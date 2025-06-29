# Setup Environment Variables for Cloud Telegram Bot
Write-Host "🔧 Setting up environment variables..." -ForegroundColor Green

# Your Telegram credentials (found in your codebase)
$TELEGRAM_BOT_TOKEN = "7588516086:AAGJuMzc2OCyzhj057px_QCYdVSUEe1JLRM"
$TELEGRAM_CHAT_ID = "7838527455"

Write-Host "✅ Using your existing Telegram credentials:" -ForegroundColor Green
Write-Host "   Bot Token: $TELEGRAM_BOT_TOKEN" -ForegroundColor Cyan
Write-Host "   Chat ID: $TELEGRAM_CHAT_ID" -ForegroundColor Cyan

# Set environment variables using Vercel CLI
Write-Host "📝 Setting environment variables..." -ForegroundColor Yellow

try {
    # Set Telegram credentials
    Write-Host "   Setting TELEGRAM_BOT_TOKEN..." -ForegroundColor Cyan
    echo $TELEGRAM_BOT_TOKEN | vercel env add TELEGRAM_BOT_TOKEN
    
    Write-Host "   Setting TELEGRAM_CHAT_ID..." -ForegroundColor Cyan
    echo $TELEGRAM_CHAT_ID | vercel env add TELEGRAM_CHAT_ID
    
    # Set backend URLs (placeholder values - you'll need to update these)
    Write-Host "   Setting BACKEND_URL..." -ForegroundColor Cyan
    echo "https://your-ngrok-url.ngrok.io" | vercel env add BACKEND_URL
    
    Write-Host "   Setting NGROK_API_URL..." -ForegroundColor Cyan
    echo "https://your-ngrok-url.ngrok.io:4040" | vercel env add NGROK_API_URL
    
    # Set additional configuration
    Write-Host "   Setting CHECK_INTERVAL..." -ForegroundColor Cyan
    echo "30000" | vercel env add CHECK_INTERVAL
    
    Write-Host "   Setting ENABLE_NOTIFICATIONS..." -ForegroundColor Cyan
    echo "true" | vercel env add ENABLE_NOTIFICATIONS
    
    Write-Host "   Setting ALERT_THRESHOLD..." -ForegroundColor Cyan
    echo "3" | vercel env add ALERT_THRESHOLD
    
    Write-Host "✅ Environment variables set successfully!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Failed to set environment variables: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 You can set them manually in the Vercel dashboard" -ForegroundColor Yellow
}

Write-Host "📋 Next Steps:" -ForegroundColor Green
Write-Host "   1. Start ngrok: ngrok http 10000" -ForegroundColor Yellow
Write-Host "   2. Update BACKEND_URL and NGROK_API_URL with your actual ngrok URLs" -ForegroundColor Yellow
Write-Host "   3. Test your bot by sending 'hi' on Telegram" -ForegroundColor Yellow

Write-Host "🎉 Environment setup complete!" -ForegroundColor Green 