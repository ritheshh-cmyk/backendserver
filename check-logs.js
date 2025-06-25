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

async function checkLogs() {
  console.log('🔍 Checking deployment logs...\n');
  
  try {
    // Step 1: Get all services
    console.log('📋 Step 1: Fetching services...');
    const servicesResponse = await makeRequest('GET', '/v1/services');
    
    if (servicesResponse.status !== 200) {
      console.log('❌ Failed to fetch services:', servicesResponse.data);
      return;
    }
    
    // Step 2: Find the backend service
    console.log('🔍 Step 2: Looking for backend service...');
    const backendService = servicesResponse.data.find(
      service => service.service.name === 'mobile-repair-backend' || service.service.name === 'backendmobile'
    );
    
    if (!backendService) {
      console.log('❌ Backend service not found. Available services:');
      servicesResponse.data.forEach(service => {
        console.log(`   - ${service.service.name} (${service.service.id})`);
      });
      return;
    }
    
    const serviceId = backendService.service.id;
    const serviceName = backendService.service.name;
    console.log(`✅ Found service: ${serviceName} (ID: ${serviceId})`);
    
    // Step 3: Get deploys for the service
    console.log('📦 Step 3: Fetching deployment history...');
    const deploysResponse = await makeRequest('GET', `/v1/services/${serviceId}/deploys`);
    
    if (deploysResponse.status !== 200) {
      console.log('❌ Failed to fetch deploys:', deploysResponse.data);
      return;
    }
    
    if (!Array.isArray(deploysResponse.data)) {
      console.log('❌ Unexpected deploys response format:', deploysResponse.data);
      return;
    }
    
    if (deploysResponse.data.length === 0) {
      console.log('❌ No deploys found for this service.');
      return;
    }
    
    console.log(`📊 Found ${deploysResponse.data.length} deployments`);
    
    // Step 4: Get the latest deploy
    const latestDeploy = deploysResponse.data[0];
    const deployId = latestDeploy.deploy.id;
    const deployStatus = latestDeploy.deploy.status;
    const deployCreated = latestDeploy.deploy.createdAt;
    
    console.log(`\n🎯 Latest Deployment:`);
    console.log(`   ID: ${deployId}`);
    console.log(`   Status: ${deployStatus}`);
    console.log(`   Created: ${deployCreated}`);
    
    // Step 5: Fetch logs for the latest deploy
    console.log('\n📜 Step 4: Fetching deployment logs...');
    const logsResponse = await makeRequest('GET', `/v1/deploys/${deployId}/logs`);
    
    if (logsResponse.status !== 200) {
      console.log('❌ Failed to fetch logs:', logsResponse.data);
      console.log('\n💡 Alternative: Check logs manually at:');
      console.log(`   https://dashboard.render.com/web/srv-${serviceId}/logs`);
      return;
    }
    
    // Step 6: Display logs
    console.log('\n📋 DEPLOYMENT LOGS:');
    console.log('='.repeat(50));
    
    if (logsResponse.data && logsResponse.data.logs) {
      console.log(logsResponse.data.logs);
    } else if (typeof logsResponse.data === 'string') {
      console.log(logsResponse.data);
    } else {
      console.log('Raw response:', JSON.stringify(logsResponse.data, null, 2));
    }
    
    console.log('='.repeat(50));
    
    // Step 7: Provide additional info
    console.log('\n📊 Deployment Summary:');
    console.log(`   Service: ${serviceName}`);
    console.log(`   URL: https://${serviceName}.onrender.com`);
    console.log(`   Dashboard: https://dashboard.render.com/web/srv-${serviceId}`);
    console.log(`   Logs URL: https://dashboard.render.com/web/srv-${serviceId}/logs`);
    
  } catch (error) {
    console.error('❌ Error checking logs:', error.message);
    console.log('\n💡 Try checking manually at: https://dashboard.render.com');
  }
}

// Run the script
checkLogs(); 