# PowerShell script to start the backend server

Write-Host "🚀 Starting Backend Server..." -ForegroundColor Green

# Load environment variables if .env exists
if (Test-Path ".env") {
    Write-Host "📝 Loading environment variables from .env" -ForegroundColor Yellow
    Get-Content ".env" | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
}

# Set default values
$env:NODE_ENV = if ($env:NODE_ENV) { $env:NODE_ENV } else { "production" }
$env:PORT = if ($env:PORT) { $env:PORT } else { "10000" }

Write-Host "🔧 Environment: $env:NODE_ENV" -ForegroundColor Cyan
Write-Host "🌐 Port: $env:PORT" -ForegroundColor Cyan

# Check if PM2 is installed
try {
    pm2 --version | Out-Null
    Write-Host "✅ PM2 is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ PM2 is not installed. Please install it first: npm install -g pm2" -ForegroundColor Red
    exit 1
}

# Start PM2 processes
Write-Host "🔄 Starting PM2 processes..." -ForegroundColor Yellow
pm2 start ecosystem.config.js

# Wait a moment for processes to start
Start-Sleep -Seconds 3

# Show status
Write-Host "📊 === Backend Server Status ===" -ForegroundColor Magenta
Write-Host ""

Write-Host "🔄 PM2 Processes:" -ForegroundColor Cyan
pm2 status

Write-Host ""
Write-Host "🌐 Ngrok Status:" -ForegroundColor Cyan
if (Get-Process -Name "ngrok" -ErrorAction SilentlyContinue) {
    Write-Host "✅ Ngrok is running" -ForegroundColor Green
} else {
    Write-Host "❌ Ngrok is not running" -ForegroundColor Red
}

Write-Host ""
Write-Host "🔧 Backend Status:" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:$env:PORT/api/ping" -TimeoutSec 5 -ErrorAction Stop
    if ($response.Content -eq "pong") {
        Write-Host "✅ Backend is responding on port $env:PORT" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend is not responding correctly on port $env:PORT" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Backend is not responding on port $env:PORT" -ForegroundColor Red
}

Write-Host ""
Write-Host "🤖 Telegram Bot Status:" -ForegroundColor Cyan
$pm2List = pm2 list
if ($pm2List -match "telegram-bot.*online") {
    Write-Host "✅ Telegram bot is running" -ForegroundColor Green
} else {
    Write-Host "❌ Telegram bot is not running" -ForegroundColor Red
}

Write-Host ""
Write-Host "📝 Recent Logs:" -ForegroundColor Cyan
Get-ChildItem -Name "*.log" -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "  $_" -ForegroundColor Gray
}

Write-Host ""
Write-Host "✅ Backend server started successfully!" -ForegroundColor Green
Write-Host "📊 Check status: pm2 status" -ForegroundColor Yellow
Write-Host "📝 View logs: pm2 logs" -ForegroundColor Yellow
Write-Host "🛑 Stop server: pm2 stop all" -ForegroundColor Yellow 