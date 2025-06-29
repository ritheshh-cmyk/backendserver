#!/usr/bin/env node

// === Cloud-Ready Telegram Bot for Remote Monitoring ===
// This bot can be hosted on Railway, Render, Heroku, etc.
// It monitors your backend from a separate server

const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');

// Configuration
const config = {
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:10000',
    NGROK_API_URL: process.env.NGROK_API_URL || 'http://localhost:4040',
    CHECK_INTERVAL: parseInt(process.env.CHECK_INTERVAL) || 60000, // 1 minute
    ENABLE_NOTIFICATIONS: process.env.ENABLE_NOTIFICATIONS !== 'false',
    PORT: process.env.PORT || 3000
};

// State tracking
let state = {
    lastUrl: '',
    lastStatus: 'unknown',
    lastCheck: new Date(),
    isRunning: false,
    errorCount: 0,
    backendStatus: 'unknown',
    lastBackendCheck: new Date()
};

// Initialize bot
let bot;
if (config.TELEGRAM_BOT_TOKEN && config.TELEGRAM_CHAT_ID) {
    try {
        bot = new TelegramBot(config.TELEGRAM_BOT_TOKEN, { polling: false });
        console.log('🤖 Cloud Telegram bot initialized');
    } catch (error) {
        console.error('❌ Failed to initialize Telegram bot:', error.message);
    }
} else {
    console.log('⚠️ Telegram bot not configured. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID');
}

// Express app for health checks
const app = express();

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        bot: !!bot,
        backendUrl: config.BACKEND_URL,
        lastCheck: state.lastCheck
    });
});

app.get('/status', (req, res) => {
    res.json({
        ...state,
        config: {
            backendUrl: config.BACKEND_URL,
            ngrokApiUrl: config.NGROK_API_URL,
            checkInterval: config.CHECK_INTERVAL
        }
    });
});

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
        // Check ngrok API from remote server
        const response = await axios.get(`${config.NGROK_API_URL}/api/tunnels`, {
            timeout: 10000
        });
        
        const tunnels = response.data;
        
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
        // Check backend health endpoint
        const response = await axios.get(`${config.BACKEND_URL}/health`, {
            timeout: 10000
        });
        
        if (response.status === 200) {
            if (state.backendStatus !== 'healthy') {
                sendNotification(
                    `✅ <b>Backend Service Restored</b>\n\n` +
                    `📅 <b>Time:</b> ${new Date().toLocaleString()}\n` +
                    `🔧 <b>URL:</b> ${config.BACKEND_URL}\n` +
                    `✅ <b>Status:</b> Healthy`
                );
            }
            state.backendStatus = 'healthy';
        }
        
    } catch (error) {
        if (state.backendStatus !== 'down') {
            sendNotification(
                `⚠️ <b>Backend Service Down</b>\n\n` +
                `📅 <b>Time:</b> ${new Date().toLocaleString()}\n` +
                `🔧 <b>URL:</b> ${config.BACKEND_URL}\n` +
                `❌ <b>Error:</b> ${error.message}\n\n` +
                `🔄 Attempting to restart...`
            );
        }
        state.backendStatus = 'down';
    }
    
    state.lastBackendCheck = new Date();
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
                    `🤖 <b>Cloud Monitor Bot Started</b>\n\n` +
                    `📅 <b>Time:</b> ${new Date().toLocaleString()}\n` +
                    `✅ Monitoring your backend remotely\n\n` +
                    `Use /help for available commands`
                );
                break;
                
            case '/status':
                sendNotification(
                    `📊 <b>Remote System Status</b>\n\n` +
                    `📅 <b>Time:</b> ${new Date().toLocaleString()}\n` +
                    `🔗 <b>Current URL:</b> <code>${state.lastUrl || 'None'}</code>\n` +
                    `🔄 <b>Ngrok Status:</b> ${state.lastStatus}\n` +
                    `🔧 <b>Backend Status:</b> ${state.backendStatus}\n` +
                    `⏰ <b>Last Check:</b> ${state.lastCheck.toLocaleString()}\n` +
                    `🌐 <b>Backend URL:</b> ${config.BACKEND_URL}`
                );
                break;
                
            case '/restart':
                sendNotification(
                    `🔄 <b>Manual Restart Requested</b>\n\n` +
                    `📅 <b>Time:</b> ${new Date().toLocaleString()}\n` +
                    `👤 <b>Requested by:</b> ${msg.from.first_name}\n\n` +
                    `🔄 Sending restart command to backend...`
                );
                
                try {
                    // You can implement a restart endpoint on your backend
                    await axios.post(`${config.BACKEND_URL}/api/restart`, {}, {
                        timeout: 5000
                    });
                    sendNotification(
                        `✅ <b>Restart Command Sent</b>\n\n` +
                        `📅 <b>Time:</b> ${new Date().toLocaleString()}\n` +
                        `🔄 Backend restart initiated`
                    );
                } catch (error) {
                    sendNotification(
                        `❌ <b>Restart Failed</b>\n\n` +
                        `📅 <b>Time:</b> ${new Date().toLocaleString()}\n` +
                        `❌ <b>Error:</b> ${error.message}`
                    );
                }
                break;
                
            case '/help':
                sendNotification(
                    `🤖 <b>Available Commands</b>\n\n` +
                    `/start - Start monitoring\n` +
                    `/status - Show system status\n` +
                    `/restart - Restart backend service\n` +
                    `/help - Show this help\n\n` +
                    `📅 <b>Time:</b> ${new Date().toLocaleString()}`
                );
                break;
                
            default:
                sendNotification(
                    `❓ <b>Unknown Command</b>\n\n` +
                    `📅 <b>Time:</b> ${new Date().toLocaleString()}\n` +
                    `💬 <b>Message:</b> ${text}\n\n` +
                    `Use /help for available commands`
                );
        }
    });
}

// Main monitoring loop
async function startMonitoring() {
    log('🚀 Starting cloud monitoring bot...');
    
    if (bot) {
        sendNotification(
            `🤖 <b>Cloud Monitor Bot Started</b>\n\n` +
            `📅 <b>Time:</b> ${new Date().toLocaleString()}\n` +
            `✅ Monitoring your backend remotely\n\n` +
            `Use /help for available commands`
        );
    }
    
    // Initial check
    await checkNgrokStatus();
    await checkBackendStatus();
    
    // Set up monitoring interval
    setInterval(async () => {
        state.lastCheck = new Date();
        await checkNgrokStatus();
        await checkBackendStatus();
    }, config.CHECK_INTERVAL);
    
    log(`✅ Monitoring started with ${config.CHECK_INTERVAL}ms interval`);
}

// Start Express server
app.listen(config.PORT, () => {
    log(`🌐 Cloud bot server running on port ${config.PORT}`);
    log(`🔗 Health check: http://localhost:${config.PORT}/health`);
    log(`📊 Status: http://localhost:${config.PORT}/status`);
});

// Handle process termination
process.on('SIGINT', () => {
    log('🛑 Received SIGINT, shutting down gracefully...');
    if (bot) {
        sendNotification(
            `🛑 <b>Cloud Bot Shutting Down</b>\n\n` +
            `📅 <b>Time:</b> ${new Date().toLocaleString()}\n` +
            `🔄 Monitoring stopped`
        );
    }
    process.exit(0);
});

process.on('SIGTERM', () => {
    log('🛑 Received SIGTERM, shutting down gracefully...');
    if (bot) {
        sendNotification(
            `🛑 <b>Cloud Bot Shutting Down</b>\n\n` +
            `📅 <b>Time:</b> ${new Date().toLocaleString()}\n` +
            `🔄 Monitoring stopped`
        );
    }
    process.exit(0);
});

// Start monitoring
startMonitoring().catch(error => {
    log(`❌ Failed to start monitoring: ${error.message}`);
    process.exit(1);
}); 