#!/bin/bash
set -e  # Exit on any error

# Shell compatibility check
if [ -z "$BASH_VERSION" ]; then
    echo "❌ This script must be run with bash. Try: bash $0"
    exit 1
fi

# Log file setup
LOG_FILE=backend-setup.log
exec > >(tee -i $LOG_FILE)
exec 2>&1

echo "🚀 Setting up Backend Server for Ubuntu-in-Termux..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
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

# Retry function for resilient operations
retry() {
    local n=0
    local try=$1
    local cmd="${@:2}"
    until [ $n -ge $try ]
    do
        $cmd && break || {
            ((n++))
            print_warning "Attempt $n failed. Retrying in 2s..."
            sleep 2
        }
    done
    if [ $n -eq $try ]; then
        print_error "Command failed after $try attempts: $cmd"
        exit 1
    fi
}

# Check if we're in the right directory
if [ ! -f "server.mjs" ]; then
    print_error "server.mjs not found. Please run this script from your project root."
    exit 1
fi

echo ""
echo "🔍 Checking System Requirements..."

# Cross-platform compatibility check
if [ "$(uname -o)" = "Android" ]; then
    print_warning "You're running this inside Termux, not Ubuntu-in-Termux."
    print_error "Please install Ubuntu using proot-distro first."
    exit 1
fi

# User privilege check
if [ "$(id -u)" = "0" ]; then
    print_warning "You're running this script as root. It's safer to run as a regular user unless required."
fi

# Network connectivity check
print_status "Checking internet connectivity..."
if ! ping -c 1 google.com &>/dev/null; then
    print_error "No internet connection. Please check your network."
    exit 1
fi
print_success "Internet connection looks good."

# System resource check
DISK_FREE=$(df -h . | awk 'NR==2 {print $4}')
MEM_FREE=$(free -m | awk '/Mem:/ {print $7}' 2>/dev/null || echo "Unknown")
print_status "Available Disk: $DISK_FREE, Free RAM: ${MEM_FREE}MB"

if [ "$MEM_FREE" != "Unknown" ] && [ "$MEM_FREE" -lt 100 ]; then
    print_warning "Available memory is low. You may face install issues."
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    print_status "You can install it with: curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - && sudo apt-get install -y nodejs"
    exit 1
else
    NODE_VERSION=$(node --version)
    print_success "Node.js found: $NODE_VERSION"
fi

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed."
    exit 1
else
    NPM_VERSION=$(npm --version)
    print_success "npm found: $NPM_VERSION"
fi

# Check curl (needed for health check)
if ! command -v curl &> /dev/null; then
    print_error "curl is not installed. Please install curl."
    print_status "You can install it with: sudo apt-get install curl"
    exit 1
else
    print_success "curl found"
fi

# Check timeout command
if ! command -v timeout &> /dev/null; then
    print_warning "'timeout' command not found. Install coreutils if needed."
    print_status "You can install it with: sudo apt-get install coreutils"
fi

# Check lsof for port checking
if ! command -v lsof &> /dev/null; then
    print_warning "'lsof' is not installed. Skipping port-in-use check."
    PORT_CHECK_AVAILABLE=false
else
    PORT_CHECK_AVAILABLE=true
fi

# Function to create .env file with random values
create_env_file() {
    # Generate random tokens for testing
    RAND_TOKEN=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 16)
    RAND_DOMAIN="test-$(head /dev/urandom | tr -dc a-z0-9 | head -c 8).duckdns.org"
    
    cat > .env << EOF
# Backend Server Configuration
NODE_ENV=production
PORT=$PORT

# Ngrok Configuration (if using ngrok)
NGROK_AUTH_TOKEN=$RAND_TOKEN

# DuckDNS Configuration (if using DuckDNS)
DUCKDNS_DOMAIN=$RAND_DOMAIN
DUCKDNS_TOKEN=$RAND_TOKEN

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=$RAND_TOKEN
TELEGRAM_CHAT_ID=123456789

# Database Configuration
DB_FILE=db.json
EOF
    print_success ".env file created with random test values. Please edit with your actual values."
}

echo ""
echo "🔧 Configuring Environment..."

# Dynamic port detection and fallback
DEFAULT_PORT=10000
if [ "$PORT_CHECK_AVAILABLE" = true ]; then
    PORT_IN_USE=$(lsof -ti :$DEFAULT_PORT 2>/dev/null || echo "")
    
    if [ ! -z "$PORT_IN_USE" ]; then
        print_warning "Port $DEFAULT_PORT is in use."
        read -p "Enter a different port to use [10001-65535]: " ALT_PORT
        export PORT="${ALT_PORT:-10001}"
        print_success "Using port $PORT"
    else
        export PORT=$DEFAULT_PORT
    fi
else
    export PORT=$DEFAULT_PORT
fi

# Create .env file if it doesn't exist
if [ -f ".env" ]; then
    print_status ".env file already exists"
    # Create backup before overwriting
    cp .env ".env.backup.$(date +%s)"
    print_status "Backup of existing .env saved as .env.backup.*"
    
    read -p "Do you want to regenerate the .env file? [y/N] " choice
    if [[ "$choice" =~ ^[Yy]$ ]]; then
        print_status "Creating new .env file..."
        create_env_file
    fi
else
    print_status "Creating .env file..."
    create_env_file
fi

# Validate .env variable integrity
REQUIRED_VARS=("PORT" "DB_FILE")
for var in "${REQUIRED_VARS[@]}"; do
    VALUE=$(grep "^$var=" .env | cut -d= -f2 2>/dev/null || echo "")
    if [[ -z "$VALUE" ]]; then
        print_warning "⚠️  Environment variable '$var' is not set in .env!"
    fi
done

# Validate server.mjs syntax
print_status "Validating server.mjs syntax..."
if ! node --check server.mjs &>/dev/null; then
    print_error "Your server.mjs has a syntax error. Fix it before continuing."
    exit 1
fi
print_success "Server syntax validation passed."

echo ""
echo "📦 Installing Dependencies..."

# Clean up zombie PM2 processes
print_status "Checking for stale PM2 processes..."
pm2 delete all &>/dev/null || true
pm2 flush &>/dev/null || true

print_status "Installing dependencies..."
retry 3 "npm install --silent"
print_success "Dependencies installed successfully"

echo ""
echo "⚙️  Setting up PM2..."

# Install PM2 globally if not installed
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2 globally..."
    retry 3 "npm install -g pm2 --silent"
    print_success "PM2 installed successfully"
else
    PM2_VERSION=$(pm2 --version)
    print_success "PM2 found: $PM2_VERSION"
fi

# Verify PM2 is accessible after install
if ! command -v pm2 &> /dev/null; then
    print_error "PM2 was installed but is not accessible. Try restarting your shell or checking PATH."
    exit 1
fi

echo ""
echo "🔧 Setting up Scripts..."

# Make scripts executable with absolute paths
print_status "Making scripts executable..."
chmod +x ./start-backend-server.sh ./duckdns-updater.sh ./setup-auto-start.sh ./update-backend.sh

# Auto-create and pre-fill db.json if missing
if [ ! -f "db.json" ]; then
    echo '{"expenses": []}' > db.json
    print_success "Created db.json with initial structure."
fi

echo ""
echo "🧪 Testing Server Startup..."

# Test the server with retry logic
print_status "Testing server startup..."
if command -v timeout &> /dev/null; then
    # Set up trap to clean up server process on exit
    trap 'kill $SERVER_PID 2>/dev/null' EXIT
    
    timeout 10s node server.mjs &
    SERVER_PID=$!
    
    # Health check retry loop
    MAX_RETRIES=10
    RETRY_INTERVAL=1
    SUCCESS=false

    for ((i=1;i<=MAX_RETRIES;i++)); do
        if curl -s http://localhost:$PORT/api/ping > /dev/null; then
            print_success "Server test successful - backend is responding"
            SUCCESS=true
            break
        fi
        sleep $RETRY_INTERVAL
    done

    if [ "$SUCCESS" = false ]; then
        print_warning "Server test failed after ${MAX_RETRIES}s - backend may not be responding"
    fi
    
    # Clean up trap
    trap - EXIT
else
    print_warning "Skipping server test (timeout command not available)"
fi

echo ""
echo "🚀 Setting up Auto-Start..."

# Setup auto-start
print_status "Setting up auto-start..."
./setup-auto-start.sh

print_status "Setting up PM2 startup script..."
if ! pm2 startup; then
    print_warning "Trying Termux-specific startup setup..."
    pm2 startup termux || print_warning "PM2 startup setup may need manual configuration"
fi

# Preload PM2 process on first run
print_status "Creating PM2 process for your backend..."
pm2 start server.mjs --name backend-server --env production
pm2 save
print_success "PM2 process 'backend-server' created and saved."

# Auto-run Ngrok if available
if command -v ngrok &> /dev/null && grep -q "NGROK_AUTH_TOKEN=" .env; then
    NGROK_TOKEN=$(grep NGROK_AUTH_TOKEN .env | cut -d= -f2)
    if [ "$NGROK_TOKEN" != "$RAND_TOKEN" ]; then  # Only if not the random test token
        print_status "Starting ngrok tunnel..."
        ngrok config add-authtoken "$NGROK_TOKEN" &>/dev/null || true
        ngrok http $PORT &
        print_success "Ngrok tunnel started"
    fi
fi

# Final summary table
echo -e "\n=================== ✅ Setup Summary ==================="
cat <<EOF
🟢 Server script     : ./start-backend-server.sh
🟢 Env file          : .env (Edit manually to add secrets)
🟢 Process manager   : PM2
🟢 Health endpoint   : http://localhost:$PORT/api/ping
🟢 Logs              : pm2 logs
🟢 Restart backend   : pm2 restart all
🟢 Setup log         : $LOG_FILE

📱 Remote Access:
  - Ngrok: Add NGROK_AUTH_TOKEN in .env and run ngrok
  - DuckDNS: Set DUCKDNS_DOMAIN and DUCKDNS_TOKEN

===========================================================
EOF

print_success "Your backend is ready to use!" 