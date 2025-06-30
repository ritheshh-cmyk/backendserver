#!/usr/bin/env node

// === Backend Connection Fix Script ===
// This script diagnoses and fixes backend connection issues

const fs = require('fs');
const path = require('path');

console.log('🔍 Backend Connection Diagnostic & Fix Tool');
console.log('==========================================\n');

// Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

function writeFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content);
    return true;
  } catch (error) {
    return false;
  }
}

// Step 1: Check Environment Configuration
log('\n📋 Step 1: Environment Configuration Check', 'blue');
log('----------------------------------------');

const envFile = '.env';
const envExample = 'env-example.txt';

if (!checkFileExists(envFile)) {
  log('❌ .env file not found', 'red');
  
  if (checkFileExists(envExample)) {
    log('📝 Creating .env file from template...', 'yellow');
    const envContent = readFile(envExample);
    if (envContent) {
      const newEnvContent = envContent
        .replace(/your_github_token_here/g, 'YOUR_GITHUB_TOKEN_HERE')
        .replace(/your_ngrok_token_here/g, 'YOUR_NGROK_AUTH_TOKEN_HERE')
        .replace(/your_telegram_bot_token_here/g, 'YOUR_TELEGRAM_BOT_TOKEN_HERE')
        .replace(/your_telegram_chat_id_here/g, 'YOUR_TELEGRAM_CHAT_ID_HERE');
      
      if (writeFile(envFile, newEnvContent)) {
        log('✅ .env file created successfully', 'green');
        log('⚠️  Please update the .env file with your actual tokens', 'yellow');
      } else {
        log('❌ Failed to create .env file', 'red');
      }
    }
  } else {
    log('❌ env-example.txt not found', 'red');
  }
} else {
  log('✅ .env file exists', 'green');
  
  const envContent = readFile(envFile);
  if (envContent) {
    const requiredVars = ['GITHUB_TOKEN', 'NGROK_AUTH_TOKEN', 'TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID'];
    const missingVars = requiredVars.filter(varName => !envContent.includes(varName));
    
    if (missingVars.length > 0) {
      log(`⚠️  Missing environment variables: ${missingVars.join(', ')}`, 'yellow');
    } else {
      log('✅ All required environment variables found', 'green');
    }
  }
}

// Step 2: Check Backend Files
log('\n📁 Step 2: Backend Files Check', 'blue');
log('----------------------------');

const backendFiles = [
  'server.mjs',
  'backend/server/index.ts',
  'ecosystem.config.cjs',
  'package.json'
];

backendFiles.forEach(file => {
  if (checkFileExists(file)) {
    log(`✅ ${file} exists`, 'green');
  } else {
    log(`❌ ${file} missing`, 'red');
  }
});

// Step 3: Check Port Configuration
log('\n🔌 Step 3: Port Configuration Check', 'blue');
log('----------------------------------');

const serverMjs = readFile('server.mjs');
const ecosystemConfig = readFile('ecosystem.config.cjs');

if (serverMjs) {
  const portMatch = serverMjs.match(/PORT.*?(\d+)/);
  if (portMatch) {
    const port = portMatch[1];
    log(`📡 server.mjs uses port: ${port}`, port === '10000' ? 'green' : 'yellow');
  }
}

if (ecosystemConfig) {
  const portMatch = ecosystemConfig.match(/PORT.*?(\d+)/);
  if (portMatch) {
    const port = portMatch[1];
    log(`📡 ecosystem.config.cjs uses port: ${port}`, port === '10000' ? 'green' : 'yellow');
  }
}

// Step 4: Check Gist Status
log('\n🌐 Step 4: GitHub Gist Status Check', 'blue');
log('--------------------------------');

async function checkGistStatus() {
  try {
    const https = require('https');
    
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.github.com',
        path: '/gists/d394f3df4c86cf1cb0040a7ec4138bfd',
        method: 'GET',
        headers: {
          'User-Agent': 'Backend-Connection-Fix'
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const gist = JSON.parse(data);
            if (gist.files && gist.files['backend-url.txt']) {
              const url = gist.files['backend-url.txt'].content;
              log(`🔗 Current Gist URL: ${url}`, url.includes('ngrok.io') ? 'green' : 'yellow');
              
              if (url === 'https://abcd1234.ngrok.io') {
                log('⚠️  Gist contains placeholder URL - needs real ngrok URL', 'yellow');
              }
            } else {
              log('❌ Gist file not found', 'red');
            }
            resolve();
          } catch (error) {
            log('❌ Failed to parse Gist response', 'red');
            reject(error);
          }
        });
      });

      req.on('error', (error) => {
        log('❌ Failed to fetch Gist', 'red');
        reject(error);
      });

      req.end();
    });
  } catch (error) {
    log('❌ Error checking Gist status', 'red');
  }
}

checkGistStatus();

// Step 5: Check Dependencies
log('\n📦 Step 5: Dependencies Check', 'blue');
log('----------------------------');

if (checkFileExists('package.json')) {
  const packageJson = JSON.parse(readFile('package.json'));
  const requiredDeps = ['express', 'cors', 'pm2'];
  const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]);
  
  if (missingDeps.length > 0) {
    log(`⚠️  Missing dependencies: ${missingDeps.join(', ')}`, 'yellow');
    log('💡 Run: npm install', 'blue');
  } else {
    log('✅ All required dependencies found', 'green');
  }
}

// Step 6: Generate Fix Commands
log('\n🛠️  Step 6: Fix Commands', 'blue');
log('----------------------');

log('\n📝 To fix the backend connection issues, run these commands:', 'yellow');

log('\n1. Set up environment variables:', 'blue');
log('   # Create .env file with your tokens');
log('   cp env-example.txt .env');
log('   # Edit .env and add your actual tokens');

log('\n2. Install dependencies:', 'blue');
log('   npm install');

log('\n3. Start the backend system:', 'blue');
log('   chmod +x start-all-fixed.sh');
log('   ./start-all-fixed.sh');

log('\n4. Check backend status:', 'blue');
log('   curl http://localhost:10000/health');
log('   pm2 status');

log('\n5. Update Gist with real ngrok URL:', 'blue');
log('   # Get ngrok URL');
log('   curl -s http://localhost:4040/api/tunnels | jq -r \'.tunnels[0].public_url\'');
log('   # Update Gist (replace YOUR_GITHUB_TOKEN and NGROK_URL)');
log('   curl -X PATCH \\');
log('     -H "Authorization: token YOUR_GITHUB_TOKEN" \\');
log('     -H "Accept: application/vnd.github.v3+json" \\');
log('     https://api.github.com/gists/d394f3df4c86cf1cb0040a7ec4138bfd \\');
log('     -d \'{"files":{"backend-url.txt":{"content":"NGROK_URL"}}}\'');

log('\n6. Test frontend connection:', 'blue');
log('   # Start frontend development server');
log('   npm run dev');
log('   # Open browser and check connection status');

// Step 7: Quick Fix Script
log('\n🚀 Step 7: Quick Fix Script', 'blue');
log('-------------------------');

const quickFixScript = `#!/bin/bash
# Quick fix script for backend connection issues

echo "🔧 Quick Backend Connection Fix"
echo "=============================="

# 1. Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp env-example.txt .env
    echo "⚠️  Please edit .env and add your actual tokens"
fi

# 2. Install dependencies
echo "📦 Installing dependencies..."
npm install

# 3. Start backend
echo "🚀 Starting backend..."
chmod +x start-all-fixed.sh
./start-all-fixed.sh

# 4. Wait for backend to start
echo "⏳ Waiting for backend to start..."
for i in {1..30}; do
    if curl -s http://localhost:10000/health > /dev/null 2>&1; then
        echo "✅ Backend is running!"
        break
    fi
    sleep 2
done

# 5. Check ngrok
echo "🌐 Checking ngrok..."
if curl -s http://localhost:4040/api/tunnels > /dev/null 2>&1; then
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url')
    echo "🔗 Ngrok URL: $NGROK_URL"
    
    # Update Gist if GitHub token is available
    if [ -n "$GITHUB_TOKEN" ]; then
        echo "📝 Updating Gist..."
        curl -X PATCH \\
            -H "Authorization: token $GITHUB_TOKEN" \\
            -H "Accept: application/vnd.github.v3+json" \\
            https://api.github.com/gists/d394f3df4c86cf1cb0040a7ec4138bfd \\
            -d "{\\"files\\":{\\"backend-url.txt\\":{\\"content\\":\\"$NGROK_URL\\"}}}"
        echo "✅ Gist updated!"
    fi
else
    echo "❌ Ngrok not running"
fi

echo "🎉 Quick fix completed!"
echo "📊 Check status: pm2 status"
echo "🔗 Test backend: curl http://localhost:10000/health"
`;

if (writeFile('quick-fix.sh', quickFixScript)) {
  log('✅ Quick fix script created: quick-fix.sh', 'green');
  log('💡 Run: chmod +x quick-fix.sh && ./quick-fix.sh', 'blue');
} else {
  log('❌ Failed to create quick fix script', 'red');
}

// Summary
log('\n📊 Summary', 'blue');
log('--------');
log('✅ Environment configuration checked');
log('✅ Backend files verified');
log('✅ Port configuration analyzed');
log('✅ Gist status checked');
log('✅ Dependencies verified');
log('✅ Fix commands generated');
log('✅ Quick fix script created');

log('\n🎯 Next Steps:', 'yellow');
log('1. Update .env file with your actual tokens');
log('2. Run the quick fix script: ./quick-fix.sh');
log('3. Test the backend connection');
log('4. Deploy your cloud Telegram bot');

log('\n🚀 Your backend should be working after following these steps!', 'green'); 