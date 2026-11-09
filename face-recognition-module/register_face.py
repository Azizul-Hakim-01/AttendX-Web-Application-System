
import cv2
import os
import time

STUDENT_ID = 1
TOTAL_SAMPLES = 40
SAVE_PATH = f"dataset/{STUDENT_ID}"

os.makedirs(SAVE_PATH, exist_ok=True)

# Check OpenCV face recognition support
if not hasattr(cv2, "face"):
    raise RuntimeError(
        "OpenCV contrib is required. Install opencv-contrib-python."
    )

# Load face detector
cascade_path = (
    cv2.data.haarcascades +
    "haarcascade_frontalface_default.xml"
)

face_detector = cv2.CascadeClassifier(cascade_path)

if face_detector.empty():
    raise RuntimeError("Could not load Haar Cascade detector.")

# Open laptop webcam
cam = cv2.VideoCapture(0, cv2.CAP_DSHOW)

if not cam.isOpened():
    raise RuntimeError("Could not open webcam.")

cam.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cam.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

count = 0
last_capture = 0

print("\nFace registration started.")
print("Look at the camera and slowly change your head position.")
print("Press ESC to stop.\n")

while count < TOTAL_SAMPLES:
    ret, frame = cam.read()

    if not ret:
        print("Could not receive camera frame.")
        break

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    faces = face_detector.detectMultiScale(
        gray,
        scaleFactor=1.2,
        minNeighbors=5,
        minSize=(80, 80)
    )

    for (x, y, w, h) in faces:
        cv2.rectangle(
            frame,
            (x, y),
            (x + w, y + h),
            (0, 255, 0),
            2
        )

    # Capture only when exactly one face is detected
    current_time = time.time()

    if len(faces) == 1 and current_time - last_capture >= 0.4:
        x, y, w, h = faces[0]

        face = gray[y:y+h, x:x+w]
        face = cv2.resize(face, (200, 200))

        count += 1

        filename = os.path.join(
            SAVE_PATH,
            f"{count}.jpg"
        )

        cv2.imwrite(filename, face)
        last_capture = current_time

    cv2.putText(
        frame,
        f"Samples: {count}/{TOTAL_SAMPLES}",
        (20, 35),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (0, 255, 0),
        2
    )

    cv2.imshow("AttendX - Face Registration", frame)

    if cv2.waitKey(1) & 0xFF == 27:
        break

cam.release()
cv2.destroyAllWindows()

print(f"\nCaptured {count} face samples.")

if count == TOTAL_SAMPLES:
    print("Face registration completed successfully.")
else:
    print("Registration incomplete. Run the script again to capture more.")
