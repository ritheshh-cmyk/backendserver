#!/bin/bash

# === Ngrok Service Manager ===
# A utility script to manage the ngrok auto-start service

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
NGROK_SCRIPT="$PROJECT_DIR/update-ngrok-gist-v2.sh"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Function to check if ngrok service is running
is_ngrok_running() {
    if pgrep -f "update-ngrok-gist-v2.sh" > /dev/null; then
        return 0
    else
        return 1
    fi
}

# Function to check if ngrok tunnel is active
is_ngrok_tunnel_active() {
    if curl -s http://127.0.0.1:4040/api/tunnels > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to get current ngrok URL
get_ngrok_url() {
    if [ -f "$PROJECT_DIR/.ngrok-url" ]; then
        cat "$PROJECT_DIR/.ngrok-url"
    else
        echo "No URL found"
    fi
}

# Function to show status
show_status() {
    print_info "=== Ngrok Service Status ==="
    
    if is_ngrok_running; then
        print_status "Service: RUNNING"
    else
        print_error "Service: STOPPED"
    fi
    
    if is_ngrok_tunnel_active; then
        print_status "Tunnel: ACTIVE"
        print_info "URL: $(get_ngrok_url)"
    else
        print_error "Tunnel: INACTIVE"
    fi
    
    # Show recent logs
    if [ -d "$PROJECT_DIR/backend/logs" ]; then
        LATEST_LOG=$(ls -t "$PROJECT_DIR/backend/logs"/backend_*.log 2>/dev/null | head -1)
        if [ -n "$LATEST_LOG" ]; then
            print_info "Latest log: $(basename "$LATEST_LOG")"
        fi
    fi
}

# Function to start service
start_service() {
    print_info "Starting ngrok service..."
    
    if is_ngrok_running; then
        print_warning "Service is already running"
        return 1
    fi
    
    cd "$PROJECT_DIR" || exit 1
    
    # Check if .env exists
    if [ ! -f ".env" ]; then
        print_warning "No .env file found. Creating from template..."
        if [ -f "env-example.txt" ]; then
            cp env-example.txt .env
            print_error "Please edit .env file and set your GITHUB_TOKEN"
            return 1
        fi
    fi
    
    # Start the service
    nohup "$NGROK_SCRIPT" > ngrok-service.log 2>&1 &
    sleep 2
    
    if is_ngrok_running; then
        print_status "Service started successfully"
        show_status
    else
        print_error "Failed to start service"
        return 1
    fi
}

# Function to stop service
stop_service() {
    print_info "Stopping ngrok service..."
    
    if ! is_ngrok_running; then
        print_warning "Service is not running"
        return 1
    fi
    
    pkill -f "update-ngrok-gist-v2.sh"
    pkill -f "ngrok"
    
    sleep 2
    
    if ! is_ngrok_running; then
        print_status "Service stopped successfully"
    else
        print_error "Failed to stop service"
        return 1
    fi
}

# Function to restart service
restart_service() {
    print_info "Restarting ngrok service..."
    stop_service
    sleep 3
    start_service
}

# Function to show logs
show_logs() {
    print_info "=== Recent Service Logs ==="
    if [ -f "$PROJECT_DIR/ngrok-service.log" ]; then
        tail -20 "$PROJECT_DIR/ngrok-service.log"
    else
        print_warning "No service log found"
    fi
    
    print_info "=== Recent Backend Logs ==="
    if [ -d "$PROJECT_DIR/backend/logs" ]; then
        LATEST_LOG=$(ls -t "$PROJECT_DIR/backend/logs"/backend_*.log 2>/dev/null | head -1)
        if [ -n "$LATEST_LOG" ]; then
            tail -10 "$LATEST_LOG"
        else
            print_warning "No backend logs found"
        fi
    fi
}

# Function to run once
run_once() {
    print_info "Running ngrok service once..."
    cd "$PROJECT_DIR" || exit 1
    "$NGROK_SCRIPT" --once
}

# Function to show help
show_help() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start     Start the ngrok auto-start service"
    echo "  stop      Stop the ngrok service"
    echo "  restart   Restart the ngrok service"
    echo "  status    Show current service status"
    echo "  logs      Show recent logs"
    echo "  once      Run the service once (no auto-restart)"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start"
    echo "  $0 status"
    echo "  $0 logs"
}

# Main command parsing
case "${1:-help}" in
    start)
        start_service
        ;;
    stop)
        stop_service
        ;;
    restart)
        restart_service
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    once)
        run_once
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac 