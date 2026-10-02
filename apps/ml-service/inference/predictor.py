import os
import json
import joblib
import numpy as np

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
import tensorflow as tf
from tensorflow import keras

class StudentPredictor:
    def __init__(self, model_dir: str = "models"):
        if model_dir == "models":
            abs_models = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models"))
            self.model_dir = abs_models if os.path.exists(abs_models) else "models"
        else:
            self.model_dir = model_dir
        self.model = None
        self.scaler = None
        self.metadata = None
        self.model_version = "unknown"
        self._load_artifacts()

    def _load_artifacts(self):
        model_path = os.path.join(self.model_dir, "ann_model.keras")
        scaler_path = os.path.join(self.model_dir, "scaler.joblib")
        metadata_path = os.path.join(self.model_dir, "model_metadata.json")

        if os.path.exists(model_path) and os.path.exists(scaler_path):
            print(f"[Predictor] Loading model from: {model_path}")
            self.model = keras.models.load_model(model_path)
            self.scaler = joblib.load(scaler_path)

            if os.path.exists(metadata_path):
                with open(metadata_path, "r") as f:
                    self.metadata = json.load(f)
                    self.model_version = self.metadata.get("version", "v1.0.0")
            print(f"[Predictor] Model loaded successfully. Version: {self.model_version}")
        else:
            print(f"[Predictor] WARNING: Model artifacts not found in {self.model_dir}. Need training first.")

    def is_ready(self) -> bool:
        return self.model is not None and self.scaler is not None

    def predict(self, features: dict) -> tuple[float, str]:
        if not self.is_ready():
            raise RuntimeError("Model artifacts are not loaded. Please train the model first.")

        # Extract features in strict order
        feature_order = [
            "attendance",
            "previousScore",
            "internalMarks",
            "assignmentCompletion",
            "studyHours",
            "participation",
        ]

        raw_values = []
        for feat in feature_order:
            if feat not in features:
                raise ValueError(f"Missing required feature: '{feat}'")
            val = float(features[feat])
            raw_values.append(val)

        # Scale features using persisted scaler
        input_array = np.array([raw_values])
        scaled_input = self.scaler.transform(input_array)

        # ANN inference
        prediction = self.model.predict(scaled_input, verbose=0)
        raw_score = float(prediction[0][0])
        predicted_score = round(max(0.0, min(100.0, raw_score)), 2)

        return predicted_score, self.model_version

# Singleton predictor instance
predictor = StudentPredictor()
