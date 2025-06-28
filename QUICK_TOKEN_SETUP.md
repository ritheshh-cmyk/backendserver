# Quick Token Setup Guide

## 🚀 One-Click Setup (Recommended)

```bash
# Make script executable
chmod +x setup-tokens.sh

# Setup all tokens interactively
./setup-tokens.sh all

# Check current status
./setup-tokens.sh check
```

## 🔑 Manual Setup Methods

### Method 1: Environment Variables (Global)

```bash
# Set tokens
export GITHUB_TOKEN="ghp_your_github_token_here"
export NGROK_AUTH_TOKEN="your_ngrok_auth_token_here"

# Make permanent
echo 'export GITHUB_TOKEN="ghp_your_github_token_here"' >> ~/.bashrc
echo 'export NGROK_AUTH_TOKEN="your_ngrok_auth_token_here"' >> ~/.bashrc

# Reload
source ~/.bashrc
```

### Method 2: .env File (Project-Specific)

```bash
cat > .env << EOF
GITHUB_TOKEN=ghp_your_github_token_here
NGROK_AUTH_TOKEN=your_ngrok_auth_token_here
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here
TELEGRAM_ENABLE_NOTIFICATIONS=true
GIST_ID=your_gist_id_here
GIST_FILENAME=ngrok-url.txt
PORT=10000
EOF
```

### Method 3: GitHub CLI

```bash
# Install GitHub CLI
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh

# Authenticate
gh auth login
```

### Method 4: ngrok Config

```bash
# Configure ngrok
ngrok config add-authtoken "your_ngrok_auth_token_here"
```

## ✅ Verification Commands

```bash
# Check GitHub token
echo "GitHub: ${GITHUB_TOKEN:0:10}..."
gh auth status

# Check ngrok token
echo "Ngrok: ${NGROK_AUTH_TOKEN:0:10}..."
ngrok config check

# Check environment
env | grep -E "(GITHUB|NGROK)_TOKEN"
```

## 🔄 Automatic Detection Order

The system automatically detects tokens in this priority order:

1. **Environment Variables** (`GITHUB_TOKEN`, `NGROK_AUTH_TOKEN`)
2. **GitHub CLI** (`gh auth status`)
3. **Git Configuration** (`git config --global`)
4. **.env File** (project-specific)
5. **ngrok config** (for ngrok token)

## 🛠️ Script Commands

```bash
./setup-tokens.sh github    # Setup GitHub token only
./setup-tokens.sh ngrok     # Setup ngrok token only
./setup-tokens.sh cli       # Setup GitHub CLI
./setup-tokens.sh all       # Setup everything
./setup-tokens.sh check     # Check current status
./setup-tokens.sh help      # Show help
```

## 🚨 Troubleshooting

### GitHub Token Issues:
```bash
# Test token validity
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user

# Regenerate token at: https://github.com/settings/tokens
```

### Ngrok Token Issues:
```bash
# Check ngrok config
ngrok config check

# Reconfigure
ngrok config add-authtoken "your_new_token_here"
```

### Environment Issues:
```bash
# Check if variables are loaded
env | grep -E "(GITHUB|NGROK)_TOKEN"

# Reload bashrc
source ~/.bashrc
```

## 📱 For Ubuntu-in-Termux

```bash
# Ensure proper permissions
chmod 600 ~/.bashrc

# Add to termux boot (optional)
echo 'source ~/.bashrc' >> ~/.bash_profile
```

---

**Get Tokens:**
- GitHub: https://github.com/settings/tokens (need 'gist' permission)
- Ngrok: https://dashboard.ngrok.com/get-started/your-authtoken 