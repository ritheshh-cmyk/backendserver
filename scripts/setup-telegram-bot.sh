#!/bin/bash

# === Telegram Bot Setup Script ===
# Helps you set up the Telegram bot for ngrok monitoring

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🤖 === Telegram Bot Setup for Ngrok Monitoring ==="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

print_success "Node.js is installed: $(node --version)"

# Navigate to scripts directory
cd "$SCRIPT_DIR" || exit 1

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_error "package.json not found in scripts directory"
    exit 1
fi

# Install dependencies
print_info "Installing Telegram bot dependencies..."
npm install

if [ $? -eq 0 ]; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Check if .env exists in project root
if [ ! -f "$PROJECT_DIR/.env" ]; then
    print_warning "No .env file found. Creating from template..."
    cp "$PROJECT_DIR/env-example.txt" "$PROJECT_DIR/.env"
    print_info "Created .env file. Please edit it with your settings."
fi

# Check Telegram bot configuration
print_info "Checking Telegram bot configuration..."

if [ -f "$PROJECT_DIR/.env" ]; then
    source "$PROJECT_DIR/.env"
    
    if [ -z "$TELEGRAM_BOT_TOKEN" ] || [ "$TELEGRAM_BOT_TOKEN" = "your_telegram_bot_token_here" ]; then
        print_warning "TELEGRAM_BOT_TOKEN not configured"
        echo ""
        print_info "To get a bot token:"
        echo "1. Open Telegram and search for @BotFather"
        echo "2. Send /newbot command"
        echo "3. Follow the instructions to create your bot"
        echo "4. Copy the token and add it to your .env file"
        echo ""
    else
        print_success "TELEGRAM_BOT_TOKEN is configured"
    fi
    
    if [ -z "$TELEGRAM_CHAT_ID" ] || [ "$TELEGRAM_CHAT_ID" = "your_telegram_chat_id_here" ]; then
        print_warning "TELEGRAM_CHAT_ID not configured"
        echo ""
        print_info "To get your chat ID:"
        echo "1. Open Telegram and search for @userinfobot"
        echo "2. Send any message to the bot"
        echo "3. Copy your chat ID and add it to your .env file"
        echo ""
    else
        print_success "TELEGRAM_CHAT_ID is configured"
    fi
fi

# Test the bot
print_info "Testing Telegram bot..."
if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ] && [ "$TELEGRAM_BOT_TOKEN" != "your_telegram_bot_token_here" ] && [ "$TELEGRAM_CHAT_ID" != "your_telegram_chat_id_here" ]; then
    print_info "Starting bot test (will run for 10 seconds)..."
    timeout 10s node telegram-bot.js &
    BOT_PID=$!
    sleep 2
    
    if kill -0 $BOT_PID 2>/dev/null; then
        print_success "Bot started successfully"
        sleep 8
        kill $BOT_PID 2>/dev/null
        print_info "Bot test completed"
    else
        print_error "Failed to start bot"
    fi
else
    print_warning "Skipping bot test - configuration incomplete"
fi

# Create startup script
print_info "Creating startup script..."
cat > "$SCRIPT_DIR/start-telegram-bot.sh" << 'EOF'
#!/bin/bash

# === Start Telegram Bot ===
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Load environment variables
if [ -f "$PROJECT_DIR/.env" ]; then
    source "$PROJECT_DIR/.env"
fi

# Check if bot is already running
if pgrep -f "telegram-bot.js" > /dev/null; then
    echo "🤖 Telegram bot is already running"
    exit 0
fi

# Start the bot
cd "$SCRIPT_DIR"
echo "🤖 Starting Telegram bot..."
nohup node telegram-bot.js > telegram-bot.log 2>&1 &

# Wait a moment and check if it started
sleep 2
if pgrep -f "telegram-bot.js" > /dev/null; then
    echo "✅ Telegram bot started successfully"
    echo "📝 Logs: $SCRIPT_DIR/telegram-bot.log"
else
    echo "❌ Failed to start Telegram bot"
    exit 1
fi
EOF

chmod +x "$SCRIPT_DIR/start-telegram-bot.sh"
print_success "Created start-telegram-bot.sh"

# Create stop script
print_info "Creating stop script..."
cat > "$SCRIPT_DIR/stop-telegram-bot.sh" << 'EOF'
#!/bin/bash

# === Stop Telegram Bot ===
echo "🛑 Stopping Telegram bot..."

# Kill the bot process
pkill -f "telegram-bot.js"

# Wait a moment and check if it stopped
sleep 2
if ! pgrep -f "telegram-bot.js" > /dev/null; then
    echo "✅ Telegram bot stopped successfully"
else
    echo "❌ Failed to stop Telegram bot"
    exit 1
fi
EOF

chmod +x "$SCRIPT_DIR/stop-telegram-bot.sh"
print_success "Created stop-telegram-bot.sh"

# Create status script
print_info "Creating status script..."
cat > "$SCRIPT_DIR/telegram-bot-status.sh" << 'EOF'
#!/bin/bash

# === Telegram Bot Status ===
echo "🤖 === Telegram Bot Status ==="

if pgrep -f "telegram-bot.js" > /dev/null; then
    echo "✅ Status: RUNNING"
    echo "📊 Process ID: $(pgrep -f 'telegram-bot.js')"
    
    # Show recent logs
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    if [ -f "$SCRIPT_DIR/telegram-bot.log" ]; then
        echo ""
        echo "📝 Recent logs:"
        tail -5 "$SCRIPT_DIR/telegram-bot.log"
    fi
else
    echo "❌ Status: STOPPED"
    echo ""
    echo "To start the bot:"
    echo "  ./start-telegram-bot.sh"
fi
EOF

chmod +x "$SCRIPT_DIR/telegram-bot-status.sh"
print_success "Created telegram-bot-status.sh"

echo ""
print_success "=== Setup Complete ==="
echo ""
print_info "Next steps:"
echo "1. Edit your .env file with Telegram bot credentials:"
echo "   nano $PROJECT_DIR/.env"
echo ""
echo "2. Start the Telegram bot:"
echo "   ./scripts/start-telegram-bot.sh"
echo ""
print_info "Available commands:"
echo "  ./scripts/start-telegram-bot.sh     - Start the bot"
echo "  ./scripts/stop-telegram-bot.sh      - Stop the bot"
echo "  ./scripts/telegram-bot-status.sh    - Check bot status"
echo ""
print_info "Bot commands (in Telegram):"
echo "  /start   - Start monitoring"
echo "  /status  - Show system status"
echo "  /restart - Restart ngrok service"
echo "  /logs    - Show recent logs"
echo "  /help    - Show help"
echo ""
print_success "Your Telegram bot is ready! 🎉" 