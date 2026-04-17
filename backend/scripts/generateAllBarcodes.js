/**
 * Migration Script: Generate Barcodes for All Products
 *
 * This script adds barcodes to all product variants in the format:
 * SAW-{productId}-{weight}
 *
 * Run with: node scripts/generateAllBarcodes.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Product = require('../models/Product');

const generateBarcodes = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('📦 Connected to MongoDB');

    // Get all products
    const products = await Product.find({});
    console.log(`\n🔍 Found ${products.length} products\n`);

    let updatedCount = 0;
    let barcodesGenerated = 0;

    for (const product of products) {
      let productUpdated = false;

      // Check if product has variants
      if (product.variants && product.variants.length > 0) {
        product.variants.forEach(variant => {
          if (!variant.barcode) {
            // Generate barcode: SAW-{productId}-{weight}
            variant.barcode = `SAW-${product.id}-${variant.weight}`;
            productUpdated = true;
            barcodesGenerated++;
            console.log(`  ✅ ${product.name} (${variant.weight}): ${variant.barcode}`);
          } else {
            console.log(`  ⏭️  ${product.name} (${variant.weight}): Already has barcode`);
          }
        });
      } else {
        // If no variants, create default variants with barcodes
        const defaultWeights = ['250g', '500g', '1kg'];
        product.variants = defaultWeights.map(weight => ({
          weight,
          price: product.price,
          stock: Math.floor(product.stock / 3) || 10,
          sku: `${product.id}-${weight}`,
          barcode: `SAW-${product.id}-${weight}`
        }));
        productUpdated = true;
        barcodesGenerated += 3;
        console.log(`  🆕 ${product.name}: Created variants with barcodes`);
        defaultWeights.forEach(w => {
          console.log(`      - SAW-${product.id}-${w}`);
        });
      }

      if (productUpdated) {
        await product.save();
        updatedCount++;
      }
    }

    console.log('\n' + '═'.repeat(50));
    console.log('📊 MIGRATION SUMMARY');
    console.log('═'.repeat(50));
    console.log(`Products updated: ${updatedCount}`);
    console.log(`Barcodes generated: ${barcodesGenerated}`);
    console.log('═'.repeat(50) + '\n');

    console.log('✅ Barcode migration completed successfully!\n');

    // Show sample barcodes for testing
    const sampleProducts = await Product.find({}).limit(3);
    console.log('📋 Sample barcodes for testing:');
    console.log('─'.repeat(50));
    sampleProducts.forEach(p => {
      if (p.variants && p.variants.length > 0) {
        const variant = p.variants[0];
        console.log(`${p.name} (${variant.weight}): ${variant.barcode}`);
      }
    });
    console.log('─'.repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the migration
generateBarcodes();
