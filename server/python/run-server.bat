@echo off
REM -------------------------------
REM FastAPI Python Server Launcher
REM -------------------------------

echo ================================
echo Starting FastAPI Server Setup
echo ================================

REM Check if venv exists
if not exist venv (
    echo [INFO] Virtual environment not found. Creating venv...
    python -m venv venv
) else (
    echo [INFO] Virtual environment already exists. Skipping creation.
)

REM Activate venv
echo [INFO] Activating virtual environment...
call venv\Scripts\activate

REM Check if requirements are installed
echo [INFO] Checking if required packages are installed...
for /f "delims=" %%p in ('type requirements.txt') do (
    pip show %%p >nul 2>&1 || (
        echo [INFO] Package %%p not found. Installing...
        pip install %%p
    )
)

REM Run FastAPI
echo [INFO] Starting FastAPI server on http://127.0.0.1:8000 ...
python -m uvicorn main:app --reload --port 8000
