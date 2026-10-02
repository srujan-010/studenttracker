@echo off
echo =================================================================
echo   EduGuard AI - Starting All Services
echo   Frontend: http://localhost:3000
echo   Backend API: http://localhost:5000/api
echo   ML Microservice: http://localhost:8000
echo =================================================================

start "EduGuard ML Microservice (FastAPI + TensorFlow)" cmd /k "cd apps\ml-service && .\venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
timeout /t 3 /nobreak >nul

start "EduGuard Backend API (Express + MongoDB)" cmd /k "cd apps\api && npm run dev"
timeout /t 3 /nobreak >nul

start "EduGuard Web Frontend (Next.js 14)" cmd /k "cd apps\web && npm run dev"

echo All services launched in separate windows!
echo Access the application at: http://localhost:3000
pause
