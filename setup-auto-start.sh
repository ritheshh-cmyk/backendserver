#!/bin/bash
set -e  # Exit on any error

echo "🔧 Setting up auto-start for Ubuntu-in-Termux..."

# Get the current directory
CURRENT_DIR=$(pwd)
echo "📁 Current directory: $CURRENT_DIR"

# Check if we're in the right directory
if [ ! -f "server.mjs" ]; then
    echo "❌ Error: server.mjs not found. Please run this script from your project root."
    exit 1
fi

# Check if start script exists
if [ ! -f "start-backend-server.sh" ]; then
    echo "❌ Error: start-backend-server.sh not found. Please run ./setup-backend.sh first."
    exit 1
fi

# Create the auto-start command
AUTO_START_CMD="cd $CURRENT_DIR && ./start-backend-server.sh"

# Check if already added to .bashrc
if grep -q "$CURRENT_DIR" ~/.bashrc; then
    echo "⚠️  Auto-start already configured in .bashrc"
    echo "Current auto-start command:"
    grep "$CURRENT_DIR" ~/.bashrc
    read -p "Do you want to update the auto-start command? [y/N] " choice
    if [[ "$choice" =~ ^[Yy]$ ]]; then
        # Remove old entries
        sed -i "/$CURRENT_DIR/d" ~/.bashrc
        # Add new entry
        echo "" >> ~/.bashrc
        echo "# Auto-start backend server on Ubuntu-in-Termux login" >> ~/.bashrc
        echo "$AUTO_START_CMD" >> ~/.bashrc
        echo "✅ Auto-start updated in .bashrc"
    fi
else
    # Add to .bashrc
    echo "" >> ~/.bashrc
    echo "# Auto-start backend server on Ubuntu-in-Termux login" >> ~/.bashrc
    echo "$AUTO_START_CMD" >> ~/.bashrc
    echo "✅ Auto-start added to .bashrc"
fi

# Make scripts executable
chmod +x ./start-backend-server.sh
chmod +x ./duckdns-updater.sh

echo ""
echo "🎉 Auto-start setup complete!"
echo "📝 The backend will now start automatically when you open Ubuntu-in-Termux"
echo ""
echo "To test immediately:"
echo "  source ~/.bashrc"
echo ""
echo "To disable auto-start, remove the line from ~/.bashrc" 