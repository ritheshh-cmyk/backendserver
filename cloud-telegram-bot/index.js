#!/usr/bin/env node

// === Cloud-Ready Telegram Bot for Remote Monitoring ===
// This bot can be hosted on Railway, Render, Heroku, etc.
// It monitors your backend from a separate server

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');

// Configuration
const config = {
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
    GIST_ID: process.env.GIST_ID || 'd394f3df4c86cf1cb0040a7ec4138bfd',
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    CHECK_INTERVAL: parseInt(process.env.CHECK_INTERVAL) || 60000, // 1 minute
    ENABLE_NOTIFICATIONS: process.env.ENABLE_NOTIFICATIONS !== 'false',
    PORT: process.env.PORT || 3000,
    ALERT_THRESHOLD: parseInt(process.env.ALERT_THRESHOLD) || 3, // consecutive failures
    PERFORMANCE_MODE: process.env.PERFORMANCE_MODE === 'true'
};

// Enhanced state tracking
let state = {
    lastUrl: '',
    lastStatus: 'unknown',
    lastCheck: new Date(),
    isRunning: false,
    errorCount: 0,
    backendStatus: 'unknown',
    lastBackendCheck: new Date(),
    // New enhanced tracking
    consecutiveFailures: 0,
    totalChecks: 0,
    successfulChecks: 0,
    lastError: null,
    uptime: new Date(),
    performanceMetrics: {
        avgResponseTime: 0,
        responseTimes: [],
        lastResponseTime: 0
    },
    alerts: {
        backendDown: false,
        ngrokDown: false,
        highLatency: false
    },
    customAlerts: [],
    // Gist tracking
    currentBackendUrl: '',
    lastGistCheck: new Date(),
    gistErrorCount: 0
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
        backendUrl: state.currentBackendUrl || 'Not fetched from Gist yet',
        lastCheck: state.lastCheck,
        uptime: Date.now() - state.uptime.getTime(),
        performance: state.performanceMetrics
    });
});

app.get('/status', (req, res) => {
    res.json({
        ...state,
        config: {
            gistId: config.GIST_ID,
            checkInterval: config.CHECK_INTERVAL
        }
    });
});

app.get('/metrics', (req, res) => {
    const uptime = Date.now() - state.uptime.getTime();
    const successRate = state.totalChecks > 0 ? (state.successfulChecks / state.totalChecks * 100).toFixed(2) : 0;
    
    res.json({
        uptime: {
            milliseconds: uptime,
            seconds: Math.floor(uptime / 1000),
            minutes: Math.floor(uptime / 60000),
            hours: Math.floor(uptime / 3600000)
        },
        checks: {
            total: state.totalChecks,
            successful: state.successfulChecks,
            failed: state.totalChecks - state.successfulChecks,
            successRate: `${successRate}%`
        },
        performance: state.performanceMetrics,
        alerts: state.alerts,
        gist: {
            currentUrl: state.currentBackendUrl,
            lastCheck: state.lastGistCheck,
            errorCount: state.gistErrorCount
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

async function fetchBackendUrlFromGist() {
    try {
        const headers = {};
        if (config.GITHUB_TOKEN) {
            headers['Authorization'] = `token ${config.GITHUB_TOKEN}`;
        }
        
        const response = await axios.get(`https://api.github.com/gists/${config.GIST_ID}`, {
            headers,
            timeout: 10000
        });
        
        // Look for the ngrok URL in the gist files
        const files = response.data.files;
        let ngrokUrl = '';
        
        // Check common filename patterns
        const possibleFiles = ['ngrok-url.txt', 'url.txt', 'backend-url.txt', 'ngrok-url'];
        
        for (const filename of possibleFiles) {
            if (files[filename] && files[filename].content) {
                ngrokUrl = files[filename].content.trim();
                break;
            }
        }
        
        // If no specific file found, check all files for ngrok URL pattern
        if (!ngrokUrl) {
            for (const [filename, file] of Object.entries(files)) {
                if (file.content && file.content.includes('ngrok.io')) {
                    // Extract ngrok URL from content
                    const urlMatch = file.content.match(/https:\/\/[a-zA-Z0-9-]+\.ngrok\.io/);
                    if (urlMatch) {
                        ngrokUrl = urlMatch[0];
                        break;
                    }
                }
            }
        }
        
        if (ngrokUrl && ngrokUrl !== state.currentBackendUrl) {
            log(`🔄 Backend URL updated from Gist: ${ngrokUrl}`);
            if (state.currentBackendUrl) {
                sendNotification(
                    `🔄 <b>Backend URL Updated</b>\n\n` +
                    `📅 <b>Time:</b> ${new Date().toLocaleString()}\n` +
                    `🔗 <b>Old URL:</b> <code>${state.currentBackendUrl}</code>\n` +
                    `🔗 <b>New URL:</b> <code>${ngrokUrl}</code>\n\n` +
                    `✅ Bot will now monitor the new URL`
                );
            }
            state.currentBackendUrl = ngrokUrl;
        }
        
        state.lastGistCheck = new Date();
        state.gistErrorCount = 0;
        
        return ngrokUrl;
        
    } catch (error) {
        state.gistErrorCount++;
        log(`❌ Error fetching backend URL from Gist: ${error.message}`);
        
        if (state.gistErrorCount === 1) {
            sendNotification(
                `⚠️ <b>Gist Fetch Failed</b>\n\n` +
                `📅 <b>Time:</b> ${new Date().toLocaleString()}\n` +
                `❌ <b>Error:</b> ${error.message}\n\n` +
                `🔄 Will retry automatically`
            );
        }
        
        return state.currentBackendUrl; // Return last known URL
    }
}

function addPerformanceMetric(responseTime) {
    state.performanceMetrics.responseTimes.push(responseTime);
    state.performanceMetrics.lastResponseTime = responseTime;
    
    // Keep only last 10 measurements
    if (state.performanceMetrics.responseTimes.length > 10) {
        state.performanceMetrics.responseTimes.shift();
    }
    
    // Calculate average
    const sum = state.performanceMetrics.responseTimes.reduce((a, b) => a + b, 0);
    state.performanceMetrics.avgResponseTime = sum / state.performanceMetrics.responseTimes.length;
}

function checkAlerts() {
    const alerts = [];
    
    // High latency alert
    if (state.performanceMetrics.avgResponseTime > 5000) { // 5 seconds
        if (!state.alerts.highLatency) {
            alerts.push('⚠️ High latency detected (>5s average)');
            state.alerts.highLatency = true;
        }
    } else {
        state.alerts.highLatency = false;
    }
    
    // Consecutive failures alert
    if (state.consecutiveFailures >= config.ALERT_THRESHOLD) {
        alerts.push(`🚨 ${state.consecutiveFailures} consecutive failures detected`);
    }
    
    // Gist fetch failures alert
    if (state.gistErrorCount >= 3) {
        alerts.push(`📄 Gist fetch failing (${state.gistErrorCount} errors)`);
    }
    
    // Send alerts if any
    if (alerts.length > 0) {
        sendNotification(
            `🚨 <b>System Alerts</b>\n\n` +
            `📅 <b>Time:</b> ${new Date().toLocaleString()}\n` +
            alerts.map(alert => `• ${alert}`).join('\n')
        );
    }
}

async function checkNgrokStatus() {
    const startTime = Date.now();
    
    try {
        // First, fetch the latest backend URL from Gist
        const backendUrl = await fetchBackendUrlFromGist();
        
        if (!backendUrl) {
            log('⚠️ No backend URL available from Gist');
            return;
        }
        
        // Check ngrok API from the backend URL
        const ngrokApiUrl = backendUrl.replace('https://', 'http://') + ':4040';
        const response = await axios.get(`${ngrokApiUrl}/api/tunnels`, {
            timeout: 10000
        });
        
        const responseTime = Date.now() - startTime;
        addPerformanceMetric(responseTime);
        
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
            state.consecutiveFailures = 0;
            
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
            state.consecutiveFailures++;
        }
        
        state.totalChecks++;
        state.successfulChecks++;
        
    } catch (error) {
        const responseTime = Date.now() - startTime;
        addPerformanceMetric(responseTime);
        
        state.errorCount++;
        state.consecutiveFailures++;
        state.lastError = error.message;
        state.totalChecks++;
        
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
    const startTime = Date.now();
    
    try {
        // Use the current backend URL from Gist
        if (!state.currentBackendUrl) {
            log('⚠️ No backend URL available for health check');
            return;
        }
        
        // Check backend health endpoint
        const response = await axios.get(`${state.currentBackendUrl}/health`, {
            timeout: 10000
        });
        
        const responseTime = Date.now() - startTime;
        addPerformanceMetric(responseTime);
        
        if (response.status === 200) {
            if (state.backendStatus !== 'healthy') {
                sendNotification(
                    `✅ <b>Backend Service Restored</b>\n\n` +
                    `📅 <b>Time:</b> ${new Date().toLocaleString()}\n` +
                    `🔧 <b>URL:</b> ${state.currentBackendUrl}\n` +
                    `✅ <b>Status:</b> Healthy\n` +
                    `⚡ <b>Response Time:</b> ${responseTime}ms`
                );
            }
            state.backendStatus = 'healthy';
            state.alerts.backendDown = false;
        }
        
    } catch (error) {
        const responseTime = Date.now() - startTime;
        addPerformanceMetric(responseTime);
        
        if (state.backendStatus !== 'down') {
            sendNotification(
                `⚠️ <b>Backend Service Down</b>\n\n` +
                `📅 <b>Time:</b> ${new Date().toLocaleString()}\n` +
                `🔧 <b>URL:</b> ${state.currentBackendUrl}\n` +
                `❌ <b>Error:</b> ${error.message}\n` +
                `⚡ <b>Response Time:</b> ${responseTime}ms\n\n` +
                `🔄 Attempting to restart...`
            );
            state.alerts.backendDown = true;
        }
        state.backendStatus = 'down';
    }
    
    state.lastBackendCheck = new Date();
}

function getDetailedStatus() {
    const uptime = Date.now() - state.uptime.getTime();
    const successRate = state.totalChecks > 0 ? (state.successfulChecks / state.totalChecks * 100).toFixed(2) : 0;
    
    return `📊 <b>Detailed System Status</b>\n\n` +
           `📅 <b>Time:</b> ${new Date().toLocaleString()}\n` +
           `🔗 <b>Current URL:</b> <code>${state.lastUrl || 'None'}</code>\n` +
           `🔄 <b>Ngrok Status:</b> ${state.lastStatus}\n` +
           `🔧 <b>Backend Status:</b> ${state.backendStatus}\n` +
           `⏰ <b>Last Check:</b> ${state.lastCheck.toLocaleString()}\n` +
           `🌐 <b>Backend URL:</b> ${state.currentBackendUrl || 'Not fetched from Gist'}\n\n` +
           `📈 <b>Performance Metrics:</b>\n` +
           `⚡ <b>Avg Response Time:</b> ${state.performanceMetrics.avgResponseTime.toFixed(0)}ms\n` +
           `⚡ <b>Last Response:</b> ${state.performanceMetrics.lastResponseTime}ms\n` +
           `📊 <b>Success Rate:</b> ${successRate}%\n` +
           `🔄 <b>Total Checks:</b> ${state.totalChecks}\n` +
           `✅ <b>Successful:</b> ${state.successfulChecks}\n` +
           `❌ <b>Failed:</b> ${state.totalChecks - state.successfulChecks}\n` +
           `🚨 <b>Consecutive Failures:</b> ${state.consecutiveFailures}\n\n` +
           `📄 <b>Gist Status:</b>\n` +
           `🔗 <b>Last Gist Check:</b> ${state.lastGistCheck.toLocaleString()}\n` +
           `❌ <b>Gist Errors:</b> ${state.gistErrorCount}\n\n` +
           `⏱️ <b>Uptime:</b> ${Math.floor(uptime / 3600000)}h ${Math.floor((uptime % 3600000) / 60000)}m`;
}

// Enhanced bot commands
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
                    `✅ Monitoring your backend remotely\n` +
                    `📄 <b>Gist ID:</b> ${config.GIST_ID}\n\n` +
                    `Use /help for available commands`
                );
                break;
                
            case '/status':
                sendNotification(getDetailedStatus());
                break;
                
            case '/metrics':
                const uptime = Date.now() - state.uptime.getTime();
                const successRate = state.totalChecks > 0 ? (state.successfulChecks / state.totalChecks * 100).toFixed(2) : 0;
                
                sendNotification(
                    `📊 <b>Performance Metrics</b>\n\n` +
                    `📅 <b>Time:</b> ${new Date().toLocaleString()}\n` +
                    `⏱️ <b>Uptime:</b> ${Math.floor(uptime / 3600000)}h ${Math.floor((uptime % 3600000) / 60000)}m\n` +
                    `📊 <b>Success Rate:</b> ${successRate}%\n` +
                    `🔄 <b>Total Checks:</b> ${state.totalChecks}\n` +
                    `✅ <b>Successful:</b> ${state.successfulChecks}\n` +
                    `❌ <b>Failed:</b> ${state.totalChecks - state.successfulChecks}\n` +
                    `⚡ <b>Avg Response Time:</b> ${state.performanceMetrics.avgResponseTime.toFixed(0)}ms\n` +
                    `⚡ <b>Last Response:</b> ${state.performanceMetrics.lastResponseTime}ms\n` +
                    `🚨 <b>Consecutive Failures:</b> ${state.consecutiveFailures}\n\n` +
                    `📄 <b>Gist Status:</b>\n` +
                    `🔗 <b>Current URL:</b> ${state.currentBackendUrl || 'Not fetched'}\n` +
                    `❌ <b>Gist Errors:</b> ${state.gistErrorCount}`
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
                    if (state.currentBackendUrl) {
                        // You can implement a restart endpoint on your backend
                        await axios.post(`${state.currentBackendUrl}/api/restart`, {}, {
                            timeout: 5000
                        });
                        sendNotification(
                            `✅ <b>Restart Command Sent</b>\n\n` +
                            `📅 <b>Time:</b> ${new Date().toLocaleString()}\n` +
                            `🔄 Backend restart initiated`
                        );
                    } else {
                        sendNotification(
                            `❌ <b>Restart Failed</b>\n\n` +
                            `📅 <b>Time:</b> ${new Date().toLocaleString()}\n` +
                            `❌ <b>Error:</b> No backend URL available`
                        );
                    }
                } catch (error) {
                    sendNotification(
                        `❌ <b>Restart Failed</b>\n\n` +
                        `📅 <b>Time:</b> ${new Date().toLocaleString()}\n` +
                        `❌ <b>Error:</b> ${error.message}`
                    );
                }
                break;
                
            case '/alerts':
                const activeAlerts = Object.entries(state.alerts)
                    .filter(([key, value]) => value)
                    .map(([key, value]) => `• ${key}: ${value ? 'Active' : 'Inactive'}`);
                
                const alerts = [];
                if (activeAlerts.length > 0) alerts.push(...activeAlerts);
                if (state.gistErrorCount > 0) alerts.push(`• Gist errors: ${state.gistErrorCount}`);
                if (state.consecutiveFailures > 0) alerts.push(`• Consecutive failures: ${state.consecutiveFailures}`);
                
                sendNotification(
                    `🚨 <b>System Alerts</b>\n\n` +
                    `📅 <b>Time:</b> ${new Date().toLocaleString()}\n` +
                    (alerts.length > 0 ? 
                        alerts.join('\n') : 
                        `✅ No active alerts`)
                );
                break;
                
            case '/help':
                sendNotification(
                    `🤖 <b>Available Commands</b>\n\n` +
                    `/start - Start monitoring\n` +
                    `/status - Show detailed system status\n` +
                    `/metrics - Show performance metrics\n` +
                    `/alerts - Show active alerts\n` +
                    `/restart - Restart backend service\n` +
                    `/help - Show this help\n\n` +
                    `💡 <b>Tip:</b> Send any message (like "hi") to get instant status!\n\n` +
                    `📄 <b>Gist ID:</b> ${config.GIST_ID}\n` +
                    `📅 <b>Time:</b> ${new Date().toLocaleString()}`
                );
                break;
                
            default:
                // For any other message, reply with backend status
                sendNotification(getDetailedStatus());
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
            `✅ Monitoring your backend remotely\n` +
            `📄 <b>Gist ID:</b> ${config.GIST_ID}\n\n` +
            `Use /help for available commands`
        );
    }
    
    // Initial fetch of backend URL from Gist
    await fetchBackendUrlFromGist();
    
    // Initial check
    await checkNgrokStatus();
    await checkBackendStatus();
    
    // Set up monitoring interval
    setInterval(async () => {
        state.lastCheck = new Date();
        await checkNgrokStatus();
        await checkBackendStatus();
        checkAlerts(); // Check for alerts after each monitoring cycle
    }, config.CHECK_INTERVAL);
    
    log(`✅ Monitoring started with ${config.CHECK_INTERVAL}ms interval`);
}

// Start Express server
app.listen(config.PORT, () => {
    log(`🌐 Cloud bot server running on port ${config.PORT}`);
    log(`🔗 Health check: http://localhost:${config.PORT}/health`);
    log(`📊 Status: http://localhost:${config.PORT}/status`);
    log(`📈 Metrics: http://localhost:${config.PORT}/metrics`);
    log(`📄 Gist ID: ${config.GIST_ID}`);
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