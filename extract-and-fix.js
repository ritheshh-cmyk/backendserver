#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
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

async function extractLogs() {
  console.log('📜 Extracting deployment logs...');
  
  try {
    const serviceId = 'srv-d1e6k16mcj7s73a0ros0';
    
    // Get latest deploy
    const deploysResponse = await makeRequest('GET', `/v1/services/${serviceId}/deploys`);
    if (deploysResponse.status !== 200 || !deploysResponse.data.length) {
      console.log('❌ No deploys found');
      return null;
    }
    
    const latestDeploy = deploysResponse.data[0];
    const deployId = latestDeploy.deploy.id;
    
    // Get logs for the latest deploy
    const logsResponse = await makeRequest('GET', `/v1/deploys/${deployId}/logs`);
    if (logsResponse.status !== 200) {
      console.log('❌ Failed to fetch logs');
      return null;
    }
    
    return logsResponse.data;
  } catch (error) {
    console.log('❌ Error extracting logs:', error.message);
    return null;
  }
}

function parseTypeScriptErrors(logs) {
  console.log('🔍 Parsing TypeScript errors...');
  
  const errors = [];
  const lines = logs.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Match TypeScript error pattern: file(line,col): error TSxxxx: message
    const match = line.match(/(\S+)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)/);
    if (match) {
      errors.push({
        file: match[1],
        line: parseInt(match[2]),
        column: parseInt(match[3]),
        code: match[4],
        message: match[5]
      });
    }
  }
  
  console.log(`📋 Found ${errors.length} TypeScript errors:`);
  errors.forEach(error => {
    console.log(`   ${error.file}:${error.line}:${error.column} - ${error.code}: ${error.message}`);
  });
  
  return errors;
}

function fixErrors(errors) {
  console.log('🔧 Fixing errors...');
  let fixed = false;
  
  // Group errors by file
  const errorsByFile = {};
  errors.forEach(error => {
    if (!errorsByFile[error.file]) {
      errorsByFile[error.file] = [];
    }
    errorsByFile[error.file].push(error);
  });
  
  // Fix each file
  Object.keys(errorsByFile).forEach(file => {
    if (!fs.existsSync(file)) {
      console.log(`⚠️ File not found: ${file}`);
      return;
    }
    
    console.log(`🔧 Fixing ${file}...`);
    let content = fs.readFileSync(file, 'utf8');
    const fileErrors = errorsByFile[file];
    
    fileErrors.forEach(error => {
      switch (error.code) {
        case 'TS2305': // Module has no exported member
          if (error.message.includes('schema')) {
            content = content.replace(
              /import\s*{\s*schema\s*}\s*from\s*['"]@shared\/schema['"]/g,
              '// import { schema } from \'@shared/schema\' // Removed unused import'
            );
            fixed = true;
          }
          break;
          
        case 'TS7006': // Parameter implicitly has 'any' type
          if (error.message.includes('sum') || error.message.includes('purchase')) {
            content = content.replace(
              /\.reduce\(\(sum,\s*purchase\)\s*=>/g,
              '.reduce((sum: number, purchase: any) =>'
            );
            fixed = true;
          } else if (error.message.includes('msg') || error.message.includes('options')) {
            content = content.replace(
              /\(msg,\s*options\)\s*=>/g,
              '(msg: string, options: any) =>'
            );
            fixed = true;
          }
          break;
          
        case 'TS2322': // Type is not assignable
          if (error.message.includes('number') && error.message.includes('string')) {
            // Find the specific line and fix it
            const lines = content.split('\n');
            if (lines[error.line - 1]) {
              const originalLine = lines[error.line - 1];
              const fixedLine = originalLine.replace(/(\w+)\s*=\s*(\d+);/g, (match, prop, num) => {
                if (prop.includes('id') || prop.includes('Id')) {
                  return `${prop} = ${num};`;
                }
                return `${prop} = ${num}.toString();`;
              });
              lines[error.line - 1] = fixedLine;
              content = lines.join('\n');
              fixed = true;
            }
          }
          break;
          
        case 'TS2307': // Cannot find module
          if (error.message.includes('vite')) {
            content = content.replace(
              /import.*vite.*from.*['"]vite['"]/g,
              '// import { createServer } from "vite" // Commented out for backend'
            );
            fixed = true;
          } else if (error.message.includes('nanoid')) {
            content = content.replace(
              /import.*nanoid.*from.*['"]nanoid['"]/g,
              '// import { nanoid } from "nanoid" // Commented out for backend'
            );
            fixed = true;
          } else if (error.message.includes('drizzle-zod')) {
            content = content.replace(
              /import.*drizzle-zod.*/g,
              '// import { createInsertSchema } from "drizzle-zod" // Commented out for backend'
            );
            fixed = true;
          } else if (error.message.includes('vite.config')) {
            content = content.replace(
              /import.*vite\.config.*/g,
              '// import config from "../vite.config" // Commented out for backend'
            );
            fixed = true;
          }
          break;
      }
    });
    
    fs.writeFileSync(file, content);
  });
  
  return fixed;
}

function updateBackendRepo() {
  console.log('📝 Updating backend repository...');
  
  try {
    // Create temp directory for backend repo
    const tempDir = 'temp-backend-update';
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    
    // Clone backend repo
    execSync(`git clone https://github.com/ritheshh-cmyk/backendmobile.git ${tempDir}`, { stdio: 'inherit' });
    
    // Copy fixed files to backend repo
    const filesToCopy = [
      'server/storage.ts',
      'server/vite.ts',
      'shared/schema.ts',
      'package.json',
      'tsconfig.json'
    ];
    
    filesToCopy.forEach(file => {
      if (fs.existsSync(file)) {
        fs.copyFileSync(file, `${tempDir}/${file}`);
        console.log(`✅ Copied ${file}`);
      }
    });
    
    // Change to backend directory
    process.chdir(tempDir);
    
    // Install dependencies
    execSync('npm install', { stdio: 'inherit' });
    
    // Commit and push
    execSync('git add .', { stdio: 'inherit' });
    execSync('git commit -m "Auto-fix TypeScript errors from logs"', { stdio: 'inherit' });
    execSync('git push origin main', { stdio: 'inherit' });
    
    // Return to original directory
    process.chdir('..');
    
    // Clean up
    fs.rmSync(tempDir, { recursive: true, force: true });
    
    console.log('✅ Backend repository updated successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Error updating backend repo:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting log extraction and auto-fix process...\n');
  
  // 1. Extract logs
  const logs = await extractLogs();
  if (!logs) {
    console.log('❌ Could not extract logs');
    return;
  }
  
  console.log('📋 Extracted logs:');
  console.log('='.repeat(50));
  console.log(logs);
  console.log('='.repeat(50));
  
  // 2. Parse TypeScript errors
  const errors = parseTypeScriptErrors(logs);
  if (errors.length === 0) {
    console.log('✅ No TypeScript errors found!');
    return;
  }
  
  // 3. Fix errors
  const fixed = fixErrors(errors);
  if (!fixed) {
    console.log('⚠️ No fixes applied');
    return;
  }
  
  // 4. Update backend repository
  const updated = updateBackendRepo();
  if (!updated) {
    console.log('❌ Failed to update backend repository');
    return;
  }
  
  // 5. Deploy
  console.log('🚀 Triggering deployment...');
  execSync('node render-cli.js deploy', { stdio: 'inherit' });
  
  console.log('✅ Process completed! Check deployment status.');
}

main().catch(console.error); 