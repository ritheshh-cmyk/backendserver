# 🌐 Mobile Repair Backend Access Guide

## 📍 **Your Backend Port Configuration**

Your backend is configured to run on **Port 10000** (not 3000 anymore!)

```javascript
const PORT = process.env.PORT || 10000;
```

## 🔍 **How to Check Current Backend Status**

### **On Termux-Ubuntu (Local Device):**

```bash
# Check if backend is running
curl http://localhost:10000/health

# Check backend process
ps aux | grep "node.*server.mjs"

# Check port usage
netstat -tlnp | grep :10000

# Check systemd service status
systemctl status mobile-repair-backend.service
```

### **Check ngrok Tunnel Status:**
```bash
# Check ngrok API
curl http://localhost:4040/api/tunnels

# Get public URL
curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*"' | cut -d'"' -f4
```

## 🌍 **How to Access Your Backend**

### **1. Local Access (On Termux-Ubuntu Device):**
```bash
# Health check
curl http://localhost:10000/health

# API endpoints
curl http://localhost:10000/api/ping
curl http://localhost:10000/api/auth/login
```

### **2. Public Access (Via ngrok):**
```bash
# Get your public ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*"' | cut -d'"' -f4)

# Access via public URL
curl $NGROK_URL/health
curl $NGROK_URL/api/ping
```

### **3. Access from Gist (Cloud Bot):**
Your cloud Telegram bot fetches the ngrok URL from your GitHub Gist and uses it to monitor your backend.

## 📱 **Frontend Access URLs**

### **Local Development:**
- **Frontend**: `http://localhost:5173` (Vite dev server)
- **Backend API**: `http://localhost:10000`

### **Production (Via ngrok):**
- **Frontend**: Your ngrok URL (e.g., `https://abc123.ngrok.io`)
- **Backend API**: Same ngrok URL + `/api` endpoints

## 🔧 **API Endpoints Reference**

### **Public Endpoints (No Auth Required):**
```bash
GET  /health          # Health check
GET  /api/ping        # Ping endpoint
POST /api/auth/login  # Login endpoint
```

### **Protected Endpoints (Auth Required):**
```bash
GET    /api/auth/me     # Get current user
GET    /api/users       # Get all users (admin only)
POST   /api/users       # Create user (admin only)
GET    /api/expense     # Get expenses
POST   /api/expense     # Create expense
```

## 🚀 **Quick Status Check Script**

Create this script to quickly check everything:

```bash
#!/bin/bash
echo "🔍 Mobile Repair Backend Status Check"
echo "======================================"

# Check backend
echo "🔧 Backend Status:"
if curl -s http://localhost:10000/health > /dev/null; then
    echo "✅ Backend: RUNNING on port 10000"
    curl -s http://localhost:10000/health | jq .
else
    echo "❌ Backend: NOT RUNNING"
fi

echo ""

# Check ngrok
echo "🚇 ngrok Status:"
if curl -s http://localhost:4040/api/tunnels > /dev/null; then
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*"' | cut -d'"' -f4 | head -1)
    if [ -n "$NGROK_URL" ]; then
        echo "✅ ngrok: RUNNING"
        echo "📍 Public URL: $NGROK_URL"
        
        # Test public access
        if curl -s "$NGROK_URL/health" > /dev/null; then
            echo "✅ Public Access: WORKING"
        else
            echo "❌ Public Access: FAILED"
        fi
    else
        echo "⚠️  ngrok: RUNNING (no URL found)"
    fi
else
    echo "❌ ngrok: NOT RUNNING"
fi

echo ""

# Check processes
echo "📊 Process Status:"
echo "Backend PID: $(pgrep -f 'node.*server.mjs' || echo 'Not running')"
echo "ngrok PID: $(pgrep -f 'ngrok' || echo 'Not running')"
```

## 🔐 **Default Login Credentials**

```json
{
  "admin": {
    "username": "rithesh",
    "password": "7989002273"
  },
  "owner": {
    "username": "rajashekar", 
    "password": "raj99481"
  },
  "worker": {
    "username": "sravan",
    "password": "sravan6565"
  }
}
```

## 🌐 **Testing API Endpoints**

### **Login Test:**
```bash
curl -X POST http://localhost:10000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"rithesh","password":"7989002273"}'
```

### **Health Check Test:**
```bash
curl http://localhost:10000/health
```

### **Public ngrok Test:**
```bash
# Get ngrok URL first
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*"' | cut -d'"' -f4)

# Test public access
curl "$NGROK_URL/health"
```

## 🚨 **Troubleshooting**

### **Backend Not Starting:**
```bash
# Check logs
tail -f /var/log/mobile-repair/backend.log

# Restart service
systemctl restart mobile-repair-backend.service

# Manual start
cd /root/backendserver
node server.mjs
```

### **ngrok Not Working:**
```bash
# Check ngrok logs
tail -f /var/log/mobile-repair/ngrok.log

# Restart ngrok
systemctl restart mobile-repair-ngrok.service

# Manual start
ngrok http 10000
```

### **Port Already in Use:**
```bash
# Check what's using port 10000
lsof -i :10000

# Kill process
sudo kill -9 $(lsof -t -i:10000)
```

## 📋 **Summary**

- **Local Backend**: `http://localhost:10000`
- **Public Backend**: Your ngrok URL (fetched from Gist)
- **Health Check**: `/health` endpoint
- **API Base**: `/api` endpoints
- **Authentication**: `/api/auth` endpoints

Your backend is now running on port **10000** and accessible both locally and publicly via ngrok! 🚀 