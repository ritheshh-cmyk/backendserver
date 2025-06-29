#!/usr/bin/env node

// === Auto Deploy to Vercel ===
// Automatically deploys changes to Vercel when files are modified

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const execAsync = util.promisify(exec);

// Configuration
const config = {
    PROJECT_DIR: process.cwd(),
    VERCEL_PROJECT_NAME: 'backend',
    DEPLOY_INTERVAL: 30000, // 30 seconds
    WATCH_FILES: ['index.js', 'package.json', 'vercel.json'],
    ENABLE_AUTO_DEPLOY: process.env.ENABLE_AUTO_DEPLOY !== 'false'
};

// State tracking
let state = {
    lastDeploy: new Date(),
    isDeploying: false,
    deployCount: 0,
    lastFileChange: null
};

// Utility functions
function log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
}

async function deployToVercel() {
    if (state.isDeploying) {
        log('⚠️ Deployment already in progress, skipping...');
        return;
    }

    state.isDeploying = true;
    state.deployCount++;

    try {
        log(`🚀 Starting deployment #${state.deployCount}...`);
        
        // Deploy to Vercel
        const { stdout, stderr } = await execAsync('vercel --prod --yes', {
            cwd: config.PROJECT_DIR,
            timeout: 60000 // 60 seconds timeout
        });

        if (stderr && !stderr.includes('Warning')) {
            throw new Error(stderr);
        }

        state.lastDeploy = new Date();
        log(`✅ Deployment #${state.deployCount} successful!`);
        log(`📊 Output: ${stdout.substring(0, 200)}...`);

        // Extract deployment URL
        const urlMatch = stdout.match(/https:\/\/[^\s]+/);
        if (urlMatch) {
            log(`🌐 Deployed to: ${urlMatch[0]}`);
        }

    } catch (error) {
        log(`❌ Deployment #${state.deployCount} failed: ${error.message}`);
    } finally {
        state.isDeploying = false;
    }
}

function watchFiles() {
    log('👀 Watching for file changes...');
    
    config.WATCH_FILES.forEach(file => {
        const filePath = path.join(config.PROJECT_DIR, file);
        
        if (fs.existsSync(filePath)) {
            fs.watchFile(filePath, { interval: 1000 }, (curr, prev) => {
                if (curr.mtime > prev.mtime) {
                    state.lastFileChange = new Date();
                    log(`📝 File changed: ${file}`);
                    
                    if (config.ENABLE_AUTO_DEPLOY) {
                        // Wait a bit to avoid multiple rapid deployments
                        setTimeout(deployToVercel, 2000);
                    }
                }
            });
        }
    });
}

async function checkVercelStatus() {
    try {
        const { stdout } = await execAsync('vercel ls', {
            cwd: config.PROJECT_DIR,
            timeout: 10000
        });
        
        log('📊 Vercel project status:');
        console.log(stdout);
        
    } catch (error) {
        log(`❌ Failed to check Vercel status: ${error.message}`);
    }
}

async function setupAutoDeploy() {
    log('🔧 Setting up auto-deploy system...');
    
    // Check if Vercel is configured
    try {
        await execAsync('vercel whoami', { cwd: config.PROJECT_DIR });
        log('✅ Vercel CLI is configured');
    } catch (error) {
        log('❌ Vercel CLI not configured. Please run: vercel login');
        process.exit(1);
    }
    
    // Check project status
    await checkVercelStatus();
    
    // Start file watching
    watchFiles();
    
    log('🎉 Auto-deploy system ready!');
    log(`📁 Watching files: ${config.WATCH_FILES.join(', ')}`);
    log(`⏰ Deploy interval: ${config.DEPLOY_INTERVAL}ms`);
    log(`🔄 Auto-deploy: ${config.ENABLE_AUTO_DEPLOY ? 'Enabled' : 'Disabled'}`);
}

// Handle process termination
process.on('SIGINT', () => {
    log('🛑 Auto-deploy system shutting down...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    log('🛑 Auto-deploy system shutting down...');
    process.exit(0);
});

// Start auto-deploy system
setupAutoDeploy().catch(error => {
    log(`❌ Failed to setup auto-deploy: ${error.message}`);
    process.exit(1);
}); 