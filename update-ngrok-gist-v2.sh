#!/bin/bash

# === CONFIGURATION ===
PORT=10000
GIST_ID="d394f3df4c86cf1cb0040a7ec4138bfd"
GIST_FILENAME="backend-url.txt"
BACKEND_FILE="backend/server/index.ts"

# Ensure GitHub token is set
if [ -z "$GITHUB_TOKEN" ]; then
  echo "❌ GITHUB_TOKEN is not set. Please export it before running."
  exit 1
fi

# === Start ngrok ===
echo "🚀 Starting ngrok on port $PORT..."
ngrok http $PORT > /dev/null &
NGROK_PID=$!

# === Wait for ngrok to initialize ===
echo "⏳ Waiting for ngrok..."
sleep 8

# === Extract ngrok public URL ===
NGROK_URL=$(curl -s http://127.0.0.1:4040/api/tunnels \
  | grep -o '"public_url":"https:[^"]*' \
  | head -n 1 \
  | sed 's/"public_url":"//')

if [ -z "$NGROK_URL" ]; then
  echo "❌ Failed to get Ngrok URL. Killing ngrok..."
  kill $NGROK_PID
  exit 1
fi

echo "✅ Ngrok URL: $NGROK_URL"

# === Patch CORS origin in backend index.ts ===
echo "🔧 Updating CORS config in $BACKEND_FILE..."
sed -i "s|'https://[a-zA-Z0-9\-]*\.ngrok\.io'|'$NGROK_URL'|g" "$BACKEND_FILE"
echo "✅ CORS origin updated"

# === Update GitHub Gist with new URL ===
echo "📡 Updating GitHub Gist..."
PATCH_DATA=$(jq -n \
  --arg filename "$GIST_FILENAME" \
  --arg content "$NGROK_URL" \
  '{files: {($filename): {content: $content}}}')

curl -s -X PATCH \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  -d "$PATCH_DATA" \
  "https://api.github.com/gists/$GIST_ID"

echo "✅ Gist updated at: https://gist.github.com/$GIST_ID"

# === Restart Backend Server ===
echo "♻️ Rebuilding and restarting backend..."
cd backend || exit 1
npm run build || { echo "❌ Build failed"; exit 1; }
pkill -f "node"
nohup npm start > backend.log 2>&1 &
cd ../
echo "✅ Backend is running. Logs: backend/backend.log"
echo "🎉 All done. Access via: $NGROK_URL" 