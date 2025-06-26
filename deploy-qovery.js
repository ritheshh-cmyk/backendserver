const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Qovery deployment...');

// Check if Qovery CLI is installed
try {
  execSync('qovery --version', { stdio: 'pipe' });
  console.log('✅ Qovery CLI is installed');
} catch (error) {
  console.log('❌ Qovery CLI not found.');
  console.log('');
  console.log('📋 Installation Options:');
  console.log('');
  console.log('Option 1: Manual Installation (Recommended for Windows)');
  console.log('1. Visit: https://docs.qovery.com/docs/cli/');
  console.log('2. Download the appropriate binary for Windows');
  console.log('3. Add it to your PATH');
  console.log('');
  console.log('Option 2: Use Qovery Web Interface');
  console.log('1. Go to https://qovery.com');
  console.log('2. Sign up/Login');
  console.log('3. Connect your GitHub repository');
  console.log('4. Deploy using the web interface');
  console.log('');
  console.log('Option 3: Use GitHub Actions (Automatic)');
  console.log('1. Push your code to GitHub');
  console.log('2. Set up QOVERY_TOKEN in GitHub Secrets');
  console.log('3. The GitHub Actions workflow will deploy automatically');
  console.log('');
  console.log('📁 Configuration files created:');
  console.log('✅ .qovery.yml - Qovery configuration');
  console.log('✅ Dockerfile - Docker configuration');
  console.log('✅ .dockerignore - Docker ignore rules');
  console.log('✅ .github/workflows/deploy-qovery.yml - GitHub Actions workflow');
  console.log('✅ QOVERY_DEPLOYMENT.md - Detailed deployment guide');
  console.log('');
  console.log('🎯 Next Steps:');
  console.log('1. Commit and push these files to your repository');
  console.log('2. Follow one of the deployment options above');
  console.log('3. Set your FAST2SMS_API_KEY environment variable');
  console.log('');
  process.exit(0);
}

// Build the project
console.log('🔨 Building the project...');
try {
  execSync('cd backend && npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Check if user is logged into Qovery
try {
  execSync('qovery auth status', { stdio: 'pipe' });
  console.log('✅ Logged into Qovery');
} catch (error) {
  console.log('🔐 Please log into Qovery...');
  try {
    execSync('qovery auth login', { stdio: 'inherit' });
  } catch (loginError) {
    console.log('❌ Login failed. Please login manually:');
    console.log('   qovery auth login');
    process.exit(1);
  }
}

// Deploy to Qovery
console.log('🚀 Deploying to Qovery...');
try {
  execSync('qovery deploy', { stdio: 'inherit' });
  console.log('✅ Deployment completed successfully');
  
  // Get the deployment URL
  console.log('🔗 Getting deployment URL...');
  try {
    const url = execSync('qovery status', { encoding: 'utf8' });
    console.log('📋 Deployment status:');
    console.log(url);
    
    // Extract URL from status (you might need to adjust this based on actual output)
    const urlMatch = url.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      console.log(`🌐 Your app is live at: ${urlMatch[0]}`);
      console.log(`🏥 Health check: ${urlMatch[0]}/health`);
      console.log(`📊 API endpoints: ${urlMatch[0]}/api`);
    }
  } catch (statusError) {
    console.log('⚠️ Could not get deployment URL automatically');
    console.log('   Please check your Qovery dashboard for the URL');
  }
  
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
} 