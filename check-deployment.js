import https from 'https';

const RENDER_API_KEY = 'rnd_ONkrrujimHRQOPLaj7EgAnXuEz6C';
const SERVICE_ID = 'srv-d1e6k16mcj7s73a0ros0';

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

async function checkDeployment() {
  try {
    console.log('🔍 Checking detailed deployment information...');
    
    // Get service details
    console.log('\n📋 Service Details:');
    const serviceResponse = await makeRequest('GET', `/v1/services/${SERVICE_ID}`);
    if (serviceResponse.status === 200) {
      console.log('✅ Service found:', JSON.stringify(serviceResponse.data, null, 2));
    } else {
      console.log('❌ Failed to get service details:', serviceResponse.data);
    }
    
    // Get recent deploys
    console.log('\n📋 Recent Deployments:');
    const deploysResponse = await makeRequest('GET', `/v1/services/${SERVICE_ID}/deploys`);
    if (deploysResponse.status === 200) {
      console.log('✅ Deployments found:', deploysResponse.data.length);
      deploysResponse.data.forEach((deploy, index) => {
        console.log(`\n${index + 1}. Deployment ID: ${deploy.deploy.id}`);
        console.log(`   Status: ${deploy.deploy.status}`);
        console.log(`   Created: ${deploy.deploy.createdAt}`);
        console.log(`   Finished: ${deploy.deploy.finishedAt || 'Still running'}`);
        if (deploy.deploy.error) {
          console.log(`   Error: ${deploy.deploy.error}`);
        }
      });
    } else {
      console.log('❌ Failed to get deployments:', deploysResponse.data);
    }
    
    // Get environment variables
    console.log('\n📋 Environment Variables:');
    const envResponse = await makeRequest('GET', `/v1/services/${SERVICE_ID}/env-vars`);
    if (envResponse.status === 200) {
      console.log('✅ Environment variables:', JSON.stringify(envResponse.data, null, 2));
    } else {
      console.log('❌ Failed to get environment variables:', envResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDeployment(); 