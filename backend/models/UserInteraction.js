const mongoose = require('mongoose');

const userInteractionSchema = new mongoose.Schema({
  userId: {
    type: String,  // Clerk ID
    required: true,
    index: true
  },
  productId: {
    type: String,
    required: true,
    index: true
  },
  actionType: {
    type: String,
    enum: ['view', 'click', 'purchase', 'review', 'wishlist_add', 'wishlist_remove', 'cart_add', 'cart_remove'],
    required: true
  },
  weight: {
    type: Number,
    default: 1
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  sessionId: {
    type: String
  },
  productSnapshot: {
    name: String,
    price: Number,
    category: String
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
userInteractionSchema.index({ userId: 1, timestamp: -1 });
userInteractionSchema.index({ productId: 1, timestamp: -1 });
userInteractionSchema.index({ actionType: 1, timestamp: -1 });

// Static method to log an interaction
userInteractionSchema.statics.logInteraction = async function(userId, productId, actionType, productSnapshot = null, sessionId = null) {
  const actionWeights = {
    'purchase': 5,
    'review': 3,
    'cart_add': 2,
    'wishlist_add': 2,
    'click': 1.5,
    'view': 1,
    'cart_remove': -1,
    'wishlist_remove': -0.5
  };

  const weight = actionWeights[actionType] || 1;

  return this.create({
    userId,
    productId,
    actionType,
    weight,
    sessionId,
    productSnapshot
  });
};

// Get user's recent interactions
userInteractionSchema.statics.getUserInteractions = async function(userId, limit = 100, daysBack = 90) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  return this.find({
    userId,
    timestamp: { $gte: startDate }
  })
  .sort({ timestamp: -1 })
  .limit(limit);
};

// Get users who interacted with same products (for collaborative filtering)
userInteractionSchema.statics.getSimilarUsers = async function(userId, limit = 50) {
  const userProducts = await this.distinct('productId', { userId });

  if (userProducts.length === 0) return [];

  const similarUsers = await this.aggregate([
    {
      $match: {
        productId: { $in: userProducts },
        userId: { $ne: userId },
        actionType: { $in: ['purchase', 'review', 'cart_add'] }
      }
    },
    {
      $group: {
        _id: '$userId',
        commonProducts: { $addToSet: '$productId' },
        totalWeight: { $sum: '$weight' }
      }
    },
    {
      $project: {
        userId: '$_id',
        commonCount: { $size: '$commonProducts' },
        totalWeight: 1
      }
    },
    { $sort: { commonCount: -1, totalWeight: -1 } },
    { $limit: limit }
  ]);

  return similarUsers;
};

// Get trending products
userInteractionSchema.statics.getTrendingProducts = async function(daysBack = 7, limit = 10) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate },
        actionType: { $in: ['purchase', 'view', 'cart_add'] }
      }
    },
    {
      $group: {
        _id: '$productId',
        totalWeight: { $sum: '$weight' },
        uniqueUsers: { $addToSet: '$userId' },
        interactionCount: { $sum: 1 }
      }
    },
    {
      $project: {
        productId: '$_id',
        score: {
          $add: [
            '$totalWeight',
            { $multiply: [{ $size: '$uniqueUsers' }, 2] }
          ]
        },
        interactionCount: 1
      }
    },
    { $sort: { score: -1 } },
    { $limit: limit }
  ]);
};

module.exports = mongoose.model('UserInteraction', userInteractionSchema);
