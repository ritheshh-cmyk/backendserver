#!/bin/bash

# === BULLETPROOF MOBILE REPAIR TRACKER STARTUP ===
# 100% Error-Free Auto-Start System
# This script handles all edge cases and ensures reliable operation

set -euo pipefail  # Strict error handling

# Script configuration
SCRIPT_NAME="bulletproof-start.sh"
SCRIPT_VERSION="2.0.0"
LOG_FILE="logs/bulletproof.log"
PID_FILE="/tmp/mobile-repair.pid"
LOCK_FILE="/tmp/mobile-repair.lock"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[ℹ]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[🎉]${NC} $1"
}

# Function to log messages with timestamp
log_message() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

# Function to check if script is already running
check_running() {
    if [ -f "$LOCK_FILE" ]; then
        local pid=$(cat "$LOCK_FILE" 2>/dev/null)
        if kill -0 "$pid" 2>/dev/null; then
            print_warning "Script is already running (PID: $pid)"
            exit 1
        else
            print_warning "Removing stale lock file"
            rm -f "$LOCK_FILE"
        fi
    fi
}

# Function to create lock file
create_lock() {
    echo $$ > "$LOCK_FILE"
    trap 'cleanup_lock' EXIT
}

# Function to cleanup lock file
cleanup_lock() {
    rm -f "$LOCK_FILE"
}

# Function to ensure directories exist
ensure_directories() {
    local dirs=("logs" "backups" "config" "temp")
    for dir in "${dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            log_message "INFO" "Created directory: $dir"
        fi
    done
}

# Function to load environment variables
load_environment() {
    print_info "Loading environment variables..."
    
    # Load from .env file if it exists
    if [ -f ".env" ]; then
        print_status "Loading from .env file"
        set -a  # Export all variables
        source .env
        set +a  # Stop exporting
        log_message "INFO" "Environment loaded from .env"
    else
        print_warning "No .env file found, using system environment"
        log_message "WARN" "No .env file found"
    fi
    
    # Set default values
    export NODE_ENV=${NODE_ENV:-production}
    export PORT=${PORT:-10000}
    export GIST_ID=${GIST_ID:-"d394f3df4c86cf1cb0040a7ec4138bfd"}
    export GIST_FILENAME=${GIST_FILENAME:-"backend-url.txt"}
    export MAX_RETRIES=${MAX_RETRIES:-10}
    export RETRY_DELAY=${RETRY_DELAY:-5}
    
    print_status "Environment: $NODE_ENV, Port: $PORT"
    log_message "INFO" "Environment configured: NODE_ENV=$NODE_ENV, PORT=$PORT"
}

# Function to check dependencies
check_dependencies() {
    print_info "Checking system dependencies..."
    
    local deps=("node" "npm" "pm2" "ngrok" "jq" "curl")
    local missing_deps=()
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            missing_deps+=("$dep")
        fi
    done
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        print_error "Missing dependencies: ${missing_deps[*]}"
        log_message "ERROR" "Missing dependencies: ${missing_deps[*]}"
        print_info "Run: ./setup-complete-system.sh to install dependencies"
        exit 1
    fi
    
    print_status "All dependencies available"
    log_message "INFO" "All dependencies verified"
}

# Function to stop existing processes
stop_existing_processes() {
    print_info "Stopping existing processes..."
    
    # Stop PM2 processes
    if command -v pm2 &> /dev/null; then
        pm2 stop all 2>/dev/null || true
        pm2 delete all 2>/dev/null || true
        log_message "INFO" "PM2 processes stopped"
    fi
    
    # Kill ngrok processes
    pkill -f ngrok 2>/dev/null || true
    sleep 2
    
    # Kill any remaining node processes for this project
    pkill -f "server.mjs" 2>/dev/null || true
    pkill -f "connection-manager" 2>/dev/null || true
    
    log_message "INFO" "Existing processes stopped"
    print_status "Existing processes stopped"
}

# Function to install npm dependencies
install_dependencies() {
    print_info "Installing npm dependencies..."
    
    if [ -f "package.json" ]; then
        if npm install --silent; then
            print_status "npm dependencies installed"
            log_message "INFO" "npm dependencies installed successfully"
        else
            print_error "Failed to install npm dependencies"
            log_message "ERROR" "npm install failed"
            exit 1
        fi
    else
        print_warning "No package.json found"
        log_message "WARN" "No package.json found"
    fi
}

# Function to configure ngrok
configure_ngrok() {
    print_info "Configuring ngrok..."
    
    if [ -n "${NGROK_AUTH_TOKEN:-}" ]; then
        if ngrok config add-authtoken "$NGROK_AUTH_TOKEN" 2>/dev/null; then
            print_status "ngrok configured with auth token"
            log_message "INFO" "ngrok configured with auth token"
        else
            print_warning "Failed to configure ngrok auth token"
            log_message "WARN" "ngrok auth token configuration failed"
        fi
    else
        print_warning "No NGROK_AUTH_TOKEN found"
        log_message "WARN" "No NGROK_AUTH_TOKEN found"
    fi
}

# Function to start ngrok with retry logic
start_ngrok() {
    print_info "Starting ngrok tunnel..."
    
    local retry_count=0
    local max_retries=5
    
    while [ $retry_count -lt $max_retries ]; do
        # Kill any existing ngrok processes
        pkill -f ngrok 2>/dev/null || true
        sleep 2
        
        # Start ngrok
        nohup ngrok http "$PORT" > logs/ngrok.log 2>&1 &
        local ngrok_pid=$!
        
        # Wait for ngrok to start
        local wait_count=0
        while [ $wait_count -lt 30 ]; do
            if curl -s http://localhost:4040/api/tunnels > /dev/null 2>&1; then
                print_status "ngrok started successfully (PID: $ngrok_pid)"
                log_message "INFO" "ngrok started successfully (PID: $ngrok_pid)"
                return 0
            fi
            sleep 2
            ((wait_count++))
        done
        
        print_warning "ngrok failed to start (attempt $((retry_count + 1))/$max_retries)"
        log_message "WARN" "ngrok failed to start (attempt $((retry_count + 1))/$max_retries)"
        kill $ngrok_pid 2>/dev/null || true
        ((retry_count++))
        sleep 5
    done
    
    print_error "Failed to start ngrok after $max_retries attempts"
    log_message "ERROR" "Failed to start ngrok after $max_retries attempts"
    exit 1
}

# Function to get ngrok URL
get_ngrok_url() {
    print_info "Getting ngrok URL..."
    
    local retry_count=0
    local max_retries=10
    
    while [ $retry_count -lt $max_retries ]; do
        if curl -s http://localhost:4040/api/tunnels > /dev/null 2>&1; then
            local url=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url' 2>/dev/null)
            if [ "$url" != "null" ] && [ -n "$url" ]; then
                print_status "ngrok URL: $url"
                log_message "INFO" "ngrok URL obtained: $url"
                echo "$url" > .ngrok-url
                echo "$url"
                return 0
            fi
        fi
        
        print_warning "Waiting for ngrok URL (attempt $((retry_count + 1))/$max_retries)"
        sleep 3
        ((retry_count++))
    done
    
    print_error "Failed to get ngrok URL"
    log_message "ERROR" "Failed to get ngrok URL"
    exit 1
}

# Function to update GitHub Gist
update_gist() {
    local url="$1"
    print_info "Updating GitHub Gist..."
    
    if [ -z "${GITHUB_TOKEN:-}" ]; then
        print_warning "No GITHUB_TOKEN found, skipping Gist update"
        log_message "WARN" "No GITHUB_TOKEN found, skipping Gist update"
        return 1
    fi
    
    local patch_data=$(cat <<EOF
{
  "files": {
    "$GIST_FILENAME": {
      "content": "$url"
    }
  }
}
EOF
)
    
    local response
    if response=$(curl -s -X PATCH \
        -H "Authorization: token $GITHUB_TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        -H "Content-Type: application/json" \
        -d "$patch_data" \
        "https://api.github.com/gists/$GIST_ID" 2>/dev/null); then
        
        if echo "$response" | jq -e '.files' > /dev/null 2>&1; then
            print_status "Gist updated successfully"
            log_message "INFO" "GitHub Gist updated successfully with URL: $url"
            return 0
        else
            print_warning "Failed to update Gist (invalid response)"
            log_message "WARN" "Gist update failed - invalid response"
            return 1
        fi
    else
        print_warning "Failed to update Gist (network error)"
        log_message "WARN" "Gist update failed - network error"
        return 1
    fi
}

# Function to start backend with PM2
start_backend() {
    print_info "Starting backend with PM2..."
    
    if [ ! -f "ecosystem.config.cjs" ]; then
        print_error "ecosystem.config.cjs not found"
        log_message "ERROR" "ecosystem.config.cjs not found"
        exit 1
    fi
    
    if pm2 start ecosystem.config.cjs; then
        print_status "PM2 processes started"
        log_message "INFO" "PM2 processes started successfully"
        return 0
    else
        print_error "Failed to start PM2 processes"
        log_message "ERROR" "PM2 start failed"
        return 1
    fi
}

# Function to wait for backend to be ready
wait_for_backend() {
    print_info "Waiting for backend to be ready..."
    
    local retry_count=0
    local max_retries=30
    
    while [ $retry_count -lt $max_retries ]; do
        if curl -s http://localhost:"$PORT"/health > /dev/null 2>&1; then
            print_status "Backend is responding (health endpoint)"
            log_message "INFO" "Backend health check passed"
            return 0
        elif curl -s http://localhost:"$PORT"/api/ping > /dev/null 2>&1; then
            print_status "Backend is responding (ping endpoint)"
            log_message "INFO" "Backend ping check passed"
            return 0
        fi
        
        if [ $((retry_count % 5)) -eq 0 ]; then
            print_warning "Waiting for backend (attempt $((retry_count + 1))/$max_retries)"
        fi
        
        sleep 2
        ((retry_count++))
    done
    
    print_error "Backend failed to start within timeout"
    log_message "ERROR" "Backend failed to start within timeout"
    
    # Show PM2 logs for debugging
    print_info "Showing PM2 logs for debugging:"
    pm2 logs backendserver --lines 10 2>/dev/null || true
    
    return 1
}

# Function to verify system health
verify_system_health() {
    print_info "Verifying system health..."
    
    local all_healthy=true
    
    # Check ngrok
    if ! curl -s http://localhost:4040/api/tunnels > /dev/null 2>&1; then
        print_error "ngrok is not responding"
        log_message "ERROR" "ngrok health check failed"
        all_healthy=false
    else
        print_status "ngrok is healthy"
    fi
    
    # Check backend
    if ! curl -s http://localhost:"$PORT"/health > /dev/null 2>&1 && \
       ! curl -s http://localhost:"$PORT"/api/ping > /dev/null 2>&1; then
        print_error "Backend is not responding"
        log_message "ERROR" "Backend health check failed"
        all_healthy=false
    else
        print_status "Backend is healthy"
    fi
    
    # Check PM2 processes
    if ! pm2 list | grep -q "online"; then
        print_error "PM2 processes are not running"
        log_message "ERROR" "PM2 health check failed"
        all_healthy=false
    else
        print_status "PM2 processes are healthy"
    fi
    
    if [ "$all_healthy" = true ]; then
        print_success "All system components are healthy"
        log_message "INFO" "All system health checks passed"
        return 0
    else
        print_error "System health verification failed"
        log_message "ERROR" "System health verification failed"
        return 1
    fi
}

# Function to display final status
display_final_status() {
    local ngrok_url="$1"
    
    echo ""
    echo "🎉 === BULLETPROOF SYSTEM STARTED ==="
    echo ""
    
    echo "📊 PM2 Processes:"
    pm2 status 2>/dev/null || echo "PM2 not available"
    
    echo ""
    echo "🌐 Ngrok Status:"
    if pgrep -f ngrok > /dev/null; then
        echo "✅ ngrok is running"
        echo "🔗 URL: $ngrok_url"
    else
        echo "❌ ngrok is not running"
    fi
    
    echo ""
    echo "🔧 Backend Status:"
    if curl -s http://localhost:"$PORT"/health > /dev/null 2>&1; then
        echo "✅ Backend is responding on port $PORT"
        local health_response=$(curl -s http://localhost:"$PORT"/health 2>/dev/null || echo "{}")
        echo "📊 Health: $health_response"
    elif curl -s http://localhost:"$PORT"/api/ping > /dev/null 2>&1; then
        echo "✅ Backend is responding on port $PORT (ping endpoint)"
    else
        echo "❌ Backend is not responding on port $PORT"
    fi
    
    echo ""
    echo "📝 Gist Status:"
    if [ -n "${GITHUB_TOKEN:-}" ]; then
        echo "✅ Gist should be updated with: $ngrok_url"
        echo "🔗 Gist URL: https://gist.github.com/ritheshhh/$GIST_ID"
    else
        echo "⚠️  Gist update status unknown (no GitHub token)"
    fi
    
    echo ""
    echo "📊 Management Commands:"
    echo "  Status: ./status.sh"
    echo "  Stop: ./stop-system.sh"
    echo "  Logs: tail -f $LOG_FILE"
    echo "  PM2: pm2 status"
    echo "  Health: curl http://localhost:$PORT/health"
    
    if [ -n "$ngrok_url" ]; then
        echo ""
        echo "🌐 Public Access:"
        echo "  Backend: $ngrok_url"
        echo "  Health: $ngrok_url/health"
        echo "  API: $ngrok_url/api"
    fi
    
    echo ""
    print_success "Bulletproof system is now running!"
    log_message "INFO" "Bulletproof system startup completed successfully"
}

# Function to send Telegram notification
send_telegram_notification() {
    local message="$1"
    
    if [ -n "${TELEGRAM_BOT_TOKEN:-}" ] && [ -n "${TELEGRAM_CHAT_ID:-}" ]; then
        curl -s -X POST \
            "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
            -d "chat_id=$TELEGRAM_CHAT_ID" \
            -d "text=$message" \
            -d "parse_mode=HTML" > /dev/null 2>&1 || true
    fi
}

# Main execution function
main() {
    local start_time=$(date +%s)
    
    # Initialize
    ensure_directories
    check_running
    create_lock
    
    log_message "INFO" "=== Bulletproof startup initiated ==="
    print_info "Starting Bulletproof Mobile Repair Tracker System"
    print_info "Version: $SCRIPT_VERSION"
    
    # Load environment
    load_environment
    
    # Check dependencies
    check_dependencies
    
    # Stop existing processes
    stop_existing_processes
    
    # Install dependencies
    install_dependencies
    
    # Configure ngrok
    configure_ngrok
    
    # Start ngrok
    start_ngrok
    
    # Get ngrok URL
    local ngrok_url
    ngrok_url=$(get_ngrok_url)
    
    # Update Gist
    if update_gist "$ngrok_url"; then
        send_telegram_notification "✅ <b>Ngrok Started</b>\n\n🔗 <b>URL:</b> <code>$ngrok_url</code>\n📝 <b>Gist:</b> Updated"
    else
        send_telegram_notification "⚠️ <b>Ngrok Started (Gist Update Failed)</b>\n\n🔗 <b>URL:</b> <code>$ngrok_url</code>"
    fi
    
    # Start backend
    if start_backend; then
        # Wait for backend to be ready
        if wait_for_backend; then
            # Verify system health
            if verify_system_health; then
                local end_time=$(date +%s)
                local duration=$((end_time - start_time))
                
                send_telegram_notification "🎉 <b>System Fully Operational</b>\n\n🔗 <b>URL:</b> <code>$ngrok_url</code>\n⏱️ <b>Startup Time:</b> ${duration}s\n🌐 <b>Status:</b> All systems healthy"
                
                # Display final status
                display_final_status "$ngrok_url"
            else
                send_telegram_notification "⚠️ <b>System Partially Ready</b>\n\n🔗 <b>URL:</b> <code>$ngrok_url</code>\n❌ <b>Health Check:</b> Failed"
                print_error "System health verification failed"
                log_message "ERROR" "System health verification failed"
                exit 1
            fi
        else
            send_telegram_notification "❌ <b>Backend Failed to Start</b>\n\n🔗 <b>URL:</b> <code>$ngrok_url</code>\n❌ <b>Backend:</b> Not responding"
            print_error "Backend failed to start"
            log_message "ERROR" "Backend failed to start"
            exit 1
        fi
    else
        send_telegram_notification "❌ <b>Backend Start Failed</b>\n\n🔗 <b>URL:</b> <code>$ngrok_url</code>\n❌ <b>PM2:</b> Failed to start"
        print_error "Failed to start backend"
        log_message "ERROR" "Failed to start backend"
        exit 1
    fi
}

# Error handling
trap 'log_message "ERROR" "Script interrupted by signal"; exit 1' INT TERM

# Run main function
main "$@" 