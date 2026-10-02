"""
EduGuard AI - ANN Model Weight & Scaler Parameter Exporter

Extracts trained weights, biases, normalization parameters, and feature scaler parameters
from TensorFlow/Keras artifacts (ann_model.keras, scaler.joblib) into a lightweight,
self-contained NumPy archive (ann_model_weights.npz) and JSON metadata.

This enables high-performance, low-latency, zero-TensorFlow inference in serverless
production environments such as Vercel.
"""

import os
import sys
import json
import argparse
import numpy as np

def export_model_artifacts(model_dir: str = "models", output_dir: str = None):
    if output_dir is None:
        output_dir = model_dir

    os.makedirs(output_dir, exist_ok=True)
    model_path = os.path.join(model_dir, "ann_model.keras")
    scaler_path = os.path.join(model_dir, "scaler.joblib")
    metadata_path = os.path.join(model_dir, "model_metadata.json")

    npz_output = os.path.join(output_dir, "ann_model_weights.npz")
    scaler_json_output = os.path.join(output_dir, "scaler_params.json")

    print("====================================================")
    print(" EduGuard AI - ANN Model Export Utility")
    print("====================================================")
    print(f"Loading Keras model from:  {model_path}")
    print(f"Loading Scaler from:       {scaler_path}")

    # Set TensorFlow logging before import
    os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
    from tensorflow import keras
    import joblib

    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found: {model_path}")
    if not os.path.exists(scaler_path):
        raise FileNotFoundError(f"Scaler file not found: {scaler_path}")

    model = keras.models.load_model(model_path)
    scaler = joblib.load(scaler_path)

    # 1. Extract weights & biases from each layer
    W1, b1 = model.get_layer("dense_1").get_weights()
    bn_layer = model.get_layer("bn_1")
    gamma, beta, moving_mean, moving_variance = bn_layer.get_weights()
    epsilon = float(bn_layer.epsilon)
    W2, b2 = model.get_layer("dense_2").get_weights()
    W3, b3 = model.get_layer("dense_3").get_weights()
    W_out, b_out = model.get_layer("output_regression").get_weights()

    # 2. Extract feature order and scaler values
    feature_order = [
        "attendance",
        "previousScore",
        "internalMarks",
        "assignmentCompletion",
        "studyHours",
        "participation",
    ]
    scaler_mean = np.array(scaler.mean_, dtype=np.float64)
    scaler_scale = np.array(scaler.scale_, dtype=np.float64)

    # 3. Save compressed NumPy archive
    np.savez_compressed(
        npz_output,
        W1=W1.astype(np.float32),
        b1=b1.astype(np.float32),
        bn_gamma=gamma.astype(np.float32),
        bn_beta=beta.astype(np.float32),
        bn_moving_mean=moving_mean.astype(np.float32),
        bn_moving_variance=moving_variance.astype(np.float32),
        bn_epsilon=np.array(epsilon, dtype=np.float32),
        W2=W2.astype(np.float32),
        b2=b2.astype(np.float32),
        W3=W3.astype(np.float32),
        b3=b3.astype(np.float32),
        W_out=W_out.astype(np.float32),
        b_out=b_out.astype(np.float32),
        scaler_mean=scaler_mean,
        scaler_scale=scaler_scale,
    )
    print(f"[Export] Saved lightweight weights to: {npz_output} ({os.path.getsize(npz_output):,} bytes)")

    # 4. Save JSON scaler parameters
    scaler_data = {
        "features": feature_order,
        "mean": scaler_mean.tolist(),
        "scale": scaler_scale.tolist(),
    }
    with open(scaler_json_output, "w") as f:
        json.dump(scaler_data, f, indent=2)
    print(f"[Export] Saved scaler JSON to: {scaler_json_output}")

    # 5. Update metadata with architecture and export info
    if os.path.exists(metadata_path):
        with open(metadata_path, "r") as f:
            metadata = json.load(f)
    else:
        metadata = {}

    metadata["lightweightInference"] = {
        "format": "NumPy (NPZ)",
        "weightsFile": "ann_model_weights.npz",
        "scalerFile": "scaler_params.json",
        "layers": [
            {"name": "dense_1", "type": "Dense", "units": 64, "activation": "relu"},
            {"name": "bn_1", "type": "BatchNormalization", "units": 64, "epsilon": epsilon},
            {"name": "dense_2", "type": "Dense", "units": 32, "activation": "relu"},
            {"name": "dense_3", "type": "Dense", "units": 16, "activation": "relu"},
            {"name": "output_regression", "type": "Dense", "units": 1, "activation": "linear"},
        ],
        "zeroTensorFlowRequired": True,
    }

    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"[Export] Updated metadata in: {metadata_path}")
    print("====================================================")
    print(" Export completed successfully!")
    print("====================================================")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Export Keras ANN model to lightweight NumPy artifacts")
    parser.add_argument("--model-dir", default="models", help="Directory containing Keras and Scaler artifacts")
    parser.add_argument("--output-dir", default=None, help="Directory to save exported artifacts")
    args = parser.parse_args()

    export_model_artifacts(model_dir=args.model_dir, output_dir=args.output_dir)
