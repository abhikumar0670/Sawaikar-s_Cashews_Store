#!/usr/bin/env node
/**
 * Index Products Script
 * Fetches all products from MongoDB and indexes them in Pinecone vector database
 * Run: node backend/scripts/indexProducts.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { getVectorService } = require('../services/vectorService');

async function indexProducts() {
  try {
    console.log('🚀 Starting product indexing...');
    
    // Connect to MongoDB
    if (!mongoose.connections[0].readyState) {
      console.log('📦 Connecting to MongoDB...');
      await mongoose.connect(process.env.MONGODB_URI, {
        dbName: process.env.MONGODB_NAME,
      });
      console.log('✅ MongoDB connected');
    }

    // Initialize vector service
    const vectorService = await getVectorService();
    if (!vectorService.initialized) {
      console.error('❌ Vector service not initialized. Check PINECONE_API_KEY');
      process.exit(1);
    }

    // Fetch all products
    console.log('📚 Fetching products from MongoDB...');
    const products = await Product.find({}).lean();
    console.log(`✅ Found ${products.length} products`);

    if (products.length === 0) {
      console.warn('⚠️ No products found in database');
      process.exit(0);
    }

    // Prepare vectors for batch upsert
    const vectors = products.map((product) => {
      // Combine all product info into text for embedding
      const text = `
Product: ${product.name}
Category: ${product.category || 'General'}
Price: ₹${product.price || 0}
Description: ${product.description || 'No description'}
${product.nutrition ? `Nutrition: ${JSON.stringify(product.nutrition)}` : ''}
${product.tags ? `Tags: ${product.tags.join(', ')}` : ''}
${product.rating ? `Rating: ${product.rating}/5` : ''}
${product.stock ? `Stock: ${product.stock} units available` : 'Out of stock'}
      `.trim();

      return {
        id: `product-${product._id.toString()}`,
        vector: null, // Will be embedded by batchUpsert
        metadata: {
          type: 'product',
          productId: product._id.toString(),
          name: product.name,
          category: product.category || 'General',
          price: product.price || 0,
          originalPrice: product.originalPrice || product.price || 0,
          discount: product.discount || 0,
          rating: product.rating || 0,
          stock: product.stock || 0,
          inStock: (product.stock || 0) > 0,
        },
        text,
      };
    });

    // Embed all texts and create proper vector objects
    console.log('🧮 Generating embeddings...');
    const vectorsWithEmbeddings = [];
    for (let i = 0; i < vectors.length; i++) {
      const vector = vectors[i];
      const embedding = await vectorService.embedText(vector.text);
      vectorsWithEmbeddings.push({
        ...vector,
        vector: embedding,
      });

      if ((i + 1) % 10 === 0) {
        console.log(`   ⏳ Generated ${i + 1}/${vectors.length} embeddings...`);
      }
    }

    // Batch upsert to Pinecone
    console.log('📤 Upserting to Pinecone...');
    const uploaded = await vectorService.batchUpsert(vectorsWithEmbeddings, 50);
    
    console.log('');
    console.log('✅ Product indexing completed!');
    console.log(`📊 Statistics:`);
    console.log(`   - Total products: ${products.length}`);
    console.log(`   - Vectors uploaded: ${uploaded}`);
    console.log(`   - Success rate: ${((uploaded / products.length) * 100).toFixed(2)}%`);

    // Display index stats
    const stats = await vectorService.getIndexStats();
    if (stats) {
      console.log(`\n📈 Pinecone Index Stats:`);
      console.log(`   - Total vectors: ${stats.totalVectorCount}`);
      console.log(`   - Index size: ${(stats.indexFullSize / (1024 * 1024)).toFixed(2)} MB`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

indexProducts();
