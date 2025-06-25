#!/usr/bin/env node

import https from 'https';
import readline from 'readline';

const RENDER_API_KEY = 'rnd_ONkrrujimHRQOPLaj7EgAnXuEz6C';
const REPO_URL = 'https://github.com/ritheshh-cmyk/backendmobile.git';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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

async function showHelp() {
  console.log(`
🚀 Render CLI - Custom Deployment Tool
=====================================

Available commands:
  deploy          - Deploy backend to Render
  services        - List all services
  status          - Check deployment status
  help            - Show this help message
  exit            - Exit the CLI

Usage: node render-cli.js [command]
`);
}

async function listServices() {
  try {
    console.log('📋 Fetching services...');
    const response = await makeRequest('GET', '/v1/services');
    
    if (response.status === 200) {
      console.log('\n🌐 Your Render Services:');
      console.log('========================');
      
      if (response.data.length === 0) {
        console.log('No services found.');
      } else {
        response.data.forEach((service, index) => {
          console.log(`${index + 1}. ${service.service.name}`);
          console.log(`   ID: ${service.service.id}`);
          console.log(`   Status: ${service.service.status}`);
          console.log(`   URL: https://${service.service.serviceDetailsPath}`);
          console.log('');
        });
      }
    } else {
      console.log('❌ Failed to fetch services:', response.data);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function deployBackend() {
  try {
    console.log('🚀 Starting backend deployment...');
    
    // Get owner
    const ownerResponse = await makeRequest('GET', '/v1/owners');
    if (ownerResponse.status !== 200) {
      console.log('❌ Failed to get owner information');
      return;
    }
    
    const owner = ownerResponse.data[0].owner;
    console.log(`✅ Owner: ${owner.name}`);
    
    // Check existing services
    const servicesResponse = await makeRequest('GET', '/v1/services');
    let serviceId = null;
    
    if (servicesResponse.status === 200) {
      // Look for either "mobile-repair-backend" or "backendmobile"
      const existingService = servicesResponse.data.find(
        service => service.service.name === 'mobile-repair-backend' || service.service.name === 'backendmobile'
      );
      
      if (existingService) {
        serviceId = existingService.service.id;
        console.log(`✅ Found existing service: ${existingService.service.name} (ID: ${serviceId})`);
        console.log('🚀 Triggering redeploy...');
      }
    }
    
    if (!serviceId) {
      console.log('❌ No existing service found. Creating new service requires payment.');
      console.log('💡 Try deploying via dashboard: https://dashboard.render.com');
      return;
    }
    
    // Trigger deployment
    console.log('🚀 Triggering deployment...');
    const deployResponse = await makeRequest('POST', `/v1/services/${serviceId}/deploys`);
    
    if (deployResponse.status === 201) {
      console.log('✅ Deployment triggered successfully!');
      if (deployResponse.data && deployResponse.data.deploy) {
        console.log(`🔗 Deployment ID: ${deployResponse.data.deploy.id}`);
      }
      console.log('⏳ Check status at: https://dashboard.render.com');
      
      // Get service details for URL
      const serviceResponse = await makeRequest('GET', `/v1/services/${serviceId}`);
      if (serviceResponse.status === 200) {
        const service = serviceResponse.data.service;
        console.log(`🌐 Service URL: https://${service.serviceDetailsPath}`);
      }
    } else {
      console.log('❌ Failed to trigger deployment:', deployResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
  }
}

async function checkStatus() {
  try {
    console.log('📊 Checking deployment status...');
    const response = await makeRequest('GET', '/v1/services');
    
    if (response.status === 200) {
      const backendService = response.data.find(
        service => service.service.name === 'mobile-repair-backend' || service.service.name === 'backendmobile'
      );
      
      if (backendService) {
        console.log(`\n📋 Service: ${backendService.service.name}`);
        console.log(`🆔 ID: ${backendService.service.id}`);
        console.log(`📊 Status: ${backendService.service.status}`);
        console.log(`🌐 URL: https://${backendService.service.serviceDetailsPath}`);
      } else {
        console.log('❌ Backend service not found. Run "deploy" first.');
      }
    } else {
      console.log('❌ Failed to check status:', response.data);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'deploy':
      await deployBackend();
      break;
    case 'services':
      await listServices();
      break;
    case 'status':
      await checkStatus();
      break;
    case 'help':
    case '--help':
    case '-h':
      await showHelp();
      break;
    default:
      console.log('🚀 Render CLI - Custom Deployment Tool');
      console.log('Type "node render-cli.js help" for available commands');
      console.log('');
      console.log('Quick deploy: node render-cli.js deploy');
      console.log('Check status: node render-cli.js status');
      console.log('List services: node render-cli.js services');
  }
  
  rl.close();
}

main().catch(console.error); 