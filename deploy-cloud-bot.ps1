# Deploy Cloud Telegram Bot to Vercel
# This script automates the deployment process

Write-Host "🚀 Deploying Cloud Telegram Bot to Vercel..." -ForegroundColor Green

# Check if Vercel CLI is installed
try {
    $vercelVersion = vercel --version
    Write-Host "✅ Vercel CLI found: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Red
    npm install -g vercel
}

# Navigate to cloud-telegram-bot directory
if (Test-Path "cloud-telegram-bot") {
    Set-Location "cloud-telegram-bot"
    Write-Host "📁 Navigated to cloud-telegram-bot directory" -ForegroundColor Green
} else {
    Write-Host "❌ cloud-telegram-bot directory not found!" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory." -ForegroundColor Yellow
    exit 1
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️ .env file not found. Creating from template..." -ForegroundColor Yellow
    Copy-Item "env-example.txt" ".env"
    Write-Host "📝 Please edit .env file with your credentials before deploying" -ForegroundColor Yellow
    Write-Host "   - TELEGRAM_BOT_TOKEN (from @BotFather)" -ForegroundColor Cyan
    Write-Host "   - TELEGRAM_CHAT_ID (from @userinfobot)" -ForegroundColor Cyan
    Write-Host "   - BACKEND_URL (your ngrok URL)" -ForegroundColor Cyan
    Write-Host "   - NGROK_API_URL (your ngrok API URL)" -ForegroundColor Cyan
}

# Deploy to Vercel
Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Green
Write-Host "   Your API key: 62EvqOyqkSurqHgctfTL7tl4" -ForegroundColor Cyan

try {
    vercel --prod
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
} catch {
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Try running 'vercel login' first" -ForegroundColor Yellow
}

# Set environment variables
Write-Host "🔧 Setting up environment variables..." -ForegroundColor Yellow
Write-Host "   Run these commands to set your environment variables:" -ForegroundColor Cyan
Write-Host "   vercel env add TELEGRAM_BOT_TOKEN" -ForegroundColor White
Write-Host "   vercel env add TELEGRAM_CHAT_ID" -ForegroundColor White
Write-Host "   vercel env add BACKEND_URL" -ForegroundColor White
Write-Host "   vercel env add NGROK_API_URL" -ForegroundColor White

Write-Host "🎉 Cloud Telegram Bot deployment complete!" -ForegroundColor Green
Write-Host "📱 Your bot will now monitor your backend from the cloud!" -ForegroundColor Cyan 