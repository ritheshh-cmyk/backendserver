# Auto-Start Setup for Ngrok Backend

This guide will help you set up automatic startup of your ngrok backend when your phone boots and when internet connection is restored.

## 🆕 **New Enhanced Features**

- ✅ **Timestamp Logging**: Every restart is logged with timestamps
- ✅ **Smart URL Detection**: Only restarts backend when ngrok URL changes
- ✅ **Local URL Storage**: Saves ngrok URL to `.ngrok-url` file
- ✅ **Command-Line Options**: `--once`, `--port`, `--help` flags
- ✅ **Environment Configuration**: Use `.env` file for settings
- ✅ **Timestamped Logs**: Backend logs with timestamps in `backend/logs/`
- ✅ **Service Manager**: Easy management with `scripts/ngrok-manager.sh`

## Prerequisites

1. **Termux:Boot** app installed from F-Droid
2. **GitHub Personal Access Token** configured
3. **Ngrok** installed and authenticated

## Quick Start

### 1. Install Termux:Boot
```bash
# Install from F-Droid (not Play Store)
# Search for "Termux:Boot" and install
```

### 2. Configure Environment
```bash
# Copy environment template
cp env-example.txt .env

# Edit with your settings
nano .env
```

### 3. Use the Service Manager (Recommended)
```bash
# Make manager executable
chmod +x scripts/ngrok-manager.sh

# Start the service
./scripts/ngrok-manager.sh start

# Check status
./scripts/ngrok-manager.sh status

# View logs
./scripts/ngrok-manager.sh logs
```

## Setup Steps

### 1. Install Termux:Boot
```bash
# Install from F-Droid (not Play Store)
# Search for "Termux:Boot" and install
```

### 2. Configure GitHub Token
```bash
# In Termux, set your GitHub token
export GITHUB_TOKEN="your_github_token_here"

# Make it permanent by adding to ~/.bashrc
echo 'export GITHUB_TOKEN="your_github_token_here"' >> ~/.bashrc
source ~/.bashrc
```

### 3. Set Up Auto-Start Scripts

#### Option A: Simple Auto-Start (Recommended)
```bash
# Copy the boot script to Termux:Boot directory
cp scripts/termux-boot.sh ~/.termux/boot/

# Make it executable
chmod +x ~/.termux/boot/termux-boot.sh

# Edit the script to set your GitHub token
nano ~/.termux/boot/termux-boot.sh
```

#### Option B: Network Monitor (Advanced)
```bash
# Copy the network monitor script
cp scripts/network-monitor.sh ~/.termux/boot/

# Make it executable
chmod +x ~/.termux/boot/network-monitor.sh

# Edit the script to set your GitHub token
nano ~/.termux/boot/network-monitor.sh
```

### 4. Grant Permissions
- Open **Termux:Boot** app
- Grant **Autostart** permission
- Grant **Display over other apps** permission (if needed)

### 5. Test Auto-Start
```bash
# Reboot your phone or restart Termux
# Check if scripts are running
ps aux | grep ngrok
ps aux | grep network-monitor
```

## Scripts Overview

### 1. `update-ngrok-gist-v2.sh` (Enhanced)
- **Auto-restart**: Automatically restarts every 60 seconds
- **Network detection**: Checks internet connectivity
- **Error handling**: Better error recovery
- **CORS updating**: Automatically updates backend CORS
- **Timestamp logging**: Every action is timestamped
- **URL change detection**: Only restarts when URL changes
- **Command-line options**: `--once`, `--port`, `--help`
- **Environment config**: Loads settings from `.env` file

### 2. `scripts/ngrok-manager.sh` (NEW)
- **Service management**: Start, stop, restart, status
- **Log viewing**: View recent logs with colored output
- **Status monitoring**: Check service and tunnel status
- **Easy setup**: Creates `.env` from template if missing

### 3. `scripts/termux-boot.sh`
- **Boot startup**: Runs when phone starts
- **Continuous monitoring**: Keeps checking if ngrok is running
- **Auto-restart**: Restarts ngrok if it stops

### 4. `scripts/network-monitor.sh`
- **Network monitoring**: Checks internet every 30 seconds
- **Smart restart**: Only restarts when internet is available
- **Logging**: Keeps logs of all activities

## Usage

### Using the Service Manager (Recommended)
```bash
# Start the service
./scripts/ngrok-manager.sh start

# Check status
./scripts/ngrok-manager.sh status

# View logs
./scripts/ngrok-manager.sh logs

# Stop service
./scripts/ngrok-manager.sh stop

# Restart service
./scripts/ngrok-manager.sh restart

# Run once (no auto-restart)
./scripts/ngrok-manager.sh once
```

### Manual Usage
```bash
# Start the enhanced script manually
./update-ngrok-gist-v2.sh

# Run once (no auto-restart)
./update-ngrok-gist-v2.sh --once

# Use custom port
./update-ngrok-gist-v2.sh --port 8080

# Show help
./update-ngrok-gist-v2.sh --help
```

### Check Status
```bash
# Check if ngrok is running
curl http://127.0.0.1:4040/api/tunnels

# Check current URL
cat .ngrok-url

# Check logs
tail -f backend/logs/backend_*.log
tail -f ngrok-service.log
```

### Stop Auto-Start
```bash
# Remove boot scripts
rm ~/.termux/boot/termux-boot.sh
rm ~/.termux/boot/network-monitor.sh

# Kill running processes
pkill -f ngrok
pkill -f network-monitor
```

## Configuration

### Environment Variables (.env file)
```bash
# GitHub Personal Access Token (required)
GITHUB_TOKEN=your_github_token_here

# Ngrok Configuration
PORT=10000
GIST_ID=d394f3df4c86cf1cb0040a7ec4138bfd
GIST_FILENAME=backend-url.txt

# Backend Configuration
BACKEND_FILE=backend/server/index.ts

# Auto-restart Settings
AUTO_RESTART=true
RESTART_DELAY=60
```

### Command-Line Options
```bash
--once      Run once and exit (no auto-restart)
--port      Specify custom port (default: 10000)
--help      Show help message
```

### Customize Check Intervals
Edit the scripts to change timing:
- `RESTART_DELAY=60` (seconds between checks)
- `CHECK_INTERVAL=30` (network check frequency)

### Change Port
Edit `PORT=10000` in the scripts or use `--port` flag.

### Custom Logging
Scripts create timestamped log files:
- `backend/logs/backend_YYYY-MM-DD_HH-MM-SS.log` - Backend server logs
- `ngrok-service.log` - Service management logs
- `network-monitor.log` - Network monitoring logs

## Troubleshooting

### Script not starting on boot
1. Check Termux:Boot permissions
2. Verify script is in `~/.termux/boot/`
3. Check script permissions (`chmod +x`)
4. Check logs: `cat ~/.termux/boot/termux-boot.sh.log`

### Ngrok not connecting
1. Check internet connection
2. Verify ngrok authentication
3. Check if port is available
4. Restart ngrok manually

### GitHub token issues
1. Verify token is set: `echo $GITHUB_TOKEN`
2. Check token permissions (needs gist access)
3. Test token manually

### Service Manager Issues
1. Check if `.env` file exists and has correct token
2. Verify script permissions: `chmod +x scripts/ngrok-manager.sh`
3. Check service status: `./scripts/ngrok-manager.sh status`

## Security Notes

1. **GitHub Token**: Keep your token secure, don't share it
2. **Ngrok Auth**: Use ngrok authentication for better security
3. **Firewall**: Consider firewall rules for additional security
4. **Logs**: Regularly check logs for any suspicious activity
5. **Environment File**: Keep `.env` file secure and don't commit it

## Advanced Features

### URL Change Detection
The script now only restarts the backend when the ngrok URL actually changes, saving resources and avoiding unnecessary restarts.

### Timestamped Logging
Every action is logged with timestamps, making it easy to track when issues occurred.

### Local URL Storage
The current ngrok URL is saved to `.ngrok-url` file for other scripts to use.

### Service Management
Use the service manager for easy start/stop/restart operations with colored output and status monitoring.

## Support

If you encounter issues:
1. Check the logs first: `./scripts/ngrok-manager.sh logs`
2. Verify all prerequisites are installed
3. Test scripts manually before auto-start
4. Check Termux:Boot app permissions
5. Use the service manager for easier troubleshooting 