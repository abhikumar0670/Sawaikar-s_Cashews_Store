#!/usr/bin/env node
/**
 * Index FAQs Script
 * Indexes FAQ knowledge base from faqData.js into Pinecone vector database
 * Run: node backend/scripts/indexFAQs.js
 */

require('dotenv').config();
const faqData = require('../data/faqData');
const { getVectorService } = require('../services/vectorService');

async function indexFAQs() {
  try {
    console.log('🚀 Starting FAQ indexing...');

    // Initialize vector service
    const vectorService = await getVectorService();
    if (!vectorService.initialized) {
      console.error('❌ Vector service not initialized. Check PINECONE_API_KEY');
      process.exit(1);
    }

    console.log(`✅ Found ${faqData.length} FAQs`);

    if (faqData.length === 0) {
      console.warn('⚠️ No FAQs found');
      process.exit(0);
    }

    // Prepare vectors for batch upsert
    console.log('🧮 Generating embeddings for FAQs...');
    const vectors = [];

    for (let i = 0; i < faqData.length; i++) {
      const faq = faqData[i];

      // Combine question and answer for embedding
      const text = `Question: ${faq.question}\nAnswer: ${faq.answer}`;

      // Generate embedding
      const embedding = await vectorService.embedText(text);

      vectors.push({
        id: `faq-${faq.id}`,
        vector: embedding,
        metadata: {
          type: 'faq',
          category: faq.category,
          question: faq.question.substring(0, 500), // Truncate for metadata
          answer: faq.answer.substring(0, 500), // Truncate for metadata
        },
        text,
      });

      process.stdout.write(
        `\r   ⏳ Embedded ${i + 1}/${faqData.length} FAQs...`
      );
    }

    console.log('\n');

    // Batch upsert to Pinecone
    console.log('📤 Upserting to Pinecone...');
    const uploaded = await vectorService.batchUpsert(vectors, 10);

    console.log('');
    console.log('✅ FAQ indexing completed!');
    console.log(`📊 Statistics:`);
    console.log(`   - Total FAQs: ${faqData.length}`);
    console.log(`   - Vectors uploaded: ${uploaded}`);
    console.log(`   - Success rate: ${((uploaded / faqData.length) * 100).toFixed(2)}%`);

    // Display index stats
    const stats = await vectorService.getIndexStats();
    if (stats) {
      console.log(`\n📈 Pinecone Index Stats:`);
      console.log(`   - Total vectors: ${stats.totalVectorCount}`);
      console.log(`   - Index size: ${(stats.indexFullSize / (1024 * 1024)).toFixed(2)} MB`);
    }

    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

indexFAQs();
