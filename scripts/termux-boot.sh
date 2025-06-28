#!/data/data/com.termux/files/usr/bin/bash

# === Termux:Boot Auto-start Script ===
# This script runs automatically when Termux starts (phone boots)

# Wait for network to be available
sleep 30

# Set your GitHub token (you'll need to set this manually)
export GITHUB_TOKEN="YOUR_GITHUB_TOKEN_HERE"

# Navigate to your project directory
cd /storage/emulated/0/Download/MobileRepairTracker-1

# Start the ngrok update script
./update-ngrok-gist-v2.sh

# Keep the script running and restart if it fails
while true; do
    if ! pgrep -f "ngrok" > /dev/null; then
        echo "Ngrok stopped, restarting..."
        ./update-ngrok-gist-v2.sh
    fi
    sleep 60
done 