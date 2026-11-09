
import cv2
import os
import time

STUDENT_ID = 1
TOTAL_SAMPLES = 120
SAVE_PATH = f"dataset/{STUDENT_ID}"

os.makedirs(SAVE_PATH, exist_ok=True)

detector = cv2.CascadeClassifier(
    cv2.data.haarcascades +
    "haarcascade_frontalface_default.xml"
)

cam = cv2.VideoCapture(0, cv2.CAP_DSHOW)

if not cam.isOpened():
    raise RuntimeError("Cannot open webcam.")

cam.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cam.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

instructions = [
    "Look straight at camera",
    "Slowly turn left and right",
    "Look slightly up and down",
    "Change expression and distance"
]

count = 0
stage = 0
last_capture = 0

print("Face registration started.")
print("Follow the instructions displayed on screen.")
print("Press ESC to stop.")

while count < TOTAL_SAMPLES:

    ret, frame = cam.read()

    if not ret:
        print("Camera frame unavailable.")
        break

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    faces = detector.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(100, 100)
    )

    for (x, y, w, h) in faces:
        cv2.rectangle(
            frame, (x, y), (x+w, y+h),
            (0, 255, 0), 2
        )

    # Move through four capture stages
    stage = min(count // 30, 3)

    cv2.putText(
        frame,
        instructions[stage],
        (15, 35),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.65,
        (0, 255, 255),
        2
    )

    cv2.putText(
        frame,
        f"Samples: {count}/{TOTAL_SAMPLES}",
        (15, 70),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (0, 255, 0),
        2
    )

    current_time = time.time()

    if len(faces) == 1 and current_time - last_capture >= 0.5:

        x, y, w, h = faces[0]

        face = gray[y:y+h, x:x+w]
        face = cv2.resize(face, (200, 200))

        count += 1

        cv2.imwrite(
            os.path.join(SAVE_PATH, f"{count}.jpg"),
            face
        )

        last_capture = current_time

    cv2.imshow("AttendX - Face Registration", frame)

    if cv2.waitKey(1) & 0xFF == 27:
        break

cam.release()
cv2.destroyAllWindows()

print(f"\nCaptured {count} images.")

if count == TOTAL_SAMPLES:
    print("Registration completed.")
else:
    print("Registration incomplete.")
