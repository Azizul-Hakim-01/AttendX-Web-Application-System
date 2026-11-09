

import cv2
import numpy as np
import os

from pathlib import Path


# Project paths
BASE_DIR = Path(__file__).resolve().parent

DATASET_PATH = BASE_DIR / "dataset"
TRAINER_PATH = BASE_DIR / "trainer"

MODEL_PATH = TRAINER_PATH / "trainer.yml"
TEMP_MODEL_PATH = TRAINER_PATH / "trainer_temp.yml"

TARGET_SAMPLES = 120

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}


def train_model(eligible_student_ids=None):

    faces = []
    labels = []

    if not hasattr(cv2, "face"):
        raise RuntimeError("OpenCV contrib is required.")

    if not DATASET_PATH.exists():
        raise RuntimeError("Dataset folder does not exist.")

    # Convert approved IDs into a set
    if eligible_student_ids is not None:
        eligible_student_ids = {
            int(student_id) for student_id in eligible_student_ids
        }

    # Read student folders
    for student_folder in sorted(DATASET_PATH.iterdir()):

        if not student_folder.is_dir():
            continue

        if not student_folder.name.isdigit():
            continue

        student_id = int(student_folder.name)

        # Exclude students not explicitly approved
        if (
            eligible_student_ids is not None
            and student_id not in eligible_student_ids
        ):
            continue

        student_faces = []

        for image_path in sorted(student_folder.iterdir()):

            if not image_path.is_file():
                continue

            if image_path.suffix.lower() not in IMAGE_EXTENSIONS:
                continue

            image = cv2.imread(
                str(image_path),
                cv2.IMREAD_GRAYSCALE
            )

            if image is None:
                print("Skipping invalid image:", image_path)
                continue

            image = cv2.resize(image, (200, 200))
            student_faces.append(image)

        if len(student_faces) < TARGET_SAMPLES:
            print(
                f"Skipping Student ID {student_id}: "
                f"{len(student_faces)} valid images."
            )
            continue

        print(
            f"Including Student ID {student_id}: "
            f"{len(student_faces)} valid images."
        )

        faces.extend(student_faces)
        labels.extend([student_id] * len(student_faces))

    if not faces:
        raise RuntimeError(
            "No eligible student has at least 120 valid images. "
            "Existing model was preserved."
        )

    labels = np.array(labels, dtype=np.int32)

    TRAINER_PATH.mkdir(parents=True, exist_ok=True)

    try:
        recognizer = cv2.face.LBPHFaceRecognizer_create()
        recognizer.train(faces, labels)

        recognizer.save(str(TEMP_MODEL_PATH))

        # Validate temporary model
        test_recognizer = cv2.face.LBPHFaceRecognizer_create()
        test_recognizer.read(str(TEMP_MODEL_PATH))

        # Replace active model only after validation
        os.replace(
            str(TEMP_MODEL_PATH),
            str(MODEL_PATH)
        )

    finally:
        if TEMP_MODEL_PATH.exists():
            TEMP_MODEL_PATH.unlink()

    student_ids = sorted(set(labels.tolist()))

    print("\nFace model trained successfully!")
    print("Total training images:", len(faces))
    print("Student IDs:", student_ids)
    print("Model saved at:", MODEL_PATH)

    return {
        "totalImages": len(faces),
        "studentIds": student_ids
    }


if __name__ == "__main__":
    train_model()

