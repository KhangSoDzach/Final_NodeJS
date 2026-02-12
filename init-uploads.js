#!/usr/bin/env node
/**
 * Script to initialize uploads directory with sample product images
 * Run this before starting Docker to ensure images are available
 */

const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, 'uploads', 'products');
const publicImagesDir = path.join(__dirname, 'public', 'image');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✓ Created uploads/products directory');
}

// Create .gitkeep to preserve directory structure
const gitkeepPath = path.join(uploadsDir, '.gitkeep');
if (!fs.existsSync(gitkeepPath)) {
  fs.writeFileSync(gitkeepPath, '');
  console.log('✓ Created .gitkeep file');
}

// Check if public/image directory has any sample images we can copy
if (fs.existsSync(publicImagesDir)) {
  const files = fs.readdirSync(publicImagesDir);
  const imageFiles = files.filter(file => 
    /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
  );

  if (imageFiles.length > 0) {
    console.log(`\n📁 Found ${imageFiles.length} image(s) in public/image/`);
    console.log('Copying sample images to uploads/products/...\n');

    imageFiles.forEach(file => {
      const sourcePath = path.join(publicImagesDir, file);
      const destPath = path.join(uploadsDir, file);
      
      if (!fs.existsSync(destPath)) {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`  ✓ Copied ${file}`);
      }
    });
  }
}

// Create a placeholder image if no images exist
const existingImages = fs.readdirSync(uploadsDir).filter(file => 
  /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
);

if (existingImages.length === 0) {
  console.log('\n⚠️  No product images found!');
  console.log('   Please add product images to uploads/products/ directory');
  console.log('   or run seeders to populate database with sample products\n');
  
  // Create a simple placeholder text file
  const placeholderPath = path.join(uploadsDir, 'README.txt');
  fs.writeFileSync(placeholderPath, 
    'Place your product images here.\n' +
    'Supported formats: jpg, jpeg, png, gif, webp\n\n' +
    'Images will be served at: /uploads/products/<filename>\n'
  );
  console.log('✓ Created README.txt placeholder\n');
} else {
  console.log(`\n✓ Total ${existingImages.length} product image(s) ready in uploads/products/\n`);
}

console.log('✅ Uploads directory initialized successfully!\n');
