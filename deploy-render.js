import https from 'https';
import fs from 'fs';
import path from 'path';

const RENDER_API_KEY = 'rnd_ONkrrujimHRQOPLaj7EgAnXuEz6C';
const REPO_URL = 'https://github.com/ritheshh-cmyk/backendmobile.git';

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

async function deployBackend() {
  try {
    console.log('🚀 Starting backend deployment to Render...');
    
    // Step 1: Get owner information
    console.log('📋 Getting owner information...');
    const ownerResponse = await makeRequest('GET', '/v1/owners');
    
    if (ownerResponse.status !== 200) {
      console.log('❌ Failed to get owner information:', ownerResponse.data);
      return;
    }
    
    const owner = ownerResponse.data[0].owner;
    console.log(`✅ Found owner: ${owner.name} (ID: ${owner.id})`);
    
    // Step 2: Check if service already exists
    console.log('📋 Checking existing services...');
    const servicesResponse = await makeRequest('GET', '/v1/services');
    
    let serviceId = null;
    if (servicesResponse.status === 200) {
      const existingService = servicesResponse.data.find(
        service => service.service.name === 'mobile-repair-backend'
      );
      
      if (existingService) {
        serviceId = existingService.service.id;
        console.log(`✅ Found existing service: ${existingService.service.name} (ID: ${serviceId})`);
      }
    }
    
    // Step 3: Create or update service
    if (!serviceId) {
      console.log('🔧 Creating new service...');
      const deployConfig = {
        name: 'mobile-repair-backend',
        type: 'web_service',
        env: 'node',
        buildCommand: 'npm install && npm run build',
        startCommand: 'npm run start',
        repo: REPO_URL,
        branch: 'main',
        ownerId: owner.id,
        serviceDetails: {
          env: 'node',
          buildCommand: 'npm install && npm run build',
          startCommand: 'npm run start',
          repo: REPO_URL,
          branch: 'main',
          envSpecificDetails: {
            buildCommand: 'npm install && npm run build',
            startCommand: 'npm run start'
          }
        },
        envVars: [
          { key: 'NODE_ENV', value: 'production' },
          { key: 'PORT', value: '10000' }
        ]
      };
      
      const createResponse = await makeRequest('POST', '/v1/services', deployConfig);
      
      if (createResponse.status === 201) {
        serviceId = createResponse.data.service.id;
        console.log('✅ Service created successfully!');
        console.log(`🌐 Service URL: https://${createResponse.data.service.serviceDetailsPath}`);
      } else {
        console.log('❌ Failed to create service:', createResponse.data);
        return;
      }
    }
    
    // Step 4: Trigger deployment
    console.log('🚀 Triggering deployment...');
    const deployResponse = await makeRequest('POST', `/v1/services/${serviceId}/deploys`);
    
    if (deployResponse.status === 201) {
      console.log('✅ Deployment triggered successfully!');
      console.log(`🔗 Deployment ID: ${deployResponse.data.deploy.id}`);
      console.log('⏳ Deployment is in progress...');
      console.log('📊 Check deployment status at: https://dashboard.render.com');
    } else {
      console.log('❌ Failed to trigger deployment:', deployResponse.data);
    }
    
    // Step 5: Get service details
    console.log('📋 Getting service details...');
    const serviceResponse = await makeRequest('GET', `/v1/services/${serviceId}`);
    
    if (serviceResponse.status === 200) {
      const service = serviceResponse.data.service;
      console.log(`🌐 Your backend will be available at: https://${service.serviceDetailsPath}`);
      console.log(`📊 Service status: ${service.status}`);
    }
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
  }
}

// Run the deployment
deployBackend(); 