#!/bin/bash

# === Network Monitor Script ===
# Monitors internet connectivity and restarts ngrok when needed

# Configuration
PROJECT_DIR="/storage/emulated/0/Download/MobileRepairTracker-1"
NGROK_SCRIPT="update-ngrok-gist-v2.sh"
CHECK_INTERVAL=30  # Check every 30 seconds
LOG_FILE="network-monitor.log"

# Function to check internet connectivity
check_internet() {
    if ping -c 1 8.8.8.8 > /dev/null 2>&1; then
        return 0  # Internet is available
    else
        return 1  # No internet
    fi
}

# Function to check if ngrok is running
check_ngrok() {
    if curl -s http://127.0.0.1:4040/api/tunnels > /dev/null 2>&1; then
        return 0  # Ngrok is running
    else
        return 1  # Ngrok is not running
    fi
}

# Function to log messages
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
    echo "$1"
}

# Navigate to project directory
cd "$PROJECT_DIR" || exit 1

log_message "Network monitor started"

# Main monitoring loop
while true; do
    if check_internet; then
        # Internet is available
        if ! check_ngrok; then
            log_message "Internet available but ngrok not running. Starting ngrok..."
            ./"$NGROK_SCRIPT"
        fi
    else
        # No internet
        log_message "No internet connection detected"
        # Kill ngrok if it's running (optional)
        pkill -f "ngrok" > /dev/null 2>&1
    fi
    
    sleep "$CHECK_INTERVAL"
done 