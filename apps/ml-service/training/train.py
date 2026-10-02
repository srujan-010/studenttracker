import os
import sys
import json
import argparse
import datetime
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# Set Keras/TensorFlow logging
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, callbacks

FEATURE_COLUMNS = [
    "attendance",
    "previousScore",
    "internalMarks",
    "assignmentCompletion",
    "studyHours",
    "participation",
]
TARGET_COLUMN = "finalScore"
MODEL_VERSION = "v1.0.0"

def train_model(data_path: str = "data/student_performance_data.csv", output_dir: str = "models", epochs: int = 80, seed: int = 42):
    print("====================================================")
    print(" EduGuard AI - Deep Learning Model Training Pipeline")
    print(f" Target Model Version: {MODEL_VERSION}")
    print("====================================================")

    # Set reproducible seeds
    np.random.seed(seed)
    tf.random.set_seed(seed)

    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)

    # 1. Load Dataset
    if not os.path.exists(data_path):
        print(f"Dataset not found at {data_path}. Generating synthetic academic dataset...")
        from generate_dataset import generate_synthetic_academic_dataset
        generate_synthetic_academic_dataset(output_path=data_path, seed=seed)

    print(f"[Pipeline] Loading dataset from: {data_path}")
    df = pd.read_csv(data_path)

    # 2. Validate columns
    required_cols = FEATURE_COLUMNS + [TARGET_COLUMN]
    for col in required_cols:
        if col not in df.columns:
            raise ValueError(f"Required column '{col}' missing from dataset. Found: {list(df.columns)}")

    # 3. Handle missing values & validate bounds
    initial_count = len(df)
    df = df.dropna(subset=required_cols)
    # Filter valid academic ranges
    df = df[
        (df["attendance"] >= 0) & (df["attendance"] <= 100) &
        (df["previousScore"] >= 0) & (df["previousScore"] <= 100) &
        (df["internalMarks"] >= 0) & (df["internalMarks"] <= 100) &
        (df["assignmentCompletion"] >= 0) & (df["assignmentCompletion"] <= 100) &
        (df["studyHours"] >= 0) & (df["studyHours"] <= 100) &
        (df["participation"] >= 0) & (df["participation"] <= 100) &
        (df["finalScore"] >= 0) & (df["finalScore"] <= 100)
    ]
    print(f"[Pipeline] Validated {len(df)} / {initial_count} records (dropped {initial_count - len(df)} invalid/missing).")

    X = df[FEATURE_COLUMNS].values
    y = df[TARGET_COLUMN].values

    # 4. Train / Test Split (80 / 20)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=seed
    )
    print(f"[Pipeline] Training samples: {len(X_train)}, Testing samples: {len(X_test)}")

    # 5. Feature Normalization
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # 6. Build Artificial Neural Network (ANN) Architecture
    model = keras.Sequential([
        layers.Input(shape=(len(FEATURE_COLUMNS),)),
        layers.Dense(64, activation="relu", name="dense_1"),
        layers.BatchNormalization(name="bn_1"),
        layers.Dropout(0.2, name="dropout_1"),
        layers.Dense(32, activation="relu", name="dense_2"),
        layers.Dropout(0.1, name="dropout_2"),
        layers.Dense(16, activation="relu", name="dense_3"),
        layers.Dense(1, activation="linear", name="output_regression")
    ])

    optimizer = keras.optimizers.Adam(learning_rate=0.001)
    model.compile(
        optimizer=optimizer,
        loss="mean_squared_error",
        metrics=["mae"]
    )

    model.summary()

    # 7. Model Training with Early Stopping
    early_stop = callbacks.EarlyStopping(
        monitor="val_loss",
        patience=12,
        restore_best_weights=True,
        verbose=1
    )

    history = model.fit(
        X_train_scaled,
        y_train,
        validation_split=0.2,
        epochs=epochs,
        batch_size=32,
        callbacks=[early_stop],
        verbose=1
    )

    # 8. Evaluation on Unseen Test Set
    y_pred = model.predict(X_test_scaled).flatten()
    mae = float(mean_absolute_error(y_test, y_pred))
    mse = float(mean_squared_error(y_test, y_pred))
    rmse = float(np.sqrt(mse))
    r2 = float(r2_score(y_test, y_pred))

    print("\n----------------------------------------------------")
    print(" Model Evaluation Results on Test Dataset:")
    print(f" Mean Absolute Error (MAE):    {mae:.3f} points")
    print(f" Root Mean Squared Error (RMSE): {rmse:.3f} points")
    print(f" Coefficient of Determination (R²): {r2:.4f}")
    print("----------------------------------------------------\n")

    # 9. Save Model, Scaler & Metadata Artifacts
    model_path = os.path.join(output_dir, "ann_model.keras")
    scaler_path = os.path.join(output_dir, "scaler.joblib")
    metadata_path = os.path.join(output_dir, "model_metadata.json")

    model.save(model_path)
    joblib.dump(scaler, scaler_path)

    metadata = {
        "version": MODEL_VERSION,
        "createdAt": datetime.datetime.utcnow().isoformat() + "Z",
        "features": FEATURE_COLUMNS,
        "target": TARGET_COLUMN,
        "datasetIdentifier": os.path.basename(data_path),
        "datasetSize": len(df),
        "testSplit": 0.2,
        "metrics": {
            "mae": round(mae, 3),
            "rmse": round(rmse, 3),
            "r2": round(r2, 4)
        },
        "hyperparameters": {
            "layers": [64, 32, 16, 1],
            "activations": ["relu", "relu", "relu", "linear"],
            "dropout": [0.2, 0.1],
            "optimizer": "Adam",
            "learningRate": 0.001,
            "loss": "mean_squared_error",
            "epochsTrained": len(history.history["loss"])
        },
        "frameworkVersion": f"TensorFlow {tf.__version__} / Keras {keras.__version__}",
        "status": "ACTIVE"
    }

    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"[Pipeline] Successfully saved artifacts:")
    print(f"  - Model:    {model_path}")
    print(f"  - Scaler:   {scaler_path}")
    print(f"  - Metadata: {metadata_path}")

    # 10. Automatically export lightweight NumPy deployment artifacts
    try:
        from export_model import export_model_artifacts
    except ImportError:
        from training.export_model import export_model_artifacts
    export_model_artifacts(model_dir=output_dir)

    print("====================================================")

    return metadata

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train EduGuard ANN Model")
    parser.add_argument("--data-path", default="data/student_performance_data.csv", help="Path to input dataset CSV")
    parser.add_argument("--output-dir", default="models", help="Output directory for artifacts")
    parser.add_argument("--epochs", type=int, default=80, help="Max training epochs")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    args = parser.parse_args()

    train_model(
        data_path=args.data_path,
        output_dir=args.output_dir,
        epochs=args.epochs,
        seed=args.seed
    )
