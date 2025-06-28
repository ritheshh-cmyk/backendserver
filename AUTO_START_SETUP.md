# Auto-Start Setup for Ngrok Backend

This guide will help you set up automatic startup of your ngrok backend when your phone boots and when internet connection is restored.

## Prerequisites

1. **Termux:Boot** app installed from F-Droid
2. **GitHub Personal Access Token** configured
3. **Ngrok** installed and authenticated

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

### 2. `scripts/termux-boot.sh`
- **Boot startup**: Runs when phone starts
- **Continuous monitoring**: Keeps checking if ngrok is running
- **Auto-restart**: Restarts ngrok if it stops

### 3. `scripts/network-monitor.sh`
- **Network monitoring**: Checks internet every 30 seconds
- **Smart restart**: Only restarts when internet is available
- **Logging**: Keeps logs of all activities

## Usage

### Manual Start
```bash
# Start the enhanced script manually
./update-ngrok-gist-v2.sh
```

### Check Status
```bash
# Check if ngrok is running
curl http://127.0.0.1:4040/api/tunnels

# Check logs
tail -f network-monitor.log
tail -f backend/backend.log
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

## Troubleshooting

### Script not starting on boot
1. Check Termux:Boot permissions
2. Verify script is in `~/.termux/boot/`
3. Check script permissions (`chmod +x`)
4. Check logs: `cat ~/.termux/boot/termux-boot.sh.log`

### Ngrok not connecting
1. Check internet connection
2. Verify ngrok authentication
3. Check if port 10000 is available
4. Restart ngrok manually

### GitHub token issues
1. Verify token is set: `echo $GITHUB_TOKEN`
2. Check token permissions (needs gist access)
3. Test token manually

## Configuration

### Customize Check Intervals
Edit the scripts to change timing:
- `RESTART_DELAY=60` (seconds between checks)
- `CHECK_INTERVAL=30` (network check frequency)

### Change Port
Edit `PORT=10000` in the scripts to use a different port.

### Custom Logging
Scripts create log files:
- `network-monitor.log` - Network monitoring logs
- `backend/backend.log` - Backend server logs

## Security Notes

1. **GitHub Token**: Keep your token secure, don't share it
2. **Ngrok Auth**: Use ngrok authentication for better security
3. **Firewall**: Consider firewall rules for additional security
4. **Logs**: Regularly check logs for any suspicious activity

## Support

If you encounter issues:
1. Check the logs first
2. Verify all prerequisites are installed
3. Test scripts manually before auto-start
4. Check Termux:Boot app permissions 