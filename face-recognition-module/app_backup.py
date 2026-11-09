
import cv2
import base64
import numpy as np

from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Recognition settings
STUDENT_NAMES = {
    1: "Azizul Hakim"
}

THRESHOLD = 60

# Load the trained model once when the server starts
recognizer = cv2.face.LBPHFaceRecognizer_create()
recognizer.read("trainer/trainer.yml")

# Load face detector
cascade_path = (
    cv2.data.haarcascades +
    "haarcascade_frontalface_default.xml"
)

detector = cv2.CascadeClassifier(cascade_path)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "running",
        "service": "AttendX Face Recognition API"
    })


@app.route("/recognize", methods=["POST"])
def recognize():

    data = request.get_json(silent=True) or {}
    image_data = data.get("image")

    if not image_data:
        return jsonify({
            "recognized": False,
            "message": "No image provided"
        }), 400

    try:
        # Remove Base64 image header
        if "," in image_data:
            image_data = image_data.split(",", 1)[1]

        image_bytes = base64.b64decode(image_data)

        image_array = np.frombuffer(
            image_bytes,
            dtype=np.uint8
        )

        frame = cv2.imdecode(
            image_array,
            cv2.IMREAD_COLOR
        )

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

        # Select the largest detected face
        x, y, w, h = max(
            faces,
            key=lambda face: face[2] * face[3]
        )

        face = gray[y:y+h, x:x+w]
        face = cv2.resize(face, (200, 200))

        student_id, distance = recognizer.predict(face)

        if (
            student_id in STUDENT_NAMES
            and distance < THRESHOLD
        ):
            return jsonify({
                "recognized": True,
                "studentId": student_id,
                "name": STUDENT_NAMES[student_id],
                "distance": round(float(distance), 2)
            })

        return jsonify({
            "recognized": False,
            "message": "Unknown face",
            "distance": round(float(distance), 2)
        })

    except Exception as error:
        return jsonify({
            "recognized": False,
            "message": str(error)
        }), 500


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False
    )
