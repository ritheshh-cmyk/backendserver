#!/bin/bash

# === BULLETPROOF SYSTEM STATUS ===
# Shows comprehensive status of all system components

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

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

# Load environment
if [ -f ".env" ]; then
    set -a
    source .env
    set +a
fi

export PORT=${PORT:-10000}
export GIST_ID=${GIST_ID:-"d394f3df4c86cf1cb0040a7ec4138bfd"}

# Function to check PM2 status
check_pm2() {
    echo "📊 === PM2 PROCESSES ==="
    
    if command -v pm2 &> /dev/null; then
        if pm2 list | grep -q "online"; then
            print_success "PM2 processes are running"
            pm2 status
        else
            print_error "No PM2 processes running"
        fi
    else
        print_warning "PM2 not installed"
    fi
    echo ""
}

# Function to check ngrok status
check_ngrok() {
    echo "🌐 === NGROK STATUS ==="
    
    if pgrep -f ngrok > /dev/null; then
        print_success "ngrok is running"
        
        if curl -s http://localhost:4040/api/tunnels > /dev/null 2>&1; then
            local url=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url' 2>/dev/null)
            if [ "$url" != "null" ] && [ -n "$url" ]; then
                echo "🔗 URL: $url"
                
                # Test if URL is accessible
                if curl -s "$url/health" > /dev/null 2>&1 || curl -s "$url/api/ping" > /dev/null 2>&1; then
                    print_status "URL is accessible"
                else
                    print_warning "URL may not be accessible"
                fi
            else
                print_warning "Could not get ngrok URL"
            fi
        else
            print_warning "ngrok API not responding"
        fi
    else
        print_error "ngrok is not running"
    fi
    echo ""
}

# Function to check backend status
check_backend() {
    echo "🔧 === BACKEND STATUS ==="
    
    if curl -s http://localhost:"$PORT"/health > /dev/null 2>&1; then
        print_success "Backend is responding (health endpoint)"
        local health_response=$(curl -s http://localhost:"$PORT"/health 2>/dev/null || echo "{}")
        echo "📊 Health: $health_response"
    elif curl -s http://localhost:"$PORT"/api/ping > /dev/null 2>&1; then
        print_success "Backend is responding (ping endpoint)"
    else
        print_error "Backend is not responding on port $PORT"
        
        # Check if port is in use
        if netstat -tuln 2>/dev/null | grep -q ":$PORT "; then
            print_warning "Port $PORT is in use but not responding"
        else
            print_warning "Port $PORT is not in use"
        fi
    fi
    echo ""
}

# Function to check Gist status
check_gist() {
    echo "📝 === GIST STATUS ==="
    
    if [ -n "${GITHUB_TOKEN:-}" ]; then
        local gist_url="https://gist.github.com/ritheshhh/$GIST_ID"
        echo "🔗 Gist URL: $gist_url"
        
        # Try to fetch current Gist content
        if command -v curl &> /dev/null && command -v jq &> /dev/null; then
            local gist_content=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
                "https://api.github.com/gists/$GIST_ID" 2>/dev/null | \
                jq -r '.files["backend-url.txt"].content' 2>/dev/null)
            
            if [ "$gist_content" != "null" ] && [ -n "$gist_content" ]; then
                echo "📄 Current Gist content: $gist_content"
                
                # Check if it matches current ngrok URL
                if [ -f ".ngrok-url" ]; then
                    local current_url=$(cat .ngrok-url 2>/dev/null)
                    if [ "$gist_content" = "$current_url" ]; then
                        print_status "Gist is up to date"
                    else
                        print_warning "Gist may be outdated"
                    fi
                fi
            else
                print_warning "Could not fetch Gist content"
            fi
        else
            print_warning "curl or jq not available for Gist check"
        fi
    else
        print_warning "No GITHUB_TOKEN found"
    fi
    echo ""
}

# Function to check system resources
check_resources() {
    echo "💻 === SYSTEM RESOURCES ==="
    
    # CPU usage
    if command -v top &> /dev/null; then
        local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
        echo "🖥️  CPU Usage: ${cpu_usage}%"
    fi
    
    # Memory usage
    if command -v free &> /dev/null; then
        local mem_info=$(free -h | grep Mem)
        echo "🧠 Memory: $mem_info"
    fi
    
    # Disk usage
    if command -v df &> /dev/null; then
        local disk_usage=$(df -h . | tail -1 | awk '{print $5}')
        echo "💾 Disk Usage: $disk_usage"
    fi
    
    # Network connections
    if command -v netstat &> /dev/null; then
        local connections=$(netstat -an | grep ESTABLISHED | wc -l)
        echo "🌐 Active Connections: $connections"
    fi
    
    echo ""
}

# Function to check logs
check_logs() {
    echo "📋 === RECENT LOGS ==="
    
    if [ -f "logs/bulletproof.log" ]; then
        echo "📄 Bulletproof logs (last 10 lines):"
        tail -10 logs/bulletproof.log 2>/dev/null || echo "No logs available"
    else
        print_warning "No bulletproof logs found"
    fi
    
    if [ -f "logs/ngrok.log" ]; then
        echo ""
        echo "📄 Ngrok logs (last 5 lines):"
        tail -5 logs/ngrok.log 2>/dev/null || echo "No ngrok logs available"
    fi
    
    echo ""
}

# Function to show management commands
show_commands() {
    echo "🛠️  === MANAGEMENT COMMANDS ==="
    echo "  Start:   ./bulletproof-start.sh"
    echo "  Stop:    ./stop-system.sh"
    echo "  Status:  ./status.sh"
    echo "  Logs:    tail -f logs/bulletproof.log"
    echo "  PM2:     pm2 status"
    echo "  Health:  curl http://localhost:$PORT/health"
    echo "  Ngrok:   curl http://localhost:4040/api/tunnels"
    echo ""
}

# Main function
main() {
    echo "📊 === BULLETPROOF SYSTEM STATUS ==="
    echo "🕐 $(date)"
    echo ""
    
    check_pm2
    check_ngrok
    check_backend
    check_gist
    check_resources
    check_logs
    show_commands
    
    # Overall status
    echo "🎯 === OVERALL STATUS ==="
    
    local all_healthy=true
    
    # Check if PM2 is running
    if ! command -v pm2 &> /dev/null || ! pm2 list | grep -q "online"; then
        all_healthy=false
    fi
    
    # Check if ngrok is running
    if ! pgrep -f ngrok > /dev/null; then
        all_healthy=false
    fi
    
    # Check if backend is responding
    if ! curl -s http://localhost:"$PORT"/health > /dev/null 2>&1 && \
       ! curl -s http://localhost:"$PORT"/api/ping > /dev/null 2>&1; then
        all_healthy=false
    fi
    
    if [ "$all_healthy" = true ]; then
        print_success "System is fully operational"
    else
        print_warning "System has issues - check details above"
    fi
    
    echo ""
}

main "$@" 