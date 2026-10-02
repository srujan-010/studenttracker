# EduGuard AI - Machine Learning Dataset Specification

> [!IMPORTANT]
> **Pedagogical Integrity Notice**: This pipeline is engineered for transparent, reproducible academic performance estimation. Seed data and synthetic training sets are explicitly distinguished from real institutional examination records.

## 1. Required Features and Data Types

The Artificial Neural Network regression model expects the following normalized numerical inputs:

| Feature Name | Type | Range | Description |
| :--- | :--- | :--- | :--- |
| `attendance` | `float` | `0.0 - 100.0` | Overall lecture and lab attendance percentage |
| `previousScore` | `float` | `0.0 - 100.0` | Previous semester/term final examination percentage |
| `internalMarks` | `float` | `0.0 - 100.0` | Cumulative score across continuous internal assessments |
| `assignmentCompletion` | `float` | `0.0 - 100.0` | Percentage of assigned problem sets and projects submitted |
| `studyHours` | `float` | `0.0 - 60.0` | Self-reported weekly independent study hours |
| `participation` | `float` | `0.0 - 100.0` | Active classroom and laboratory engagement score |

## 2. Target Variable

- **Target Column**: `finalScore`
- **Data Type**: `float` (Range: `0.0 - 100.0`)
- **Metric**: Continuous regression output representing estimated final academic score.

## 3. Dataset Preprocessing Requirements

1. **Missing Values**: Handled via feature median imputation during preprocessing.
2. **Outlier Detection**: Values outside physiological or academic limits (e.g. `attendance > 100` or `studyHours < 0`) are flagged and dropped or clamped.
3. **Scaling**: Z-score normalization (`StandardScaler`) is applied to all numerical inputs. The trained scaler artifact is persisted to `models/scaler.joblib` to ensure identical scaling at inference time.

## 4. Retraining on Real Institutional Data

To train the ANN model on your institution's verified examination data:

1. Place your CSV file at:
   ```
   apps/ml-service/data/student_performance_data.csv
   ```
2. Verify headers match:
   `attendance,previousScore,internalMarks,assignmentCompletion,studyHours,participation,finalScore`
3. Execute the training pipeline:
   ```powershell
   cd apps/ml-service
   .\venv\Scripts\python.exe training/train.py --data-path data/student_performance_data.csv
   ```
4. The trained model (`ann_model.keras`), scaler (`scaler.joblib`), and evaluation report (`model_metadata.json`) will automatically update.
