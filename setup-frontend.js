const fs = require('fs');
const path = require('path');

// Define directory structure
const dirs = [
  'frontend',
  'frontend/src',
  'frontend/src/api',
  'frontend/src/components',
  'frontend/src/pages',
  'frontend/src/hooks',
  'frontend/src/context',
  'frontend/src/utils',
  'frontend/src/styles'
];

// Create directories
dirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created: ${dir}`);
  } else {
    console.log(`Exists: ${dir}`);
  }
});

console.log('Frontend structure created successfully!');
