# EduGuard AI

### AI-Powered Student Performance Prediction & Early Warning System
> *"Identify Risk Early. Support Students Better."*

EduGuard AI is a comprehensive, production-grade university management and academic early warning platform. Built with an institutional SaaS philosophy, it connects students, faculty, and academic deans to identify students who may require academic support **before** final examinations.

---

## 🌟 Key Highlights & Engineering Standards

- **Zero Mock / Zero Fake Policy:** Real MongoDB Atlas integration with Mongoose ODM, real JWT authentication with role-based access control (RBAC), and real deep learning inference. If the ML service is offline, the API gracefully issues HTTP 503 instead of fabricating numbers.
- **Deep Learning Regression Pipeline:** Trained Artificial Neural Network (ANN) using **TensorFlow 2.21 + Keras 3.15** with Batch Normalization, Dropout regularization, and Scikit-Learn standard feature normalization ($R^2 = 0.8117$, MAE = 3.295 points).
- **Ethical & Transparent AI:** Adheres strictly to institutional standards. The system outputs *"Predicted Score"*, *"Risk Level"*, *"Model Estimate"*, and transparent *"Potential Contributing Factors"*. It never makes deterministic or fatalistic claims like *"student will fail"*.
- **Live Institutional Dashboards:** Real-time MongoDB aggregation pipelines calculate dynamic risk distribution, longitudinal performance trends, attendance vs. score correlations, and intervention completion rates.
- **Auditable & Reproducible:** Every prediction persists an immutable `inputSnapshot` of features, active `modelVersion`, and applied risk thresholds. All security-sensitive actions are logged to the `AuditLog` collection.

---

## 🏛️ System Architecture

```
                          Next.js 14 Web Frontend
                       (Tailwind CSS + Recharts + Lucide)
                                    │
                                    │ HTTPS / REST (Bearer JWT)
                                    ▼
                          Node.js + Express API
                      (RBAC, Aggregations, Auditing)
                         │                     │
      Mongoose Connection│                     │ HTTP POST /predict
                         ▼                     ▼
                  MongoDB Atlas         Python FastAPI ML Service
               (Database of Record)    (TensorFlow / Keras ANN Engine)
```

---

## 📁 Monorepo Structure

```
eduguard-ai/
├── apps/
│   ├── web/                        # Next.js 14 App Router frontend
│   │   ├── src/
│   │   │   ├── app/                # 16 Production routes (/dashboard, /students, etc.)
│   │   │   ├── components/         # Reusable charts, modals, layout, metric cards
│   │   │   ├── context/            # AuthContext, NotificationContext
│   │   │   └── lib/                # API client with automatic token injection
│   │   └── package.json
│   │
│   ├── api/                        # Node.js + Express + TypeScript REST API
│   │   ├── src/
│   │   │   ├── config/             # MongoDB Atlas connection & environment setup
│   │   │   ├── controllers/        # Controllers (auth, student, prediction, etc.)
│   │   │   ├── middleware/         # RBAC, JWT auth, rate limiter, audit logging
│   │   │   ├── models/             # 13 Mongoose models with proper indexes
│   │   │   ├── routes/             # Express API routes
│   │   │   ├── scripts/            # Database seed script & API integration tests
│   │   │   └── services/           # Factor analysis, recommendations, ML client
│   │   └── package.json
│   │
│   └── ml-service/                 # Python 3.11 FastAPI Deep Learning Microservice
│       ├── data/                   # Data specification & training dataset README
│       ├── inference/              # Real-time ANN inference & feature transformation
│       ├── models/                 # Saved artifacts (ann_model.keras, scaler.joblib, metadata)
│       ├── training/               # ANN training script & synthetic dataset generator
│       ├── main.py                 # FastAPI application (GET /health, POST /predict)
│       └── requirements.txt        # TensorFlow, Keras, FastAPI, Scikit-Learn
│
├── packages/
│   └── shared/                     # Shared TypeScript contracts, DTOs & risk thresholds
│       ├── src/
│       └── package.json
│
├── docs/                           # System architecture & REST API references
│   ├── ARCHITECTURE.md
│   └── API_REFERENCE.md
│
├── scripts/                        # Automation & verification scripts
│   ├── e2e-verification.ts         # 12-step end-to-end integration test suite
│   ├── start-all.bat               # 1-click Windows multi-service launcher
│   ├── seed.bat                    # 1-click DB seeder
│   └── train-model.bat             # 1-click ANN model trainer
│
├── .env.example                    # Template environment variables
├── package.json                    # Workspace orchestrator
└── README.md
```

---

## 🔑 Demo Accounts

Use these pre-seeded accounts to experience role-based perspectives:

| Role | Email | Password | Scope & Privileges |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@eduguard.demo` | `EduGuard@2026!` | Global oversight, user/teacher management, risk thresholds, audit logs |
| **Teacher** | `teacher@eduguard.demo` | `EduGuard@2026!` | Assigned classes (B.Tech CSE Sem 5), student records, run predictions, interventions |
| **Student** | `student@eduguard.demo` | `EduGuard@2026!` | Self-profile only, personal performance history, personalized recommendations |

---

## ⚙️ Quick Start Guide

### Prerequisites
1. **Node.js** v18.0.0 or later
2. **Python** 3.11 (TensorFlow 2.21 requires Python 3.10 or 3.11 on Windows)
3. **MongoDB** (Atlas connection URI or local MongoDB instance)

### 1. Installation
Clone the repository and install root dependencies:
```bash
git clone <repository-url>
cd Deeplearnig

# Install all monorepo workspace dependencies
npm install

# Build the shared contracts package
npm --workspace=@eduguard/shared run build
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in the root:
```bash
cp .env.example .env
```
Ensure your `.env` contains:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/eduguard_ai?retryWrites=true&w=majority
JWT_SECRET=eduguard_super_secret_jwt_key_2026_production_grade
ML_SERVICE_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Setup Python ML Microservice
Initialize the Python 3.11 virtual environment and install packages:
```bash
cd apps/ml-service
py -3.11 -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

*(Optional) Train the Neural Network:*
```bash
# Model artifacts are already pre-trained and saved in apps/ml-service/models/
python training/train.py
```

### 4. Seed the Database
Populate the database with realistic demo students, academic records, predictions, and classes:
```bash
# From workspace root:
npm run seed
```

---

## 🚀 Running the Application

### Option A: 1-Click Launch (Windows)
Double-click `scripts\start-all.bat` or run:
```cmd
scripts\start-all.bat
```
This starts the ML microservice, Backend API, and Next.js frontend in distinct labeled console windows.

### Option B: Concurrent Terminal Launch
From the root directory:
```bash
npm run dev
```

### Option C: Individual Terminals
- **ML Microservice:**
  ```bash
  cd apps/ml-service
  .\venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
  ```
- **Backend API:**
  ```bash
  npm run dev:api
  ```
- **Web Frontend:**
  ```bash
  npm run dev:web
  ```

Access the web interface at **`http://localhost:3000`**.

---

## 🧪 Comprehensive Verification & Testing

EduGuard AI features a 12-step programmatic integration test suite verifying the complete stack end-to-end:

```bash
npm run test:e2e
```

### What the E2E Suite Validates:
1. **ML Service Health:** Verifies FastAPI is alive and has loaded the TensorFlow Keras ANN (`/health`).
2. **Express API Health:** Validates MongoDB Atlas connection pooling and REST endpoints (`/api/health`).
3. **Admin Authentication:** Authenticates administrator and verifies JWT issuance.
4. **Subject & Class Creation:** Creates course curriculum entities in MongoDB.
5. **Student Registration:** Registers a new student record in MongoDB.
6. **Academic Record Entry:** Stores attendance, test marks, assignment completion, and study hours.
7. **Real ANN Prediction:**
   - Feeds data through Python FastAPI ML service.
   - Computes regression predicted score.
   - Generates transparent risk factors with severity indicators.
   - Generates tailored academic recommendations.
8. **Dashboard Recalculation:** Validates live MongoDB aggregation pipelines incorporate new prediction.
9. **Teacher Authentication:** Validates faculty login and authorization scope.
10. **Intervention Lifecycle:** Creates and completes student counseling record with documented outcomes.
11. **RBAC Isolation:** Proves a student attempting to access another student's profile receives **HTTP 403 Forbidden**.
12. **ML Failure Graceful Handling:** Terminates the ML service and confirms the API returns **HTTP 503** with zero fabricated predictions.

---

## 📊 Deep Learning Model Architecture

- **Inputs (6 Features):**
  - Attendance Rate ($0 - 100\%$)
  - Previous Examination Score ($0 - 100$)
  - Internal Assessment Marks ($0 - 100$)
  - Assignment Completion Rate ($0 - 100\%$)
  - Weekly Self-Study Hours ($0 - 40\text{ hrs}$)
  - Classroom & Lab Participation ($0 - 100\%$)
- **Architecture:**
  - `Dense(64, kernel_initializer='he_normal')` $\rightarrow$ `BatchNormalization` $\rightarrow$ `ReLU` $\rightarrow$ `Dropout(0.20)`
  - `Dense(32)` $\rightarrow$ `BatchNormalization` $\rightarrow$ `ReLU` $\rightarrow$ `Dropout(0.10)`
  - `Dense(16)` $\rightarrow$ `ReLU`
  - `Dense(1, activation='linear')`
- **Trained Performance:**
  - $R^2 \text{ Score}$: **0.8117**
  - $\text{Mean Absolute Error (MAE)}$: **3.295 points**
  - $\text{Root Mean Squared Error (RMSE)}$: **4.169 points**

---

## 🛡️ Role-Based Access Control (RBAC)

- **ADMIN (`admin@eduguard.demo`):**
  Full administrative privileges. Manage teachers, classes, subjects, student records, audit logs, system risk thresholds, and model metadata.
- **TEACHER (`teacher@eduguard.demo`):**
  Scoped to assigned classes and subjects. Enter academic marks and attendance, run ANN predictions, review early warning flags, and document intervention actions.
- **STUDENT (`student@eduguard.demo`):**
  Scoped strictly to self. View personal performance predictions, risk assessment breakdowns, historical performance trends, and action recommendations. Accessing other students returns `403 Forbidden`.

---

## 📜 License

EduGuard AI is licensed under the MIT License for institutional and educational research purposes.
#   s t u d e n t t r a c k e r  
 