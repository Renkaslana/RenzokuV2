@echo off
title Renzoku Anime Streaming
echo.
echo ========================================
echo    🎬 RENZOKU ANIME STREAMING 🎬
echo ========================================
echo.
echo Starting Renzoku server...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python tidak ditemukan!
    echo Silakan install Python dari: https://python.org
    echo.
    pause
    exit /b 1
)

REM Find available port
set PORT=8000
:check_port
netstat -an | find ":%PORT%" >nul
if %errorlevel% equ 0 (
    set /a PORT+=1
    goto check_port
)

echo ✅ Menggunakan port %PORT%
echo 🌐 Membuka browser...
start http://localhost:%PORT%/pages/index.html
echo.
echo ✅ Server berjalan di: http://localhost:%PORT%
echo 🚀 Menjalankan server...
echo.
echo ========================================
echo   Server Renzoku berhasil dijalankan!
echo ========================================
echo.
echo 📱 Akses website di: http://localhost:%PORT%/pages/index.html
echo 🛑 Tekan Ctrl+C untuk menghentikan server
echo.

python -m http.server %PORT%
