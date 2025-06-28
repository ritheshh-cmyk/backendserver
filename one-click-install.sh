#!/bin/bash
set -e  # Exit on any error

echo "🚀 One-Click Backend Install for Ubuntu-in-Termux"
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

# Check if we're in Ubuntu-in-Termux
if [ "$(uname -o)" = "Android" ]; then
    print_error "❌ You're running this inside Termux, not Ubuntu-in-Termux!"
    print_error "Please install Ubuntu using proot-distro first:"
    echo ""
    echo "1. Install proot-distro:"
    echo "   pkg install proot-distro"
    echo ""
    echo "2. Install Ubuntu:"
    echo "   proot-distro install ubuntu"
    echo ""
    echo "3. Start Ubuntu:"
    echo "   proot-distro login ubuntu"
    echo ""
    echo "4. Then run this script again inside Ubuntu"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "server.mjs" ]; then
    print_error "❌ server.mjs not found!"
    print_error "Please run this script from your project root directory."
    exit 1
fi

echo ""
echo "🔍 Pre-flight Checks..."

# Check internet connectivity
print_status "Checking internet connection..."
if ! ping -c 1 google.com &>/dev/null; then
    print_error "❌ No internet connection. Please check your network."
    exit 1
fi
print_success "✅ Internet connection OK"

# Check system resources
DISK_FREE=$(df -h . | awk 'NR==2 {print $4}')
MEM_FREE=$(free -m | awk '/Mem:/ {print $7}' 2>/dev/null || echo "Unknown")
print_status "System resources: Disk $DISK_FREE free, RAM ${MEM_FREE}MB free"

if [ "$MEM_FREE" != "Unknown" ] && [ "$MEM_FREE" -lt 100 ]; then
    print_warning "⚠️  Low memory detected. Installation may be slow."
fi

echo ""
echo "📦 Installing Dependencies..."

# Update package list
print_status "Updating package list..."
apt update -qq

# Install required system packages
print_status "Installing system dependencies..."
apt install -y curl wget git nodejs npm lsof coreutils

# Verify Node.js installation
NODE_VERSION=$(node --version)
print_success "✅ Node.js installed: $NODE_VERSION"

# Install PM2 globally
print_status "Installing PM2..."
npm install -g pm2 --silent
print_success "✅ PM2 installed"

echo ""
echo "🔧 Setting up Backend..."

# Run the setup script
print_status "Running backend setup..."
./setup-backend.sh

echo ""
echo "🚀 Starting Backend Server..."

# Start the backend
print_status "Starting backend server..."
./start-backend-server.sh

echo ""
echo "🎉 Installation Complete!"
echo "========================"
echo ""
echo "📋 Your backend is now running with these features:"
echo ""
echo "🟢 Auto-start on boot"
echo "🟢 PM2 process management"
echo "🟢 Health monitoring"
echo "🟢 Logging and error tracking"
echo "🟢 Self-update capability"
echo "🟢 Mobile-optimized for Ubuntu-in-Termux"
echo ""
echo "🔧 Useful Commands:"
echo "  Check status: pm2 status"
echo "  View logs: pm2 logs"
echo "  Restart: pm2 restart all"
echo "  Stop: pm2 stop all"
echo "  Update: ./update-backend.sh"
echo ""
echo "🌐 Access your backend:"
echo "  Local: http://localhost:$(grep '^PORT=' .env | cut -d= -f2)/api/ping"
echo ""
echo "📱 For remote access, edit .env and add:"
echo "  - NGROK_AUTH_TOKEN for ngrok tunnel"
echo "  - DUCKDNS_DOMAIN and DUCKDNS_TOKEN for DuckDNS"
echo ""
print_success "🎉 Your enterprise-grade backend is ready!" 