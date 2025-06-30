# 🚀 Mobile Repair Tracker - Fixed System

## 🎯 What's Fixed

This system has been completely overhauled to fix all connection issues and ensure reliable operation:

### ✅ **Fixed Issues:**
1. **Startup Sequence** - ngrok starts first, updates Gist, then backend starts
2. **Environment Variables** - Proper loading and validation
3. **Gist Updates** - Automatic updates with real ngrok URLs
4. **Error Handling** - Comprehensive error checking and recovery
5. **Dependency Management** - Automatic installation and verification
6. **Logging** - Detailed logging for troubleshooting
7. **Monitoring** - Health checks and automatic restarts

### 🔧 **New Features:**
- **Smart Startup** - Proper sequence with dependency checking
- **Auto-Recovery** - Automatic restart on failures
- **Environment Templates** - Easy configuration
- **Status Monitoring** - Real-time system status
- **Comprehensive Logging** - Detailed logs for debugging

## 📋 Prerequisites

### **Required Tokens:**
1. **GitHub Token** - For Gist updates
   - Go to: https://github.com/settings/tokens
   - Create new token with `gist` permission
   - Copy the token

2. **Ngrok Auth Token** - For ngrok functionality
   - Go to: https://dashboard.ngrok.com/get-started/your-authtoken
   - Copy your authtoken

### **Optional Tokens:**
3. **Telegram Bot Token** - For notifications
   - Message @BotFather on Telegram
   - Create new bot and get token

4. **Telegram Chat ID** - For notifications
   - Message @userinfobot on Telegram
   - Copy your chat ID

## 🚀 Quick Start

### **Step 1: Fresh Installation**
```bash
# Clone or download the project
cd MobileRepairTracker-1

# Run the complete setup
chmod +x setup-complete-system.sh
./setup-complete-system.sh
```

### **Step 2: Configure Environment**
```bash
# Edit the .env file with your tokens
nano .env

# Add your actual tokens:
GITHUB_TOKEN=your_actual_github_token
NGROK_AUTH_TOKEN=your_actual_ngrok_token
TELEGRAM_BOT_TOKEN=your_telegram_bot_token  # optional
TELEGRAM_CHAT_ID=your_telegram_chat_id      # optional
```

### **Step 3: Start the System**
```bash
# Start the complete system
./start-system.sh

# Or use the fixed startup script directly
./start-system-fixed.sh
```

### **Step 4: Verify Everything Works**
```bash
# Check system status
./status.sh

# View logs
tail -f logs/startup.log
```

## 🔄 How It Works

### **Startup Sequence:**
1. **Load Environment** - Load all variables from `.env`
2. **Check Dependencies** - Verify Node.js, npm, PM2, ngrok, jq
3. **Stop Existing** - Clean up any running processes
4. **Start ngrok** - Start ngrok tunnel on port 10000
5. **Get URL** - Extract the public ngrok URL
6. **Update Gist** - Update GitHub Gist with the new URL
7. **Start Backend** - Start the backend server via PM2
8. **Verify** - Check that everything is working
9. **Monitor** - Begin continuous monitoring

### **Monitoring:**
- **Health Checks** - Every 30 seconds
- **URL Changes** - Automatic Gist updates
- **Auto-Restart** - On failures
- **Telegram Notifications** - Status updates

## 📁 File Structure

```
MobileRepairTracker-1/
├── start-system-fixed.sh      # Main startup script (FIXED)
├── setup-complete-system.sh   # Complete setup script
├── env-template.txt           # Environment template
├── .env                       # Your environment variables
├── ecosystem.config.cjs       # PM2 configuration
├── server.mjs                 # Main backend server
├── logs/                      # Log files
│   ├── startup.log           # Startup logs
│   └── ngrok.log             # ngrok logs
├── scripts/                   # Utility scripts
└── .ngrok-url                # Current ngrok URL (auto-generated)
```

## 🛠️ Management Commands

### **Start/Stop:**
```bash
# Start the system
./start-system.sh

# Stop the system
./stop-system.sh

# Check status
./status.sh
```

### **PM2 Management:**
```bash
# View processes
pm2 status

# View logs
pm2 logs

# Restart all
pm2 restart all

# Stop all
pm2 stop all
```

### **Monitoring:**
```bash
# View startup logs
tail -f logs/startup.log

# View ngrok logs
tail -f logs/ngrok.log

# Check ngrok status
curl http://localhost:4040/api/tunnels

# Check backend health
curl http://localhost:10000/health
```

## 🔧 Configuration

### **Environment Variables (.env):**
```bash
# Required
GITHUB_TOKEN=your_github_token
NGROK_AUTH_TOKEN=your_ngrok_token

# Optional
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id

# System
PORT=10000
NODE_ENV=production
GIST_ID=d394f3df4c86cf1cb0040a7ec4138bfd
GIST_FILENAME=backend-url.txt
```

### **Customization:**
- **Port**: Change `PORT=10000` to use different port
- **Gist**: Change `GIST_ID` to use different Gist
- **Monitoring**: Adjust `CHECK_INTERVAL` for monitoring frequency

## 🚨 Troubleshooting

### **Common Issues:**

#### **1. ngrok Not Starting**
```bash
# Check if ngrok is installed
ngrok version

# Check auth token
echo $NGROK_AUTH_TOKEN

# Reinstall ngrok
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
apt update && apt install ngrok -y
```

#### **2. Gist Not Updating**
```bash
# Check GitHub token
echo $GITHUB_TOKEN

# Test Gist API
curl -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/gists/d394f3df4c86cf1cb0040a7ec4138bfd
```

#### **3. Backend Not Starting**
```bash
# Check PM2 logs
pm2 logs backendserver

# Check port availability
netstat -tulpn | grep :10000

# Restart backend
pm2 restart backendserver
```

#### **4. Dependencies Missing**
```bash
# Install all dependencies
./setup-complete-system.sh

# Or install manually
npm install -g pm2
apt install jq
```

### **Log Analysis:**
```bash
# View all logs
tail -f logs/startup.log logs/ngrok.log

# Search for errors
grep -i error logs/startup.log

# Check recent activity
tail -20 logs/startup.log
```

## 🔗 Integration

### **Frontend Connection:**
Your frontend can now connect using:
1. **Auto-detection** - Frontend detects backend URL
2. **Gist URL** - Frontend fetches URL from Gist
3. **Manual URL** - Set URL in BackendSettings

### **Telegram Bot:**
The cloud Telegram bot will:
1. Fetch backend URL from Gist
2. Monitor backend health
3. Send notifications on status changes

### **API Endpoints:**
- `GET /health` - Health check
- `GET /api/ping` - Ping endpoint
- `GET /api/transactions` - Get transactions
- `POST /api/transactions` - Create transaction
- And many more...

## 📊 Monitoring Dashboard

### **System Status:**
```bash
./status.sh
```

### **Real-time Monitoring:**
```bash
# Watch system status
watch -n 5 ./status.sh

# Monitor logs
tail -f logs/startup.log
```

### **Performance Metrics:**
- **Uptime** - System uptime tracking
- **Response Time** - API response times
- **Error Rate** - Error frequency
- **Restart Count** - Auto-restart statistics

## 🔄 Auto-Start Setup

### **Termux Boot:**
```bash
# Enable auto-start
mkdir -p ~/.termux/boot
cp start-system-fixed.sh ~/.termux/boot/start-mobile-repair.sh
chmod +x ~/.termux/boot/start-mobile-repair.sh
```

### **Systemd Service:**
```bash
# Create systemd service
sudo systemctl enable mobile-repair-backend
sudo systemctl start mobile-repair-backend
```

## 🎉 Success Indicators

When everything is working correctly, you should see:

✅ **ngrok running** with a public URL  
✅ **Gist updated** with the current ngrok URL  
✅ **Backend responding** on health checks  
✅ **PM2 processes** running  
✅ **Telegram notifications** (if configured)  
✅ **Frontend connecting** successfully  

## 📞 Support

If you encounter issues:

1. **Check logs**: `tail -f logs/startup.log`
2. **Verify tokens**: Ensure all tokens are correct
3. **Test manually**: Run each component separately
4. **Restart system**: `./stop-system.sh && ./start-system.sh`

## 🔄 Updates

To update the system:
```bash
# Pull latest changes
git pull origin main

# Reinstall dependencies
npm install

# Restart system
./stop-system.sh
./start-system.sh
```

---

**🎯 This fixed system ensures reliable operation with proper startup sequence, error handling, and monitoring!** 