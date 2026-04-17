const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['personalized', 'similar_users', 'trending', 'recently_viewed', 'category_based'],
    required: true
  },
  recommendations: [{
    productId: {
      type: String,
      required: true
    },
    score: {
      type: Number,
      default: 0
    },
    reason: {
      type: String,
      enum: ['purchased_together', 'viewed_together', 'similar_category', 'trending', 'popular', 'based_on_history']
    }
  }],
  metadata: {
    algorithm: String,
    inputProducts: [String],
    generatedAt: {
      type: Date,
      default: Date.now
    }
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Recommendations expire after 24 hours
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    },
    index: true
  }
}, {
  timestamps: true
});

// TTL index for automatic expiration
recommendationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for efficient lookups
recommendationSchema.index({ userId: 1, type: 1 });

// Get user recommendations by type
recommendationSchema.statics.getForUser = async function(userId, type = 'personalized', limit = 10) {
  const rec = await this.findOne({
    userId,
    type,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });

  if (rec) {
    return rec.recommendations.slice(0, limit);
  }
  return [];
};

// Save or update recommendations for user
recommendationSchema.statics.saveForUser = async function(userId, type, recommendations, metadata = {}) {
  return this.findOneAndUpdate(
    { userId, type },
    {
      userId,
      type,
      recommendations,
      metadata: {
        ...metadata,
        generatedAt: new Date()
      },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    },
    { upsert: true, new: true }
  );
};

// Clear expired recommendations (cleanup job)
recommendationSchema.statics.clearExpired = async function() {
  return this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
};

module.exports = mongoose.model('Recommendation', recommendationSchema);
