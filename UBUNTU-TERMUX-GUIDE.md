# 🚀 Ubuntu-in-Termux Backend Setup Guide

## Quick Start (One-Click Install)

```bash
# Make the script executable
chmod +x one-click-install.sh

# Run one-click install
./one-click-install.sh
```

That's it! The script will handle everything automatically.

---

## 📋 What the One-Click Install Does

### 1. **Environment Detection**
- ✅ Checks if you're in Ubuntu-in-Termux (not pure Termux)
- ✅ Validates internet connectivity
- ✅ Monitors system resources (RAM, disk space)

### 2. **System Dependencies**
- ✅ Installs Node.js, npm, git, curl, lsof, coreutils
- ✅ Installs PM2 globally for process management
- ✅ Updates package lists automatically

### 3. **Backend Setup**
- ✅ Runs the enterprise-grade setup script
- ✅ Configures environment with smart defaults
- ✅ Sets up auto-start on boot
- ✅ Starts the backend server

---

## 🔧 New Features You Can Use

### **1. Dynamic Port Detection**
```bash
# If port 10000 is busy, the script will ask for an alternative
# You can also manually change it in .env:
PORT=10001
```

### **2. Auto-Start on Boot**
```bash
# The backend starts automatically when you open Ubuntu-in-Termux
# To disable: remove the line from ~/.bashrc
# To test: source ~/.bashrc
```

### **3. Self-Update System**
```bash
# Check for updates and install them
./update-backend.sh

# This will:
# - Pull latest changes from git
# - Install new dependencies
# - Restart services
# - Save PM2 configuration
```

### **4. Health Monitoring**
```bash
# Check if backend is responding
curl http://localhost:10000/api/ping

# Check PM2 status
pm2 status

# View logs
pm2 logs

# Monitor in real-time
pm2 monit
```

### **5. Remote Access Setup**

#### **Option A: Ngrok (Recommended)**
1. Sign up at https://ngrok.com
2. Get your auth token
3. Edit `.env`:
   ```env
   NGROK_AUTH_TOKEN=your_actual_token_here
   ```
4. Restart: `pm2 restart all`

#### **Option B: DuckDNS**
1. Sign up at https://duckdns.org
2. Create a subdomain
3. Edit `.env`:
   ```env
   DUCKDNS_DOMAIN=your-subdomain.duckdns.org
   DUCKDNS_TOKEN=your_duckdns_token
   ```
4. Restart: `pm2 restart all`

### **6. Telegram Bot Integration**
1. Create bot with @BotFather
2. Get your chat ID (send message to bot, then check):
   ```
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
   ```
3. Edit `.env`:
   ```env
   TELEGRAM_BOT_TOKEN=your_bot_token
   TELEGRAM_CHAT_ID=your_chat_id
   ```

---

## 📊 Management Commands

### **PM2 Commands**
```bash
# Check status
pm2 status

# View logs
pm2 logs

# Restart all services
pm2 restart all

# Stop all services
pm2 stop all

# Delete all services
pm2 delete all

# Save current configuration
pm2 save

# Monitor in real-time
pm2 monit
```

### **Backend Commands**
```bash
# Start backend
./start-backend-server.sh

# Setup auto-start
./setup-auto-start.sh

# Update to latest version
./update-backend.sh

# Check health
curl http://localhost:10000/api/ping
```

### **Log Files**
```bash
# View setup log
cat backend-setup.log

# View PM2 logs
pm2 logs

# View specific service logs
pm2 logs backend-server
```

---

## 🔍 Troubleshooting

### **Common Issues**

#### **1. "Cannot find package 'lowdb'"**
```bash
npm install
```

#### **2. Port already in use**
```bash
# Check what's using the port
lsof -i :10000

# Kill the process or change port in .env
PORT=10001
```

#### **3. PM2 not found**
```bash
npm install -g pm2
```

#### **4. Auto-start not working**
```bash
# Check if added to .bashrc
grep "start-backend-server" ~/.bashrc

# Test manually
source ~/.bashrc
```

#### **5. Update fails**
```bash
# Check git status
git status

# Check remote
git remote -v

# Manual update
git pull origin main
npm install
pm2 restart all
```

### **System Issues**

#### **Low Memory**
```bash
# Check available memory
free -h

# Close unnecessary apps
# Restart Ubuntu-in-Termux
```

#### **No Internet**
```bash
# Test connectivity
ping google.com

# Check DNS
nslookup google.com
```

---

## 📱 Mobile Access Setup

### **1. Ngrok Setup**
```bash
# Download ngrok
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar xvzf ngrok-v3-stable-linux-amd64.tgz

# Add to PATH
export PATH=$PATH:$(pwd)

# Configure with your token
ngrok config add-authtoken YOUR_TOKEN

# Start tunnel
ngrok http 10000
```

### **2. DuckDNS Setup**
```bash
# The DuckDNS updater runs automatically via PM2
# Just add your domain and token to .env
```

---

## 🎯 Advanced Features

### **1. Custom Environment Variables**
Edit `.env` to customize:
```env
NODE_ENV=production
PORT=10000
DB_FILE=db.json
# Add your tokens and domains
```

### **2. Database Management**
```bash
# View database
cat db.json

# Backup database
cp db.json db.backup.$(date +%s)

# Reset database
echo '{"expenses": []}' > db.json
```

### **3. Performance Monitoring**
```bash
# Monitor system resources
htop

# Monitor PM2 processes
pm2 monit

# Check disk usage
df -h
```

---

## 🚀 Production Deployment

Your backend is now **production-ready** with:

- ✅ **Auto-restart** on crashes
- ✅ **Health monitoring** and logging
- ✅ **Self-update** capability
- ✅ **Remote access** via ngrok/DuckDNS
- ✅ **Mobile optimization** for Ubuntu-in-Termux
- ✅ **Enterprise-grade** error handling
- ✅ **Comprehensive** logging and debugging

---

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. View logs: `pm2 logs` or `cat backend-setup.log`
3. Test manually: `node server.mjs`
4. Run setup again: `./setup-backend.sh`
5. Update: `./update-backend.sh`

---

**🎉 Your enterprise-grade mobile backend is ready for production!** 