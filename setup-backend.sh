#!/bin/bash
set -e  # Exit on any error

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

# Check if we're in the right directory
if [ ! -f "server.mjs" ]; then
    print_error "server.mjs not found. Please run this script from your project root."
    exit 1
fi

print_status "Checking system requirements..."

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

# Check if port 10000 is already in use
if lsof -i :10000 &>/dev/null; then
    print_warning "Port 10000 is already in use!"
    print_status "You may need to stop the existing service or change the port in .env"
fi

print_status "Installing dependencies..."
npm install --silent
if [ $? -eq 0 ]; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Install PM2 globally if not installed
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2 globally..."
    npm install -g pm2 --silent
    if [ $? -eq 0 ]; then
        print_success "PM2 installed successfully"
    else
        print_error "Failed to install PM2"
        exit 1
    fi
else
    PM2_VERSION=$(pm2 --version)
    print_success "PM2 found: $PM2_VERSION"
fi

# Create .env file if it doesn't exist
if [ -f ".env" ]; then
    print_status ".env file already exists"
    read -p "Do you want to regenerate the .env file? [y/N] " choice
    if [[ "$choice" =~ ^[Yy]$ ]]; then
        print_status "Creating new .env file..."
        cat > .env << EOF
# Backend Server Configuration
NODE_ENV=production
PORT=10000

# Ngrok Configuration (if using ngrok)
NGROK_AUTH_TOKEN=your_ngrok_auth_token_here

# DuckDNS Configuration (if using DuckDNS)
DUCKDNS_DOMAIN=your_duckdns_domain_here
DUCKDNS_TOKEN=your_duckdns_token_here

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here

# Database Configuration
DB_FILE=db.json
EOF
        print_success ".env file regenerated. Please edit it with your actual values."
    fi
else
    print_status "Creating .env file..."
    cat > .env << EOF
# Backend Server Configuration
NODE_ENV=production
PORT=10000

# Ngrok Configuration (if using ngrok)
NGROK_AUTH_TOKEN=your_ngrok_auth_token_here

# DuckDNS Configuration (if using DuckDNS)
DUCKDNS_DOMAIN=your_duckdns_domain_here
DUCKDNS_TOKEN=your_duckdns_token_here

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here

# Database Configuration
DB_FILE=db.json
EOF
    print_success ".env file created. Please edit it with your actual values."
fi

# Make scripts executable with absolute paths
print_status "Making scripts executable..."
chmod +x ./start-backend-server.sh ./duckdns-updater.sh ./setup-auto-start.sh

# Test the server
print_status "Testing server startup..."
if command -v timeout &> /dev/null; then
    timeout 10s node server.mjs &
    SERVER_PID=$!
    sleep 3

    if curl -s http://localhost:10000/api/ping > /dev/null; then
        print_success "Server test successful - backend is responding"
        kill $SERVER_PID 2>/dev/null
    else
        print_warning "Server test failed - backend may not be responding"
        kill $SERVER_PID 2>/dev/null
    fi
else
    print_warning "Skipping server test (timeout command not available)"
fi

# Setup auto-start
print_status "Setting up auto-start..."
./setup-auto-start.sh

print_status "Setting up PM2 startup script..."
if ! pm2 startup; then
    print_warning "Trying Termux-specific startup setup..."
    pm2 startup termux || print_warning "PM2 startup setup may need manual configuration"
fi

echo ""
echo "🎉 Backend setup complete!"
echo "=================================================="
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your actual values"
echo "2. Run: ./start-backend-server.sh"
echo "3. Check status: pm2 status"
echo "4. View logs: pm2 logs"
echo ""
echo "🔧 Useful commands:"
echo "  Start server: ./start-backend-server.sh"
echo "  Stop server: pm2 stop all"
echo "  Restart server: pm2 restart all"
echo "  View logs: pm2 logs"
echo "  Check status: pm2 status"
echo ""
echo "📱 For mobile access:"
echo "  - Install ngrok and add your auth token to .env"
echo "  - Or set up DuckDNS and add your domain/token to .env"
echo ""
print_success "Your backend is ready to use!" 