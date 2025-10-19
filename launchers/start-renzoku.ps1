# Renzoku Anime Streaming - PowerShell Launcher
# Author: Renzoku Team
# Description: Easy launcher for Renzoku anime streaming website

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   🎬 RENZOKU ANIME STREAMING 🎬" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Python is installed
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python ditemukan: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python tidak ditemukan!" -ForegroundColor Red
    Write-Host "Silakan install Python dari: https://python.org" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Tekan Enter untuk keluar"
    exit 1
}

# Function to check if port is available
function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $false
    } catch {
        return $true
    }
}

# Check available port
$port = 8000
if (-not (Test-Port -Port $port)) {
    Write-Host "⚠️  Port $port sudah digunakan!" -ForegroundColor Yellow
    $port = 8001
    if (-not (Test-Port -Port $port)) {
        $port = 8002
    }
    Write-Host "✅ Menggunakan port $port" -ForegroundColor Green
} else {
    Write-Host "✅ Port $port tersedia" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Menjalankan server Renzoku..." -ForegroundColor Cyan
Write-Host ""

# Start server
try {
    Write-Host "📡 Server URL: http://localhost:$port" -ForegroundColor Green
    Write-Host "🌐 Membuka browser..." -ForegroundColor Blue
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "   Server Renzoku berhasil dijalankan!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📱 Akses website di:" -ForegroundColor White
    Write-Host "   http://localhost:$port" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🛑 Tekan Ctrl+C untuk menghentikan server" -ForegroundColor Red
    Write-Host ""
    
    # Open browser
    Start-Process "http://localhost:$port/pages/index.html"
    
    # Start Python server
    python -m http.server $port
    
} catch {
    Write-Host "❌ Error menjalankan server: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Read-Host "Tekan Enter untuk keluar"
}
