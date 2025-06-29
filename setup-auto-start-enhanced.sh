#!/bin/bash

# 🚀 Enhanced Auto-Start Setup for Mobile Repair Backend
# This script sets up automatic startup on device reboot and network reconnection

set -e

echo "🔧 Setting up Auto-Start for Mobile Repair Backend..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root (use sudo)"
    exit 1
fi

# Get current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

print_info "Project directory: $PROJECT_DIR"

# Create necessary directories
mkdir -p /etc/systemd/system
mkdir -p /var/log/mobile-repair
mkdir -p /root/.config/pm2

# 1. Create systemd service for backend
print_info "Creating systemd service for backend..."

cat > /etc/systemd/system/mobile-repair-backend.service << 'EOF'
[Unit]
Description=Mobile Repair Backend Service
After=network.target
Wants=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/backendserver
Environment=NODE_ENV=production
Environment=PORT=10000
ExecStart=/usr/bin/node server.mjs
ExecReload=/bin/kill -HUP $MAINPID
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=mobile-repair-backend

# Restart on network changes
RestartPreventExitStatus=0
RestartForceExitStatus=143

[Install]
WantedBy=multi-user.target
EOF

# 2. Create systemd service for ngrok
print_info "Creating systemd service for ngrok..."

cat > /etc/systemd/system/mobile-repair-ngrok.service << 'EOF'
[Unit]
Description=Mobile Repair ngrok Tunnel
After=network.target mobile-repair-backend.service
Wants=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/backendserver
ExecStart=/usr/local/bin/ngrok http 10000 --log=stdout
ExecReload=/bin/kill -HUP $MAINPID
Restart=always
RestartSec=30
StandardOutput=journal
StandardError=journal
SyslogIdentifier=mobile-repair-ngrok

# Restart on network changes
RestartPreventExitStatus=0
RestartForceExitStatus=143

[Install]
WantedBy=multi-user.target
EOF

# 3. Create network monitoring script
print_info "Creating network monitoring script..."

cat > /root/backendserver/monitor-network.sh << 'EOF'
#!/bin/bash

# Network monitoring script for auto-restart on network changes

LOG_FILE="/var/log/mobile-repair/network-monitor.log"
LAST_STATUS_FILE="/tmp/network-status"

log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

check_network() {
    # Check if we can reach a reliable host
    if ping -c 1 -W 5 8.8.8.8 > /dev/null 2>&1; then
        echo "online"
    else
        echo "offline"
    fi
}

# Create log file if it doesn't exist
touch "$LOG_FILE"

# Check current network status
CURRENT_STATUS=$(check_network)

# Read last known status
if [ -f "$LAST_STATUS_FILE" ]; then
    LAST_STATUS=$(cat "$LAST_STATUS_FILE")
else
    LAST_STATUS="unknown"
fi

# If status changed, log it
if [ "$CURRENT_STATUS" != "$LAST_STATUS" ]; then
    log_message "Network status changed from $LAST_STATUS to $CURRENT_STATUS"
    
    if [ "$CURRENT_STATUS" = "online" ]; then
        log_message "Network is back online, restarting services..."
        
        # Restart services
        systemctl restart mobile-repair-backend.service
        sleep 5
        systemctl restart mobile-repair-ngrok.service
        
        log_message "Services restarted successfully"
    else
        log_message "Network went offline"
    fi
    
    # Update status file
    echo "$CURRENT_STATUS" > "$LAST_STATUS_FILE"
fi

log_message "Network check completed: $CURRENT_STATUS"
EOF

chmod +x /root/backendserver/monitor-network.sh

# 4. Create systemd timer for network monitoring
print_info "Creating network monitoring timer..."

cat > /etc/systemd/system/mobile-repair-network-monitor.service << 'EOF'
[Unit]
Description=Mobile Repair Network Monitor
After=network.target

[Service]
Type=oneshot
ExecStart=/root/backendserver/monitor-network.sh
User=root

[Install]
WantedBy=multi-user.target
EOF

cat > /etc/systemd/system/mobile-repair-network-monitor.timer << 'EOF'
[Unit]
Description=Run network monitor every 30 seconds
Requires=mobile-repair-network-monitor.service

[Timer]
Unit=mobile-repair-network-monitor.service
OnBootSec=30
OnUnitActiveSec=30
AccuracySec=5

[Install]
WantedBy=timers.target
EOF

# 5. Create comprehensive startup script
print_info "Creating comprehensive startup script..."

cat > /root/backendserver/auto-start-complete.sh << 'EOF'
#!/bin/bash

# 🚀 Complete Auto-Start Script for Mobile Repair Backend
# This script handles everything needed for startup

set -e

LOG_FILE="/var/log/mobile-repair/auto-start.log"
PROJECT_DIR="/root/backendserver"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
    log_message "SUCCESS: $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    log_message "WARNING: $1"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    log_message "ERROR: $1"
}

# Create log file
mkdir -p /var/log/mobile-repair
touch "$LOG_FILE"

log_message "=== Starting Auto-Start Process ==="

# 1. Wait for network
log_message "Waiting for network connection..."
for i in {1..30}; do
    if ping -c 1 -W 5 8.8.8.8 > /dev/null 2>&1; then
        print_status "Network is available"
        break
    fi
    if [ $i -eq 30 ]; then
        print_warning "Network not available after 30 attempts, continuing anyway"
    fi
    sleep 2
done

# 2. Navigate to project directory
cd "$PROJECT_DIR" || {
    print_error "Cannot navigate to project directory"
    exit 1
}

# 3. Install dependencies if needed
if [ ! -d "node_modules" ]; then
    log_message "Installing dependencies..."
    npm install || print_warning "Failed to install dependencies"
fi

# 4. Stop existing processes
log_message "Stopping existing processes..."
pkill -f "ngrok" || true
pkill -f "node.*server.mjs" || true
pm2 delete all || true

# 5. Start backend
log_message "Starting backend server..."
nohup node server.mjs > /var/log/mobile-repair/backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Check if backend is running
if kill -0 $BACKEND_PID 2>/dev/null; then
    print_status "Backend started successfully (PID: $BACKEND_PID)"
else
    print_error "Failed to start backend"
    exit 1
fi

# 6. Wait for backend to be ready
log_message "Waiting for backend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:10000/health > /dev/null 2>&1; then
        print_status "Backend is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        print_warning "Backend not ready after 30 attempts, continuing anyway"
    fi
    sleep 2
done

# 7. Start ngrok
log_message "Starting ngrok tunnel..."
nohup ngrok http 10000 --log=stdout > /var/log/mobile-repair/ngrok.log 2>&1 &
NGROK_PID=$!

# Wait for ngrok to start
sleep 10

# Check if ngrok is running
if kill -0 $NGROK_PID 2>/dev/null; then
    print_status "ngrok started successfully (PID: $NGROK_PID)"
else
    print_error "Failed to start ngrok"
    exit 1
fi

# 8. Update Gist with ngrok URL
log_message "Updating Gist with ngrok URL..."
sleep 5

# Get ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*"' | cut -d'"' -f4 | head -1)

if [ -n "$NGROK_URL" ]; then
    print_status "ngrok URL: $NGROK_URL"
    
    # Update Gist (you'll need to set up your Gist ID and token)
    if [ -f "update-ngrok-gist-v2.sh" ]; then
        bash update-ngrok-gist-v2.sh "$NGROK_URL" || print_warning "Failed to update Gist"
    fi
else
    print_warning "Could not get ngrok URL"
fi

# 9. Start PM2 for process management
log_message "Starting PM2..."
pm2 start server.mjs --name "mobile-repair-backend" || print_warning "Failed to start PM2"

# 10. Save PM2 configuration
pm2 save || print_warning "Failed to save PM2 configuration"

# 11. Final status check
log_message "Performing final status check..."

# Check backend
if curl -s http://localhost:10000/health > /dev/null 2>&1; then
    print_status "Backend is healthy"
else
    print_warning "Backend health check failed"
fi

# Check ngrok
if curl -s http://localhost:4040/api/tunnels > /dev/null 2>&1; then
    print_status "ngrok is running"
else
    print_warning "ngrok status check failed"
fi

# Show running processes
log_message "Running processes:"
ps aux | grep -E "(node|ngrok)" | grep -v grep || true

log_message "=== Auto-Start Process Completed ==="

# Keep script running to maintain processes
while true; do
    sleep 60
    
    # Check if processes are still running
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        log_message "Backend process died, restarting..."
        cd "$PROJECT_DIR"
        nohup node server.mjs > /var/log/mobile-repair/backend.log 2>&1 &
        BACKEND_PID=$!
    fi
    
    if ! kill -0 $NGROK_PID 2>/dev/null; then
        log_message "ngrok process died, restarting..."
        nohup ngrok http 10000 --log=stdout > /var/log/mobile-repair/ngrok.log 2>&1 &
        NGROK_PID=$!
    fi
done
EOF

chmod +x /root/backendserver/auto-start-complete.sh

# 6. Create systemd service for the complete startup script
print_info "Creating complete startup service..."

cat > /etc/systemd/system/mobile-repair-complete.service << 'EOF'
[Unit]
Description=Mobile Repair Complete Auto-Start Service
After=network.target
Wants=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/backendserver
ExecStart=/root/backendserver/auto-start-complete.sh
Restart=always
RestartSec=30
StandardOutput=journal
StandardError=journal
SyslogIdentifier=mobile-repair-complete

# Restart on network changes
RestartPreventExitStatus=0
RestartForceExitStatus=143

[Install]
WantedBy=multi-user.target
EOF

# 7. Enable all services
print_info "Enabling services..."

systemctl daemon-reload

# Enable services
systemctl enable mobile-repair-backend.service
systemctl enable mobile-repair-ngrok.service
systemctl enable mobile-repair-network-monitor.timer
systemctl enable mobile-repair-complete.service

print_status "All services enabled"

# 8. Create status check script
print_info "Creating status check script..."

cat > /root/backendserver/check-status.sh << 'EOF'
#!/bin/bash

# Status check script for mobile repair backend

echo "🔍 Mobile Repair Backend Status Check"
echo "======================================"

# Check systemd services
echo "📋 Systemd Services:"
systemctl is-active mobile-repair-backend.service && echo "✅ Backend Service: ACTIVE" || echo "❌ Backend Service: INACTIVE"
systemctl is-active mobile-repair-ngrok.service && echo "✅ ngrok Service: ACTIVE" || echo "❌ ngrok Service: INACTIVE"
systemctl is-active mobile-repair-complete.service && echo "✅ Complete Service: ACTIVE" || echo "❌ Complete Service: INACTIVE"

echo ""
echo "🌐 Network Status:"
if ping -c 1 -W 5 8.8.8.8 > /dev/null 2>&1; then
    echo "✅ Network: ONLINE"
else
    echo "❌ Network: OFFLINE"
fi

echo ""
echo "🔧 Backend Health:"
if curl -s http://localhost:10000/health > /dev/null 2>&1; then
    echo "✅ Backend: HEALTHY"
    echo "📍 URL: http://localhost:10000"
else
    echo "❌ Backend: UNHEALTHY"
fi

echo ""
echo "🚇 ngrok Tunnel:"
if curl -s http://localhost:4040/api/tunnels > /dev/null 2>&1; then
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*"' | cut -d'"' -f4 | head -1)
    if [ -n "$NGROK_URL" ]; then
        echo "✅ ngrok: RUNNING"
        echo "📍 Public URL: $NGROK_URL"
    else
        echo "⚠️  ngrok: RUNNING (no URL found)"
    fi
else
    echo "❌ ngrok: NOT RUNNING"
fi

echo ""
echo "📊 Process Status:"
echo "Backend PID: $(pgrep -f 'node.*server.mjs' || echo 'Not running')"
echo "ngrok PID: $(pgrep -f 'ngrok' || echo 'Not running')"

echo ""
echo "📝 Recent Logs:"
echo "Backend Logs (last 5 lines):"
tail -5 /var/log/mobile-repair/backend.log 2>/dev/null || echo "No backend logs found"

echo ""
echo "ngrok Logs (last 5 lines):"
tail -5 /var/log/mobile-repair/ngrok.log 2>/dev/null || echo "No ngrok logs found"

echo ""
echo "Network Monitor Logs (last 5 lines):"
tail -5 /var/log/mobile-repair/network-monitor.log 2>/dev/null || echo "No network monitor logs found"
EOF

chmod +x /root/backendserver/check-status.sh

# 9. Create quick restart script
print_info "Creating quick restart script..."

cat > /root/backendserver/quick-restart.sh << 'EOF'
#!/bin/bash

# Quick restart script for mobile repair backend

echo "🔄 Quick Restart of Mobile Repair Backend..."

# Stop services
systemctl stop mobile-repair-backend.service
systemctl stop mobile-repair-ngrok.service
systemctl stop mobile-repair-complete.service

# Kill any remaining processes
pkill -f "ngrok" || true
pkill -f "node.*server.mjs" || true
pm2 delete all || true

# Wait a moment
sleep 3

# Start services
systemctl start mobile-repair-backend.service
sleep 5
systemctl start mobile-repair-ngrok.service
sleep 5
systemctl start mobile-repair-complete.service

echo "✅ Restart completed!"
echo "Check status with: ./check-status.sh"
EOF

chmod +x /root/backendserver/quick-restart.sh

# 10. Final setup
print_info "Finalizing setup..."

# Start services now
systemctl start mobile-repair-backend.service
sleep 5
systemctl start mobile-repair-ngrok.service
sleep 5
systemctl start mobile-repair-network-monitor.timer
systemctl start mobile-repair-complete.service

print_status "Auto-start setup completed successfully!"

echo ""
echo "🎉 Auto-Start Setup Complete!"
echo "=============================="
echo ""
echo "✅ Services will auto-start on device reboot"
echo "✅ Services will auto-restart on network changes"
echo "✅ Network monitoring every 30 seconds"
echo "✅ Complete process management"
echo ""
echo "📋 Available Commands:"
echo "  ./check-status.sh    - Check all services status"
echo "  ./quick-restart.sh   - Quick restart all services"
echo "  systemctl status mobile-repair-backend.service"
echo "  systemctl status mobile-repair-ngrok.service"
echo ""
echo "📝 Log Files:"
echo "  /var/log/mobile-repair/backend.log"
echo "  /var/log/mobile-repair/ngrok.log"
echo "  /var/log/mobile-repair/network-monitor.log"
echo "  /var/log/mobile-repair/auto-start.log"
echo ""
echo "🔄 To disable auto-start:"
echo "  systemctl disable mobile-repair-backend.service"
echo "  systemctl disable mobile-repair-ngrok.service"
echo "  systemctl disable mobile-repair-network-monitor.timer"
echo "  systemctl disable mobile-repair-complete.service"
echo ""
print_status "Your mobile repair backend will now auto-start on every reboot!" 