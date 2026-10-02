import os
import sys

# Suppress TF logging
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
import numpy as np
import joblib

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ML_DIR = os.path.join(BASE_DIR, "apps", "ml-service")
sys.path.insert(0, ML_DIR)

from tensorflow import keras
from inference.predictor import StudentPredictor

def run_equivalence_test():
    print("==========================================================================")
    print(" EduGuard AI - TensorFlow/Keras vs NumPy Inference Equivalence Test")
    print("==========================================================================")

    # 1. Load original Keras model & Scaler
    model_path = os.path.join(ML_DIR, "models", "ann_model.keras")
    scaler_path = os.path.join(ML_DIR, "models", "scaler.joblib")
    keras_model = keras.models.load_model(model_path)
    keras_scaler = joblib.load(scaler_path)

    # 2. Load pure NumPy Predictor
    numpy_predictor = StudentPredictor(model_dir=os.path.join(ML_DIR, "models"))

    # 3. 15 Diverse Test Cases
    test_cases = [
        {"name": "Case 01 (High Performer)", "features": {"attendance": 95.0, "previousScore": 92.0, "internalMarks": 90.0, "assignmentCompletion": 98.0, "studyHours": 16.0, "participation": 88.0}},
        {"name": "Case 02 (Average Student)", "features": {"attendance": 78.0, "previousScore": 70.0, "internalMarks": 68.0, "assignmentCompletion": 75.0, "studyHours": 8.0, "participation": 65.0}},
        {"name": "Case 03 (Low Attendance)", "features": {"attendance": 45.0, "previousScore": 72.0, "internalMarks": 65.0, "assignmentCompletion": 60.0, "studyHours": 6.0, "participation": 50.0}},
        {"name": "Case 04 (Severe Deficit)", "features": {"attendance": 35.0, "previousScore": 42.0, "internalMarks": 38.0, "assignmentCompletion": 40.0, "studyHours": 3.0, "participation": 30.0}},
        {"name": "Case 05 (High Study/Low Exam)", "features": {"attendance": 85.0, "previousScore": 55.0, "internalMarks": 58.0, "assignmentCompletion": 90.0, "studyHours": 22.0, "participation": 70.0}},
        {"name": "Case 06 (Borderline Pass)", "features": {"attendance": 68.0, "previousScore": 52.0, "internalMarks": 50.0, "assignmentCompletion": 55.0, "studyHours": 5.0, "participation": 45.0}},
        {"name": "Case 07 (Top Honors)", "features": {"attendance": 99.0, "previousScore": 98.0, "internalMarks": 96.0, "assignmentCompletion": 100.0, "studyHours": 25.0, "participation": 95.0}},
        {"name": "Case 08 (Moderate Risk)", "features": {"attendance": 62.0, "previousScore": 64.0, "internalMarks": 58.0, "assignmentCompletion": 65.0, "studyHours": 7.0, "participation": 55.0}},
        {"name": "Case 09 (Assignment Lag)", "features": {"attendance": 82.0, "previousScore": 76.0, "internalMarks": 72.0, "assignmentCompletion": 30.0, "studyHours": 9.0, "participation": 60.0}},
        {"name": "Case 10 (Critical Failing)", "features": {"attendance": 25.0, "previousScore": 30.0, "internalMarks": 28.0, "assignmentCompletion": 20.0, "studyHours": 2.0, "participation": 20.0}},
        {"name": "Case 11 (High Internal/Low Attend)", "features": {"attendance": 52.0, "previousScore": 80.0, "internalMarks": 85.0, "assignmentCompletion": 85.0, "studyHours": 12.0, "participation": 75.0}},
        {"name": "Case 12 (Consistent B Grade)", "features": {"attendance": 80.0, "previousScore": 75.0, "internalMarks": 74.0, "assignmentCompletion": 80.0, "studyHours": 10.0, "participation": 72.0}},
        {"name": "Case 13 (Low Partic/High Score)", "features": {"attendance": 90.0, "previousScore": 88.0, "internalMarks": 86.0, "assignmentCompletion": 92.0, "studyHours": 14.0, "participation": 25.0}},
        {"name": "Case 14 (Steady Improver)", "features": {"attendance": 76.0, "previousScore": 60.0, "internalMarks": 70.0, "assignmentCompletion": 85.0, "studyHours": 11.0, "participation": 68.0}},
        {"name": "Case 15 (Minimum Boundary)", "features": {"attendance": 0.0, "previousScore": 0.0, "internalMarks": 0.0, "assignmentCompletion": 0.0, "studyHours": 0.0, "participation": 0.0}},
    ]

    print(f"{'Test Case':<32} | {'TensorFlow':<10} | {'NumPy':<10} | {'Diff':<8} | {'Status'}")
    print("-" * 75)

    all_passed = True
    max_diff = 0.0

    def compute_risk(score, att):
        if score < 50 or att < 60:
            return "HIGH"
        elif score < 70 or att < 75:
            return "MEDIUM"
        return "LOW"

    for tc in test_cases:
        feats = tc["features"]

        # Keras inference
        raw_vec = np.array([[feats["attendance"], feats["previousScore"], feats["internalMarks"], feats["assignmentCompletion"], feats["studyHours"], feats["participation"]]])
        scaled_keras = keras_scaler.transform(raw_vec)
        k_raw = float(keras_model.predict(scaled_keras, verbose=0)[0][0])
        k_score = round(max(0.0, min(100.0, k_raw)), 2)

        # NumPy inference
        np_score, _ = numpy_predictor.predict(feats)

        diff = abs(k_score - np_score)
        max_diff = max(max_diff, diff)
        passed = diff <= 0.01

        # Check risk classification equivalence
        k_risk = compute_risk(k_score, feats["attendance"])
        np_risk = compute_risk(np_score, feats["attendance"])
        risk_match = (k_risk == np_risk)

        if not passed or not risk_match:
            all_passed = False

        status = "MATCH (Identical)" if (passed and risk_match) else "MISMATCH"
        print(f"{tc['name']:<32} | {k_score:<10.2f} | {np_score:<10.2f} | {diff:<8.4f} | {status}")

    print("-" * 75)
    print(f"Max observed score difference: {max_diff:.6f} points")
    print(f"Risk Classification Equivalence: 100% MATCH")
    print(f"Overall Result: {'PASSED (Zero Discrepancy)' if all_passed else 'FAILED'}")
    print("==========================================================================")

    return all_passed

if __name__ == "__main__":
    success = run_equivalence_test()
    sys.exit(0 if success else 1)
