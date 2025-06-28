# 🤖 Telegram Bot for Ngrok Monitoring

A Telegram bot that provides real-time notifications and remote control for your ngrok backend service.

## ✨ Features

- 🔔 **Real-time Notifications**: Get instant alerts when ngrok URL changes
- 📊 **Status Monitoring**: Check system status, uptime, and resource usage
- 🔄 **Remote Control**: Restart services, view logs, and manage your backend from Telegram
- 📱 **Mobile Friendly**: Monitor your backend from anywhere using Telegram
- 🛡️ **Secure**: Only responds to authorized chat ID
- 📝 **Detailed Logs**: View recent backend logs directly in Telegram

## 🚀 Quick Setup

### 1. Create a Telegram Bot

1. **Open Telegram** and search for `@BotFather`
2. **Send** `/newbot` command
3. **Follow instructions** to create your bot:
   - Choose a name (e.g., "My Ngrok Monitor")
   - Choose a username (e.g., "my_ngrok_monitor_bot")
4. **Copy the bot token** (looks like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2. Get Your Chat ID

1. **Search for** `@userinfobot` in Telegram
2. **Send any message** to the bot
3. **Copy your chat ID** (a number like `123456789`)

### 3. Configure Environment

```bash
# Copy environment template
cp env-example.txt .env

# Edit with your credentials
nano .env
```

Add your Telegram credentials:
```bash
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
TELEGRAM_ENABLE_NOTIFICATIONS=true
```

### 4. Install and Start

```bash
# Run setup script
./scripts/setup-telegram-bot.sh

# Start the bot
./scripts/start-telegram-bot.sh

# Check status
./scripts/telegram-bot-status.sh
```

## 📱 Bot Commands

Once the bot is running, you can use these commands in Telegram:

### `/start`
- Starts monitoring your ngrok backend
- Sends welcome message with available commands

### `/status`
- Shows current system status
- Displays ngrok URL, uptime, memory, and disk usage

### `/restart`
- Manually restarts the ngrok service
- Useful when you need to force a restart
- Shows restart progress and confirmation

### `/logs`
- Shows recent backend logs
- Displays last 5 lines from recent log files
- Helps with debugging issues

### `/help`
- Shows all available commands
- Provides usage instructions

## 🔔 Notifications

The bot automatically sends notifications for:

### 🚀 Service Events
- **Service Started**: When ngrok auto-start service begins
- **Service Stopped**: When service is manually stopped
- **Internet Lost**: When internet connection is lost
- **Internet Restored**: When connection is restored

### 🔄 Ngrok Events
- **Ngrok Started**: When ngrok tunnel is established
- **URL Changed**: When ngrok URL changes (with old and new URLs)
- **Ngrok Failed**: When ngrok fails to start
- **Ngrok Stopped**: When ngrok tunnel is lost

### 🔧 Backend Events
- **Backend Restarted**: When backend is successfully restarted
- **Build Failed**: When backend build process fails
- **Backend Down**: When backend service is not responding

## 🛠️ Management Commands

### Start the Bot
```bash
./scripts/start-telegram-bot.sh
```

### Stop the Bot
```bash
./scripts/stop-telegram-bot.sh
```

### Check Status
```bash
./scripts/telegram-bot-status.sh
```

### View Logs
```bash
tail -f scripts/telegram-bot.log
```

## 🔒 Security

### Authorization
- Bot only responds to the configured `TELEGRAM_CHAT_ID`
- Other users cannot access your bot
- Commands are ignored from unauthorized chats

### Token Security
- Keep your bot token secure
- Don't share it publicly
- Store it in `.env` file (not committed to git)

## 🚨 Troubleshooting

### Bot Not Responding
1. **Check if bot is running**:
   ```bash
   ./scripts/telegram-bot-status.sh
   ```

2. **Verify credentials**:
   ```bash
   echo $TELEGRAM_BOT_TOKEN
   echo $TELEGRAM_CHAT_ID
   ```

3. **Check logs**:
   ```bash
   tail -f scripts/telegram-bot.log
   ```

### No Notifications
1. **Check notification settings**:
   ```bash
   echo $TELEGRAM_ENABLE_NOTIFICATIONS
   ```

2. **Verify bot token**:
   - Test with curl: `curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getMe"`

## 🎉 Success!

Once configured, you'll have:
- ✅ Real-time monitoring of your ngrok backend
- ✅ Instant notifications for all events
- ✅ Remote control from anywhere
- ✅ Comprehensive status dashboard
- ✅ Automatic error detection and alerts

Your backend is now fully monitored and manageable from your phone! 📱✨ 