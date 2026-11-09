

import cv2
import base64
import numpy as np
import requests
import shutil
import os

from functools import wraps

from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS


# --------------------------------------------------
# Configuration
# --------------------------------------------------

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:5173"]}})

BASE_DIR = Path(__file__).resolve().parent

DATASET_PATH = BASE_DIR / "dataset"
TRAINER_PATH = BASE_DIR / "trainer"
MODEL_PATH = TRAINER_PATH / "trainer.yml"

SPRING_BOOT_URL = "http://localhost:8080/api/internal/students"
INTERNAL_ATTENDANCE_URL = "http://localhost:8080/api/internal/attendance/face-verified"

FLASK_SERVICE_KEY = os.getenv("FLASK_SERVICE_KEY")

if not FLASK_SERVICE_KEY:
    raise RuntimeError("FLASK_SERVICE_KEY environment variable is missing.")


def internal_headers():
    return {
        "X-Service-Key": FLASK_SERVICE_KEY
    }



def get_current_user():

    auth_header = request.headers.get("Authorization", "")

    if not auth_header.startswith("Bearer "):
        return None, (jsonify({"message": "Authentication required."}), 401)

    try:
        response = requests.get(
            "http://localhost:8080/api/auth/me",
            headers={"Authorization": auth_header},
            timeout=5
        )

    except requests.RequestException:
        return None, (jsonify({"message": "Authentication service unavailable."}), 503)

    if response.status_code in (401, 403):
        return None, (jsonify({"message": "Invalid or expired authentication."}), response.status_code)

    if response.status_code != 200:
        return None, (jsonify({"message": "Unable to verify authentication."}), 503)

    try:
        user = response.json()
    except ValueError:
        return None, (jsonify({"message": "Invalid authentication response."}), 503)

    if not isinstance(user, dict) or not user.get("id") or not user.get("role"):
        return None, (jsonify({"message": "Invalid authentication response."}), 503)

    return user, None


def require_role(*allowed_roles):

    def decorator(route_function):

        @wraps(route_function)
        def wrapper(*args, **kwargs):

            current_user, error_response = get_current_user()

            if error_response:
                return error_response

            user_role = str(current_user.get("role", "")).upper()

            if user_role not in allowed_roles:
                return jsonify({"message": "You do not have permission to access this resource."}), 403

            return route_function(current_user, *args, **kwargs)

        return wrapper

    return decorator


THRESHOLD = 60
TARGET_SAMPLES = 120

# Existing recognition mapping (will be made dynamic later)
STUDENT_NAMES = {
    1: "Azizul Hakim"
}


# --------------------------------------------------
# Face Recognition Setup
# --------------------------------------------------

recognizer = cv2.face.LBPHFaceRecognizer_create()
recognizer.read(str(MODEL_PATH))

cascade_path = (
    cv2.data.haarcascades +
    "haarcascade_frontalface_default.xml"
)

detector = cv2.CascadeClassifier(cascade_path)

def get_student(student_id):

    response = requests.get(
        f"{SPRING_BOOT_URL}/{student_id}",
        headers=internal_headers(),
        timeout=5
    )

    if response.status_code == 200:
        return response.json()

    if response.status_code == 404:
        return None

    response.raise_for_status()


def get_all_students():

    response = requests.get(
        SPRING_BOOT_URL,
        headers=internal_headers(),
        timeout=5
    )

    response.raise_for_status()

    students = response.json()

    if not isinstance(students, list):
        raise RuntimeError("Invalid student list returned by backend.")

    return students


def get_eligible_student_ids(current_student_id=None):

    students = get_all_students()

    eligible_ids = []

    for student in students:

        student_id = student.get("id")
        status = student.get("faceEnrollmentStatus")

        if not student_id:
            continue

        if status == "ENROLLED":
            eligible_ids.append(int(student_id))

    # Include the student currently completing enrollment
    if current_student_id is not None:
        eligible_ids.append(int(current_student_id))

    return sorted(set(eligible_ids))


def decode_image(image_data):

    if not image_data:
        return None

    if "," in image_data:
        image_data = image_data.split(",", 1)[1]

    image_bytes = base64.b64decode(image_data)

    image_array = np.frombuffer(
        image_bytes,
        dtype=np.uint8
    )

    return cv2.imdecode(
        image_array,
        cv2.IMREAD_COLOR
    )


def get_sample_count(student_id):

    student_folder = DATASET_PATH / str(student_id)

    if not student_folder.exists():
        return 0

    return sum(
        1 for path in student_folder.iterdir()
        if path.is_file() and path.suffix.lower() in
        [".jpg", ".jpeg", ".png"]
    )


# --------------------------------------------------
# Health Check
# --------------------------------------------------

@app.route("/health", methods=["GET"])
def health():

    return jsonify({
        "status": "running",
        "service": "AttendX Face Recognition API"
    })


# --------------------------------------------------
# Existing Face Recognition
# --------------------------------------------------

@app.route("/recognize", methods=["POST"])
@require_role("STUDENT")
def recognize(current_user):

    data = request.get_json(silent=True) or {}
    image_data = data.get("image")
    confirm_attendance = data.get("confirmAttendance", False)
    subject_id = data.get("subjectId")

    if confirm_attendance:
        try:
            subject_id = int(subject_id)
            if subject_id <= 0:
                raise ValueError
        except (TypeError, ValueError):
            return jsonify({
                "recognized": False,
                "message": "A valid subject ID is required."
            }), 400

    if not image_data:
        return jsonify({
            "recognized": False,
            "message": "No image provided"
        }), 400

    try:

        frame = decode_image(image_data)

        if frame is None:
            return jsonify({
                "recognized": False,
                "message": "Invalid image"
            }), 400

        gray = cv2.cvtColor(
            frame,
            cv2.COLOR_BGR2GRAY
        )

        faces = detector.detectMultiScale(
            gray,
            scaleFactor=1.2,
            minNeighbors=5,
            minSize=(80, 80)
        )

        if len(faces) == 0:
            return jsonify({
                "recognized": False,
                "message": "No face detected"
            })

        x, y, w, h = max(
            faces,
            key=lambda face: face[2] * face[3]
        )

        face = gray[y:y+h, x:x+w]
        face = cv2.resize(face, (200, 200))

        student_id, distance = recognizer.predict(face)

        students = get_all_students()
        authenticated_email = (
            current_user.get("email") or ""
        ).strip().lower()

        matching_student = next(
            (
                student for student in students
                if (student.get("email") or "").strip().lower()
                == authenticated_email
            ),
            None
        )

        if matching_student is None:
            return jsonify({
                "recognized": False,
                "message": "Student profile not found for this account."
            }), 404

        authenticated_student_id = matching_student.get("id")

        print(
            f"FACE DEBUG | Predicted ID: {student_id} | "
            f"Authenticated Student ID: {authenticated_student_id} | "
            f"Distance: {float(distance):.2f} | Threshold: {THRESHOLD}",
            flush=True
        )

        if authenticated_student_id is None:
            raise RuntimeError("Matching student profile has no ID.")

        if (
            int(student_id) == int(authenticated_student_id)
            and distance < THRESHOLD
        ):

            if confirm_attendance:
                attendance_response = requests.post(
                    INTERNAL_ATTENDANCE_URL,
                    headers=internal_headers(),
                    json={
                        "studentId": int(authenticated_student_id),
                        "subjectId": subject_id
                    },
                    timeout=5
                )

                if not attendance_response.ok:
                    try:
                        error_data = attendance_response.json()
                        message = error_data.get(
                            "message",
                            "Attendance recording failed."
                        )
                    except ValueError:
                        message = "Attendance recording failed."

                    return jsonify({
                        "recognized": True,
                        "attendanceRecorded": False,
                        "message": message
                    }), attendance_response.status_code

                return jsonify({
                    "recognized": True,
                    "attendanceRecorded": True,
                    "studentId": int(authenticated_student_id),
                    "name": current_user.get("name", "Student"),
                    "distance": round(float(distance), 2),
                    "message": "Attendance marked successfully."
                })

            return jsonify({
                "recognized": True,
                "studentId": int(authenticated_student_id),
                "name": current_user.get("name", "Student"),
                "distance": round(float(distance), 2)
            })

        return jsonify({
            "recognized": False,
            "message": "Unknown face",
            "distance": round(float(distance), 2)
        })

    except Exception:
        return jsonify({
            "recognized": False,
            "message": "Face recognition failed."
        }), 500


# --------------------------------------------------
# Face Enrollment - Capture Samples
# --------------------------------------------------

@app.route("/enroll/capture", methods=["POST"])
@require_role("ADMIN")
def capture_face(current_user):

    data = request.get_json(silent=True) or {}

    student_id = data.get("studentId")
    image_data = data.get("image")

    if not student_id or not image_data:
        return jsonify({
            "success": False,
            "message": "Student ID and image are required."
        }), 400

    try:

        student_id = int(student_id)

        if student_id <= 0:
            raise ValueError()

    except (ValueError, TypeError):

        return jsonify({
            "success": False,
            "message": "Invalid student ID."
        }), 400

    try:

        student = get_student(student_id)

        if student is None:
            return jsonify({
                "success": False,
                "message": "Student not found."
            }), 404

        if student.get("faceEnrollmentStatus") == "ENROLLED":
            return jsonify({
                "success": False,
                "message": "Student is already enrolled."
            }), 409

        current_count = get_sample_count(student_id)

        if current_count >= TARGET_SAMPLES:
            return jsonify({
                "success": True,
                "count": current_count,
                "target": TARGET_SAMPLES,
                "complete": True,
                "message": "All samples already captured."
            })

        frame = decode_image(image_data)

        if frame is None:
            return jsonify({
                "success": False,
                "message": "Invalid image."
            }), 400

        gray = cv2.cvtColor(
            frame,
            cv2.COLOR_BGR2GRAY
        )

        faces = detector.detectMultiScale(
            gray,
            scaleFactor=1.2,
            minNeighbors=5,
            minSize=(80, 80)
        )

        if len(faces) == 0:
            return jsonify({
                "success": False,
                "message": "No face detected. Adjust your position."
            }), 400

        if len(faces) > 1:
            return jsonify({
                "success": False,
                "message": "Multiple faces detected. Only one person should be visible."
            }), 400

        # x, y, w, h = faces[0]

        # face = gray[y:y+h, x:x+w]
        # face = cv2.resize(face, (200, 200))
        
        
        x, y, w, h = faces[0]

        # Mark enrollment as pending before saving the first sample
        if student.get("faceEnrollmentStatus") != "PENDING":

            response = requests.patch(
                f"{SPRING_BOOT_URL}/{student_id}/face-enrollment-status",
                json={"status": "PENDING"},
                headers=internal_headers(),
                timeout=5
            )

            response.raise_for_status()

        face = gray[y:y+h, x:x+w]
        face = cv2.resize(face, (200, 200))

        student_folder = DATASET_PATH / str(student_id)
        student_folder.mkdir(parents=True, exist_ok=True)

        sample_number = current_count + 1

        sample_path = (
            student_folder /
            f"{student_id}_{sample_number:03d}.jpg"
        )

        if not cv2.imwrite(str(sample_path), face):
            raise RuntimeError("Could not save face sample.")

        new_count = get_sample_count(student_id)

        return jsonify({
            "success": True,
            "count": new_count,
            "target": TARGET_SAMPLES,
            "complete": new_count >= TARGET_SAMPLES,
            "message": "Face sample captured successfully."
        })

    except requests.RequestException:

        return jsonify({
            "success": False,
            "message": "Could not connect to the student database."
        }), 503

    except Exception:
        return jsonify({
            "success": False,
            "message": "Face sample capture failed."
        }), 500


# --------------------------------------------------
# Enrollment Progress
# --------------------------------------------------

@app.route("/enroll/status/<int:student_id>", methods=["GET"])
@require_role("ADMIN")
def enrollment_status(current_user, student_id):

    try:

        student = get_student(student_id)

        if student is None:
            return jsonify({
                "success": False,
                "message": "Student not found."
            }), 404

        count = get_sample_count(student_id)

        return jsonify({
            "success": True,
            "studentId": student_id,
            "name": student.get("name"),
            "count": count,
            "target": TARGET_SAMPLES,
            "complete": count >= TARGET_SAMPLES,
            "status": student.get("faceEnrollmentStatus")
        })

    except requests.RequestException:

        return jsonify({
            "success": False,
            "message": "Could not connect to student database."
        }), 503


# --------------------------------------------------
# Train Face Recognition Model
# --------------------------------------------------

@app.route("/enroll/train", methods=["POST"])
@require_role("ADMIN")
def train_faces(current_user):

    global recognizer

    data = request.get_json(silent=True) or {}
    student_id = data.get("studentId")

    try:
        student_id = int(student_id)

        if student_id <= 0:
            raise ValueError()

    except (ValueError, TypeError):
        return jsonify({
            "success": False,
            "message": "Valid student ID is required."
        }), 400

    try:
        student = get_student(student_id)

        if student is None:
            return jsonify({
                "success": False,
                "message": "Student not found."
            }), 404

        if student.get("faceEnrollmentStatus") == "ENROLLED":
            return jsonify({
                "success": False,
                "message": "Student is already enrolled."
            }), 409

        if get_sample_count(student_id) < TARGET_SAMPLES:
            return jsonify({
                "success": False,
                "message": f"At least {TARGET_SAMPLES} samples are required."
            }), 400

        from train_model import train_model

        # Train only enrolled students plus this student
        eligible_ids = get_eligible_student_ids(student_id)

        # Preserve the previous model in case database update fails
        backup_path = TRAINER_PATH / "trainer_backup.yml"
        had_previous_model = MODEL_PATH.exists()

        if had_previous_model:
            shutil.copy2(MODEL_PATH, backup_path)

        try:
            result = train_model(eligible_ids)

            # Load the newly trained model
            new_recognizer = cv2.face.LBPHFaceRecognizer_create()
            new_recognizer.read(str(MODEL_PATH))

            # Confirm database update
            response = requests.patch(
                f"{SPRING_BOOT_URL}/{student_id}/face-enrollment-status",
                json={"status": "ENROLLED"},
                headers=internal_headers(),
                timeout=5
            )

            response.raise_for_status()

            # Activate new model only after database update succeeds
            recognizer = new_recognizer

            STUDENT_NAMES[student_id] = student.get("name", "Unknown")

            if backup_path.exists():
                backup_path.unlink()

            return jsonify({
                "success": True,
                "message": "Face enrollment completed successfully.",
                "studentId": student_id,
                "totalImages": result["totalImages"],
                "status": "ENROLLED"
            })

        except Exception:
            # Restore the previous model if anything fails
            if had_previous_model and backup_path.exists():
                shutil.copy2(backup_path, MODEL_PATH)
                backup_path.unlink()

            raise

    except requests.RequestException:
        return jsonify({
            "success": False,
            "message": "Database connection failed while updating enrollment status."
        }), 503

    except Exception:
        return jsonify({
            "success": False,
            "message": "Face model training failed."
        }), 500

@app.route("/enroll/<int:student_id>", methods=["DELETE"])
def delete_enrollment(student_id):

    return jsonify({
        "success": False,
        "message": "Face data deletion is temporarily disabled."
    }), 501


if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False
    )


