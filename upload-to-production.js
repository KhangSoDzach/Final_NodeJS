/**
 * Upload data-export.json to production via API
 */
const fs = require('fs');
const path = require('path');

const PRODUCTION_URL = 'https://final-nodejs-njfq.onrender.com/utils/import-data';

async function uploadData() {
  try {
    // Read export file
    const filePath = path.join(__dirname, 'data-export.json');
    if (!fs.existsSync(filePath)) {
      console.error('❌ data-export.json not found!');
      process.exit(1);
    }

    console.log('📖 Reading export file...');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`Found: ${data.products.length} products, ${data.admins.length} admins, ${data.coupons.length} coupons\n`);

    console.log('📤 Uploading to production...');
    const response = await fetch(PRODUCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (result.success) {
      console.log('\n✅ Import successful!');
      console.log('\nResults:');
      console.log(`  Products:`);
      console.log(`    - Imported: ${result.results.products.imported}`);
      console.log(`    - Skipped: ${result.results.products.skipped}`);
      console.log(`  Admins:`);
      console.log(`    - Imported: ${result.results.admins.imported}`);
      console.log(`    - Skipped: ${result.results.admins.skipped}`);
      console.log(`  Coupons:`);
      console.log(`    - Imported: ${result.results.coupons.imported}`);
      console.log(`    - Skipped: ${result.results.coupons.skipped}`);
    } else {
      console.error('❌ Import failed:', result.error);
    }

  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    process.exit(1);
  }
}

uploadData();
