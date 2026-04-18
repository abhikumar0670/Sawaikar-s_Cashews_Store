#!/usr/bin/env node
/**
 * Index Reviews Script
 * Fetches product reviews from MongoDB and indexes them in Pinecone vector database
 * Run: node backend/scripts/indexReviews.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Review = require('../models/Review');
const Product = require('../models/Product');
const { getVectorService } = require('../services/vectorService');

async function indexReviews() {
  try {
    console.log('🚀 Starting reviews indexing...');

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

    // Fetch all reviews
    console.log('📚 Fetching reviews from MongoDB...');
    const reviews = await Review.find({}).populate('productId', 'name').lean();
    console.log(`✅ Found ${reviews.length} reviews`);

    if (reviews.length === 0) {
      console.warn('⚠️ No reviews found in database');
      process.exit(0);
    }

    // Prepare vectors for batch upsert
    console.log('🧮 Generating embeddings for reviews...');
    const vectors = [];

    for (let i = 0; i < reviews.length; i++) {
      const review = reviews[i];

      // Get product name
      const productName = review.productId?.name || 'Unknown Product';

      // Combine review info into text for embedding
      const text = `
Product: ${productName}
Rating: ${review.rating}/5 stars
Review: ${review.comment || 'No comment'}
User: ${review.userName || 'Anonymous'}
      `.trim();

      // Generate embedding
      const embedding = await vectorService.embedText(text);

      vectors.push({
        id: `review-${review._id.toString()}`,
        vector: embedding,
        metadata: {
          type: 'review',
          reviewId: review._id.toString(),
          productId: review.productId?._id?.toString() || '',
          productName,
          rating: review.rating || 0,
          userName: review.userName || 'Anonymous',
          helpful: review.helpful || 0,
        },
        text,
      });

      process.stdout.write(
        `\r   ⏳ Embedded ${i + 1}/${reviews.length} reviews...`
      );
    }

    console.log('\n');

    // Batch upsert to Pinecone
    console.log('📤 Upserting to Pinecone...');
    const uploaded = await vectorService.batchUpsert(vectors, 50);

    console.log('');
    console.log('✅ Reviews indexing completed!');
    console.log(`📊 Statistics:`);
    console.log(`   - Total reviews: ${reviews.length}`);
    console.log(`   - Vectors uploaded: ${uploaded}`);
    console.log(`   - Success rate: ${((uploaded / reviews.length) * 100).toFixed(2)}%`);

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

indexReviews();
