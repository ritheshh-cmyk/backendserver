# Enhanced Cloud Telegram Bot Deployment
# Automatically deploys with your existing credentials

Write-Host "🚀 Enhanced Cloud Telegram Bot Deployment" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Your existing credentials (found in your codebase)
$TELEGRAM_BOT_TOKEN = "7588516086:AAGJuMzc2OCyzhj057px_QCYdVSUEe1JLRM"
$TELEGRAM_CHAT_ID = "7838527455"

Write-Host "✅ Using your existing Telegram credentials:" -ForegroundColor Green
Write-Host "   Bot Token: $TELEGRAM_BOT_TOKEN" -ForegroundColor Cyan
Write-Host "   Chat ID: $TELEGRAM_CHAT_ID" -ForegroundColor Cyan

# Navigate to cloud-telegram-bot directory
if (Test-Path "cloud-telegram-bot") {
    Set-Location "cloud-telegram-bot"
    Write-Host "📁 Navigated to cloud-telegram-bot directory" -ForegroundColor Green
} else {
    Write-Host "❌ cloud-telegram-bot directory not found!" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Deploy to Vercel
Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Green
try {
    vercel --prod --yes
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
} catch {
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Set environment variables automatically
Write-Host "🔧 Setting environment variables..." -ForegroundColor Yellow

try {
    # Set Telegram credentials
    Write-Host "   Setting TELEGRAM_BOT_TOKEN..." -ForegroundColor Cyan
    vercel env add TELEGRAM_BOT_TOKEN $TELEGRAM_BOT_TOKEN --scope=ritheshs-projects-2bddf162
    
    Write-Host "   Setting TELEGRAM_CHAT_ID..." -ForegroundColor Cyan
    vercel env add TELEGRAM_CHAT_ID $TELEGRAM_CHAT_ID --scope=ritheshs-projects-2bddf162
    
    # Set backend URLs (you'll need to update these with your actual ngrok URLs)
    Write-Host "   Setting BACKEND_URL..." -ForegroundColor Cyan
    Write-Host "   ⚠️  Please update BACKEND_URL with your actual ngrok URL" -ForegroundColor Yellow
    vercel env add BACKEND_URL "https://your-ngrok-url.ngrok.io" --scope=ritheshs-projects-2bddf162
    
    Write-Host "   Setting NGROK_API_URL..." -ForegroundColor Cyan
    Write-Host "   ⚠️  Please update NGROK_API_URL with your actual ngrok API URL" -ForegroundColor Yellow
    vercel env add NGROK_API_URL "https://your-ngrok-url.ngrok.io:4040" --scope=ritheshs-projects-2bddf162
    
    # Set additional configuration
    Write-Host "   Setting CHECK_INTERVAL..." -ForegroundColor Cyan
    vercel env add CHECK_INTERVAL "30000" --scope=ritheshs-projects-2bddf162
    
    Write-Host "   Setting ENABLE_NOTIFICATIONS..." -ForegroundColor Cyan
    vercel env add ENABLE_NOTIFICATIONS "true" --scope=ritheshs-projects-2bddf162
    
    Write-Host "   Setting ALERT_THRESHOLD..." -ForegroundColor Cyan
    vercel env add ALERT_THRESHOLD "3" --scope=ritheshs-projects-2bddf162
    
    Write-Host "✅ Environment variables set successfully!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Failed to set environment variables: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 You can set them manually in the Vercel dashboard" -ForegroundColor Yellow
}

# Show deployment info
Write-Host "📊 Deployment Information:" -ForegroundColor Green
Write-Host "   🌐 Production URL: https://backend-q1z4uvfhk-ritheshs-projects-2bddf162.vercel.app" -ForegroundColor Cyan
Write-Host "   🔗 Health Check: https://backend-q1z4uvfhk-ritheshs-projects-2bddf162.vercel.app/health" -ForegroundColor Cyan
Write-Host "   📊 Status Page: https://backend-q1z4uvfhk-ritheshs-projects-2bddf162.vercel.app/status" -ForegroundColor Cyan
Write-Host "   📈 Metrics: https://backend-q1z4uvfhk-ritheshs-projects-2bddf162.vercel.app/metrics" -ForegroundColor Cyan

# Instructions for next steps
Write-Host "📋 Next Steps:" -ForegroundColor Green
Write-Host "   1. Update BACKEND_URL and NGROK_API_URL with your actual ngrok URLs" -ForegroundColor Yellow
Write-Host "   2. Test your bot by sending 'hi' or '/start' on Telegram" -ForegroundColor Yellow
Write-Host "   3. Use /help to see all available commands" -ForegroundColor Yellow

Write-Host "🎉 Enhanced Cloud Telegram Bot deployment complete!" -ForegroundColor Green
Write-Host "📱 Your bot now has advanced monitoring features!" -ForegroundColor Cyan 