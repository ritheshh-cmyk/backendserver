#!/bin/bash

# === CONFIGURATION ===
GIST_ID="d394f3df4c86cf1cb0040a7ec4138bfd"  # Your Gist ID
GIST_FILENAME="backend-url.txt"              # Your Gist filename
GITHUB_TOKEN="YOUR_GITHUB_TOKEN_HERE"        # <-- Replace with your GitHub personal access token

# === GET NGROK URL ===
NGROK_API="http://127.0.0.1:4040/api/tunnels"
NGROK_URL=$(curl -s $NGROK_API | grep -o '"public_url":"https:[^\"]*' | head -n 1 | sed 's/"public_url":"//')

if [ -z "$NGROK_URL" ]; then
  echo "Ngrok URL not found. Is ngrok running?"
  exit 1
fi

echo "Current Ngrok URL: $NGROK_URL"

# === UPDATE GIST ===
PATCH_DATA=$(cat <<EOF
{
  "files": {
    "$GIST_FILENAME": {
      "content": "$NGROK_URL"
    }
  }
}
EOF
)

curl -X PATCH \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  -d "$PATCH_DATA" \
  "https://api.github.com/gists/$GIST_ID"

echo "Gist updated!" 