#!/bin/bash

# === Token Setup Script ===
# Sets up both GitHub and ngrok tokens globally

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Function to check if token is valid
check_github_token() {
    if [ -n "$1" ]; then
        if curl -s -H "Authorization: token $1" -H "Accept: application/vnd.github.v3+json" https://api.github.com/user > /dev/null 2>&1; then
            return 0
        fi
    fi
    return 1
}

check_ngrok_token() {
    if [ -n "$1" ]; then
        if ngrok config add-authtoken "$1" > /dev/null 2>&1; then
            return 0
        fi
    fi
    return 1
}

# Function to setup GitHub token
setup_github_token() {
    print_info "Setting up GitHub token..."
    
    echo "📝 GitHub Token Setup:"
    echo "1. Go to: https://github.com/settings/tokens"
    echo "2. Click 'Generate new token (classic)'"
    echo "3. Give it a name like 'MobileRepairTracker'"
    echo "4. Select scopes: gist, repo (if needed)"
    echo "5. Copy the generated token"
    echo ""
    
    read -s -p "Enter your GitHub token: " GITHUB_TOKEN_INPUT
    echo ""
    
    if [ -n "$GITHUB_TOKEN_INPUT" ]; then
        if check_github_token "$GITHUB_TOKEN_INPUT"; then
            print_status "✅ GitHub token is valid"
            
            # Set environment variable
            export GITHUB_TOKEN="$GITHUB_TOKEN_INPUT"
            
            # Add to .bashrc
            if ! grep -q "GITHUB_TOKEN=" ~/.bashrc; then
                echo "export GITHUB_TOKEN=\"$GITHUB_TOKEN_INPUT\"" >> ~/.bashrc
                print_status "💾 Added to ~/.bashrc"
            fi
            
            # Add to .env
            if [ ! -f ".env" ]; then
                touch .env
            fi
            if ! grep -q "GITHUB_TOKEN=" .env; then
                echo "GITHUB_TOKEN=$GITHUB_TOKEN_INPUT" >> .env
                print_status "💾 Added to .env"
            fi
            
            return 0
        else
            print_error "❌ Invalid GitHub token"
            return 1
        fi
    else
        print_warning "⚠️ No token provided"
        return 1
    fi
}

# Function to setup ngrok token
setup_ngrok_token() {
    print_info "Setting up ngrok token..."
    
    echo "📝 Ngrok Token Setup:"
    echo "1. Go to: https://dashboard.ngrok.com/get-started/your-authtoken"
    echo "2. Copy your authtoken"
    echo ""
    
    read -s -p "Enter your ngrok auth token: " NGROK_TOKEN_INPUT
    echo ""
    
    if [ -n "$NGROK_TOKEN_INPUT" ]; then
        # Configure ngrok
        if command -v ngrok &> /dev/null; then
            ngrok config add-authtoken "$NGROK_TOKEN_INPUT" > /dev/null 2>&1
            print_status "✅ Ngrok configured"
        fi
        
        # Set environment variable
        export NGROK_AUTH_TOKEN="$NGROK_TOKEN_INPUT"
        
        # Add to .bashrc
        if ! grep -q "NGROK_AUTH_TOKEN=" ~/.bashrc; then
            echo "export NGROK_AUTH_TOKEN=\"$NGROK_TOKEN_INPUT\"" >> ~/.bashrc
            print_status "💾 Added to ~/.bashrc"
        fi
        
        # Add to .env
        if [ ! -f ".env" ]; then
            touch .env
        fi
        if ! grep -q "NGROK_AUTH_TOKEN=" .env; then
            echo "NGROK_AUTH_TOKEN=$NGROK_TOKEN_INPUT" >> .env
            print_status "💾 Added to .env"
        fi
        
        return 0
    else
        print_warning "⚠️ No token provided"
        return 1
    fi
}

# Function to setup GitHub CLI
setup_github_cli() {
    print_info "Setting up GitHub CLI..."
    
    if ! command -v gh &> /dev/null; then
        print_warning "GitHub CLI not installed. Installing..."
        
        # Install GitHub CLI
        curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
        sudo apt update
        sudo apt install -y gh
        
        print_status "✅ GitHub CLI installed"
    fi
    
    # Authenticate
    print_info "Authenticating with GitHub CLI..."
    gh auth login --web
}

# Function to check current setup
check_current_setup() {
    print_info "Checking current token setup..."
    
    echo ""
    echo "=== GitHub Token Status ==="
    
    # Check environment variable
    if [ -n "$GITHUB_TOKEN" ]; then
        if check_github_token "$GITHUB_TOKEN"; then
            print_status "✅ Environment variable: Valid"
        else
            print_error "❌ Environment variable: Invalid"
        fi
    else
        print_warning "⚠️ Environment variable: Not set"
    fi
    
    # Check .env file
    if [ -f ".env" ] && grep -q "GITHUB_TOKEN=" .env; then
        ENV_TOKEN=$(grep GITHUB_TOKEN .env | cut -d= -f2)
        if check_github_token "$ENV_TOKEN"; then
            print_status "✅ .env file: Valid"
        else
            print_error "❌ .env file: Invalid"
        fi
    else
        print_warning "⚠️ .env file: Not found"
    fi
    
    # Check GitHub CLI
    if command -v gh &> /dev/null; then
        if gh auth status &> /dev/null; then
            print_status "✅ GitHub CLI: Authenticated"
        else
            print_warning "⚠️ GitHub CLI: Not authenticated"
        fi
    else
        print_warning "⚠️ GitHub CLI: Not installed"
    fi
    
    echo ""
    echo "=== Ngrok Token Status ==="
    
    # Check environment variable
    if [ -n "$NGROK_AUTH_TOKEN" ]; then
        print_status "✅ Environment variable: Set"
    else
        print_warning "⚠️ Environment variable: Not set"
    fi
    
    # Check .env file
    if [ -f ".env" ] && grep -q "NGROK_AUTH_TOKEN=" .env; then
        print_status "✅ .env file: Found"
    else
        print_warning "⚠️ .env file: Not found"
    fi
    
    # Check ngrok config
    if command -v ngrok &> /dev/null; then
        if ngrok config check &> /dev/null; then
            print_status "✅ ngrok config: Configured"
        else
            print_warning "⚠️ ngrok config: Not configured"
        fi
    else
        print_warning "⚠️ ngrok: Not installed"
    fi
}

# Function to show help
show_help() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  github     Setup GitHub token only"
    echo "  ngrok      Setup ngrok token only"
    echo "  cli        Setup GitHub CLI authentication"
    echo "  all        Setup all tokens and CLI"
    echo "  check      Check current token status"
    echo "  help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 all"
    echo "  $0 check"
    echo "  $0 github"
}

# Main command parsing
case "${1:-help}" in
    github)
        setup_github_token
        ;;
    ngrok)
        setup_ngrok_token
        ;;
    cli)
        setup_github_cli
        ;;
    all)
        print_info "Setting up all tokens and CLI..."
        setup_github_token
        setup_ngrok_token
        setup_github_cli
        print_status "🎉 All tokens set up successfully!"
        print_info "Run 'source ~/.bashrc' to reload environment variables"
        ;;
    check)
        check_current_setup
        ;;
    help|*)
        show_help
        ;;
esac 