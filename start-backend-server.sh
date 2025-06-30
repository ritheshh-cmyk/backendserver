#!/bin/bash
set -e  # Exit on any error

echo "🚀 Starting Backend Server..."

# Load environment variables if .env exists
if [ -f .env ]; then
    echo "📝 Loading environment variables from .env"
    export $(cat .env | grep -v '^#' | xargs)
fi

# Set default values
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-10000}

echo "🔧 Environment: $NODE_ENV"
echo "🌐 Port: $PORT"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed. Please run ./setup-backend.sh first"
    exit 1
fi

# Stop any existing PM2 processes
echo "🛑 Stopping existing PM2 processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Start PM2 processes
echo "🔄 Starting PM2 processes..."
pm2 start ecosystem.config.cjs

# Wait a moment for processes to start
sleep 5

# Show status
echo "📊 === Backend Server Status ==="
echo ""
echo "🔄 PM2 Processes:"
pm2 status

echo ""
echo "🌐 Ngrok Status:"
if pgrep -f "ngrok" > /dev/null; then
    echo "✅ Ngrok is running"
    # Get ngrok URL if available
    if curl -s http://localhost:4040/api/tunnels > /dev/null 2>&1; then
        NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url' 2>/dev/null)
        if [ "$NGROK_URL" != "null" ] && [ -n "$NGROK_URL" ]; then
            echo "🔗 Ngrok URL: $NGROK_URL"
        fi
    fi
else
    echo "❌ Ngrok is not running"
fi

echo ""
echo "🔧 Backend Status:"
if curl -s http://localhost:$PORT/health > /dev/null 2>&1; then
    echo "✅ Backend is responding on port $PORT"
    # Show health response
    HEALTH_RESPONSE=$(curl -s http://localhost:$PORT/health)
    echo "📊 Health: $HEALTH_RESPONSE"
elif curl -s http://localhost:$PORT/api/ping > /dev/null 2>&1; then
    echo "✅ Backend is responding on port $PORT (ping endpoint)"
else
    echo "❌ Backend is not responding on port $PORT"
    echo "🔍 Checking PM2 logs..."
    pm2 logs backendserver --lines 5
fi

echo ""
echo "🤖 Telegram Bot Status:"
if pm2 list | grep -q "telegram-bot.*online"; then
    echo "✅ Telegram bot is running"
else
    echo "❌ Telegram bot is not running"
fi

echo ""
echo "📝 Recent Logs:"
ls -la *.log 2>/dev/null || echo "No log files found"

echo ""
echo "✅ Backend server started successfully!"
echo "📊 Check status: pm2 status"
echo "📝 View logs: pm2 logs"
echo "🛑 Stop server: pm2 stop all" 
echo "🔄 Restart: pm2 restart all" 