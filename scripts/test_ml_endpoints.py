import os
import sys
import time
import json
import urllib.request
import subprocess

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ML_DIR = os.path.join(BASE_DIR, "apps", "ml-service")
PYTHON_EXE = os.path.join(ML_DIR, "venv", "Scripts", "python.exe")

def test_endpoints():
    print("==========================================================================")
    print(" EduGuard AI - Live FastAPI Microservice Verification (/health & /predict)")
    print("==========================================================================")

    # Launch uvicorn server in subprocess
    cmd = [
        PYTHON_EXE,
        "-m", "uvicorn",
        "main:app",
        "--host", "127.0.0.1",
        "--port", "8008"
    ]
    print(f"Starting FastAPI server on http://127.0.0.1:8008 ...")
    server_process = subprocess.Popen(cmd, cwd=ML_DIR, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    try:
        # Wait for server to bind
        time.sleep(2.5)

        # 1. Test GET /health
        health_url = "http://127.0.0.1:8008/health"
        print(f"\n[1] Testing GET {health_url}")
        req = urllib.request.Request(health_url)
        with urllib.request.urlopen(req, timeout=5) as response:
            status = response.getcode()
            body = json.loads(response.read().decode("utf-8"))
            print(f"Status:   {status} OK")
            print(f"Response: {json.dumps(body, indent=2)}")
            assert status == 200, "Health check failed!"
            assert body["status"] == "HEALTHY", "Service status not healthy!"
            assert body["modelReady"] is True, "Model not ready!"

        # 2. Test POST /predict with exact express backend contract
        predict_url = "http://127.0.0.1:8008/predict"
        print(f"\n[2] Testing POST {predict_url}")
        payload = {
            "attendance": 85.0,
            "previousScore": 78.0,
            "internalMarks": 72.0,
            "assignmentCompletion": 88.0,
            "studyHours": 12.0,
            "participation": 75.0
        }
        data = json.dumps(payload).encode("utf-8")
        headers = {
            "Content-Type": "application/json",
            "X-Service-Secret": "eduguard_internal_ml_service_token_2026"
        }
        print(f"Request Payload: {json.dumps(payload)}")
        print(f"Request Headers: {headers}")

        post_req = urllib.request.Request(predict_url, data=data, headers=headers, method="POST")
        with urllib.request.urlopen(post_req, timeout=5) as response:
            status = response.getcode()
            body = json.loads(response.read().decode("utf-8"))
            print(f"Status:   {status} OK")
            print(f"Response: {json.dumps(body, indent=2)}")
            assert status == 200, "Prediction request failed!"
            assert "predictedScore" in body, "predictedScore missing from response!"
            assert "modelVersion" in body, "modelVersion missing from response!"
            assert "latencyMs" in body, "latencyMs missing from response!"

        print("\n==========================================================================")
        print(" ALL ENDPOINT TESTS PASSED SUCCESSFULLY!")
        print(" FastAPI microservice is verified, responsive, and contract-compliant!")
        print("==========================================================================")
        return True

    finally:
        server_process.terminate()
        server_process.wait()

if __name__ == "__main__":
    success = test_endpoints()
    sys.exit(0 if success else 1)
