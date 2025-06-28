# Windows PowerShell Backend Setup Script
# For Windows users who want to run the backend locally

Write-Host "🚀 Windows Backend Setup" -ForegroundColor Green
Write-Host "=======================" -ForegroundColor Green

# Check if Node.js is installed
Write-Host "🔍 Checking Node.js installation..." -ForegroundColor Blue
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check if npm is installed
Write-Host "🔍 Checking npm installation..." -ForegroundColor Blue
try {
    $npmVersion = npm --version
    Write-Host "✅ npm found: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found. Please install Node.js which includes npm." -ForegroundColor Red
    exit 1
}

# Install PM2 globally
Write-Host "📦 Installing PM2 globally..." -ForegroundColor Blue
npm install -g pm2

# Install project dependencies
Write-Host "📦 Installing project dependencies..." -ForegroundColor Blue
npm install

# Create .env file if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host "📝 Creating .env file..." -ForegroundColor Blue
    @"
# Backend Configuration
NODE_ENV=development
PORT=10000

# Database Configuration
DB_PATH=./db.json

# Security
JWT_SECRET=$(Get-Random -Minimum 100000 -Maximum 999999)$(Get-Random -Minimum 100000 -Maximum 999999)

# Optional: Ngrok for public access
# NGROK_AUTH_TOKEN=your_ngrok_token_here

# Optional: DuckDNS for dynamic DNS
# DUCKDNS_DOMAIN=your-domain.duckdns.org
# DUCKDNS_TOKEN=your_duckdns_token_here

# Optional: Telegram Bot
# TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
# TELEGRAM_CHAT_ID=your_chat_id_here
"@ | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "✅ .env file created" -ForegroundColor Green
}

# Create ecosystem.config.js if it doesn't exist
if (-not (Test-Path "ecosystem.config.js")) {
    Write-Host "📝 Creating PM2 ecosystem config..." -ForegroundColor Blue
    @"
module.exports = {
  apps: [
    {
      name: 'backend-api',
      script: 'server.mjs',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 10000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 10000
      }
    }
  ]
};
"@ | Out-File -FilePath "ecosystem.config.js" -Encoding UTF8
    Write-Host "✅ PM2 ecosystem config created" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Start the backend: pm2 start ecosystem.config.js" -ForegroundColor White
Write-Host "2. Check status: pm2 status" -ForegroundColor White
Write-Host "3. View logs: pm2 logs" -ForegroundColor White
Write-Host "4. Stop server: pm2 stop all" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Access your backend at: http://localhost:10000/api/ping" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 For public access, consider:" -ForegroundColor Yellow
Write-Host "   - Ngrok: Add NGROK_AUTH_TOKEN to .env" -ForegroundColor White
Write-Host "   - DuckDNS: Add DUCKDNS_DOMAIN and DUCKDNS_TOKEN to .env" -ForegroundColor White 