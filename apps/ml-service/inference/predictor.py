import os
import json
import numpy as np

class StudentPredictor:
    """
    High-Performance, Zero-TensorFlow Student Performance Predictor.
    
    Executes the trained 4-layer Artificial Neural Network (ANN) regression model
    (64 -> 32 -> 16 -> 1) using vectorized NumPy matrix multiplications and exact
    BatchNormalization forward-pass equations.
    
    This eliminates all heavy ML framework dependencies (TensorFlow, PyTorch, SciPy,
    Scikit-Learn, Pandas) from the production serverless function runtime, reducing
    the bundle size by >90% to fit comfortably within Vercel's 500 MB limit.
    """

    FEATURE_ORDER = [
        "attendance",
        "previousScore",
        "internalMarks",
        "assignmentCompletion",
        "studyHours",
        "participation",
    ]

    def __init__(self, model_dir: str = "models"):
        if model_dir == "models":
            abs_models = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models"))
            self.model_dir = abs_models if os.path.exists(abs_models) else "models"
        else:
            self.model_dir = model_dir

        self.model_version = "v1.0.0"
        self.metadata = None

        # Lightweight NumPy weights
        self.W1 = None
        self.b1 = None
        self.bn_gamma = None
        self.bn_beta = None
        self.bn_moving_mean = None
        self.bn_moving_variance = None
        self.bn_epsilon = 1e-3
        self.W2 = None
        self.b2 = None
        self.W3 = None
        self.b3 = None
        self.W_out = None
        self.b_out = None

        # Preprocessing Scaler
        self.scaler_mean = None
        self.scaler_scale = None

        self._load_artifacts()

    def _load_artifacts(self):
        npz_path = os.path.join(self.model_dir, "ann_model_weights.npz")
        scaler_json_path = os.path.join(self.model_dir, "scaler_params.json")
        metadata_path = os.path.join(self.model_dir, "model_metadata.json")

        # 1. Load Metadata
        if os.path.exists(metadata_path):
            try:
                with open(metadata_path, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)
                    self.model_version = self.metadata.get("version", "v1.0.0")
            except Exception as e:
                print(f"[Predictor] Warning reading metadata: {e}")

        # 2. Load Weights from Compressed NumPy Archive
        if os.path.exists(npz_path):
            print(f"[Predictor] Loading lightweight NumPy weights from: {npz_path}")
            data = np.load(npz_path)
            self.W1 = data["W1"].astype(np.float32)
            self.b1 = data["b1"].astype(np.float32)

            self.bn_gamma = data["bn_gamma"].astype(np.float32)
            self.bn_beta = data["bn_beta"].astype(np.float32)
            self.bn_moving_mean = data["bn_moving_mean"].astype(np.float32)
            self.bn_moving_variance = data["bn_moving_variance"].astype(np.float32)
            self.bn_epsilon = float(data["bn_epsilon"]) if "bn_epsilon" in data else 1e-3

            self.W2 = data["W2"].astype(np.float32)
            self.b2 = data["b2"].astype(np.float32)

            self.W3 = data["W3"].astype(np.float32)
            self.b3 = data["b3"].astype(np.float32)

            self.W_out = data["W_out"].astype(np.float32)
            self.b_out = data["b_out"].astype(np.float32)

            if "scaler_mean" in data and "scaler_scale" in data:
                self.scaler_mean = data["scaler_mean"].astype(np.float32)
                self.scaler_scale = data["scaler_scale"].astype(np.float32)

            print(f"[Predictor] Model loaded successfully (NumPy Engine). Version: {self.model_version}")

        # 3. Fallback: Load Scaler from JSON if not in NPZ
        if self.scaler_mean is None and os.path.exists(scaler_json_path):
            with open(scaler_json_path, "r", encoding="utf-8") as f:
                sdata = json.load(f)
                self.scaler_mean = np.array(sdata["mean"], dtype=np.float32)
                self.scaler_scale = np.array(sdata["scale"], dtype=np.float32)
            print(f"[Predictor] Loaded scaler parameters from: {scaler_json_path}")

        # 4. Optional local dev fallback if Keras model exists and TensorFlow is installed
        if self.W1 is None:
            keras_path = os.path.join(self.model_dir, "ann_model.keras")
            if os.path.exists(keras_path):
                try:
                    os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
                    from tensorflow import keras
                    print(f"[Predictor] Falling back to Keras model: {keras_path}")
                    keras_model = keras.models.load_model(keras_path)
                    self.W1, self.b1 = keras_model.get_layer("dense_1").get_weights()
                    bn = keras_model.get_layer("bn_1")
                    self.bn_gamma, self.bn_beta, self.bn_moving_mean, self.bn_moving_variance = bn.get_weights()
                    self.bn_epsilon = float(bn.epsilon)
                    self.W2, self.b2 = keras_model.get_layer("dense_2").get_weights()
                    self.W3, self.b3 = keras_model.get_layer("dense_3").get_weights()
                    self.W_out, self.b_out = keras_model.get_layer("output_regression").get_weights()
                    print("[Predictor] Successfully extracted weights from Keras model in memory.")
                except ImportError:
                    print("[Predictor] WARNING: NumPy weights not found and TensorFlow is not installed.")

    def is_ready(self) -> bool:
        weights_loaded = (
            self.W1 is not None and
            self.b1 is not None and
            self.bn_gamma is not None and
            self.W2 is not None and
            self.W3 is not None and
            self.W_out is not None
        )
        scaler_loaded = (self.scaler_mean is not None and self.scaler_scale is not None)
        return weights_loaded and scaler_loaded

    def forward(self, x: np.ndarray) -> np.ndarray:
        """
        Pure NumPy forward pass reproducing exact Keras sequential model:
        Dense(64, relu) -> BatchNorm -> Dense(32, relu) -> Dense(16, relu) -> Dense(1, linear)
        """
        # Dense 1 + ReLU
        z1 = np.dot(x, self.W1) + self.b1
        a1 = np.maximum(0.0, z1)

        # Batch Normalization (inference mode: uses moving mean & moving variance)
        a1_bn = self.bn_gamma * (a1 - self.bn_moving_mean) / np.sqrt(self.bn_moving_variance + self.bn_epsilon) + self.bn_beta

        # Dense 2 + ReLU (Dropout is identity during inference)
        z2 = np.dot(a1_bn, self.W2) + self.b2
        a2 = np.maximum(0.0, z2)

        # Dense 3 + ReLU (Dropout is identity during inference)
        z3 = np.dot(a2, self.W3) + self.b3
        a3 = np.maximum(0.0, z3)

        # Output Regression (Linear)
        out = np.dot(a3, self.W_out) + self.b_out
        return out

    def predict(self, features: dict) -> tuple[float, str]:
        if not self.is_ready():
            raise RuntimeError("Model artifacts are not loaded. Ensure ann_model_weights.npz exists.")

        # Extract features in strict canonical order
        raw_values = []
        for feat in self.FEATURE_ORDER:
            if feat not in features:
                raise ValueError(f"Missing required feature: '{feat}'")
            val = float(features[feat])
            raw_values.append(val)

        input_array = np.array([raw_values], dtype=np.float32)

        # StandardScaler transformation: (x - mean) / scale
        scaled_input = (input_array - self.scaler_mean) / self.scaler_scale

        # ANN Inference via NumPy forward pass
        prediction = self.forward(scaled_input)
        raw_score = float(prediction[0][0])
        predicted_score = round(max(0.0, min(100.0, raw_score)), 2)

        return predicted_score, self.model_version

# Singleton predictor instance
predictor = StudentPredictor()
