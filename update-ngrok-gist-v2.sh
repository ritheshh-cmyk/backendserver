#!/bin/bash

# === CONFIGURATION ===
# Load environment variables if .env file exists
[ -f .env ] && source .env

# Default values (can be overridden by .env or command line)
PORT=${PORT:-10000}
GIST_ID=${GIST_ID:-"d394f3df4c86cf1cb0040a7ec4138bfd"}
GIST_FILENAME=${GIST_FILENAME:-"backend-url.txt"}
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

# Function to detect GitHub token from various sources
detect_github_token() {
    # Check environment variable first
    if [ -n "$GITHUB_TOKEN" ]; then
        echo "✅ GitHub token found in environment variable"
        return 0
    fi
    
    # Check if GitHub CLI is authenticated
    if command -v gh &> /dev/null; then
        if gh auth status &> /dev/null; then
            echo "✅ GitHub CLI is authenticated"
            return 0
        fi
    fi
    
    # Check git config for token
    if git config --global --get user.name &> /dev/null; then
        echo "✅ Git is configured globally"
        return 0
    fi
    
    return 1
}

# Ensure GitHub token is available
if ! detect_github_token; then
    echo "❌ GitHub token not found. Please set it up:"
    echo ""
    echo "Method 1 - Environment variable:"
    echo "  export GITHUB_TOKEN=your_token_here"
    echo ""
    echo "Method 2 - Add to .bashrc:"
    echo "  echo 'export GITHUB_TOKEN=your_token_here' >> ~/.bashrc"
    echo ""
    echo "Method 3 - Git config:"
    echo "  git config --global user.name 'Your Name'"
    echo "  git config --global user.email 'your-email@example.com'"
    echo ""
    echo "🔗 Get a token from: https://github.com/settings/tokens (need 'gist' permission)"
    exit 1
fi

# Create logs directory
mkdir -p logs

# Initialize previous URL tracking
PREV_URL=""
if [ -f .ngrok-url ]; then
    PREV_URL=$(cat .ngrok-url)
    echo "📄 Previous ngrok URL loaded: $PREV_URL"
fi

# Function to send Telegram notification
send_telegram_notification() {
    local message="$1"
    if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ] && [ "$TELEGRAM_ENABLE_NOTIFICATIONS" != "false" ]; then
        # URL encode the message
        local encoded_message=$(echo "$message" | sed 's/ /%20/g' | sed 's/\n/%0A/g')
        curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
            -d "chat_id=$TELEGRAM_CHAT_ID" \
            -d "text=$encoded_message" \
            -d "parse_mode=HTML" > /dev/null 2>&1
    fi
}

# Function to check internet connectivity
check_internet() {
    if ping -c 1 8.8.8.8 > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to restart backend via PM2
restart_backend() {
    echo "♻️ Restarting backend via PM2..."
    pm2 restart backendserver
    if [ $? -eq 0 ]; then
        echo "✅ Backend restarted successfully"
        return 0
    else
        echo "❌ Failed to restart backend"
        return 1
    fi
}

# Function to update GitHub gist
update_gist() {
    local ngrok_url="$1"
    echo "📡 Updating GitHub Gist..."
    
    # Try different methods to update gist
    if [ -n "$GITHUB_TOKEN" ]; then
        # Use environment variable
        PATCH_DATA=$(cat <<EOF
{
  "files": {
    "$GIST_FILENAME": {
      "content": "$ngrok_url"
    }
  }
}
EOF
)
        
        curl -s -X PATCH \
          -H "Authorization: token $GITHUB_TOKEN" \
          -H "Accept: application/vnd.github.v3+json" \
          -d "$PATCH_DATA" \
          "https://api.github.com/gists/$GIST_ID"
    elif command -v gh &> /dev/null; then
        # Use GitHub CLI
        gh gist edit "$GIST_ID" --filename "$GIST_FILENAME" --content "$ngrok_url"
    else
        echo "❌ No GitHub authentication method available"
        return 1
    fi
    
    echo "✅ Gist updated at: https://gist.github.com/$GIST_ID"
    return 0
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
        
        # Send Telegram notification
        send_telegram_notification "❌ <b>Ngrok Failed to Start</b>\n\n📅 <b>Time:</b> $(date)\n🔧 <b>Port:</b> $PORT\n❌ <b>Error:</b> Could not get ngrok URL"
        
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
        
        # Send Telegram notification for URL change
        if [ -n "$PREV_URL" ]; then
            send_telegram_notification "🔄 <b>Ngrok URL Changed</b>\n\n📅 <b>Time:</b> $(date)\n🔗 <b>Old URL:</b> <code>$PREV_URL</code>\n🔗 <b>New URL:</b> <code>$NGROK_URL</code>\n\n✅ Backend will be restarted automatically"
        else
            send_telegram_notification "🚀 <b>Ngrok Started</b>\n\n📅 <b>Time:</b> $(date)\n🔗 <b>URL:</b> <code>$NGROK_URL</code>\n🌐 <b>Status:</b> Active"
        fi
        
        # Update GitHub Gist with new URL
        if update_gist "$NGROK_URL"; then
            # Restart Backend Server via PM2
            if restart_backend; then
                echo "🎉 All done. Access via: $NGROK_URL"
                
                # Send Telegram notification for successful restart
                send_telegram_notification "✅ <b>Backend Restarted Successfully</b>\n\n📅 <b>Time:</b> $(date)\n🔗 <b>URL:</b> <code>$NGROK_URL</code>\n🌐 <b>Status:</b> Active and ready"
            else
                send_telegram_notification "⚠️ <b>Backend Restart Failed</b>\n\n📅 <b>Time:</b> $(date)\n🔗 <b>URL:</b> <code>$NGROK_URL</code>\n❌ <b>Error:</b> PM2 restart failed"
            fi
        else
            send_telegram_notification "⚠️ <b>Gist Update Failed</b>\n\n📅 <b>Time:</b> $(date)\n🔗 <b>URL:</b> <code>$NGROK_URL</code>\n❌ <b>Error:</b> Could not update GitHub gist"
        fi
        
    else
        echo "🔁 Ngrok URL unchanged. Skipping update."
        return 0
    fi
    
    return 0
}

# Main execution
echo "🔄 Starting ngrok auto-restart service..."
echo "📅 Started at: $(date)"

# Send Telegram notification for service start
send_telegram_notification "🚀 <b>Ngrok Auto-Start Service Started</b>\n\n📅 <b>Time:</b> $(date)\n🔧 <b>Port:</b> $PORT\n✅ Monitoring your backend"

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
        
        # Send Telegram notification for internet loss (only once)
        if [ "$INTERNET_LOST_NOTIFIED" != "true" ]; then
            send_telegram_notification "⚠️ <b>Internet Connection Lost</b>\n\n📅 <b>Time:</b> $(date)\n🔄 Waiting for connection to restore..."
            export INTERNET_LOST_NOTIFIED=true
        fi
    fi
    
    if [ "$AUTO_RESTART" = true ]; then
        echo "⏳ Waiting $RESTART_DELAY seconds before next check..."
        sleep $RESTART_DELAY
    else
        echo "🛑 Single-shot mode completed. Exiting."
        
        # Send Telegram notification for service stop
        send_telegram_notification "🛑 <b>Ngrok Service Stopped</b>\n\n📅 <b>Time:</b> $(date)\n🔄 Service has been stopped"
        
        break
    fi
done 