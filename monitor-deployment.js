#!/usr/bin/env node

import https from 'https';

const RENDER_API_KEY = 'rnd_ONkrrujimHRQOPLaj7EgAnXuEz6C';

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.render.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${RENDER_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function monitorDeployment() {
  console.log('🔍 Monitoring deployment status...\n');
  
  const serviceName = 'backendmobile';
  const serviceId = 'srv-d1e6k16mcj7s73a0ros0';
  
  let lastStatus = null;
  let checkCount = 0;
  
  const checkStatus = async () => {
    checkCount++;
    const timestamp = new Date().toLocaleTimeString();
    
    try {
      // Get service details
      const serviceResponse = await makeRequest('GET', `/v1/services/${serviceId}`);
      
      if (serviceResponse.status === 200) {
        const service = serviceResponse.data.service;
        const currentStatus = service.status;
        
        // Get latest deploy
        const deploysResponse = await makeRequest('GET', `/v1/services/${serviceId}/deploys`);
        
        if (deploysResponse.status === 200 && deploysResponse.data.length > 0) {
          const latestDeploy = deploysResponse.data[0];
          const deployStatus = latestDeploy.deploy.status;
          const deployCreated = new Date(latestDeploy.deploy.createdAt).toLocaleTimeString();
          
          // Only show if status changed or first check
          if (currentStatus !== lastStatus || checkCount === 1) {
            console.log(`\n[${timestamp}] Check #${checkCount}`);
            console.log(`📊 Service Status: ${currentStatus}`);
            console.log(`🚀 Latest Deploy: ${deployStatus} (created: ${deployCreated})`);
            console.log(`🌐 URL: https://${serviceName}.onrender.com`);
            
            if (currentStatus === 'live') {
              console.log('✅ Deployment successful! Service is live.');
              console.log('🎉 Your backend is ready to use!');
              process.exit(0);
            } else if (currentStatus === 'build_failed') {
              console.log('❌ Build failed. Check logs for details.');
              console.log(`📋 Logs: https://dashboard.render.com/web/srv-${serviceId}/logs`);
            } else if (currentStatus === 'suspended') {
              console.log('⏸️ Service is suspended. Payment required to activate.');
            }
            
            lastStatus = currentStatus;
          } else {
            process.stdout.write(`\r[${timestamp}] Still ${currentStatus}... (check #${checkCount})`);
          }
        }
      } else {
        console.log(`\n[${timestamp}] ❌ Failed to get service status`);
      }
    } catch (error) {
      console.log(`\n[${timestamp}] ❌ Error: ${error.message}`);
    }
  };
  
  // Initial check
  await checkStatus();
  
  // Check every 30 seconds
  const interval = setInterval(checkStatus, 30000);
  
  // Stop after 10 minutes
  setTimeout(() => {
    clearInterval(interval);
    console.log('\n⏰ Monitoring stopped after 10 minutes.');
    console.log('💡 Check manually at: https://dashboard.render.com');
    process.exit(0);
  }, 600000);
  
  // Handle Ctrl+C
  process.on('SIGINT', () => {
    clearInterval(interval);
    console.log('\n👋 Monitoring stopped by user.');
    process.exit(0);
  });
}

// Run the monitor
monitorDeployment(); 