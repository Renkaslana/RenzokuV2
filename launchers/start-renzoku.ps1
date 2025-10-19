# PowerShell Launcher for Renzoku Anime Streaming
# Run this script with: powershell -ExecutionPolicy Bypass -File start-renzoku.ps1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   🎬 RENZOKU ANIME STREAMING 🎬" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting Renzoku server..." -ForegroundColor Green
Write-Host ""

# Check if Python is installed
try {
    $pythonVersion = python --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Python not found"
    }
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python tidak ditemukan!" -ForegroundColor Red
    Write-Host "Silakan install Python dari: https://python.org" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Tekan Enter untuk keluar"
    exit 1
}

# Find available port
$port = 8000
do {
    $portInUse = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($portInUse) {
        $port++
    }
} while ($portInUse)

Write-Host "✅ Menggunakan port $port" -ForegroundColor Green
Write-Host "🌐 Membuka browser..." -ForegroundColor Blue

# Open browser
Start-Process "http://localhost:$port"

Write-Host ""
Write-Host "✅ Server berjalan di: http://localhost:$port" -ForegroundColor Green
Write-Host "🚀 Menjalankan server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Server Renzoku berhasil dijalankan!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 Akses website di: http://localhost:$port" -ForegroundColor Cyan
Write-Host "🛑 Tekan Ctrl+C untuk menghentikan server" -ForegroundColor Yellow
Write-Host ""

# Start server
python -m http.server $port
