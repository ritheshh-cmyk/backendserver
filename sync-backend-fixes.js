#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🔄 Syncing TypeScript fixes to backend repository...');

try {
  // Create temp directory for backend repo
  const tempDir = 'temp-backend-sync';
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  
  // Clone the backend repository
  console.log('📥 Cloning backend repository...');
  execSync(`git clone https://github.com/ritheshh-cmyk/backendmobile.git ${tempDir}`, { stdio: 'inherit' });
  
  // Copy the fixed files from current repo to backend repo
  console.log('📋 Copying fixed files...');
  
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
    } else {
      console.log(`⚠️ File not found: ${file}`);
    }
  });
  
  // Change to backend directory
  process.chdir(tempDir);
  
  // Install dependencies
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  // Add all changes
  console.log('📝 Adding changes...');
  execSync('git add .', { stdio: 'inherit' });
  
  // Commit changes
  console.log('💾 Committing changes...');
  execSync('git commit -m "Fix TypeScript errors: remove unused imports, add types, fix number-to-string assignments"', { stdio: 'inherit' });
  
  // Push to backend repository
  console.log('🚀 Pushing to backend repository...');
  execSync('git push origin main', { stdio: 'inherit' });
  
  console.log('✅ Successfully updated backend repository!');
  console.log('🌐 Backend repository: https://github.com/ritheshh-cmyk/backendmobile');
  
  // Clean up
  process.chdir('..');
  fs.rmSync(tempDir, { recursive: true, force: true });
  console.log('🧹 Cleaned up temporary files');
  
} catch (error) {
  console.error('❌ Error syncing to backend repository:', error.message);
  process.exit(1);
} 