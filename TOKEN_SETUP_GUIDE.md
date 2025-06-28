# Token Setup Guide - GitHub & Ngrok

This guide shows you how to set up both GitHub and ngrok tokens globally so they can be detected automatically by the system.

## 🔑 Required Tokens

1. **GitHub Token** - For updating gists and repository access
2. **Ngrok Auth Token** - For creating secure tunnels

## 📋 Prerequisites

- Ubuntu-in-Termux (proot-distro)
- Git installed
- ngrok installed

## 🚀 Method 1: Environment Variables (Recommended)

### Get Your Tokens:

**GitHub Token:**
1. Go to [GitHub Settings > Tokens](https://github.com/settings/tokens)
2. Generate new token with `gist` permission
3. Copy the token

**Ngrok Auth Token:**
1. Go to [ngrok Dashboard](https://dashboard.ngrok.com/get-started/your-authtoken)
2. Copy your authtoken

### Set Environment Variables:

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

## 🔧 Method 2: Git & Ngrok Configuration

```bash
# Git config
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"

# Ngrok config
ngrok config add-authtoken "your_ngrok_auth_token_here"
```

## 🛠️ Method 3: GitHub CLI

```bash
# Install GitHub CLI
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh

# Authenticate
gh auth login
```

## 🔍 Method 4: .env File

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

## ✅ Verification

```bash
# Check GitHub token
echo "GitHub: ${GITHUB_TOKEN:0:10}..."
gh auth status

# Check ngrok token
echo "Ngrok: ${NGROK_AUTH_TOKEN:0:10}..."
ngrok config check
```

## 🔄 Automatic Detection Order

1. Environment Variables
2. GitHub CLI
3. Git Configuration
4. .env File
5. ngrok config

## 🚨 Troubleshooting

```bash
# Test GitHub token
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user

# Test ngrok
ngrok http 8080 --log=stdout

# Check environment
env | grep -E "(GITHUB|NGROK)_TOKEN"
```

## 🧪 Test Your Setup

### Test GitHub Token:

```bash
# Test with curl
curl -H "Authorization: token $GITHUB_TOKEN" \
     -H "Accept: application/vnd.github.v3+json" \
     https://api.github.com/user

# Test with GitHub CLI
gh api user
```

### Test Ngrok Token:

```bash
# Test ngrok tunnel
ngrok http 8080 --log=stdout
```

## 🚨 Troubleshooting

### GitHub Token Issues:

```bash
# Check if token is valid
curl -H "Authorization: token $GITHUB_TOKEN" \
     -H "Accept: application/vnd.github.v3+json" \
     https://api.github.com/user

# Regenerate token if needed
# Go to: https://github.com/settings/tokens
```

### Ngrok Token Issues:

```bash
# Check ngrok config
ngrok config check

# Reconfigure ngrok
ngrok config add-authtoken "your_new_token_here"
```

### Environment Variable Issues:

```bash
# Check if variables are loaded
env | grep -E "(GITHUB|NGROK)_TOKEN"

# Reload bashrc
source ~/.bashrc

# Check bashrc content
grep -E "(GITHUB|NGROK)_TOKEN" ~/.bashrc
```

## 📱 Mobile-Specific Setup

### For Termux/Ubuntu:

```bash
# Ensure proper permissions
chmod 600 ~/.bashrc

# Add to termux boot (optional)
echo 'source ~/.bashrc' >> ~/.bash_profile
```

### For PM2 Ecosystem:

```bash
# PM2 will automatically pick up environment variables
# No additional configuration needed
```

## 🔐 Security Best Practices

1. **Never commit tokens** to version control
2. **Use environment variables** instead of hardcoding
3. **Rotate tokens regularly**
4. **Use minimal permissions** for GitHub tokens
5. **Keep tokens secure** and don't share them

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify token permissions
3. Test with curl commands
4. Check system logs: `pm2 logs`

---

**Note**: Replace `your_github_token_here` and `your_ngrok_auth_token_here` with your actual tokens. 