const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Railway deployment...');

// Check if Railway CLI is installed
try {
  execSync('railway --version', { stdio: 'pipe' });
  console.log('✅ Railway CLI is installed');
} catch (error) {
  console.log('❌ Railway CLI not found. Installing...');
  execSync('npm install -g @railway/cli', { stdio: 'inherit' });
}

// Navigate to backend directory
process.chdir('backend');

// Build the project
console.log('🔨 Building the project...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Check if user is logged into Railway
try {
  execSync('railway whoami', { stdio: 'pipe' });
  console.log('✅ Logged into Railway');
} catch (error) {
  console.log('🔐 Please log into Railway...');
  execSync('railway login', { stdio: 'inherit' });
}

// Deploy to Railway
console.log('🚀 Deploying to Railway...');
try {
  execSync('railway up', { stdio: 'inherit' });
  console.log('✅ Deployment completed successfully');
  
  // Get the deployment URL
  console.log('🔗 Getting deployment URL...');
  const url = execSync('railway domain', { encoding: 'utf8' }).trim();
  console.log(`🌐 Your app is live at: ${url}`);
  console.log(`🏥 Health check: ${url}/health`);
  console.log(`📊 API endpoints: ${url}/api`);
  
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
} 