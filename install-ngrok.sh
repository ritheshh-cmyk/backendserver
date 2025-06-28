#!/bin/bash
set -e

echo "🚀 Installing Ngrok for Ubuntu-in-Termux..."

# Check if ngrok is already installed
if command -v ngrok &> /dev/null; then
    echo "✅ Ngrok is already installed"
    ngrok version
else
    echo "📦 Installing ngrok..."
    
    # Download ngrok for ARM64 (Android)
    NGROK_VERSION="3.6.0"
    NGROK_ARCH="arm64"
    
    # Create temp directory
    TEMP_DIR=$(mktemp -d)
    cd "$TEMP_DIR"
    
    # Download ngrok
    echo "⬇️ Downloading ngrok v${NGROK_VERSION} for ${NGROK_ARCH}..."
    wget -q "https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v${NGROK_VERSION}-linux-${NGROK_ARCH}.tgz"
    
    # Extract
    echo "📦 Extracting ngrok..."
    tar -xzf "ngrok-v${NGROK_VERSION}-linux-${NGROK_ARCH}.tgz"
    
    # Install to /usr/local/bin
    echo "🔧 Installing ngrok..."
    sudo mv ngrok /usr/local/bin/
    sudo chmod +x /usr/local/bin/ngrok
    
    # Cleanup
    cd /
    rm -rf "$TEMP_DIR"
    
    echo "✅ Ngrok installed successfully"
    ngrok version
fi

# Check if GitHub token is set
if [ -z "$GITHUB_TOKEN" ]; then
    echo ""
    echo "⚠️  GITHUB_TOKEN is not set!"
    echo "📝 To enable gist updates, add your GitHub token to .env:"
    echo "   GITHUB_TOKEN=your_github_token_here"
    echo ""
    echo "🔗 Get a token from: https://github.com/settings/tokens"
    echo "   (Need 'gist' permission)"
else
    echo "✅ GitHub token is configured"
fi

# Check if ngrok auth token is set
if [ -z "$NGROK_AUTH_TOKEN" ]; then
    echo ""
    echo "⚠️  NGROK_AUTH_TOKEN is not set!"
    echo "📝 To use ngrok, add your auth token to .env:"
    echo "   NGROK_AUTH_TOKEN=your_ngrok_token_here"
    echo ""
    echo "🔗 Get a token from: https://dashboard.ngrok.com/get-started/your-authtoken"
else
    echo "✅ Ngrok auth token is configured"
    echo "🔐 Authenticating ngrok..."
    ngrok config add-authtoken "$NGROK_AUTH_TOKEN"
fi

echo ""
echo "🎉 Ngrok setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Add your tokens to .env file"
echo "2. Restart PM2: pm2 restart all"
echo "3. Check status: pm2 status"
echo ""
echo "🔗 Your gist will be updated at:"
echo "   https://gist.github.com/d394f3df4c86cf1cb0040a7ec4138bfd" 