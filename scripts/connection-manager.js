#!/usr/bin/env node

/**
 * Connection Manager - 100% Auto-Start Reliability
 * 
 * This script ensures:
 * 1. Internet connectivity before starting services
 * 2. Ngrok tunnel establishment and verification
 * 3. GitHub gist updates with new URLs
 * 4. Backend server startup coordination
 * 5. Continuous monitoring and recovery
 * 6. Telegram notifications for all events
 */

const { spawn, exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
  PORT: process.env.PORT || 10000,
  GIST_ID: process.env.GIST_ID || 'd394f3df4c86cf1cb0040a7ec4138bfd',
  GIST_FILENAME: process.env.GIST_FILENAME || 'backend-url.txt',
  GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
  NGROK_AUTH_TOKEN: process.env.NGROK_AUTH_TOKEN || '',
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || '',
  TELEGRAM_ENABLE_NOTIFICATIONS: process.env.TELEGRAM_ENABLE_NOTIFICATIONS !== 'false',
  CHECK_INTERVAL: 30000, // 30 seconds
  MAX_RETRIES: 10,
  RETRY_DELAY: 5000, // 5 seconds
  NGROK_STARTUP_DELAY: 10000, // 10 seconds
  HEALTH_CHECK_TIMEOUT: 10000 // 10 seconds
};

// State management
let state = {
  ngrokUrl: null,
  ngrokProcess: null,
  backendReady: false,
  gistUpdated: false,
  lastHealthCheck: null,
  retryCount: 0,
  isShuttingDown: false
};

// Logging
const log = {
  info: (msg) => console.log(`[${new Date().toISOString()}] [INFO] ${msg}`),
  warn: (msg) => console.log(`[${new Date().toISOString()}] [WARN] ${msg}`),
  error: (msg) => console.log(`[${new Date().toISOString()}] [ERROR] ${msg}`),
  success: (msg) => console.log(`[${new Date().toISOString()}] [SUCCESS] ${msg}`)
};

// Utility functions
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const execCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stderr });
      } else {
        resolve(stdout.trim());
      }
    });
  });
};

const checkInternetConnectivity = async () => {
  return new Promise((resolve) => {
    const req = https.request('https://8.8.8.8', { timeout: 5000 }, (res) => {
      resolve(true);
    });
    
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
};

const sendTelegramNotification = async (message) => {
  if (!CONFIG.TELEGRAM_ENABLE_NOTIFICATIONS || !CONFIG.TELEGRAM_BOT_TOKEN || !CONFIG.TELEGRAM_CHAT_ID) {
    return;
  }

  try {
    const encodedMessage = encodeURIComponent(message);
    const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${CONFIG.TELEGRAM_CHAT_ID}&text=${encodedMessage}&parse_mode=HTML`;
    
    await new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });
    
    log.info('Telegram notification sent');
  } catch (error) {
    log.error(`Failed to send Telegram notification: ${error.message}`);
  }
};

const checkBackendHealth = async () => {
  return new Promise((resolve) => {
    const req = http.request(`http://localhost:${CONFIG.PORT}/api/ping`, { timeout: CONFIG.HEALTH_CHECK_TIMEOUT }, (res) => {
      resolve(res.statusCode === 200);
    });
    
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    
    req.end();
  });
};

const updateGitHubGist = async (url) => {
  if (!CONFIG.GITHUB_TOKEN) {
    log.warn('GitHub token not available, skipping gist update');
    return false;
  }

  try {
    const data = JSON.stringify({
      files: {
        [CONFIG.GIST_FILENAME]: {
          content: url
        }
      }
    });

    const options = {
      hostname: 'api.github.com',
      port: 443,
      path: `/gists/${CONFIG.GIST_ID}`,
      method: 'PATCH',
      headers: {
        'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            log.success(`Gist updated successfully: https://gist.github.com/${CONFIG.GIST_ID}`);
            resolve(true);
          } else {
            log.error(`Gist update failed with status ${res.statusCode}: ${responseData}`);
            resolve(false);
          }
        });
      });

      req.on('error', (error) => {
        log.error(`Gist update request failed: ${error.message}`);
        resolve(false);
      });

      req.write(data);
      req.end();
    });
  } catch (error) {
    log.error(`Gist update error: ${error.message}`);
    return false;
  }
};

const startNgrok = async () => {
  return new Promise((resolve, reject) => {
    log.info('Starting ngrok tunnel...');
    
    // Kill any existing ngrok processes
    exec('pkill -f ngrok', () => {
      sleep(2000).then(() => {
        const ngrokProcess = spawn('ngrok', ['http', CONFIG.PORT.toString()], {
          stdio: 'pipe',
          detached: false
        });

        state.ngrokProcess = ngrokProcess;

        ngrokProcess.stdout.on('data', (data) => {
          const output = data.toString();
          log.info(`Ngrok: ${output.trim()}`);
        });

        ngrokProcess.stderr.on('data', (data) => {
          const output = data.toString();
          log.warn(`Ngrok stderr: ${output.trim()}`);
        });

        ngrokProcess.on('error', (error) => {
          log.error(`Ngrok process error: ${error.message}`);
          reject(error);
        });

        ngrokProcess.on('exit', (code) => {
          if (code !== 0 && !state.isShuttingDown) {
            log.error(`Ngrok process exited with code ${code}`);
          }
        });

        // Wait for ngrok to start
        sleep(CONFIG.NGROK_STARTUP_DELAY).then(() => {
          resolve(ngrokProcess);
        });
      });
    });
  });
};

const getNgrokUrl = async () => {
  try {
    const response = await new Promise((resolve, reject) => {
      const req = http.request('http://127.0.0.1:4040/api/tunnels', { timeout: 5000 }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout'));
      });
      
      req.end();
    });

    const tunnels = response.tunnels || [];
    const httpsTunnel = tunnels.find(tunnel => tunnel.proto === 'https');
    
    if (httpsTunnel && httpsTunnel.public_url) {
      return httpsTunnel.public_url;
    }
    
    throw new Error('No HTTPS tunnel found');
  } catch (error) {
    log.error(`Failed to get ngrok URL: ${error.message}`);
    return null;
  }
};

const startBackend = async () => {
  try {
    log.info('Starting backend server via PM2...');
    await execCommand('pm2 start backendserver');
    
    // Wait for backend to be ready
    let attempts = 0;
    const maxAttempts = 20;
    
    while (attempts < maxAttempts) {
      await sleep(2000);
      const isHealthy = await checkBackendHealth();
      
      if (isHealthy) {
        state.backendReady = true;
        log.success('Backend server is ready');
        return true;
      }
      
      attempts++;
      log.info(`Backend health check attempt ${attempts}/${maxAttempts}`);
    }
    
    throw new Error('Backend failed to start within timeout');
  } catch (error) {
    log.error(`Failed to start backend: ${error.message}`);
    return false;
  }
};

const restartBackend = async () => {
  try {
    log.info('Restarting backend server...');
    await execCommand('pm2 restart backendserver');
    
    // Wait for backend to be ready
    let attempts = 0;
    const maxAttempts = 15;
    
    while (attempts < maxAttempts) {
      await sleep(2000);
      const isHealthy = await checkBackendHealth();
      
      if (isHealthy) {
        state.backendReady = true;
        log.success('Backend server restarted successfully');
        return true;
      }
      
      attempts++;
      log.info(`Backend restart health check attempt ${attempts}/${maxAttempts}`);
    }
    
    throw new Error('Backend failed to restart within timeout');
  } catch (error) {
    log.error(`Failed to restart backend: ${error.message}`);
    return false;
  }
};

const initializeSystem = async () => {
  log.info('=== Connection Manager Starting ===');
  await sendTelegramNotification('🚀 <b>Connection Manager Starting</b>\n\n📅 <b>Time:</b> ' + new Date().toISOString());
  
  // Check internet connectivity
  log.info('Checking internet connectivity...');
  let internetAvailable = false;
  let attempts = 0;
  
  while (!internetAvailable && attempts < CONFIG.MAX_RETRIES) {
    internetAvailable = await checkInternetConnectivity();
    if (!internetAvailable) {
      attempts++;
      log.warn(`No internet connection (attempt ${attempts}/${CONFIG.MAX_RETRIES}), retrying...`);
      await sleep(CONFIG.RETRY_DELAY);
    }
  }
  
  if (!internetAvailable) {
    const errorMsg = 'Failed to establish internet connection after maximum retries';
    log.error(errorMsg);
    await sendTelegramNotification('❌ <b>Connection Failed</b>\n\n📅 <b>Time:</b> ' + new Date().toISOString() + '\n❌ <b>Error:</b> ' + errorMsg);
    process.exit(1);
  }
  
  log.success('Internet connectivity confirmed');
  
  // Start ngrok
  try {
    await startNgrok();
    await sleep(5000); // Additional wait for ngrok to fully initialize
    
    // Get ngrok URL
    const ngrokUrl = await getNgrokUrl();
    if (!ngrokUrl) {
      throw new Error('Failed to get ngrok URL');
    }
    
    state.ngrokUrl = ngrokUrl;
    log.success(`Ngrok tunnel established: ${ngrokUrl}`);
    
    // Update GitHub gist
    const gistUpdated = await updateGitHubGist(ngrokUrl);
    state.gistUpdated = gistUpdated;
    
    if (gistUpdated) {
      await sendTelegramNotification('✅ <b>Ngrok Tunnel Active</b>\n\n📅 <b>Time:</b> ' + new Date().toISOString() + '\n🔗 <b>URL:</b> <code>' + ngrokUrl + '</code>\n📝 <b>Gist:</b> Updated');
    } else {
      await sendTelegramNotification('⚠️ <b>Ngrok Tunnel Active (Gist Update Failed)</b>\n\n📅 <b>Time:</b> ' + new Date().toISOString() + '\n🔗 <b>URL:</b> <code>' + ngrokUrl + '</code>');
    }
    
    // Start backend
    const backendStarted = await startBackend();
    if (backendStarted) {
      await sendTelegramNotification('🎉 <b>System Fully Operational</b>\n\n📅 <b>Time:</b> ' + new Date().toISOString() + '\n🔗 <b>URL:</b> <code>' + ngrokUrl + '</code>\n🌐 <b>Backend:</b> Ready\n📝 <b>Gist:</b> ' + (gistUpdated ? 'Updated' : 'Failed'));
    } else {
      await sendTelegramNotification('⚠️ <b>Partial System Ready</b>\n\n📅 <b>Time:</b> ' + new Date().toISOString() + '\n🔗 <b>URL:</b> <code>' + ngrokUrl + '</code>\n❌ <b>Backend:</b> Failed to start');
    }
    
  } catch (error) {
    log.error(`Initialization failed: ${error.message}`);
    await sendTelegramNotification('❌ <b>System Initialization Failed</b>\n\n📅 <b>Time:</b> ' + new Date().toISOString() + '\n❌ <b>Error:</b> ' + error.message);
    process.exit(1);
  }
};

const monitorSystem = async () => {
  log.info('Starting system monitoring...');
  
  setInterval(async () => {
    if (state.isShuttingDown) return;
    
    try {
      // Check internet connectivity
      const internetAvailable = await checkInternetConnectivity();
      if (!internetAvailable) {
        log.warn('Internet connection lost, waiting for recovery...');
        await sendTelegramNotification('⚠️ <b>Internet Connection Lost</b>\n\n📅 <b>Time:</b> ' + new Date().toISOString());
        return;
      }
      
      // Check ngrok tunnel
      const currentNgrokUrl = await getNgrokUrl();
      if (!currentNgrokUrl) {
        log.warn('Ngrok tunnel lost, restarting...');
        await sendTelegramNotification('🔄 <b>Ngrok Tunnel Lost - Restarting</b>\n\n📅 <b>Time:</b> ' + new Date().toISOString());
        
        // Restart ngrok
        if (state.ngrokProcess) {
          state.ngrokProcess.kill();
        }
        await startNgrok();
        await sleep(5000);
        
        const newNgrokUrl = await getNgrokUrl();
        if (newNgrokUrl && newNgrokUrl !== state.ngrokUrl) {
          state.ngrokUrl = newNgrokUrl;
          await updateGitHubGist(newNgrokUrl);
          await restartBackend();
          await sendTelegramNotification('✅ <b>Ngrok Tunnel Restored</b>\n\n📅 <b>Time:</b> ' + new Date().toISOString() + '\n🔗 <b>New URL:</b> <code>' + newNgrokUrl + '</code>');
        }
        return;
      }
      
      // Check if URL changed
      if (currentNgrokUrl !== state.ngrokUrl) {
        log.info(`Ngrok URL changed: ${state.ngrokUrl} -> ${currentNgrokUrl}`);
        state.ngrokUrl = currentNgrokUrl;
        
        const gistUpdated = await updateGitHubGist(currentNgrokUrl);
        await restartBackend();
        
        await sendTelegramNotification('🔄 <b>Ngrok URL Changed</b>\n\n📅 <b>Time:</b> ' + new Date().toISOString() + '\n🔗 <b>New URL:</b> <code>' + currentNgrokUrl + '</code>\n📝 <b>Gist:</b> ' + (gistUpdated ? 'Updated' : 'Failed'));
      }
      
      // Check backend health
      const backendHealthy = await checkBackendHealth();
      if (!backendHealthy && state.backendReady) {
        log.warn('Backend health check failed, restarting...');
        await sendTelegramNotification('🔄 <b>Backend Health Check Failed - Restarting</b>\n\n📅 <b>Time:</b> ' + new Date().toISOString());
        
        const restarted = await restartBackend();
        if (restarted) {
          await sendTelegramNotification('✅ <b>Backend Restarted Successfully</b>\n\n📅 <b>Time:</b> ' + new Date().toISOString());
        } else {
          await sendTelegramNotification('❌ <b>Backend Restart Failed</b>\n\n📅 <b>Time:</b> ' + new Date().toISOString());
        }
      } else if (backendHealthy && !state.backendReady) {
        state.backendReady = true;
        log.success('Backend is now healthy');
      }
      
      state.lastHealthCheck = new Date();
      
    } catch (error) {
      log.error(`Monitoring error: ${error.message}`);
    }
  }, CONFIG.CHECK_INTERVAL);
};

// Graceful shutdown
const gracefulShutdown = async () => {
  log.info('Shutting down gracefully...');
  state.isShuttingDown = true;
  
  if (state.ngrokProcess) {
    state.ngrokProcess.kill();
  }
  
  await sendTelegramNotification('🛑 <b>Connection Manager Shutting Down</b>\n\n📅 <b>Time:</b> ' + new Date().toISOString());
  
  process.exit(0);
};

// Signal handlers
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('uncaughtException', async (error) => {
  log.error(`Uncaught exception: ${error.message}`);
  await sendTelegramNotification('💥 <b>Critical Error</b>\n\n📅 <b>Time:</b> ' + new Date().toISOString() + '\n❌ <b>Error:</b> ' + error.message);
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  log.error(`Unhandled rejection at ${promise}: ${reason}`);
  await sendTelegramNotification('💥 <b>Unhandled Promise Rejection</b>\n\n📅 <b>Time:</b> ' + new Date().toISOString() + '\n❌ <b>Error:</b> ' + reason);
});

// Main execution
(async () => {
  try {
    await initializeSystem();
    await monitorSystem();
    
    log.success('Connection Manager is running and monitoring the system');
    
    // Keep the process alive
    setInterval(() => {
      if (!state.isShuttingDown) {
        log.info('Connection Manager heartbeat - System operational');
      }
    }, 300000); // 5 minutes
    
  } catch (error) {
    log.error(`Connection Manager failed to start: ${error.message}`);
    await sendTelegramNotification('❌ <b>Connection Manager Failed</b>\n\n📅 <b>Time:</b> ' + new Date().toISOString() + '\n❌ <b>Error:</b> ' + error.message);
    process.exit(1);
  }
})();
#!/usr/bin/env node
