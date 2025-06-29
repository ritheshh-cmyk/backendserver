#!/bin/bash
set -e  # Exit on any error

echo "🚀 Starting Complete Backend System (Fixed Version)..."

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
    echo "❌ PM2 is not installed. Installing..."
    npm install -g pm2
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "📦 Installing jq..."
    apt update && apt install jq -y
fi

# Stop any existing PM2 processes
echo "🛑 Stopping existing PM2 processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Kill any existing ngrok processes
echo "🛑 Stopping existing ngrok processes..."
pkill -f ngrok 2>/dev/null || true

# Start PM2 processes
echo "🔄 Starting PM2 processes..."
pm2 start ecosystem.config.cjs

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
for i in {1..30}; do
    if curl -s http://localhost:$PORT/health > /dev/null 2>&1; then
        echo "✅ Backend is responding!"
        break
    elif curl -s http://localhost:$PORT/api/ping > /dev/null 2>&1; then
        echo "✅ Backend is responding (ping endpoint)!"
        break
    else
        echo "⏳ Waiting... ($i/30)"
        sleep 2
    fi
done

# Check if backend started successfully
if ! curl -s http://localhost:$PORT/health > /dev/null 2>&1 && ! curl -s http://localhost:$PORT/api/ping > /dev/null 2>&1; then
    echo "❌ Backend failed to start. Checking logs..."
    pm2 logs backendserver --lines 10
    exit 1
fi

# Start ngrok
echo "🌐 Starting ngrok..."
nohup ngrok http $PORT > ngrok.log 2>&1 &

# Wait for ngrok to start
echo "⏳ Waiting for ngrok to start..."
for i in {1..15}; do
    if curl -s http://localhost:4040/api/tunnels > /dev/null 2>&1; then
        echo "✅ Ngrok is running!"
        break
    else
        echo "⏳ Waiting for ngrok... ($i/15)"
        sleep 2
    fi
done

# Get ngrok URL
NGROK_URL=""
if curl -s http://localhost:4040/api/tunnels > /dev/null 2>&1; then
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url' 2>/dev/null)
    if [ "$NGROK_URL" != "null" ] && [ -n "$NGROK_URL" ]; then
        echo "🔗 Ngrok URL: $NGROK_URL"
    else
        echo "❌ Could not get ngrok URL"
    fi
else
    echo "❌ Ngrok API not responding"
fi

# Update gist if ngrok URL is available
if [ -n "$NGROK_URL" ]; then
    echo "📝 Updating GitHub gist..."
    if [ -n "$GITHUB_TOKEN" ]; then
        # Update gist using curl
        curl -X PATCH \
            -H "Authorization: token $GITHUB_TOKEN" \
            -H "Accept: application/vnd.github.v3+json" \
            https://api.github.com/gists/$GIST_ID \
            -d "{
                \"files\": {
                    \"$GIST_FILENAME\": {
                        \"content\": \"$NGROK_URL\"
                    }
                }
            }" > /dev/null 2>&1
        
        if [ $? -eq 0 ]; then
            echo "✅ Gist updated successfully!"
        else
            echo "❌ Failed to update gist"
        fi
    else
        echo "⚠️ GitHub token not found, skipping gist update"
    fi
fi

# Show final status
echo ""
echo "📊 === Final Status ==="
echo ""
echo "🔄 PM2 Processes:"
pm2 status

echo ""
echo "🌐 Ngrok Status:"
if pgrep -f "ngrok" > /dev/null; then
    echo "✅ Ngrok is running"
    if [ -n "$NGROK_URL" ]; then
        echo "🔗 URL: $NGROK_URL"
    fi
else
    echo "❌ Ngrok is not running"
fi

echo ""
echo "🔧 Backend Status:"
if curl -s http://localhost:$PORT/health > /dev/null 2>&1; then
    echo "✅ Backend is responding on port $PORT"
    HEALTH_RESPONSE=$(curl -s http://localhost:$PORT/health)
    echo "📊 Health: $HEALTH_RESPONSE"
elif curl -s http://localhost:$PORT/api/ping > /dev/null 2>&1; then
    echo "✅ Backend is responding on port $PORT (ping endpoint)"
else
    echo "❌ Backend is not responding on port $PORT"
fi

echo ""
echo "🤖 Telegram Bot Status:"
if pm2 list | grep -q "telegram-bot.*online"; then
    echo "✅ Telegram bot is running"
else
    echo "❌ Telegram bot is not running"
fi

echo ""
echo "📝 Log Files:"
ls -la *.log 2>/dev/null || echo "No log files found"

echo ""
echo "🎉 Complete Backend System Started Successfully!"
echo ""
echo "📊 Useful Commands:"
echo "  Check status: pm2 status"
echo "  View logs: pm2 logs"
echo "  Stop all: pm2 stop all"
echo "  Restart all: pm2 restart all"
echo "  Ngrok logs: tail -f ngrok.log"
echo "  Health check: curl http://localhost:$PORT/health"
echo ""
if [ -n "$NGROK_URL" ]; then
    echo "🌐 Public URL: $NGROK_URL"
    echo "🔗 Health check: $NGROK_URL/health"
fi 