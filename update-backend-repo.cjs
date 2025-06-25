const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Updating backend repository with fixed code...');

try {
  // Create a temporary directory for the backend repo
  const tempDir = path.join(__dirname, 'temp-backend');
  
  // Remove temp directory if it exists
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  
  // Clone the backend repository
  console.log('📥 Cloning backend repository...');
  execSync(`git clone https://github.com/ritheshh-cmyk/backendmobile.git ${tempDir}`, { stdio: 'inherit' });
  
  // Copy the fixed files from current repo to backend repo
  console.log('📋 Copying fixed files...');
  
  // Copy server files
  const serverFiles = [
    'server/auth-routes.ts',
    'server/routes.ts',
    'server/storage.ts',
    'server/index.ts',
    'server/vite.ts',
    'server/db.ts',
    'server/seedSuppliers.ts'
  ];
  
  serverFiles.forEach(file => {
    if (fs.existsSync(file)) {
      fs.copyFileSync(file, path.join(tempDir, file));
      console.log(`✅ Copied ${file}`);
    }
  });
  
  // Copy lib files
  const libFiles = [
    'lib/auth.ts',
    'lib/database.ts'
  ];
  
  libFiles.forEach(file => {
    if (fs.existsSync(file)) {
      fs.copyFileSync(file, path.join(tempDir, file));
      console.log(`✅ Copied ${file}`);
    }
  });
  
  // Copy shared files
  const sharedFiles = [
    'shared/schema.ts',
    'shared/types.ts'
  ];
  
  sharedFiles.forEach(file => {
    if (fs.existsSync(file)) {
      fs.copyFileSync(file, path.join(tempDir, file));
      console.log(`✅ Copied ${file}`);
    }
  });
  
  // Copy package.json with ExcelJS dependency
  if (fs.existsSync('package.json')) {
    fs.copyFileSync('package.json', path.join(tempDir, 'package.json'));
    console.log('✅ Copied package.json');
  }
  
  // Copy tsconfig.json
  if (fs.existsSync('tsconfig.json')) {
    fs.copyFileSync('tsconfig.json', path.join(tempDir, 'tsconfig.json'));
    console.log('✅ Copied tsconfig.json');
  }
  
  // Copy render.yaml
  if (fs.existsSync('render.yaml')) {
    fs.copyFileSync('render.yaml', path.join(tempDir, 'render.yaml'));
    console.log('✅ Copied render.yaml');
  }
  
  // Change to backend directory
  process.chdir(tempDir);
  
  // Add all changes
  console.log('📝 Adding changes...');
  execSync('git add .', { stdio: 'inherit' });
  
  // Commit changes
  console.log('💾 Committing changes...');
  execSync('git commit -m "Fix async route handlers, add ExcelJS dependency, and resolve TypeScript errors"', { stdio: 'inherit' });
  
  // Push to backend repository
  console.log('🚀 Pushing to backend repository...');
  execSync('git push origin main', { stdio: 'inherit' });
  
  console.log('✅ Successfully updated backend repository!');
  console.log('🌐 Backend repository: https://github.com/ritheshh-cmyk/backendmobile');
  
  // Clean up
  process.chdir(__dirname);
  fs.rmSync(tempDir, { recursive: true, force: true });
  console.log('🧹 Cleaned up temporary files');
  
} catch (error) {
  console.error('❌ Error updating backend repository:', error.message);
  process.exit(1);
} 