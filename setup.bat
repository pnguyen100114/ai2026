@echo off
setlocal
cd /d "%~dp0"
title StudyMate - Auto Setup

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1"

if errorlevel 1 (
    echo.
    echo Setup that bai. Xem thong bao o tren de biet cach xu ly.
    pause
)

endlocal
