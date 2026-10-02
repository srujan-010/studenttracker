# EduGuard AI - Architecture & System Design

> **"Identify Risk Early. Support Students Better."**

EduGuard AI is a multi-tier, production-grade academic early warning and student performance prediction system designed for universities and higher education institutions.

---

## 1. System Overview & Component Topology

```
+-----------------------------------------------------------------------------------+
|                                  USER LAYER                                       |
|  +------------------------+  +------------------------+  +---------------------+  |
|  |    Admin Dashboard     |  |    Teacher Portal      |  |   Student Portal    |  |
|  +------------------------+  +------------------------+  +---------------------+  |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v  HTTPS / JSON
+-----------------------------------------------------------------------------------+
|                        FRONTEND WEB APPLICATION (Next.js 14)                      |
|  - App Router architecture (/dashboard, /students, /early-warnings, /reports)     |
|  - Institutional SaaS UI (Tailwind CSS, Lucide icons, Recharts visualization)     |
|  - Client Contexts: AuthContext (JWT + LocalStorage), NotificationContext          |
|  - Dynamic Modals: PredictionRunModal, InterventionModal, CSV Import Wizard       |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v  REST API (Bearer JWT)
+-----------------------------------------------------------------------------------+
|                           BACKEND API (Node.js + Express)                         |
|  - Role-Based Access Control (RBAC: ADMIN, TEACHER, STUDENT)                      |
|  - Request Rate Limiting & Helmet Security Headers                                |
|  - Transparent Factor Analysis & Multi-tier Recommendation Engine                 |
|  - Audit Logging Middleware & Live MongoDB Aggregation Pipelines                  |
+--------------------+--------------------------------------+-----------------------+
                     |                                      |
       Internal HTTP | POST /predict                        | Mongoose ODM
       (Failover: 503)                                      | Connection Pooling
                     v                                      v
+-----------------------------+       +---------------------------------------------+
|    ML SERVICE (FastAPI)     |       |          DATABASE (MongoDB Atlas)           |
|  - Python 3.11 + Uvicorn    |       |  Collections:                               |
|  - TensorFlow 2.21 + Keras  |       |  - users              - students            |
|  - StandardScaler Normalizer|       |  - teachers           - subjects            |
|  - Model Version: v1.0.0    |       |  - classes            - academicrecords     |
|  - Architecture:            |       |  - attendancerecords  - assignments         |
|    Dense(64) -> BN -> ReLU  |       |  - predictions        - interventions       |
|    -> Dropout(0.2)          |       |  - notifications      - auditlogs           |
|    -> Dense(32) -> BN       |       |  - systemsettings     - modelmetadata       |
|    -> ReLU -> Dense(1)      |       +---------------------------------------------+
+-----------------------------+
```

---

## 2. Artificial Neural Network (ANN) Regression Pipeline

### 2.1 Feature Set
The deep learning model accepts 6 continuous academic and behavioral indicators normalized to standard statistical distributions:

| Feature Name | Description | Range | Normalization |
| :--- | :--- | :--- | :--- |
| `attendance` | Percentage of lectures and laboratory sessions attended | 0.0 - 100.0% | `StandardScaler` ($\mu, \sigma$) |
| `previousScore` | Cumulative score in preceding semester or prerequisite courses | 0.0 - 100.0 | `StandardScaler` ($\mu, \sigma$) |
| `internalMarks` | Continuous assessment and mid-term internal evaluation marks | 0.0 - 100.0 | `StandardScaler` ($\mu, \sigma$) |
| `assignmentCompletion` | Percentage of assigned practicals, projects, and homework submitted | 0.0 - 100.0% | `StandardScaler` ($\mu, \sigma$) |
| `studyHours` | Self-reported weekly independent study and revision hours | 0.0 - 40.0 hrs | `StandardScaler` ($\mu, \sigma$) |
| `participation` | Classroom engagement, quiz participation, and laboratory interaction | 0.0 - 100.0% | `StandardScaler` ($\mu, \sigma$) |

### 2.2 Neural Network Architecture
```
Input Vector [6 features]
       │
       ▼
Dense (64 units, He Normal initialization)
       │
BatchNormalization()
       │
ReLU Activation
       │
Dropout (rate = 0.20)
       │
       ▼
Dense (32 units)
       │
BatchNormalization()
       │
ReLU Activation
       │
Dropout (rate = 0.10)
       │
       ▼
Dense (16 units) -> ReLU
       │
       ▼
Dense (1 unit, Linear Activation) -> Predicted Score [0.0 - 100.0]
```

- **Loss Function:** Mean Squared Error (MSE)
- **Optimizer:** Adam ($\alpha = 0.001, \beta_1 = 0.9, \beta_2 = 0.999$)
- **Validation Metrics:** Mean Absolute Error (MAE), Root Mean Squared Error (RMSE), Coefficient of Determination ($R^2$)
- **Current Model Benchmark:** MAE = 3.295 points, RMSE = 4.169 points, $R^2 = 0.8117$.

---

## 3. Accountable AI & Transparent Factor Analysis

EduGuard AI adheres to the strict ethical guideline that **neural networks output statistical estimates, not absolute fatalistic determinations**.

1. **Prediction Labeling:** All system interfaces present outputs as:
   - *"Predicted Score"*
   - *"Risk Level"*
   - *"Model Estimate"*
   - *"Potential Risk Factors"*
   - Never *"Student will fail"*.
2. **Transparent Factor Decomposition:**
   Rather than presenting uninterpretable neural weights as causation, the backend evaluates each input feature against institutional benchmark thresholds:
   - **Low Attendance:** If attendance $< 75\%$ (Severity: HIGH if $< 60\%$, MEDIUM otherwise)
   - **Low Previous Score:** If score $< 55$
   - **Low Internal Marks:** If internal assessment $< 50$
   - **Low Assignment Completion:** If completion $< 70\%$
   - **Low Study Hours:** If independent hours $< 8\text{ hrs/week}$
   - **Low Participation:** If participation score $< 50\%$
3. **Reproducibility Guarantee:** Every prediction record persists an immutable `inputSnapshot` capturing the exact features submitted at inference time, alongside the active `modelVersion` and the exact risk thresholds applied.

---

## 4. Role-Based Access Control (RBAC) Matrix

| Resource / Capability | ADMIN | TEACHER | STUDENT |
| :--- | :---: | :---: | :---: |
| Institution Settings & Thresholds | Read / Write | Denied | Denied |
| User & Teacher Management | Read / Write | Denied | Denied |
| Class & Subject Management | Read / Write | Read Only | Denied |
| Student Records Management | Global Read / Write | Assigned Classes Only | Denied |
| Own Profile & History | Read / Write | Read / Write | Read Only (Self) |
| Academic Records Entry | Read / Write | Assigned Classes Only | Denied |
| Run ANN Predictions | Authorized | Authorized (Assigned) | Denied |
| View Predictions & Recommendations | Global | Assigned Classes Only | Own Records Only |
| Create & Update Interventions | Global | Assigned Classes Only | View Own Interventions |
| View System Audit Logs | Full Access | Denied | Denied |
| System Health & Metrics | Full Access | Class-scoped | Denied |

---

## 5. Security & Reliability Measures

- **No Plaintext Passwords:** Passwords hashed with `bcrypt` (10 rounds).
- **Stateless JWT Authorization:** Signed with cryptographic secret, embedded with `userId`, `role`, and optional `teacherId` / `studentId`.
- **Database Safety:** Mongoose parameterized queries preventing NoSQL operator injection; strict schema definitions with input sanitization.
- **Microservice Fault Tolerance:**
  If the Python ML microservice becomes unavailable or crashes, the Node.js API catches the network timeout / connection refused error and immediately responds with **HTTP 503 Service Unavailable** ("AI prediction service is currently unavailable. Please try again later."). Under no circumstances are fake predictions generated or displayed.
