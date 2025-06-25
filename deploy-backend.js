import https from 'https';

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
    
    // First, get the owner ID
    console.log('📋 Getting owner information...');
    const ownerResponse = await makeRequest('GET', '/v1/owners');
    
    if (ownerResponse.status !== 200) {
      console.log('❌ Failed to get owner information:', ownerResponse.data);
      return;
    }
    
    const owner = ownerResponse.data[0].owner; // Get the owner from the first item
    console.log(`✅ Found owner: ${owner.name} (ID: ${owner.id})`);
    
    // Check if service already exists
    console.log('📋 Checking existing services...');
    const servicesResponse = await makeRequest('GET', '/v1/services');
    
    if (servicesResponse.status === 200) {
      const existingService = servicesResponse.data.find(
        service => service.service.name === 'mobile-repair-backend'
      );
      
      if (existingService) {
        console.log('✅ Service already exists, triggering manual deploy...');
        const deployResponse = await makeRequest('POST', `/v1/services/${existingService.service.id}/deploys`);
        
        if (deployResponse.status === 201) {
          console.log('✅ Deployment triggered successfully!');
          console.log(`🌐 Your backend will be available at: https://${existingService.service.serviceDetailsPath}`);
        } else {
          console.log('❌ Failed to trigger deployment:', deployResponse.data);
        }
        return;
      }
    }
    
    // Create new service
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
      console.log('✅ Service created successfully!');
      console.log(`🌐 Your backend will be available at: https://${createResponse.data.service.serviceDetailsPath}`);
      console.log('⏳ Deployment is in progress...');
    } else {
      console.log('❌ Failed to create service:', createResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
  }
}

deployBackend(); 