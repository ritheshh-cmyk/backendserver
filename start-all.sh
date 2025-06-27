#!/bin/bash

# === CONFIGURATION ===
# Set the path to your backend directory and update-ngrok-gist.sh script
BACKEND_DIR="/path/to/your/backend"  # <-- Change this to your backend path
UPDATE_GIST_SCRIPT="/path/to/update-ngrok-gist.sh"  # <-- Change this to your script path

# Start backend (adjust the command as needed)
cd "$BACKEND_DIR"
npm start &

# Wait a few seconds for backend to start
sleep 5

# Start ngrok (adjust the port if needed)
ngrok http 10000 > /dev/null 2>&1 &

# Wait for ngrok to initialize and get a public URL
sleep 8

# Update the Gist with the current ngrok URL
"$UPDATE_GIST_SCRIPT"

echo "All services started and Gist updated!" 