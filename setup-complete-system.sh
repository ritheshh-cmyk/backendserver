#!/bin/bash

# === Mobile Repair Tracker - Complete System Setup ===
# This script sets up the entire system from scratch
# Run this on a fresh Ubuntu-in-Termux installation

set -e  # Exit on any error

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

# Function to log messages
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a setup.log
}

log_message "=== Starting Complete System Setup ==="

# Step 1: System Update
print_info "Step 1: Updating System Packages"

print_status "Updating package lists..."
apt update

print_status "Upgrading packages..."
apt upgrade -y

print_status "Installing essential packages..."
apt install -y curl wget git jq nano vim htop

log_message "System packages updated and essential tools installed"

# Step 2: Install Node.js
print_info "Step 2: Installing Node.js"

if ! command -v node &> /dev/null; then
    print_status "Installing Node.js..."
    
    # Install Node.js 18.x
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
    
    # Verify installation
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    
    print_status "Node.js installed: $NODE_VERSION"
    print_status "npm installed: $NPM_VERSION"
    log_message "Node.js $NODE_VERSION and npm $NPM_VERSION installed"
else
    NODE_VERSION=$(node --version)
    print_status "Node.js already installed: $NODE_VERSION"
    log_message "Node.js already installed: $NODE_VERSION"
fi

# Step 3: Install PM2
print_info "Step 3: Installing PM2"

if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2 globally..."
    npm install -g pm2
    
    # Save PM2 configuration
    pm2 startup
    print_status "PM2 startup configuration saved"
    log_message "PM2 installed and configured"
else
    print_status "PM2 already installed"
    log_message "PM2 already installed"
fi

# Step 4: Install ngrok
print_info "Step 4: Installing ngrok"

if ! command -v ngrok &> /dev/null; then
    print_status "Installing ngrok..."
    
    # Download and install ngrok
    curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
    echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | tee /etc/apt/sources.list.d/ngrok.list
    apt update
    apt install ngrok -y
    
    print_status "ngrok installed"
    log_message "ngrok installed"
else
    print_status "ngrok already installed"
    log_message "ngrok already installed"
fi

# Step 5: Create Project Structure
print_info "Step 5: Creating Project Structure"

# Create necessary directories
mkdir -p logs
mkdir -p backups
mkdir -p config

print_status "Project directories created"
log_message "Project structure created"

# Step 6: Install Project Dependencies
print_info "Step 6: Installing Project Dependencies"

if [ -f "package.json" ]; then
    print_status "Installing npm dependencies..."
    npm install
    log_message "npm dependencies installed"
else
    print_warning "No package.json found"
    log_message "No package.json found - skipping npm install"
fi

# Step 7: Setup Environment Variables
print_info "Step 7: Setting up Environment Variables"

if [ ! -f ".env" ]; then
    if [ -f "env-template.txt" ]; then
        print_status "Creating .env file from template..."
        cp env-template.txt .env
        print_warning "Please edit .env file and add your actual tokens"
        log_message ".env file created from template"
    else
        print_warning "No env-template.txt found, creating basic .env..."
        cat > .env << 'EOF'
# Mobile Repair Tracker Environment Variables
# Add your actual tokens below

# Required tokens
GITHUB_TOKEN=your_github_token_here
NGROK_AUTH_TOKEN=your_ngrok_auth_token_here

# Optional tokens
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here

# System configuration
PORT=10000
NODE_ENV=production
GIST_ID=d394f3df4c86cf1cb0040a7ec4138bfd
GIST_FILENAME=backend-url.txt
EOF
        print_warning "Basic .env file created - please add your tokens"
        log_message "Basic .env file created"
    fi
else
    print_status ".env file already exists"
    log_message ".env file already exists"
fi

# Step 8: Make Scripts Executable
print_info "Step 8: Making Scripts Executable"

# Make all shell scripts executable
chmod +x *.sh
chmod +x scripts/*.sh

print_status "All scripts made executable"
log_message "Scripts made executable"

# Step 9: Test Dependencies
print_info "Step 9: Testing Dependencies"

# Test Node.js
if node --version > /dev/null 2>&1; then
    print_status "✅ Node.js is working"
else
    print_error "❌ Node.js test failed"
    exit 1
fi

# Test npm
if npm --version > /dev/null 2>&1; then
    print_status "✅ npm is working"
else
    print_error "❌ npm test failed"
    exit 1
fi

# Test PM2
if pm2 --version > /dev/null 2>&1; then
    print_status "✅ PM2 is working"
else
    print_error "❌ PM2 test failed"
    exit 1
fi

# Test ngrok
if ngrok version > /dev/null 2>&1; then
    print_status "✅ ngrok is working"
else
    print_error "❌ ngrok test failed"
    exit 1
fi

# Test jq
if jq --version > /dev/null 2>&1; then
    print_status "✅ jq is working"
else
    print_error "❌ jq test failed"
    exit 1
fi

log_message "All dependency tests passed"

# Step 10: Create Startup Scripts
print_info "Step 10: Creating Startup Scripts"

# Create a simple startup script
cat > start-system.sh << 'EOF'
#!/bin/bash
# Simple startup script
echo "🚀 Starting Mobile Repair Tracker System..."
./start-system-fixed.sh
EOF

chmod +x start-system.sh

# Create a stop script
cat > stop-system.sh << 'EOF'
#!/bin/bash
# Stop all services
echo "🛑 Stopping Mobile Repair Tracker System..."
pm2 stop all
pm2 delete all
pkill -f ngrok
echo "✅ All services stopped"
EOF

chmod +x stop-system.sh

# Create a status script
cat > status.sh << 'EOF'
#!/bin/bash
# Show system status
echo "📊 Mobile Repair Tracker System Status"
echo "======================================"
echo ""
echo "🔄 PM2 Processes:"
pm2 status
echo ""
echo "🌐 Ngrok Status:"
if pgrep -f ngrok > /dev/null; then
    echo "✅ ngrok is running"
    if [ -f .ngrok-url ]; then
        echo "🔗 URL: $(cat .ngrok-url)"
    fi
else
    echo "❌ ngrok is not running"
fi
echo ""
echo "🔧 Backend Status:"
if curl -s http://localhost:10000/health > /dev/null 2>&1; then
    echo "✅ Backend is responding"
elif curl -s http://localhost:10000/api/ping > /dev/null 2>&1; then
    echo "✅ Backend is responding (ping)"
else
    echo "❌ Backend is not responding"
fi
EOF

chmod +x status.sh

print_status "Startup scripts created"
log_message "Startup scripts created"

# Step 11: Setup Auto-Start (Optional)
print_info "Step 11: Setting up Auto-Start"

read -p "Do you want to set up auto-start on boot? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Setting up auto-start..."
    
    # Create boot script
    mkdir -p ~/.termux/boot
    cat > ~/.termux/boot/start-mobile-repair.sh << 'EOF'
#!/data/data/com.termux/files/usr/bin/bash
# Auto-start script for Mobile Repair Tracker

# Wait for network
sleep 30

# Navigate to project directory
cd /storage/emulated/0/Download/MobileRepairTracker-1

# Start the system
./start-system-fixed.sh
EOF

    chmod +x ~/.termux/boot/start-mobile-repair.sh
    
    print_status "Auto-start script created at ~/.termux/boot/start-mobile-repair.sh"
    log_message "Auto-start script created"
else
    print_status "Skipping auto-start setup"
    log_message "Auto-start setup skipped"
fi

# Step 12: Final Instructions
print_info "Step 12: Setup Complete"

echo ""
echo "🎉 === Setup Complete ==="
echo ""
echo "✅ All dependencies installed"
echo "✅ Project structure created"
echo "✅ Scripts made executable"
echo "✅ Environment template created"
echo ""
echo "📝 Next Steps:"
echo "1. Edit .env file and add your tokens:"
echo "   - GITHUB_TOKEN (from https://github.com/settings/tokens)"
echo "   - NGROK_AUTH_TOKEN (from https://dashboard.ngrok.com/get-started/your-authtoken)"
echo "   - TELEGRAM_BOT_TOKEN (optional, from @BotFather)"
echo "   - TELEGRAM_CHAT_ID (optional, from @userinfobot)"
echo ""
echo "2. Start the system:"
echo "   ./start-system.sh"
echo ""
echo "3. Check status:"
echo "   ./status.sh"
echo ""
echo "4. Stop the system:"
echo "   ./stop-system.sh"
echo ""
echo "📊 Useful Commands:"
echo "  View logs: tail -f logs/startup.log"
echo "  PM2 logs: pm2 logs"
echo "  PM2 status: pm2 status"
echo "  Restart: pm2 restart all"
echo ""
echo "🔗 Your backend will be accessible at the ngrok URL"
echo "   The URL will be automatically updated in your GitHub Gist"
echo ""

log_message "=== Setup completed successfully ==="
print_status "🎉 Mobile Repair Tracker System Setup Complete!"
print_status "📝 Don't forget to edit .env file with your tokens!" 