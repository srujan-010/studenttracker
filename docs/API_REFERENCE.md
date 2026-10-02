# EduGuard AI - REST API Reference

Base URL: `http://localhost:5000/api`  
Authentication: HTTP Bearer Token in `Authorization` header (`Authorization: Bearer <JWT>`)

---

## 1. Authentication Endpoints

### `POST /auth/login`
Authenticates a user and issues a JWT token.
- **Access:** Public
- **Request Body:**
  ```json
  {
    "email": "admin@eduguard.demo",
    "password": "EduGuard@2026!"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Login successful.",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIs...",
      "user": {
        "id": "67...",
        "name": "Dr. Vikram Malhotra",
        "email": "admin@eduguard.demo",
        "role": "ADMIN",
        "institutionId": "INST-001"
      }
    }
  }
  ```

### `POST /auth/logout`
Logs out user session and records an audit log event.
- **Access:** Authenticated

### `GET /auth/me`
Fetches current authenticated profile information.
- **Access:** Authenticated

---

## 2. Student Management Endpoints

### `GET /students`
Retrieves a paginated list of students with optional search and filters. Teachers only see students enrolled in their assigned classes.
- **Access:** ADMIN, TEACHER
- **Query Parameters:**
  - `page` (number, default: 1)
  - `limit` (number, default: 20)
  - `search` (string: name, studentId, email)
  - `department` (string: Computer Science, Information Technology, etc.)
  - `semester` (number)
  - `riskLevel` (enum: HIGH, MEDIUM, LOW)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "students": [...],
      "pagination": { "total": 35, "page": 1, "limit": 20, "totalPages": 2 }
    }
  }
  ```

### `POST /students`
Registers a new student record.
- **Access:** ADMIN
- **Request Body:**
  ```json
  {
    "studentId": "STU1001",
    "name": "Priya Sharma",
    "email": "priya.sharma@eduguard.demo",
    "phone": "+91 9876543210",
    "department": "Computer Science",
    "course": "B.Tech",
    "year": 3,
    "section": "A",
    "semester": 5
  }
  ```

### `GET /students/:id`
Retrieves full student profile, latest prediction, academic history, attendance, and interventions.
- **Access:** ADMIN, TEACHER (if authorized), STUDENT (own record only)

### `PUT /students/:id`
Updates student demographic and academic attributes.
- **Access:** ADMIN

### `POST /students/import-csv`
Uploads and bulk imports student records from CSV. Validates every row and reports valid/invalid rows with specific error reasons.
- **Access:** ADMIN
- **Multipart Form:** `file: <file.csv>`

---

## 3. Academic Records Endpoints

### `POST /academic-records`
Creates or updates an academic record (attendance, marks, assignments, study hours).
- **Access:** ADMIN, TEACHER
- **Request Body:**
  ```json
  {
    "studentId": "67...",
    "subjectId": "67...",
    "semester": 5,
    "academicYear": "2025-2026",
    "attendance": 84.5,
    "previousScore": 76.0,
    "internalMarks": 72.0,
    "assignmentCompletion": 90.0,
    "studyHours": 10.5,
    "participation": 80.0
  }
  ```

### `GET /students/:id/academic-records`
Fetches all historical semester records for a student.
- **Access:** ADMIN, TEACHER (authorized), STUDENT (self)

---

## 4. AI Prediction Pipeline Endpoints

### `POST /predictions`
Normalizes student features, calls the Python FastAPI TensorFlow ANN microservice, applies institutional risk classification thresholds, performs factor analysis, and stores the prediction snapshot in MongoDB.
- **Access:** ADMIN, TEACHER
- **Request Body:**
  ```json
  {
    "studentId": "67..."
  }
  ```
  *Or override explicit features directly:*
  ```json
  {
    "studentId": "67...",
    "features": {
      "attendance": 52.0,
      "previousScore": 48.0,
      "internalMarks": 44.0,
      "assignmentCompletion": 50.0,
      "studyHours": 4.0,
      "participation": 35.0
    }
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "_id": "67...",
      "studentId": "67...",
      "modelVersion": "v1.0.0",
      "predictedScore": 38.4,
      "riskLevel": "HIGH",
      "riskFactors": [
        {
          "factor": "Low Attendance Rate",
          "severity": "HIGH",
          "observedValue": 52.0,
          "referenceThreshold": 75.0,
          "description": "Observed attendance (52.0%) is below institutional reference threshold of 75%."
        }
      ],
      "recommendations": [
        {
          "category": "ATTENDANCE",
          "recommendation": "Coordinate with student counseling to review attendance barriers.",
          "priority": "HIGH"
        }
      ],
      "inputSnapshot": { ... },
      "createdAt": "2026-09-30T10:00:00Z"
    }
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Incomplete student academic features.
  - `404 Not Found`: Student not found.
  - `503 Service Unavailable`: Python ML microservice is unreachable.

### `GET /students/:id/predictions`
Fetches complete historical prediction timeline for a student.
- **Access:** ADMIN, TEACHER (authorized), STUDENT (self)

---

## 5. Early Warning & Interventions

### `GET /early-warnings`
Retrieves all students currently classified under HIGH or MEDIUM risk based on their latest ANN prediction.
- **Access:** ADMIN, TEACHER
- **Query Parameters:** `riskLevel`, `department`, `page`, `limit`

### `POST /interventions`
Creates an intervention action plan.
- **Access:** ADMIN, TEACHER
- **Request Body:**
  ```json
  {
    "studentId": "67...",
    "type": "ACADEMIC_COUNSELING",
    "title": "Remedial Calculus Review Session",
    "description": "Conduct 2 dedicated tutorial sessions on differential equations.",
    "priority": "URGENT",
    "dueDate": "2026-10-15T00:00:00Z"
  }
  ```

### `PUT /interventions/:id`
Updates intervention progress, status, and outcome notes.
- **Access:** ADMIN, TEACHER
- **Request Body:**
  ```json
  {
    "status": "COMPLETED",
    "outcome": "Student attended both sessions and completed mock quiz with 78% score."
  }
  ```

---

## 6. Dashboards, Reports, & Administration

### `GET /dashboard/summary`
Calculates real-time MongoDB aggregations:
- Total students, teachers, classes
- High/Medium/Low risk counts (from latest predictions)
- Average predicted score across active students
- Average attendance rate
- Intervention completion percentage
- Attention-required student triage list
- Risk distribution donut data
- Performance trend timeline

### `GET /reports/student/:id`
Generates comprehensive printable performance and risk assessment report.

### `GET /reports/class-risk`
Generates institutional risk report grouped by academic departments and sections.

### `GET /audit-logs`
Provides auditable trail of security, login, prediction, and academic modifications.
- **Access:** ADMIN only

### `GET /settings/thresholds` / `PUT /settings/thresholds`
Retrieves and updates institutional risk classification boundaries (`highRiskThreshold`, `mediumRiskThreshold`, and feature reference levels).
- **Access:** ADMIN only

---

## 7. Python FastAPI ML Microservice Endpoints

Host: `http://localhost:8000`

### `GET /health`
Returns service status, loaded model version, and architecture info.

### `POST /predict`
Performs ANN model inference using loaded Keras model and Scikit-Learn scaler.
- **Request Body:**
  ```json
  {
    "attendance": 85.0,
    "previousScore": 78.0,
    "internalMarks": 74.0,
    "assignmentCompletion": 92.0,
    "studyHours": 12.0,
    "participation": 80.0
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "predictedScore": 79.45,
    "modelVersion": "v1.0.0"
  }
  ```
