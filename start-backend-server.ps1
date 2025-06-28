# Windows PowerShell Backend Server Starter
# For Windows users who want to run the backend locally

Write-Host "🚀 Starting Backend Server..." -ForegroundColor Green

# Load environment variables if .env exists
if (Test-Path ".env") {
    Write-Host "📝 Loading environment variables from .env" -ForegroundColor Blue
    Get-Content ".env" | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            Set-Variable -Name $name -Value $value -Scope Global
        }
    }
}

# Set default values
$env:NODE_ENV = if ($env:NODE_ENV) { $env:NODE_ENV } else { "development" }
$env:PORT = if ($env:PORT) { $env:PORT } else { "10000" }

Write-Host "🔧 Environment: $env:NODE_ENV" -ForegroundColor Cyan
Write-Host "🌐 Port: $env:PORT" -ForegroundColor Cyan

# Check if PM2 is installed
try {
    $pm2Version = pm2 --version
    Write-Host "✅ PM2 found: $pm2Version" -ForegroundColor Green
} catch {
    Write-Host "❌ PM2 is not installed. Please run ./setup-backend.ps1 first" -ForegroundColor Red
    exit 1
}

# Start PM2 processes
Write-Host "🔄 Starting PM2 processes..." -ForegroundColor Blue
pm2 start ecosystem.config.js

# Wait a moment for processes to start
Start-Sleep -Seconds 3

# Show status
Write-Host "📊 === Backend Server Status ===" -ForegroundColor Yellow
Write-Host ""

Write-Host "🔄 PM2 Processes:" -ForegroundColor Cyan
pm2 status

Write-Host ""
Write-Host "🔧 Backend Status:" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:$env:PORT/api/ping" -TimeoutSec 5 -UseBasicParsing
    if ($response.Content -eq "pong") {
        Write-Host "✅ Backend is responding on port $env:PORT" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend is not responding correctly on port $env:PORT" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Backend is not responding on port $env:PORT" -ForegroundColor Red
}

Write-Host ""
Write-Host "📝 Recent Logs:" -ForegroundColor Cyan
Get-ChildItem *.log -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "   $($_.Name) - $($_.Length) bytes" -ForegroundColor White
}

Write-Host ""
Write-Host "✅ Backend server started successfully!" -ForegroundColor Green
Write-Host "📊 Check status: pm2 status" -ForegroundColor White
Write-Host "📝 View logs: pm2 logs" -ForegroundColor White
Write-Host "🛑 Stop server: pm2 stop all" -ForegroundColor White
Write-Host "🌐 Access: http://localhost:$env:PORT/api/ping" -ForegroundColor Cyan 