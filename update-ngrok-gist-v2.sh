#!/bin/bash

# === Ngrok Gist Updater v2 ===
# Automatically updates GitHub gist with current ngrok URL
# Includes Telegram notifications and backend restart

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Load environment variables
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
    print_info "Loaded environment from .env file"
fi

# Configuration
PORT=${PORT:-10000}
GIST_ID=${GIST_ID:-"d394f3df4c86cf1cb0040a7ec4138bfd"}
GIST_FILENAME=${GIST_FILENAME:-"backend-url.txt"}
TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN:-""}
TELEGRAM_CHAT_ID=${TELEGRAM_CHAT_ID:-""}
TELEGRAM_ENABLE_NOTIFICATIONS=${TELEGRAM_ENABLE_NOTIFICATIONS:-"true"}

# Check if running in --once mode
ONCE_MODE=false
if [[ "$1" == "--once" ]]; then
    ONCE_MODE=true
    print_info "Running in once mode"
fi

# Show help
if [[ "$1" == "--help" ]]; then
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --once    Run once and exit"
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
    
    # Check .env file
    if [ -f ".env" ] && grep -q "GITHUB_TOKEN=" .env; then
        echo "✅ GitHub token found in .env file"
        export GITHUB_TOKEN=$(grep GITHUB_TOKEN .env | cut -d= -f2)
        return 0
    fi
    
    return 1
}

# Function to detect ngrok token from various sources
detect_ngrok_token() {
    # Check environment variable first
    if [ -n "$NGROK_AUTH_TOKEN" ]; then
        echo "✅ Ngrok token found in environment variable"
        return 0
    fi
    
    # Check .env file
    if [ -f ".env" ] && grep -q "NGROK_AUTH_TOKEN=" .env; then
        echo "✅ Ngrok token found in .env file"
        export NGROK_AUTH_TOKEN=$(grep NGROK_AUTH_TOKEN .env | cut -d= -f2)
        return 0
    fi
    
    # Check if ngrok is configured
    if command -v ngrok &> /dev/null; then
        if ngrok config check &> /dev/null; then
            echo "✅ Ngrok is configured with auth token"
            return 0
        fi
    fi
    
    return 1
}

# Function to setup tokens interactively
setup_tokens_interactive() {
    echo "🔧 Token Setup Required"
    echo ""
    
    # GitHub token setup
    if ! detect_github_token; then
        echo "📝 GitHub Token Setup:"
        echo "1. Go to: https://github.com/settings/tokens"
        echo "2. Generate new token with 'gist' permission"
        echo "3. Enter your GitHub token:"
        read -s GITHUB_TOKEN_INPUT
        echo ""
        
        if [ -n "$GITHUB_TOKEN_INPUT" ]; then
            export GITHUB_TOKEN="$GITHUB_TOKEN_INPUT"
            echo "✅ GitHub token set"
            
            # Save to .env
            if [ ! -f ".env" ]; then
                touch .env
            fi
            if ! grep -q "GITHUB_TOKEN=" .env; then
                echo "GITHUB_TOKEN=$GITHUB_TOKEN_INPUT" >> .env
                echo "💾 Saved to .env file"
            fi
        fi
    fi
    
    # Ngrok token setup
    if ! detect_ngrok_token; then
        echo "📝 Ngrok Token Setup:"
        echo "1. Go to: https://dashboard.ngrok.com/get-started/your-authtoken"
        echo "2. Copy your authtoken"
        echo "3. Enter your ngrok auth token:"
        read -s NGROK_TOKEN_INPUT
        echo ""
        
        if [ -n "$NGROK_TOKEN_INPUT" ]; then
            export NGROK_AUTH_TOKEN="$NGROK_TOKEN_INPUT"
            echo "✅ Ngrok token set"
            
            # Configure ngrok
            if command -v ngrok &> /dev/null; then
                ngrok config add-authtoken "$NGROK_TOKEN_INPUT"
                echo "🔧 Ngrok configured"
            fi
            
            # Save to .env
            if [ ! -f ".env" ]; then
                touch .env
            fi
            if ! grep -q "NGROK_AUTH_TOKEN=" .env; then
                echo "NGROK_AUTH_TOKEN=$NGROK_TOKEN_INPUT" >> .env
                echo "💾 Saved to .env file"
            fi
        fi
    fi
}

# Ensure both tokens are available
echo "🔍 Checking tokens..."

if ! detect_github_token; then
    echo "❌ GitHub token not found. Please set it up:"
    echo ""
    echo "Method 1 - Environment variable:"
    echo "  export GITHUB_TOKEN=your_token_here"
    echo ""
    echo "Method 2 - Add to .bashrc:"
    echo "  echo 'export GITHUB_TOKEN=your_token_here' >> ~/.bashrc"
    echo ""
    echo "Method 3 - GitHub CLI:"
    echo "  gh auth login"
    echo ""
    echo "Method 4 - .env file:"
    echo "  echo 'GITHUB_TOKEN=your_token_here' >> .env"
    echo ""
    echo "🔗 Get a token from: https://github.com/settings/tokens (need 'gist' permission)"
    
    # Offer interactive setup
    echo ""
    read -p "Would you like to set up tokens interactively? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_tokens_interactive
    else
        exit 1
    fi
fi

if ! detect_ngrok_token; then
    echo "❌ Ngrok token not found. Please set it up:"
    echo ""
    echo "Method 1 - Environment variable:"
    echo "  export NGROK_AUTH_TOKEN=your_token_here"
    echo ""
    echo "Method 2 - Add to .bashrc:"
    echo "  echo 'export NGROK_AUTH_TOKEN=your_token_here' >> ~/.bashrc"
    echo ""
    echo "Method 3 - ngrok config:"
    echo "  ngrok config add-authtoken your_token_here"
    echo ""
    echo "Method 4 - .env file:"
    echo "  echo 'NGROK_AUTH_TOKEN=your_token_here' >> .env"
    echo ""
    echo "🔗 Get a token from: https://dashboard.ngrok.com/get-started/your-authtoken"
    
    # Offer interactive setup
    echo ""
    read -p "Would you like to set up tokens interactively? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_tokens_interactive
    else
        exit 1
    fi
fi

echo "✅ All tokens detected successfully!"

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
    if command -v pm2 &> /dev/null; then
        pm2 restart backendserver
        if [ $? -eq 0 ]; then
            echo "✅ Backend restarted successfully"
            return 0
        else
            echo "❌ Failed to restart backend"
            return 1
        fi
    else
        echo "⚠️ PM2 not found, skipping backend restart"
        return 0
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

# Main loop
if [ "$ONCE_MODE" = true ]; then
    # Run once
    start_ngrok_and_update
else
    # Continuous monitoring
    print_info "Starting continuous ngrok monitoring..."
    
    while true; do
        if check_internet; then
            start_ngrok_and_update
        else
            print_warning "No internet connection, waiting..."
            sleep 30
            continue
        fi
        
        # Wait before next check
        sleep 60
    done
fi 