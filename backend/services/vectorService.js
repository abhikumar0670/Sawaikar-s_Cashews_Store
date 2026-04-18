const { Pinecone } = require('@pinecone-database/pinecone');
const { env } = require('process');

/**
 * Vector Service - Handles embeddings and Pinecone vector database operations
 * Uses HuggingFace Transformers for efficient embedding generation
 */
class VectorService {
  constructor() {
    this.pineconeApiKey = process.env.PINECONE_API_KEY;
    this.pineconeIndexName = process.env.PINECONE_INDEX_NAME || 'sawaikar-chat';
    this.pinecone = null;
    this.index = null;
    this.embedder = null;
    this.initialized = false;
  }

  /**
   * Initialize Pinecone client and embedding model
   */
  async initialize() {
    if (this.initialized) {
      console.log('[VectorService] ✅ Already initialized');
      return;
    }

    try {
      // Initialize Pinecone
      if (!this.pineconeApiKey) {
        console.warn('[VectorService] ⚠️ PINECONE_API_KEY not set - RAG will be disabled');
        return;
      }

      this.pinecone = new Pinecone({
        apiKey: this.pineconeApiKey,
      });

      this.index = this.pinecone.Index(this.pineconeIndexName);
      console.log(`[VectorService] ✅ Pinecone initialized - Index: ${this.pineconeIndexName}`);

      // Initialize embedding model (HuggingFace)
      console.log('[VectorService] 📦 Loading embedding model...');
      const { pipeline } = await import('@xenova/transformers');
      this.embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      console.log('[VectorService] ✅ Embedding model loaded (all-MiniLM-L6-v2)');

      this.initialized = true;
    } catch (error) {
      console.error('[VectorService] ❌ Initialization error:', error.message);
      console.warn('[VectorService] RAG functionality will be disabled');
    }
  }

  /**
   * Generate embedding for text using HuggingFace model
   * @param {string} text - Text to embed
   * @returns {Promise<number[]>} - Vector embedding (384 dimensions)
   */
  async embedText(text) {
    try {
      if (!this.embedder || !this.initialized) {
        console.warn('[VectorService] ⚠️ Embedder not initialized, using zero vector');
        return new Array(384).fill(0);
      }

      // Generate embedding
      const embedding = await this.embedder(text, {
        pooling: 'mean',
        normalize: true,
      });

      // Convert tensor to array
      const vector = Array.from(embedding.data);
      return vector;
    } catch (error) {
      console.error('[VectorService] ❌ Embedding error:', error.message);
      return new Array(384).fill(0);
    }
  }

  /**
   * Upsert vector to Pinecone with metadata
   * @param {string} id - Unique ID for the vector
   * @param {number[]} vector - Vector embedding (384 dimensions)
   * @param {object} metadata - Additional metadata (type, productId, name, etc.)
   * @param {string} text - Original text (stored in metadata)
   */
  async upsertVector(id, vector, metadata = {}, text = '') {
    try {
      if (!this.index || !this.initialized) {
        console.warn('[VectorService] ⚠️ Pinecone not initialized, skipping upsert');
        return false;
      }

      await this.index.upsert([
        {
          id,
          values: vector,
          metadata: {
            ...metadata,
            text: text.substring(0, 1000), // Store truncated text for reference
          },
        },
      ]);

      return true;
    } catch (error) {
      console.error(`[VectorService] ❌ Upsert error for ${id}:`, error.message);
      return false;
    }
  }

  /**
   * Batch upsert vectors to Pinecone
   * @param {array} vectors - Array of {id, vector, metadata, text}
   */
  async batchUpsert(vectors, batchSize = 100) {
    try {
      if (!this.index || !this.initialized) {
        console.warn('[VectorService] ⚠️ Pinecone not initialized, skipping batch upsert');
        return 0;
      }

      let uploaded = 0;

      for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, Math.min(i + batchSize, vectors.length));

        const records = batch.map((v) => ({
          id: v.id,
          values: v.vector,
          metadata: {
            ...v.metadata,
            text: v.text?.substring(0, 1000) || '',
          },
        }));

        await this.index.upsert(records);
        uploaded += records.length;
        console.log(`[VectorService] 📤 Uploaded ${uploaded}/${vectors.length} vectors`);
      }

      return uploaded;
    } catch (error) {
      console.error('[VectorService] ❌ Batch upsert error:', error.message);
      return 0;
    }
  }

  /**
   * Search vectors in Pinecone
   * @param {string} query - Query text
   * @param {number} topK - Number of results to return
   * @param {object} filter - Metadata filter (e.g., {type: "product"})
   * @returns {Promise<array>} - Array of matching results with scores
   */
  async searchVectors(query, topK = 5, filter = {}) {
    try {
      if (!this.index || !this.initialized) {
        console.warn('[VectorService] ⚠️ Pinecone not initialized, returning empty results');
        return [];
      }

      // Get embedding for query
      const queryVector = await this.embedText(query);

      console.log(`[VectorService] 🔍 Searching for: "${query}"`);

      // Search Pinecone
      const results = await this.index.query({
        vector: queryVector,
        topK,
        includeMetadata: true,
        filter: Object.keys(filter).length > 0 ? filter : undefined,
      });

      if (!results || !results.matches) {
        console.warn('[VectorService] ⚠️ No search results returned');
        return [];
      }

      console.log(`[VectorService] ✅ Found ${results.matches.length} matches`);

      return results.matches.map((match) => ({
        id: match.id,
        score: match.score,
        metadata: match.metadata,
        text: match.metadata?.text || '',
      }));
    } catch (error) {
      console.error('[VectorService] ❌ Search error:', error.message);
      return [];
    }
  }

  /**
   * Delete vector from Pinecone
   * @param {string} id - Vector ID to delete
   */
  async deleteVector(id) {
    try {
      if (!this.index || !this.initialized) {
        return false;
      }

      await this.index.deleteOne(id);
      return true;
    } catch (error) {
      console.error(`[VectorService] ❌ Delete error for ${id}:`, error.message);
      return false;
    }
  }

  /**
   * Delete all vectors matching a filter
   * @param {object} filter - Metadata filter (e.g., {type: "product"})
   */
  async deleteByFilter(filter) {
    try {
      if (!this.index || !this.initialized) {
        return 0;
      }

      await this.index.deleteMany(filter);
      console.log('[VectorService] 🗑️ Vectors deleted by filter');
      return 1;
    } catch (error) {
      console.error('[VectorService] ❌ Delete by filter error:', error.message);
      return 0;
    }
  }

  /**
   * Get index stats
   */
  async getIndexStats() {
    try {
      if (!this.index || !this.initialized) {
        return null;
      }

      const stats = await this.index.describeIndexStats();
      return stats;
    } catch (error) {
      console.error('[VectorService] ❌ Stats error:', error.message);
      return null;
    }
  }
}

// Singleton instance
let vectorServiceInstance = null;

async function getVectorService() {
  if (!vectorServiceInstance) {
    vectorServiceInstance = new VectorService();
    await vectorServiceInstance.initialize();
  }
  return vectorServiceInstance;
}

module.exports = { VectorService, getVectorService };
