# PowerShell script to set up Backend Server for Windows

# Set error action preference to stop on errors
$ErrorActionPreference = "Stop"

# Log file setup
$LOG_FILE = "backend-setup.log"
Start-Transcript -Path $LOG_FILE -Append

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

# Retry function for resilient operations
function Invoke-WithRetry {
    param(
        [int]$MaxAttempts = 3,
        [scriptblock]$ScriptBlock,
        [string]$ErrorMessage = "Command failed after $MaxAttempts attempts"
    )
    
    $attempt = 1
    while ($attempt -le $MaxAttempts) {
        try {
            & $ScriptBlock
            return
        } catch {
            if ($attempt -eq $MaxAttempts) {
                Write-Error "$ErrorMessage`: $($_.Exception.Message)"
                exit 1
            }
            Write-Warning "Attempt $attempt failed. Retrying in 2s..."
            Start-Sleep -Seconds 2
            $attempt++
        }
    }
}

# Check if we're in the right directory
if (-not (Test-Path "server.mjs")) {
    Write-Error "server.mjs not found. Please run this script from your project root."
    exit 1
}

Write-Host ""
Write-Host "🔍 Checking System Requirements..." -ForegroundColor Magenta

# User privilege check
if ([Security.Principal.WindowsIdentity]::GetCurrent().IsSystem) {
    Write-Warning "You're running this script as SYSTEM. It's safer to run as a regular user unless required."
}

# Network connectivity check
Write-Status "Checking internet connectivity..."
try {
    $response = Invoke-WebRequest -Uri "https://www.google.com" -TimeoutSec 10 -UseBasicParsing
    Write-Success "Internet connection looks good."
} catch {
    Write-Error "No internet connection. Please check your network."
    exit 1
}

# System resource check
try {
    $disk = Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='C:'"
    $diskFree = [math]::Round($disk.FreeSpace / 1GB, 2)
    $memory = Get-WmiObject -Class Win32_OperatingSystem
    $memFree = [math]::Round($memory.FreePhysicalMemory / 1MB, 2)
    Write-Status "Available Disk: ${diskFree}GB, Free RAM: ${memFree}MB"
    
    if ($memFree -lt 100) {
        Write-Warning "Available memory is low. You may face install issues."
    }
} catch {
    Write-Warning "Could not check system resources."
}

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
Write-Host "🔧 Configuring Environment..." -ForegroundColor Magenta

# Dynamic port detection and fallback
$DEFAULT_PORT = 10000
try {
    $portCheck = Get-NetTCPConnection -LocalPort $DEFAULT_PORT -ErrorAction SilentlyContinue
    if ($portCheck) {
        Write-Warning "Port $DEFAULT_PORT is in use."
        $ALT_PORT = Read-Host "Enter a different port to use [10001-65535]"
        $env:PORT = if ($ALT_PORT) { $ALT_PORT } else { "10001" }
        Write-Success "Using port $env:PORT"
    } else {
        $env:PORT = $DEFAULT_PORT
    }
} catch {
    $env:PORT = $DEFAULT_PORT
}

# Function to create .env file with random values
function New-EnvFile {
    # Generate random tokens for testing
    $RAND_TOKEN = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 16 | ForEach-Object {[char]$_})
    $RAND_DOMAIN = "test-$(-join ((97..122) + (48..57) | Get-Random -Count 8 | ForEach-Object {[char]$_})).duckdns.org"
    
    @"
# Backend Server Configuration
NODE_ENV=production
PORT=$env:PORT

# Ngrok Configuration (if using ngrok)
NGROK_AUTH_TOKEN=$RAND_TOKEN

# DuckDNS Configuration (if using DuckDNS)
DUCKDNS_DOMAIN=$RAND_DOMAIN
DUCKDNS_TOKEN=$RAND_TOKEN

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=$RAND_TOKEN
TELEGRAM_CHAT_ID=123456789

# Database Configuration
DB_FILE=db.json
"@ | Out-File -FilePath ".env" -Encoding UTF8
    Write-Success ".env file created with random test values. Please edit with your actual values."
}

# Create .env file if it doesn't exist
if (Test-Path ".env") {
    Write-Status ".env file already exists"
    # Create backup before overwriting
    $timestamp = Get-Date -Format "yyyyMMddHHmmss"
    Copy-Item ".env" ".env.backup.$timestamp"
    Write-Status "Backup of existing .env saved as .env.backup.$timestamp"
    
    $choice = Read-Host "Do you want to regenerate the .env file? [y/N]"
    if ($choice -match "^[Yy]$") {
        Write-Status "Creating new .env file..."
        New-EnvFile
    }
} else {
    Write-Status "Creating .env file..."
    New-EnvFile
}

# Validate .env variable integrity
$REQUIRED_VARS = @("PORT", "DB_FILE")
foreach ($var in $REQUIRED_VARS) {
    $value = (Get-Content ".env" | Where-Object { $_ -match "^$var=" } | ForEach-Object { ($_ -split "=", 2)[1] }).Trim()
    if (-not $value) {
        Write-Warning "⚠️  Environment variable '$var' is not set in .env!"
    }
}

# Validate server.mjs syntax
Write-Status "Validating server.mjs syntax..."
try {
    node --check server.mjs | Out-Null
    Write-Success "Server syntax validation passed."
} catch {
    Write-Error "Your server.mjs has a syntax error. Fix it before continuing."
    exit 1
}

Write-Host ""
Write-Host "📦 Installing Dependencies..." -ForegroundColor Magenta

Write-Status "Installing dependencies..."
Invoke-WithRetry -MaxAttempts 3 -ScriptBlock { npm install --silent } -ErrorMessage "Failed to install dependencies"
Write-Success "Dependencies installed successfully"

Write-Host ""
Write-Host "⚙️  Setting up PM2..." -ForegroundColor Magenta

# Install PM2 globally if not installed
try {
    $pm2Version = pm2 --version
    Write-Success "PM2 found: $pm2Version"
} catch {
    Write-Status "Installing PM2 globally..."
    Invoke-WithRetry -MaxAttempts 3 -ScriptBlock { npm install -g pm2 --silent } -ErrorMessage "Failed to install PM2"
    Write-Success "PM2 installed successfully"
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
Write-Host "🔧 Setting up Scripts..." -ForegroundColor Magenta

# Auto-create and pre-fill db.json if missing
if (-not (Test-Path "db.json")) {
    '{"expenses": []}' | Out-File -FilePath "db.json" -Encoding UTF8
    Write-Success "Created db.json with initial structure."
}

Write-Host ""
Write-Host "🧪 Testing Server Startup..." -ForegroundColor Magenta

# Test the server
Write-Status "Testing server startup..."
try {
    Start-Process -FilePath "node" -ArgumentList "server.mjs" -WindowStyle Hidden
    $serverProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue | Select-Object -First 1

    # Health check retry loop
    $MAX_RETRIES = 10
    $RETRY_INTERVAL = 1
    $SUCCESS = $false

    for ($i = 1; $i -le $MAX_RETRIES; $i++) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:$env:PORT/api/ping" -TimeoutSec 5 -UseBasicParsing
            if ($response.Content -eq "pong") {
                Write-Success "Server test successful - backend is responding"
                $SUCCESS = $true
                break
            }
        } catch {
            # Continue to next retry
        }
        Start-Sleep -Seconds $RETRY_INTERVAL
    }

    if (-not $SUCCESS) {
        Write-Warning "Server test failed after ${MAX_RETRIES}s - backend may not be responding"
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

# Preload PM2 process on first run
Write-Status "Creating PM2 process for your backend..."
pm2 start server.mjs --name backend-server --env production
pm2 save
Write-Success "PM2 process 'backend-server' created and saved."

# Final summary table
Write-Host ""
Write-Host "=================== ✅ Setup Summary ===================" -ForegroundColor Green
@"
🟢 Server script     : ./start-backend-server.ps1
🟢 Env file          : .env (Edit manually to add secrets)
🟢 Process manager   : PM2
🟢 Health endpoint   : http://localhost:$env:PORT/api/ping
🟢 Logs              : pm2 logs
🟢 Restart backend   : pm2 restart all
🟢 Setup log         : $LOG_FILE

📱 Remote Access:
  - Ngrok: Add NGROK_AUTH_TOKEN in .env and run ngrok
  - DuckDNS: Set DUCKDNS_DOMAIN and DUCKDNS_TOKEN

===========================================================
"@ | Write-Host

Write-Success "Your backend is ready to use!"

# Stop transcript
Stop-Transcript 