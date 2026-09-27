@echo off
title AURA-PainCare: AI Silent-Pain & Distress Monitor
color 0B

echo ======================================================================
echo    AURA-PainCare: AI Silent-Pain & Distress Monitoring System
echo    Zero-Hardware Pure Software Clinical Prototype
echo ======================================================================
echo.

cd /d "%~dp0"

REM Check for installed Python
set "PY_CMD="
if exist "%LocalAppData%\Programs\Python\Python311\python.exe" (
    set "PY_CMD=%LocalAppData%\Programs\Python\Python311\python.exe"
) else (
    where python >nul 2>nul
    if %errorlevel% equ 0 (
        set "PY_CMD=python"
    )
)

if defined PY_CMD (
    echo [*] Launching AURA-PainCare local server with Python...
    echo [*] Starting web dashboard at http://127.0.0.1:8000 ...
    echo.
    "%PY_CMD%" "python\app.py"
) else (
    echo [!] Python not detected in standard paths.
    echo [*] Launching AURA-PainCare directly in your default browser...
    start "" "index.html"
)

pause
