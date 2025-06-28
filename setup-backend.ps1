# PowerShell script to set up Backend Server for Windows

# Set error action preference to stop on errors
$ErrorActionPreference = "Stop"

Write-Host "🚀 Setting up Backend Server for Windows..." -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if we're in the right directory
if (-not (Test-Path "server.mjs")) {
    Write-Error "server.mjs not found. Please run this script from your project root."
    exit 1
}

Write-Host ""
Write-Host "🔍 Checking System Requirements..." -ForegroundColor Magenta

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Success "Node.js found: $nodeVersion"
} catch {
    Write-Error "Node.js is not installed. Please install Node.js first from https://nodejs.org/"
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version
    Write-Success "npm found: $npmVersion"
} catch {
    Write-Error "npm is not installed."
    exit 1
}

# Check if port 10000 is already in use
try {
    $portCheck = Get-NetTCPConnection -LocalPort 10000 -ErrorAction SilentlyContinue
    if ($portCheck) {
        Write-Warning "Port 10000 is already in use!"
        Write-Status "You may need to stop the existing service or change the port in .env"
    }
} catch {
    # Port is not in use, which is good
}

Write-Host ""
Write-Host "📦 Installing Dependencies..." -ForegroundColor Magenta

Write-Status "Installing dependencies..."
try {
    npm install --silent
    Write-Success "Dependencies installed successfully"
} catch {
    Write-Error "Failed to install dependencies"
    exit 1
}

Write-Host ""
Write-Host "⚙️  Setting up PM2..." -ForegroundColor Magenta

# Install PM2 globally if not installed
try {
    $pm2Version = pm2 --version
    Write-Success "PM2 found: $pm2Version"
} catch {
    Write-Status "Installing PM2 globally..."
    try {
        npm install -g pm2 --silent
        Write-Success "PM2 installed successfully"
    } catch {
        Write-Error "Failed to install PM2"
        exit 1
    }
}

# Verify PM2 is accessible after install
try {
    $pm2Version = pm2 --version
    Write-Success "PM2 verified and accessible"
} catch {
    Write-Error "PM2 was installed but is not accessible. Try restarting your shell or checking PATH."
    exit 1
}

Write-Host ""
Write-Host "⚙️  Configuring Environment..." -ForegroundColor Magenta

# Create .env file if it doesn't exist
if (Test-Path ".env") {
    Write-Status ".env file already exists"
    $choice = Read-Host "Do you want to regenerate the .env file? [y/N]"
    if ($choice -match "^[Yy]$") {
        Write-Status "Creating new .env file..."
        @"
# Backend Server Configuration
NODE_ENV=production
PORT=10000

# Ngrok Configuration (if using ngrok)
NGROK_AUTH_TOKEN=your_ngrok_auth_token_here

# DuckDNS Configuration (if using DuckDNS)
DUCKDNS_DOMAIN=your_duckdns_domain_here
DUCKDNS_TOKEN=your_duckdns_token_here

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here

# Database Configuration
DB_FILE=db.json
"@ | Out-File -FilePath ".env" -Encoding UTF8
        Write-Success ".env file regenerated. Please edit it with your actual values."
    }
} else {
    Write-Status "Creating .env file..."
    @"
# Backend Server Configuration
NODE_ENV=production
PORT=10000

# Ngrok Configuration (if using ngrok)
NGROK_AUTH_TOKEN=your_ngrok_auth_token_here

# DuckDNS Configuration (if using DuckDNS)
DUCKDNS_DOMAIN=your_duckdns_domain_here
DUCKDNS_TOKEN=your_duckdns_token_here

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here

# Database Configuration
DB_FILE=db.json
"@ | Out-File -FilePath ".env" -Encoding UTF8
    Write-Success ".env file created. Please edit it with your actual values."
}

Write-Host ""
Write-Host "🧪 Testing Server Startup..." -ForegroundColor Magenta

# Test the server
Write-Status "Testing server startup..."
try {
    $env:PORT = "10000"
    Start-Process -FilePath "node" -ArgumentList "server.mjs" -WindowStyle Hidden
    $serverProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue | Select-Object -First 1

    Start-Sleep -Seconds 3

    try {
        $response = Invoke-WebRequest -Uri "http://localhost:10000/api/ping" -TimeoutSec 5 -ErrorAction Stop
        if ($response.Content -eq "pong") {
            Write-Success "Server test successful - backend is responding"
        } else {
            Write-Warning "Server test failed - backend may not be responding correctly"
        }
    } catch {
        Write-Warning "Server test failed - backend may not be responding"
    }

    # Stop the test server
    if ($serverProcess) {
        Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
    }
} catch {
    Write-Warning "Could not test server startup"
}

Write-Host ""
Write-Host "🚀 Setting up PM2 Startup..." -ForegroundColor Magenta

Write-Status "Setting up PM2 startup script..."
try {
    pm2 startup
    Write-Success "PM2 startup configured"
} catch {
    Write-Warning "PM2 startup configuration failed (this is normal in some environments)"
}

Write-Status "Saving current PM2 process list..."
pm2 save

Write-Host ""
Write-Host "🎉 Backend setup complete!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Edit .env file with your actual values"
Write-Host "2. Run: ./start-backend-server.ps1"
Write-Host "3. Check status: pm2 status"
Write-Host "4. View logs: pm2 logs"
Write-Host ""
Write-Host "🔧 Useful commands:" -ForegroundColor Yellow
Write-Host "  Start server: ./start-backend-server.ps1"
Write-Host "  Stop server: pm2 stop all"
Write-Host "  Restart server: pm2 restart all"
Write-Host "  View logs: pm2 logs"
Write-Host "  Check status: pm2 status"
Write-Host ""
Write-Host "📱 For mobile access:" -ForegroundColor Yellow
Write-Host "  - Install ngrok and add your auth token to .env"
Write-Host "  - Or set up DuckDNS and add your domain/token to .env"
Write-Host ""
Write-Success "Your backend is ready to use!" 