import os
import json
import numpy as np

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
import tensorflow as tf
from tensorflow import keras

# Optional joblib import for backward compatibility if scaler.joblib is used
try:
    import joblib
except ImportError:
    joblib = None

class StudentPredictor:
    def __init__(self, model_dir: str = "models"):
        if model_dir == "models":
            abs_models = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models"))
            self.model_dir = abs_models if os.path.exists(abs_models) else "models"
        else:
            self.model_dir = model_dir
        self.model = None
        self.scaler = None
        self.mean = None
        self.scale = None
        self.metadata = None
        self.model_version = "unknown"
        self._load_artifacts()

    def _load_artifacts(self):
        model_path = os.path.join(self.model_dir, "ann_model.keras")
        params_path = os.path.join(self.model_dir, "scaler_params.json")
        scaler_path = os.path.join(self.model_dir, "scaler.joblib")
        metadata_path = os.path.join(self.model_dir, "model_metadata.json")

        if os.path.exists(model_path):
            print(f"[Predictor] Loading model from: {model_path}")
            self.model = keras.models.load_model(model_path)

            # 1. Prefer lightweight JSON scaler parameters (no scikit-learn/scipy runtime dependency)
            if os.path.exists(params_path):
                with open(params_path, "r") as f:
                    params = json.load(f)
                    self.mean = np.array(params["mean"], dtype=np.float32)
                    self.scale = np.array(params["scale"], dtype=np.float32)
                print(f"[Predictor] Loaded scaler parameters from: {params_path}")
            elif os.path.exists(scaler_path) and joblib is not None:
                self.scaler = joblib.load(scaler_path)
                print(f"[Predictor] Loaded scaler from: {scaler_path}")

            if os.path.exists(metadata_path):
                with open(metadata_path, "r") as f:
                    self.metadata = json.load(f)
                    self.model_version = self.metadata.get("version", "v1.0.0")
            print(f"[Predictor] Model loaded successfully. Version: {self.model_version}")
        else:
            print(f"[Predictor] WARNING: Model artifact not found at {model_path}. Need training first.")

    def is_ready(self) -> bool:
        has_scaler = (self.scaler is not None) or (self.mean is not None and self.scale is not None)
        return self.model is not None and has_scaler

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

        input_array = np.array([raw_values], dtype=np.float32)

        # Scale features
        if self.mean is not None and self.scale is not None:
            scaled_input = (input_array - self.mean) / self.scale
        elif self.scaler is not None:
            scaled_input = self.scaler.transform(input_array)
        else:
            raise RuntimeError("No scaler available.")

        # ANN inference
        prediction = self.model.predict(scaled_input, verbose=0)
        raw_score = float(prediction[0][0])
        predicted_score = round(max(0.0, min(100.0, raw_score)), 2)

        return predicted_score, self.model_version

# Singleton predictor instance
predictor = StudentPredictor()
