#!/bin/bash

# Renzoku Anime Streaming - Linux/Mac Launcher
# Author: Renzoku Team
# Description: Easy launcher for Renzoku anime streaming website

echo ""
echo "========================================"
echo "   🎬 RENZOKU ANIME STREAMING 🎬"
echo "========================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    if ! command -v python &> /dev/null; then
        echo "❌ Python tidak ditemukan!"
        echo "Silakan install Python dari: https://python.org"
        echo ""
        read -p "Tekan Enter untuk keluar..."
        exit 1
    else
        PYTHON_CMD="python"
    fi
else
    PYTHON_CMD="python3"
fi

echo "✅ Python ditemukan: $($PYTHON_CMD --version)"

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 1  # Port is in use
    else
        return 0  # Port is available
    fi
}

# Check available port
PORT=8000
if ! check_port $PORT; then
    echo "⚠️  Port $PORT sudah digunakan!"
    PORT=8001
    if ! check_port $PORT; then
        PORT=8002
    fi
    echo "✅ Menggunakan port $PORT"
else
    echo "✅ Port $PORT tersedia"
fi

echo ""
echo "🚀 Menjalankan server Renzoku..."
echo ""

# Start server
echo "📡 Server URL: http://localhost:$PORT"
echo "🌐 Membuka browser..."
echo ""
echo "========================================"
echo "   Server Renzoku berhasil dijalankan!"
echo "========================================"
echo ""
echo "📱 Akses website di:"
echo "   http://localhost:$PORT"
echo ""
echo "🛑 Tekan Ctrl+C untuk menghentikan server"
echo ""

# Open browser (try different commands)
if command -v xdg-open &> /dev/null; then
    xdg-open "http://localhost:$PORT/pages/index.html" &
elif command -v open &> /dev/null; then
    open "http://localhost:$PORT/pages/index.html" &
elif command -v firefox &> /dev/null; then
    firefox "http://localhost:$PORT/pages/index.html" &
elif command -v google-chrome &> /dev/null; then
    google-chrome "http://localhost:$PORT/pages/index.html" &
fi

# Start Python server
$PYTHON_CMD -m http.server $PORT
