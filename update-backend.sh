#!/bin/bash
set -e  # Exit on any error

echo "🔄 Backend Self-Update Script"
echo "=============================="

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

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    print_error "Not a git repository. Cannot update."
    exit 1
fi

# Check if git is available
if ! command -v git &> /dev/null; then
    print_error "git is not installed. Please install git first."
    exit 1
fi

echo ""
echo "📥 Checking for Updates..."

# Fetch latest changes
print_status "Fetching latest changes from remote..."
git fetch origin

# Check if there are updates
LOCAL_COMMIT=$(git rev-parse HEAD)
REMOTE_COMMIT=$(git rev-parse origin/main 2>/dev/null || git rev-parse origin/master 2>/dev/null)

if [ "$LOCAL_COMMIT" = "$REMOTE_COMMIT" ]; then
    print_success "No updates available. You're already on the latest version."
    exit 0
fi

echo ""
echo "🔄 Updates Available!"

# Show what's changed
print_status "Recent changes:"
git log --oneline HEAD..origin/main 2>/dev/null || git log --oneline HEAD..origin/master 2>/dev/null

echo ""
read -p "Do you want to update? [Y/n] " choice
if [[ "$choice" =~ ^[Nn]$ ]]; then
    print_warning "Update cancelled."
    exit 0
fi

echo ""
echo "📦 Updating Backend..."

# Stop PM2 processes
print_status "Stopping PM2 processes..."
pm2 stop all 2>/dev/null || true

# Pull latest changes
print_status "Pulling latest changes..."
git pull origin main 2>/dev/null || git pull origin master 2>/dev/null

# Install any new dependencies
print_status "Installing dependencies..."
npm install --silent

# Make scripts executable again
print_status "Making scripts executable..."
chmod +x ./start-backend-server.sh ./duckdns-updater.sh ./setup-auto-start.sh ./update-backend.sh

# Restart PM2 processes
print_status "Restarting PM2 processes..."
pm2 start ecosystem.config.js

# Save PM2 configuration
print_status "Saving PM2 configuration..."
pm2 save

echo ""
echo "🎉 Update Complete!"
echo "=================="
print_success "Backend has been updated and restarted successfully."
echo ""
echo "📊 Current Status:"
pm2 status

echo ""
echo "📝 Recent logs:"
pm2 logs --lines 5 