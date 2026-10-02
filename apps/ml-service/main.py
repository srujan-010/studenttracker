import time
import os
from fastapi import FastAPI, HTTPException, Header, status
from pydantic import BaseModel, Field
from inference.predictor import predictor

app = FastAPI(
    title="EduGuard AI - ML Prediction Microservice",
    description="Dedicated Deep Learning ANN Inference Microservice for Student Academic Performance Prediction",
    version="1.0.0",
)

EXPECTED_SECRET = os.getenv("ML_SERVICE_SECRET", "eduguard_internal_ml_service_token_2026")

class PredictionRequest(BaseModel):
    attendance: float = Field(..., ge=0.0, le=100.0, description="Attendance percentage (0-100)")
    previousScore: float = Field(..., ge=0.0, le=100.0, description="Previous academic score (0-100)")
    internalMarks: float = Field(..., ge=0.0, le=100.0, description="Internal assessment marks (0-100)")
    assignmentCompletion: float = Field(..., ge=0.0, le=100.0, description="Assignment completion percentage (0-100)")
    studyHours: float = Field(..., ge=0.0, le=100.0, description="Self-study hours per week (0-100)")
    participation: float = Field(..., ge=0.0, le=100.0, description="Classroom participation score (0-100)")

class PredictionResponse(BaseModel):
    predictedScore: float
    modelVersion: str
    latencyMs: float

class HealthResponse(BaseModel):
    status: str
    service: str
    modelReady: bool
    modelVersion: str
    timestamp: float

@app.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse(
        status="HEALTHY" if predictor.is_ready() else "DEGRADED",
        service="EduGuard AI ML Microservice",
        modelReady=predictor.is_ready(),
        modelVersion=predictor.model_version,
        timestamp=time.time(),
    )

@app.post("/predict", response_model=PredictionResponse)
def predict(payload: PredictionRequest, x_service_secret: str | None = Header(default=None)):
    # Verify internal secret if provided
    if x_service_secret and x_service_secret != EXPECTED_SECRET:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid service secret for internal ML microservice",
        )

    if not predictor.is_ready():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ANN model is not loaded or ready. Training must be run.",
        )

    start_time = time.perf_counter()
    try:
        predicted_score, model_version = predictor.predict(payload.model_dump())
        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

        return PredictionResponse(
            predictedScore=predicted_score,
            modelVersion=model_version,
            latencyMs=latency_ms,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
