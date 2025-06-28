#!/bin/bash

# === Termux Ubuntu Setup ===
# Setup script for Ubuntu running inside Termux on mobile

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

echo "📱 === Termux Ubuntu Setup ==="
echo ""

# Check if we're in Termux
if [ -d "/data/data/com.termux" ]; then
    print_info "Detected Termux environment"
    IS_TERMUX=true
else
    print_warning "Not in Termux environment, but continuing..."
    IS_TERMUX=false
fi

# Navigate to project directory
cd "$PROJECT_DIR" || exit 1

# 1. Fix permissions
print_info "Step 1: Fixing script permissions..."
chmod +x scripts/*.sh
chmod +x *.sh
print_success "Permissions fixed"

# 2. Auto-configure Telegram bot
print_info "Step 2: Setting up Telegram bot..."
"$SCRIPT_DIR/auto-setup-telegram.sh"

if [ $? -ne 0 ]; then
    print_error "Telegram bot setup failed"
    exit 1
fi

# 3. Install backend dependencies
print_info "Step 3: Installing backend dependencies..."
cd backend || exit 1
npm install

if [ $? -eq 0 ]; then
    print_success "Backend dependencies installed"
else
    print_error "Backend dependencies installation failed"
    exit 1
fi

# 4. Build backend
print_info "Step 4: Building backend..."
npm run build

if [ $? -eq 0 ]; then
    print_success "Backend built successfully"
else
    print_error "Backend build failed"
    exit 1
fi

cd "$PROJECT_DIR"

# 5. Create PM2 ecosystem file
print_info "Step 5: Creating PM2 ecosystem configuration..."
cat > "$PROJECT_DIR/ecosystem.config.js" << 'EOF'
module.exports = {
  apps: [
    {
      name: 'ngrok-backend',
      script: './update-ngrok-gist-v2.sh',
      cwd: './',
      env: {
        NODE_ENV: 'production'
      },
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      log_file: './logs/ngrok-backend.log',
      out_file: './logs/ngrok-backend-out.log',
      error_file: './logs/ngrok-backend-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'telegram-bot',
      script: './scripts/telegram-bot.js',
      cwd: './scripts/',
      env: {
        NODE_ENV: 'production'
      },
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      log_file: '../logs/telegram-bot.log',
      out_file: '../logs/telegram-bot-out.log',
      error_file: '../logs/telegram-bot-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
EOF

print_success "PM2 ecosystem configuration created"

# 6. Create logs directory
print_info "Step 6: Creating logs directory..."
mkdir -p logs
print_success "Logs directory created"

# 7. Create startup script
print_info "Step 7: Creating startup script..."
cat > "$PROJECT_DIR/start-backend-server.sh" << 'EOF'
#!/bin/bash

# === Start Backend Server ===
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Starting Backend Server..."

# Load environment variables
if [ -f "$PROJECT_DIR/.env" ]; then
    source "$PROJECT_DIR/.env"
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm install -g pm2
fi

# Start services with PM2
cd "$PROJECT_DIR"
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Show status
pm2 status

echo "✅ Backend server started successfully!"
echo "📊 Check status: pm2 status"
echo "📝 View logs: pm2 logs"
echo "🛑 Stop server: pm2 stop all"
EOF

chmod +x "$PROJECT_DIR/start-backend-server.sh"
print_success "Startup script created"

# 8. Create stop script
print_info "Step 8: Creating stop script..."
cat > "$PROJECT_DIR/stop-backend-server.sh" << 'EOF'
#!/bin/bash

# === Stop Backend Server ===
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🛑 Stopping Backend Server..."

cd "$PROJECT_DIR"
pm2 stop all
pm2 delete all

echo "✅ Backend server stopped successfully!"
EOF

chmod +x "$PROJECT_DIR/stop-backend-server.sh"
print_success "Stop script created"

# 9. Create status script
print_info "Step 9: Creating status script..."
cat > "$PROJECT_DIR/backend-server-status.sh" << 'EOF'
#!/bin/bash

# === Backend Server Status ===
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "📊 === Backend Server Status ==="
echo ""

# PM2 status
echo "🔄 PM2 Processes:"
pm2 status
echo ""

# Ngrok status
echo "🌐 Ngrok Status:"
if curl -s http://127.0.0.1:4040/api/tunnels > /dev/null 2>&1; then
    echo "✅ Ngrok is running"
    NGROK_URL=$(curl -s http://127.0.0.1:4040/api/tunnels | grep -o '"public_url":"https:[^"]*' | head -n 1 | sed 's/"public_url":"//')
    echo "🔗 URL: $NGROK_URL"
else
    echo "❌ Ngrok is not running"
fi
echo ""

# Backend status
echo "🔧 Backend Status:"
if curl -s http://localhost:10000/health > /dev/null 2>&1; then
    echo "✅ Backend is running on port 10000"
else
    echo "❌ Backend is not responding on port 10000"
fi
echo ""

# Telegram bot status
echo "🤖 Telegram Bot Status:"
if pgrep -f "telegram-bot.js" > /dev/null; then
    echo "✅ Telegram bot is running"
else
    echo "❌ Telegram bot is not running"
fi
echo ""

# Recent logs
echo "📝 Recent Logs:"
if [ -d "$PROJECT_DIR/logs" ]; then
    ls -la "$PROJECT_DIR/logs/" | head -5
fi
EOF

chmod +x "$PROJECT_DIR/backend-server-status.sh"
print_success "Status script created"

# 10. Create auto-start script for Termux:Boot
if [ "$IS_TERMUX" = true ]; then
    print_info "Step 10: Creating Termux:Boot auto-start script..."
    
    # Create Termux:Boot directory if it doesn't exist
    mkdir -p ~/.termux/boot
    
    cat > ~/.termux/boot/backend-server-boot.sh << 'EOF'
#!/data/data/com.termux/files/usr/bin/bash

# === Backend Server Auto-Start for Termux:Boot ===
PROJECT_DIR="/storage/emulated/0/Download/MobileRepairTracker-1"

# Wait for network to be available
sleep 30

# Navigate to project directory
cd "$PROJECT_DIR" || exit 1

# Start the backend server
./start-backend-server.sh

# Keep monitoring and restart if needed
while true; do
    if ! pm2 list | grep -q "ngrok-backend.*online"; then
        echo "🔄 Backend service stopped, restarting..."
        pm2 restart ngrok-backend
    fi
    
    if ! pm2 list | grep -q "telegram-bot.*online"; then
        echo "🔄 Telegram bot stopped, restarting..."
        pm2 restart telegram-bot
    fi
    
    sleep 60
done
EOF

    chmod +x ~/.termux/boot/backend-server-boot.sh
    print_success "Termux:Boot script created"
fi

# 11. Create monitoring script
print_info "Step 11: Creating monitoring script..."
cat > "$PROJECT_DIR/monitor-backend.sh" << 'EOF'
#!/bin/bash

# === Backend Server Monitor ===
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔍 Starting Backend Server Monitor..."
echo "📅 Started at: $(date)"

while true; do
    echo ""
    echo "📊 === Status Check at $(date) ==="
    
    # Check PM2 processes
    if pm2 list | grep -q "ngrok-backend.*online"; then
        echo "✅ Ngrok backend: RUNNING"
    else
        echo "❌ Ngrok backend: STOPPED - Restarting..."
        pm2 restart ngrok-backend
    fi
    
    if pm2 list | grep -q "telegram-bot.*online"; then
        echo "✅ Telegram bot: RUNNING"
    else
        echo "❌ Telegram bot: STOPPED - Restarting..."
        pm2 restart telegram-bot
    fi
    
    # Check ngrok tunnel
    if curl -s http://127.0.0.1:4040/api/tunnels > /dev/null 2>&1; then
        echo "✅ Ngrok tunnel: ACTIVE"
    else
        echo "❌ Ngrok tunnel: INACTIVE"
    fi
    
    # Check backend service
    if curl -s http://localhost:10000/health > /dev/null 2>&1; then
        echo "✅ Backend service: RESPONDING"
    else
        echo "❌ Backend service: NOT RESPONDING"
    fi
    
    echo "⏳ Waiting 60 seconds before next check..."
    sleep 60
done
EOF

chmod +x "$PROJECT_DIR/monitor-backend.sh"
print_success "Monitoring script created"

echo ""
print_success "=== Termux Ubuntu Setup Complete ==="
echo ""
print_info "Your backend server is now fully configured!"
echo ""
print_info "Available commands:"
echo "  ./start-backend-server.sh      - Start all services"
echo "  ./stop-backend-server.sh       - Stop all services"
echo "  ./backend-server-status.sh     - Check status"
echo "  ./monitor-backend.sh           - Monitor services"
echo ""
if [ "$IS_TERMUX" = true ]; then
    print_info "For auto-start on boot (Termux):"
    echo "  - Grant autostart permission in Termux:Boot app"
    echo "  - Reboot your phone to test auto-start"
    echo "  - Or run: ./start-backend-server.sh"
fi
print_info "Telegram bot commands (@Backendmobilebot):"
echo "  /start   - Start monitoring"
echo "  /status  - Show system status"
echo "  /restart - Restart ngrok service"
echo "  /logs    - Show recent logs"
echo "  /help    - Show help"
echo ""
print_success "Your backend server is ready! 🎉"
print_info "Start it with: ./start-backend-server.sh" 