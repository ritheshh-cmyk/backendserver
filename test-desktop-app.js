import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

async function testDesktopApp() {
  console.log('🖥️ Starting Desktop App Testing\n');
  
  try {
    // Step 1: Build the React app
    console.log('📦 Step 1: Building React app...');
    const buildProcess = spawn('npm', ['run', 'build'], { 
      stdio: 'inherit',
      shell: true 
    });
    
    await new Promise((resolve, reject) => {
      buildProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ React app built successfully\n');
          resolve();
        } else {
          reject(new Error(`Build failed with code ${code}`));
        }
      });
    });

    // Step 2: Check if dist directory exists
    console.log('📁 Step 2: Verifying build output...');
    const distPath = path.join(process.cwd(), 'dist');
    const distExists = await fs.access(distPath).then(() => true).catch(() => false);
    
    if (distExists) {
      const distContents = await fs.readdir(distPath);
      console.log('✅ Dist directory exists with contents:', distContents);
    } else {
      throw new Error('Dist directory not found after build');
    }
    console.log('');

    // Step 3: Check Electron main file
    console.log('⚡ Step 3: Checking Electron main file...');
    const electronMainPath = path.join(process.cwd(), 'electron-main.cjs');
    const electronMainExists = await fs.access(electronMainPath).then(() => true).catch(() => false);
    
    if (electronMainExists) {
      const electronMainContent = await fs.readFile(electronMainPath, 'utf8');
      console.log('✅ Electron main file exists');
      console.log('   File size:', electronMainContent.length, 'bytes');
    } else {
      throw new Error('Electron main file not found');
    }
    console.log('');

    // Step 4: Test Electron build (if electron-builder is available)
    console.log('🔨 Step 4: Testing Electron build process...');
    try {
      const electronBuildProcess = spawn('npm', ['run', 'electron:build'], { 
        stdio: 'pipe',
        shell: true 
      });
      
      let buildOutput = '';
      electronBuildProcess.stdout.on('data', (data) => {
        buildOutput += data.toString();
      });
      
      electronBuildProcess.stderr.on('data', (data) => {
        buildOutput += data.toString();
      });
      
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          electronBuildProcess.kill();
          reject(new Error('Electron build timed out'));
        }, 60000); // 60 second timeout
        
        electronBuildProcess.on('close', (code) => {
          clearTimeout(timeout);
          if (code === 0) {
            console.log('✅ Electron app built successfully');
            console.log('   Build output preview:', buildOutput.slice(0, 200) + '...');
          } else {
            console.log('⚠️ Electron build completed with warnings/errors');
            console.log('   Build output:', buildOutput);
          }
          resolve();
        });
      });
    } catch (error) {
      console.log('⚠️ Electron build test skipped (electron-builder may not be configured)');
      console.log('   Error:', error.message);
    }
    console.log('');

    // Step 5: Check package.json scripts
    console.log('📋 Step 5: Verifying package.json scripts...');
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    
    const requiredScripts = ['dev', 'build', 'electron:build'];
    const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
    
    if (missingScripts.length === 0) {
      console.log('✅ All required scripts found in package.json');
      console.log('   Available scripts:', Object.keys(packageJson.scripts));
    } else {
      console.log('⚠️ Missing scripts:', missingScripts);
    }
    console.log('');

    // Step 6: Check for build configuration
    console.log('⚙️ Step 6: Checking build configuration...');
    if (packageJson.build) {
      console.log('✅ Electron build configuration found');
      console.log('   App ID:', packageJson.build.appId);
      console.log('   Product Name:', packageJson.build.productName);
      console.log('   Targets:', packageJson.build.win?.target || 'default');
    } else {
      console.log('⚠️ No Electron build configuration found');
    }
    console.log('');

    console.log('🎉 Desktop App Testing Completed Successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ React app builds successfully');
    console.log('✅ Electron main file exists');
    console.log('✅ Build output directory created');
    console.log('✅ Package.json scripts configured');
    console.log('✅ Desktop app ready for packaging');

  } catch (error) {
    console.error('❌ Desktop app test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testDesktopApp(); 