
import cv2
import base64
import requests

cam = cv2.VideoCapture(0, cv2.CAP_DSHOW)

if not cam.isOpened():
    raise RuntimeError("Cannot open webcam.")

print("Press SPACE to capture your face.")
print("Press ESC to exit.")

while True:
    ret, frame = cam.read()

    if not ret:
        break

    cv2.imshow("AttendX API Test", frame)

    key = cv2.waitKey(1) & 0xFF

    if key == 32:  # SPACE
        success, buffer = cv2.imencode(".jpg", frame)

        if not success:
            print("Image encoding failed.")
            continue

        image_base64 = base64.b64encode(
            buffer
        ).decode("utf-8")

        response = requests.post(
            "http://127.0.0.1:5000/recognize",
            json={"image": image_base64},
            timeout=15
        )

        print("\nAPI Response:")
        print(response.json())

    elif key == 27:
        break

cam.release()
cv2.destroyAllWindows()
