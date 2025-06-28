#!/bin/bash

# === CONFIGURATION ===
# Load environment variables if .env file exists
[ -f .env ] && source .env

# Default values (can be overridden by .env or command line)
PORT=${PORT:-10000}
GIST_ID=${GIST_ID:-"d394f3df4c86cf1cb0040a7ec4138bfd"}
GIST_FILENAME=${GIST_FILENAME:-"backend-url.txt"}
BACKEND_FILE=${BACKEND_FILE:-"backend/server/index.ts"}
AUTO_RESTART=${AUTO_RESTART:-true}
RESTART_DELAY=${RESTART_DELAY:-60}

# Command line argument parsing
if [[ "$1" == "--once" ]]; then
    AUTO_RESTART=false
    echo "🔄 Running in single-shot mode"
elif [[ "$1" == "--port" && -n "$2" ]]; then
    PORT="$2"
    echo "🔧 Using custom port: $PORT"
elif [[ "$1" == "--help" ]]; then
    echo "Usage: $0 [--once] [--port PORT] [--help]"
    echo "  --once    Run once and exit (no auto-restart)"
    echo "  --port    Specify custom port (default: 10000)"
    echo "  --help    Show this help message"
    exit 0
fi

# Ensure GitHub token is set
if [ -z "$GITHUB_TOKEN" ]; then
  echo "❌ GITHUB_TOKEN is not set. Please export it before running."
  echo "   You can also create a .env file with: GITHUB_TOKEN=your_token_here"
  exit 1
fi

# Create logs directory
mkdir -p backend/logs

# Initialize previous URL tracking
PREV_URL=""
if [ -f .ngrok-url ]; then
    PREV_URL=$(cat .ngrok-url)
    echo "📄 Previous ngrok URL loaded: $PREV_URL"
fi

# Function to check internet connectivity
check_internet() {
    if ping -c 1 8.8.8.8 > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to start ngrok and update everything
start_ngrok_and_update() {
    echo "🚀 Starting ngrok on port $PORT..."
    
    # Kill existing ngrok processes
    pkill -f "ngrok" > /dev/null 2>&1
    sleep 2
    
    # Start ngrok
    ngrok http $PORT > /dev/null &
    NGROK_PID=$!
    
    # Wait for ngrok to initialize
    echo "⏳ Waiting for ngrok..."
    sleep 8
    
    # Extract ngrok public URL
    NGROK_URL=$(curl -s http://127.0.0.1:4040/api/tunnels \
      | grep -o '"public_url":"https:[^"]*' \
      | head -n 1 \
      | sed 's/"public_url":"//')
    
    if [ -z "$NGROK_URL" ]; then
        echo "❌ Failed to get Ngrok URL. Killing ngrok..."
        kill $NGROK_PID 2>/dev/null
        return 1
    fi
    
    echo "✅ Ngrok URL: $NGROK_URL"
    
    # Check if URL has changed
    if [ "$NGROK_URL" != "$PREV_URL" ]; then
        echo "🌐 New ngrok URL detected!"
        PREV_URL="$NGROK_URL"
        
        # Save URL locally
        echo "$NGROK_URL" > .ngrok-url
        echo "💾 URL saved to .ngrok-url"
        
        # Patch CORS origin in backend index.ts
        echo "🔧 Updating CORS config in $BACKEND_FILE..."
        sed -i "s|'https://[a-zA-Z0-9\-]*\.ngrok\.io'|'$NGROK_URL'|g" "$BACKEND_FILE"
        echo "✅ CORS origin updated"
        
        # Update GitHub Gist with new URL
        echo "📡 Updating GitHub Gist..."
        PATCH_DATA=$(jq -n \
          --arg filename "$GIST_FILENAME" \
          --arg content "$NGROK_URL" \
          '{files: {($filename): {content: $content}}}')
        
        curl -s -X PATCH \
          -H "Authorization: token $GITHUB_TOKEN" \
          -H "Accept: application/vnd.github.v3+json" \
          -d "$PATCH_DATA" \
          "https://api.github.com/gists/$GIST_ID"
        
        echo "✅ Gist updated at: https://gist.github.com/$GIST_ID"
        
        # Restart Backend Server
        echo "♻️ Rebuilding and restarting backend..."
        cd backend || return 1
        npm run build || { echo "❌ Build failed"; return 1; }
        pkill -f "node"
        
        # Create timestamped log file
        TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
        nohup npm start > "logs/backend_$TIMESTAMP.log" 2>&1 &
        cd ../
        echo "✅ Backend is running. Logs: backend/logs/backend_$TIMESTAMP.log"
        echo "🎉 All done. Access via: $NGROK_URL"
    else
        echo "🔁 Ngrok URL unchanged. Skipping update."
        return 0
    fi
    
    return 0
}

# Main execution
echo "🔄 Starting ngrok auto-restart service..."
echo "📅 Started at: $(date)"

while true; do
    if check_internet; then
        echo "✅ Internet connection available"
        echo "📅 $(date) - Attempting to (re)start ngrok and backend..."
        if start_ngrok_and_update; then
            echo "✅ Ngrok started successfully"
        else
            echo "❌ Failed to start ngrok"
        fi
    else
        echo "❌ No internet connection"
        echo "📅 $(date) - Waiting for internet connection..."
    fi
    
    if [ "$AUTO_RESTART" = true ]; then
        echo "⏳ Waiting $RESTART_DELAY seconds before next check..."
        sleep $RESTART_DELAY
    else
        echo "🛑 Single-shot mode completed. Exiting."
        break
    fi
done 