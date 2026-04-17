require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

console.log('🚀 Starting barcode regeneration for Chia Seed...\n');

(async () => {
  let connected = false;
  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });
    connected = true;
    console.log('✅ Connected to MongoDB\n');
    
    console.log('🔍 Searching for Chia Seed product...\n');
    
    // Find chia seed product (case-insensitive)
    const product = await Product.findOne({
      name: { $regex: 'chia', $options: 'i' }
    });
    
    if (!product) {
      console.log('❌ Chia seed product not found in database');
      console.log('\n📋 Listing first 10 products:\n');
      const allProducts = await Product.find({}).select('id name').limit(10);
      allProducts.forEach(p => {
        console.log(`   - ${p.name}`);
      });
      mongoose.connection.close();
      process.exit(1);
    }
    
    console.log(`✅ Found: ${product.name}`);
    console.log(`   ID: ${product.id}`);
    console.log(`   Current variants:\n`);
    
    // Show current state
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach((v, i) => {
        console.log(`   Variant ${i}: Weight=${v.weight}, Barcode="${v.barcode || 'EMPTY'}"`);
      });
    } else {
      console.log('   ⚠️ No variants found!\n');
    }
    
    // Regenerate missing barcodes
    console.log(`\n🔧 REGENERATING BARCODES:\n`);
    let regenerated = 0;
    
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach((v, i) => {
        const oldBarcode = v.barcode;
        v.barcode = `SAW-${product.id}-${v.weight}`;
        regenerated++;
        console.log(`   ✅ Variant ${i} (${v.weight})`);
        console.log(`      Old: ${oldBarcode || 'EMPTY'}`);
        console.log(`      New: ${v.barcode}`);
      });
    }
    
    if (regenerated > 0) {
      console.log('\n💾 Saving to database...');
      await product.save();
      console.log(`\n✅ SUCCESS! ${regenerated} barcode(s) regenerated and saved`);
      console.log('\n📋 Updated variants:');
      product.variants.forEach((v, i) => {
        console.log(`   Variant ${i}: ${v.weight} → ${v.barcode}`);
      });
    } else {
      console.log(`\n⚠️ No barcodes were regenerated`);
    }
    
    mongoose.connection.close();
    process.exit(0);
    
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    if (connected) {
      mongoose.connection.close();
    }
    process.exit(1);
  }
})();
