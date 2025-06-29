# 🤖 Cloud Telegram Bot for Remote Monitoring

A cloud-ready Telegram bot that monitors your backend from a separate server, ensuring notifications work even when your main server goes down.

## 🚀 Why Cloud Deployment?

**Problem**: Your current Telegram bot runs on the same server as your backend. When the server goes down (power outage, network issues, etc.), the bot also stops working.

**Solution**: Deploy this bot on a cloud platform (Vercel, Railway, Render) so it continues monitoring even when your main server is offline.

## 📋 Prerequisites

1. **Telegram Bot Token** (from @BotFather)
2. **Your Chat ID** (from @userinfobot)
3. **Vercel CLI** installed: `npm i -g vercel`

## 🚀 Quick Deploy to Vercel

### 1. Setup Vercel CLI
```bash
# Login to Vercel
vercel login

# Your API key: 62EvqOyqkSurqHgctfTL7tl4
```

### 2. Deploy the Bot
```bash
# Navigate to cloud-telegram-bot directory
cd cloud-telegram-bot

# Deploy to Vercel
vercel --prod
```

### 3. Configure Environment Variables
After deployment, set your environment variables in Vercel dashboard:

```bash
# Set environment variables
vercel env add TELEGRAM_BOT_TOKEN
vercel env add TELEGRAM_CHAT_ID
vercel env add BACKEND_URL
vercel env add NGROK_API_URL
```

Or use the Vercel dashboard:
1. Go to your project in Vercel
2. Settings → Environment Variables
3. Add each variable

## 🔧 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `TELEGRAM_BOT_TOKEN` | Your bot token from @BotFather | `123456789:ABCdefGHIjklMNOpqrsTUVwxyz` |
| `TELEGRAM_CHAT_ID` | Your chat ID from @userinfobot | `123456789` |
| `BACKEND_URL` | Your ngrok URL | `https://abc123.ngrok.io` |
| `NGROK_API_URL` | Ngrok API URL | `https://abc123.ngrok.io:4040` |
| `CHECK_INTERVAL` | Check interval in ms | `60000` (1 minute) |
| `ENABLE_NOTIFICATIONS` | Enable/disable notifications | `true` |

## 📱 Bot Commands

Once deployed, use these commands in Telegram:

- `/start` - Start monitoring
- `/status` - Show system status
- `/restart` - Restart backend service
- `/help` - Show available commands

## 🔔 Notifications

The bot will send notifications for:

- ✅ **Backend Online/Offline** - When your server goes down or comes back up
- 🔄 **Ngrok URL Changes** - When your ngrok URL changes
- ⚠️ **Service Failures** - When services fail to respond
- 🚀 **Bot Status** - When the monitoring bot starts/stops

## 🌐 Alternative Deployments

### Railway Deployment
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Render Deployment
```bash
# Connect your GitHub repo to Render
# Render will auto-deploy from your repository
```

## 🔒 Security Features

- ✅ **Authorized Access Only** - Only responds to your chat ID
- 🔐 **Environment Variables** - Sensitive data stored securely
- 🛡️ **HTTPS Only** - All communications encrypted
- ⏰ **Rate Limiting** - Prevents spam notifications

## 🚨 Troubleshooting

### Bot Not Responding
1. Check Vercel deployment status
2. Verify environment variables
3. Check Vercel function logs

### No Notifications
1. Verify bot token is correct
2. Check if chat ID matches
3. Ensure backend URL is accessible

### Deployment Issues
```bash
# Check Vercel logs
vercel logs

# Redeploy
vercel --prod

# Check function status
vercel ls
```

## 📊 Monitoring Dashboard

Your bot provides a web dashboard:
- **Health Check**: `https://your-app.vercel.app/health`
- **Status Page**: `https://your-app.vercel.app/status`

## 🎉 Success!

Once deployed, you'll have:
- ✅ **24/7 Monitoring** - Bot runs on cloud infrastructure
- ✅ **Offline Detection** - Know when your server goes down
- ✅ **Remote Control** - Restart services from anywhere
- ✅ **Real-time Alerts** - Instant notifications on your phone
- ✅ **Reliable Service** - No dependency on your local server

Your backend monitoring is now bulletproof! 🛡️✨ 