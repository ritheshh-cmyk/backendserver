#!/bin/bash

# === Auto Setup Telegram Bot ===
# Automatically configures Telegram bot with provided credentials

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

echo "🤖 === Auto Setup Telegram Bot ==="
echo ""

# Bot credentials (hardcoded for auto-setup)
TELEGRAM_BOT_TOKEN="7588516086:AAGJuMzc2OCyzhj057px_QCYdVSUEe1JLRM"
TELEGRAM_CHAT_ID="7838527455"

print_info "Using bot token: $TELEGRAM_BOT_TOKEN"
print_info "Using chat ID: $TELEGRAM_CHAT_ID"

# Navigate to project directory
cd "$PROJECT_DIR" || exit 1

# Create or update .env file automatically
print_info "Creating/updating .env file..."

# Check if .env exists, if not create from template
if [ ! -f ".env" ]; then
    if [ -f "env-example.txt" ]; then
        cp env-example.txt .env
        print_success "Created .env from template"
    else
        print_error "No env-example.txt found"
        exit 1
    fi
fi

# Update .env file with Telegram credentials
print_info "Updating .env with Telegram credentials..."

# Function to update or add environment variable
update_env_var() {
    local var_name="$1"
    local var_value="$2"
    
    if grep -q "^${var_name}=" .env; then
        # Variable exists, update it
        sed -i "s|^${var_name}=.*|${var_name}=${var_value}|" .env
        print_success "Updated $var_name"
    else
        # Variable doesn't exist, add it
        echo "${var_name}=${var_value}" >> .env
        print_success "Added $var_name"
    fi
}

# Update Telegram configuration
update_env_var "TELEGRAM_BOT_TOKEN" "$TELEGRAM_BOT_TOKEN"
update_env_var "TELEGRAM_CHAT_ID" "$TELEGRAM_CHAT_ID"
update_env_var "TELEGRAM_CHECK_INTERVAL" "30000"
update_env_var "TELEGRAM_ENABLE_NOTIFICATIONS" "true"

print_success "Telegram configuration updated in .env"

# Navigate to scripts directory
cd "$SCRIPT_DIR" || exit 1

# Install dependencies
print_info "Installing Telegram bot dependencies..."
npm install

if [ $? -eq 0 ]; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Test the bot
print_info "Testing Telegram bot..."
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
    exit 1
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

# Create auto-start script for backend server
print_info "Creating auto-start script for backend server..."
cat > "$SCRIPT_DIR/auto-start-telegram.sh" << 'EOF'
#!/bin/bash

# === Auto Start Telegram Bot for Backend Server ===
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Auto-configure if .env doesn't exist
if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo "🔧 Auto-configuring Telegram bot..."
    "$SCRIPT_DIR/auto-setup-telegram.sh"
fi

# Start the bot
echo "🤖 Auto-starting Telegram bot..."
"$SCRIPT_DIR/start-telegram-bot.sh"

# Keep the script running and restart if needed
while true; do
    if ! pgrep -f "telegram-bot.js" > /dev/null; then
        echo "🔄 Telegram bot stopped, restarting..."
        "$SCRIPT_DIR/start-telegram-bot.sh"
    fi
    sleep 60
done
EOF

chmod +x "$SCRIPT_DIR/auto-start-telegram.sh"
print_success "Created auto-start-telegram.sh"

echo ""
print_success "=== Auto Setup Complete ==="
echo ""
print_info "Your Telegram bot is now configured and ready!"
echo ""
print_info "Available commands:"
echo "  ./scripts/start-telegram-bot.sh      - Start the bot"
echo "  ./scripts/stop-telegram-bot.sh       - Stop the bot"
echo "  ./scripts/telegram-bot-status.sh     - Check bot status"
echo "  ./scripts/auto-start-telegram.sh     - Auto-start with monitoring"
echo ""
print_info "For backend server deployment:"
echo "  ./scripts/auto-start-telegram.sh     - Use this for auto-start"
echo ""
print_info "Bot commands (in Telegram @Backendmobilebot):"
echo "  /start   - Start monitoring"
echo "  /status  - Show system status"
echo "  /restart - Restart ngrok service"
echo "  /logs    - Show recent logs"
echo "  /help    - Show help"
echo ""
print_success "Your Telegram bot is ready! 🎉"
print_info "Test it by sending /start to @Backendmobilebot" 