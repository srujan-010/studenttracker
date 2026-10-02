@echo off
echo =================================================================
echo   EduGuard AI - Artificial Neural Network Model Training
echo =================================================================
cd apps\ml-service
.\venv\Scripts\python.exe training\train.py
cd ..\..
pause
