

import cv2
from collections import deque

STUDENT_NAMES = {
    1: "Azizul Hakim"
}

THRESHOLD = 60
recognizer = cv2.face.LBPHFaceRecognizer_create()
recognizer.read("trainer/trainer.yml")

detector = cv2.CascadeClassifier(
    cv2.data.haarcascades +
    "haarcascade_frontalface_default.xml"
)

cam = cv2.VideoCapture(0, cv2.CAP_DSHOW)

if not cam.isOpened():
    raise RuntimeError("Cannot open webcam.")

recent_distances = deque(maxlen=10)

print("Recognition test started.")
print("Press ESC to exit.")
print("Threshold 60 is experimental, not validated.")

while True:
    ret, frame = cam.read()

    if not ret:
        break

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

    faces = detector.detectMultiScale(
        gray,
        scaleFactor=1.2,
        minNeighbors=5,
        minSize=(80, 80)
    )

    if len(faces) == 0:
        recent_distances.clear()

    for (x, y, w, h) in faces:

        face = gray[y:y+h, x:x+w]
        face = cv2.resize(face, (200, 200))

        student_id, distance = recognizer.predict(face)

        recent_distances.append(distance)
        avg_distance = sum(recent_distances) / len(recent_distances)

        if student_id in STUDENT_NAMES and avg_distance < THRESHOLD:
            result = f"{STUDENT_NAMES[student_id]} | Avg: {avg_distance:.1f}"
            color = (0, 255, 0)
        else:
            result = f"Unknown | Avg: {avg_distance:.1f}"
            color = (0, 0, 255)

        cv2.rectangle(frame, (x, y), (x+w, y+h), color, 2)

        cv2.putText(
            frame,
            result,
            (x, max(y-10, 25)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.65,
            color,
            2
        )

    cv2.imshow("AttendX - Recognition Test", frame)

    if cv2.waitKey(1) & 0xFF == 27:
        break

cam.release()
cv2.destroyAllWindows()










# import cv2

# STUDENT_NAMES = {
#     1: "Azizul Hakim"
# }

# recognizer = cv2.face.LBPHFaceRecognizer_create()
# recognizer.read("trainer/trainer.yml")

# cascade_path = (
#     cv2.data.haarcascades +
#     "haarcascade_frontalface_default.xml"
# )

# detector = cv2.CascadeClassifier(cascade_path)

# cam = cv2.VideoCapture(0, cv2.CAP_DSHOW)

# if not cam.isOpened():
#     raise RuntimeError("Cannot open webcam.")

# print("Recognition test started.")
# print("Press ESC to exit.")
# print("This test does NOT mark attendance.")

# while True:
#     ret, frame = cam.read()

#     if not ret:
#         print("Camera frame unavailable.")
#         break

#     gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

#     faces = detector.detectMultiScale(
#         gray,
#         scaleFactor=1.2,
#         minNeighbors=5,
#         minSize=(80, 80)
#     )

#     for (x, y, w, h) in faces:

#         face = gray[y:y+h, x:x+w]
#         face = cv2.resize(face, (200, 200))

#         student_id, distance = recognizer.predict(face)
#         print(f"Student ID: {student_id}, Distance: {distance:.2f}")
        
#         if student_id == 1:
#             name = STUDENT_NAMES.get(student_id, "Unknown")
#             result = f"{name} | Distance: {distance:.1f}"
#             color = (0, 255, 0)
#         else:
#             result = f"Unknown | Distance: {distance:.1f}"
#             color = (0, 0, 255)

#         # if distance < 70:
#         #     name = STUDENT_NAMES.get(
#         #         student_id,
#         #         "Unknown Student"
#         #     )
#         #     result = f"{name} | Distance: {distance:.1f}"
#         #     color = (0, 255, 0)
#         # else:
#         #     result = f"Unknown | Distance: {distance:.1f}"
#         #     color = (0, 0, 255)

#         cv2.rectangle(
#             frame,
#             (x, y),
#             (x+w, y+h),
#             color,
#             2
#         )

#         cv2.putText(
#             frame,
#             result,
#             (x, y-10),
#             cv2.FONT_HERSHEY_SIMPLEX,
#             0.65,
#             color,
#             2
#         )

#     cv2.imshow("AttendX - Recognition Test", frame)

#     if cv2.waitKey(1) & 0xFF == 27:
#         break

# cam.release()
# cv2.destroyAllWindows()
