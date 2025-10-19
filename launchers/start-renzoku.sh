#!/bin/bash
# Shell Launcher for Renzoku Anime Streaming
# Run this script with: bash start-renzoku.sh

echo ""
echo "========================================"
echo "   🎬 RENZOKU ANIME STREAMING 🎬"
echo "========================================"
echo ""
echo "Starting Renzoku server..."
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    if ! command -v python &> /dev/null; then
        echo "❌ Python tidak ditemukan!"
        echo "Silakan install Python dari: https://python.org"
        echo ""
        read -p "Tekan Enter untuk keluar"
        exit 1
    else
        PYTHON_CMD="python"
    fi
else
    PYTHON_CMD="python3"
fi

echo "✅ Python found: $($PYTHON_CMD --version)"

# Find available port
PORT=8000
while lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; do
    PORT=$((PORT+1))
done

echo "✅ Menggunakan port $PORT"
echo "🌐 Membuka browser..."

# Open browser (try different commands based on OS)
if command -v open &> /dev/null; then
    # macOS
    open "http://localhost:$PORT"
elif command -v xdg-open &> /dev/null; then
    # Linux
    xdg-open "http://localhost:$PORT"
elif command -v start &> /dev/null; then
    # Windows (if running in Git Bash)
    start "http://localhost:$PORT"
fi

echo ""
echo "✅ Server berjalan di: http://localhost:$PORT"
echo "🚀 Menjalankan server..."
echo ""
echo "========================================"
echo "   Server Renzoku berhasil dijalankan!"
echo "========================================"
echo ""
echo "📱 Akses website di: http://localhost:$PORT"
echo "🛑 Tekan Ctrl+C untuk menghentikan server"
echo ""

# Start server
$PYTHON_CMD -m http.server $PORT
