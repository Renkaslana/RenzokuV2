@echo off
REM ========================================
REM   🎬 RENZOKU ANIME STREAMING LAUNCHER
REM ========================================
REM Double-click untuk menjalankan Renzoku
REM ========================================

title Renzoku Anime Streaming
cls
echo.
echo ============================================
echo      🎬 RENZOKU ANIME STREAMING 🎬
echo ============================================
echo.
echo Starting Renzoku local server...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ❌ Python tidak ditemukan!
    echo.
    echo Renzoku memerlukan Python untuk menjalankan local server.
    echo Silakan install Python dari: https://python.org
    echo.
    echo ATAU gunakan Live Server extension di VS Code
    echo.
    pause
    exit /b 1
)

echo ✅ Python ditemukan!
echo.
echo 📡 Starting server di http://localhost:8000
echo.
echo ⏳ Membuka browser...
echo.
echo 💡 PENTING: Tekan Ctrl+F5 di browser untuk hard refresh
echo    (menghapus cache dan memuat ulang semua file)
echo.

REM Start Python HTTP server in background
start /B python -m http.server 8000

REM Wait 2 seconds for server to start
timeout /t 2 /nobreak >nul

REM Open browser
start http://localhost:8000

echo.
echo ============================================
echo   ✅ Renzoku sudah berjalan!
echo ============================================
echo.
echo 🌐 URL: http://localhost:8000
echo.
echo 📝 CATATAN:
echo    - Jangan tutup window ini!
echo    - Server akan berhenti jika window ditutup
echo    - Tekan Ctrl+C untuk stop server
echo.
echo ============================================
echo.

REM Keep the window open
pause
