#!/usr/bin/env node

// === Telegram Bot for Ngrok Monitoring ===
// Sends notifications about ngrok status, URL changes, and service events

const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

// Configuration
const config = {
    // Load from environment or .env file
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
    PROJECT_DIR: process.env.PROJECT_DIR || process.cwd(),
    CHECK_INTERVAL: parseInt(process.env.TELEGRAM_CHECK_INTERVAL) || 30000, // 30 seconds
    ENABLE_NOTIFICATIONS: process.env.TELEGRAM_ENABLE_NOTIFICATIONS !== 'false'
};

// State tracking
let state = {
    lastUrl: '',
    lastStatus: 'unknown',
    lastCheck: new Date(),
    isRunning: false,
    errorCount: 0
};

// Initialize bot
let bot;
if (config.TELEGRAM_BOT_TOKEN && config.TELEGRAM_CHAT_ID) {
    bot = new TelegramBot(config.TELEGRAM_BOT_TOKEN, { polling: false });
    console.log('🤖 Telegram bot initialized');
} else {
    console.log('⚠️ Telegram bot not configured. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID');
}

// Utility functions
function log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
}

function sendNotification(message, parseMode = 'HTML') {
    if (!bot || !config.ENABLE_NOTIFICATIONS) return;
    
    try {
        bot.sendMessage(config.TELEGRAM_CHAT_ID, message, { parse_mode: parseMode });
        log(`📱 Telegram notification sent: ${message.substring(0, 50)}...`);
    } catch (error) {
        log(`❌ Failed to send Telegram notification: ${error.message}`);
    }
}

async function checkNgrokStatus() {
    try {
        // Check if ngrok is running
        const { stdout } = await execAsync('curl -s http://127.0.0.1:4040/api/tunnels');
        const tunnels = JSON.parse(stdout);
        
        if (tunnels.tunnels && tunnels.tunnels.length > 0) {
            const currentUrl = tunnels.tunnels[0].public_url;
            const isActive = tunnels.tunnels[0].proto === 'https';
            
            // Check if URL changed
            if (currentUrl !== state.lastUrl) {
                if (state.lastUrl) {
                    sendNotification(
                        `🔄 <b>Ngrok URL Changed</b>\n\n` +
                        `📅 <b>Time:</b> ${new Date().toLocaleString()}\n` +
                        `🔗 <b>Old URL:</b> <code>${state.lastUrl}</code>\n` +
                        `🔗 <b>New URL:</b> <code>${currentUrl}</code>\n\n` +
                        `✅ Backend will be restarted automatically`
                    );
                } else {
                    sendNotification(
                        `🚀 <b>Ngrok Started</b>\n\n` +
                        `📅 <b>Time:</b> ${new Date().toLocaleString()}\n` +
                        `🔗 <b>URL:</b> <code>${currentUrl}</code>\n` +
                        `🌐 <b>Status:</b> ${isActive ? 'Active' : 'Inactive'}`
                    );
                }
                
                state.lastUrl = currentUrl;
                state.errorCount = 0;
            }
            
            state.lastStatus = 'running';
            state.isRunning = true;
            
        } else {
            if (state.isRunning) {
                sendNotification(
                    `❌ <b>Ngrok Stopped</b>\n\n` +
                    `📅 <b>Time:</b> ${new Date().toLocaleString()}\n` +
                    `🔗 <b>Last URL:</b> <code>${state.lastUrl}</code>\n\n` +
                    `🔄 Attempting to restart...`
                );
                state.isRunning = false;
            }
            state.lastStatus = 'stopped';
        }
        
    } catch (error) {
        state.errorCount++;
        log(`❌ Error checking ngrok status: ${error.message}`);
        
        if (state.errorCount === 1) {
            sendNotification(
                `⚠️ <b>Ngrok Check Failed</b>\n\n` +
                `📅 <b>Time:</b> ${new Date().toLocaleString()}\n` +
                `❌ <b>Error:</b> ${error.message}\n\n` +
                `🔄 Will retry automatically`
            );
        }
    }
}

async function checkBackendStatus() {
    try {
        // Check if backend is running on port 10000
        const { stdout } = await execAsync('curl -s http://localhost:10000/health || echo "DOWN"');
        
        if (stdout.includes('DOWN') || stdout.includes('Connection refused')) {
            sendNotification(
                `⚠️ <b>Backend Service Down</b>\n\n` +
                `📅 <b>Time:</b> ${new Date().toLocaleString()}\n` +
                `🔧 <b>Port:</b> 10000\n\n` +
                `🔄 Attempting to restart...`
            );
        }
    } catch (error) {
        // Backend check failed, but don't spam notifications
        log(`Backend check failed: ${error.message}`);
    }
}

async function getSystemInfo() {
    try {
        const { stdout: uptime } = await execAsync('uptime');
        const { stdout: memory } = await execAsync('free -h | grep Mem');
        const { stdout: disk } = await execAsync('df -h / | tail -1');
        
        return {
            uptime: uptime.trim(),
            memory: memory.trim(),
            disk: disk.trim()
        };
    } catch (error) {
        return { error: error.message };
    }
}

// Bot commands
if (bot) {
    bot.on('message', async (msg) => {
        const chatId = msg.chat.id;
        const text = msg.text;
        
        if (chatId.toString() !== config.TELEGRAM_CHAT_ID) {
            return; // Only respond to authorized chat
        }
        
        switch (text) {
            case '/start':
                sendNotification(
                    `🤖 <b>Ngrok Monitor Bot Started</b>\n\n` +
                    `📅 <b>Time:</b> ${new Date().toLocaleString()}\n` +
                    `✅ Monitoring your ngrok backend\n\n` +
                    `Use /help for available commands`
                );
                break;
                
            case '/status':
                const systemInfo = await getSystemInfo();
                sendNotification(
                    `📊 <b>System Status</b>\n\n` +
                    `📅 <b>Time:</b> ${new Date().toLocaleString()}\n` +
                    `🔗 <b>Current URL:</b> <code>${state.lastUrl || 'None'}</code>\n` +
                    `🔄 <b>Ngrok Status:</b> ${state.lastStatus}\n` +
                    `⏰ <b>Last Check:</b> ${state.lastCheck.toLocaleString()}\n\n` +
                    `💻 <b>System Info:</b>\n` +
                    `📈 <b>Uptime:</b> ${systemInfo.uptime || 'Unknown'}\n` +
                    `💾 <b>Memory:</b> ${systemInfo.memory || 'Unknown'}\n` +
                    `💿 <b>Disk:</b> ${systemInfo.disk || 'Unknown'}`
                );
                break;
                
            case '/restart':
                sendNotification(
                    `🔄 <b>Manual Restart Requested</b>\n\n` +
                    `📅 <b>Time:</b> ${new Date().toLocaleString()}\n` +
                    `👤 <b>Requested by:</b> ${msg.from.first_name}\n\n` +
                    `🔄 Restarting ngrok service...`
                );
                
                try {
                    await execAsync('pkill -f ngrok');
                    await execAsync('pkill -f "update-ngrok-gist-v2.sh"');
                    setTimeout(async () => {
                        await execAsync('./update-ngrok-gist-v2.sh --once');
                        sendNotification(
                            `✅ <b>Restart Completed</b>\n\n` +
                            `📅 <b>Time:</b> ${new Date().toLocaleString()}\n` +
                            `🔄 Ngrok service has been restarted`
                        );
                    }, 2000);
                } catch (error) {
                    sendNotification(
                        `❌ <b>Restart Failed</b>\n\n` +
                        `📅 <b>Time:</b> ${new Date().toLocaleString()}\n` +
                        `❌ <b>Error:</b> ${error.message}`
                    );
                }
                break;
                
            case '/logs':
                try {
                    const logFiles = fs.readdirSync(path.join(config.PROJECT_DIR, 'backend/logs'))
                        .filter(file => file.startsWith('backend_'))
                        .sort()
                        .reverse()
                        .slice(0, 3);
                    
                    let logContent = `📋 <b>Recent Logs</b>\n\n`;
                    
                    for (const logFile of logFiles) {
                        const logPath = path.join(config.PROJECT_DIR, 'backend/logs', logFile);
                        const content = fs.readFileSync(logPath, 'utf8');
                        const lastLines = content.split('\n').slice(-5).join('\n');
                        
                        logContent += `📄 <b>${logFile}</b>\n<code>${lastLines}</code>\n\n`;
                    }
                    
                    // Split if too long
                    if (logContent.length > 4000) {
                        logContent = logContent.substring(0, 4000) + '\n... (truncated)';
                    }
                    
                    sendNotification(logContent);
                } catch (error) {
                    sendNotification(
                        `❌ <b>Log Retrieval Failed</b>\n\n` +
                        `📅 <b>Time:</b> ${new Date().toLocaleString()}\n` +
                        `❌ <b>Error:</b> ${error.message}`
                    );
                }
                break;
                
            case '/help':
                sendNotification(
                    `🤖 <b>Ngrok Monitor Bot Commands</b>\n\n` +
                    `/start - Start monitoring\n` +
                    `/status - Show current status\n` +
                    `/restart - Restart ngrok service\n` +
                    `/logs - Show recent logs\n` +
                    `/help - Show this help\n\n` +
                    `📅 <b>Last Updated:</b> ${new Date().toLocaleString()}`
                );
                break;
                
            default:
                sendNotification(
                    `❓ <b>Unknown Command</b>\n\n` +
                    `Use /help to see available commands`
                );
        }
    });
}

// Main monitoring loop
async function startMonitoring() {
    log('🤖 Starting Telegram bot monitoring...');
    
    if (bot) {
        sendNotification(
            `🚀 <b>Ngrok Monitor Bot Started</b>\n\n` +
            `📅 <b>Time:</b> ${new Date().toLocaleString()}\n` +
            `✅ Monitoring your ngrok backend\n\n` +
            `Use /help for available commands`
        );
    }
    
    setInterval(async () => {
        state.lastCheck = new Date();
        await checkNgrokStatus();
        await checkBackendStatus();
    }, config.CHECK_INTERVAL);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    log('🛑 Shutting down Telegram bot...');
    if (bot) {
        sendNotification(
            `🛑 <b>Ngrok Monitor Bot Stopped</b>\n\n` +
            `📅 <b>Time:</b> ${new Date().toLocaleString()}\n` +
            `❌ Monitoring has been stopped`
        );
    }
    process.exit(0);
});

// Start monitoring
startMonitoring().catch(error => {
    log(`❌ Failed to start monitoring: ${error.message}`);
    process.exit(1);
}); 