const UserInteraction = require('../models/UserInteraction');
const Recommendation = require('../models/Recommendation');
const Product = require('../models/Product');
const nutritionService = require('./nutritionRecommendationService');

class RecommendationService {

  // Get personalized recommendations for a user
  async getPersonalizedRecommendations(userId, limit = 10) {
    // Try to get cached recommendations first
    const cached = await Recommendation.getForUser(userId, 'personalized', limit);
    if (cached.length > 0) {
      return cached;
    }

    // Generate new recommendations
    const recommendations = await this.generatePersonalizedRecommendations(userId, limit);

    // Cache them
    if (recommendations.length > 0) {
      await Recommendation.saveForUser(userId, 'personalized', recommendations, {
        algorithm: 'hybrid'
      });
    }

    return recommendations;
  }

  // Generate personalized recommendations using hybrid approach
  async generatePersonalizedRecommendations(userId, limit = 10) {
    const results = new Map();

    // 1. Content-based: Products similar to user's viewed/purchased items
    const contentBased = await this.getContentBasedRecommendations(userId, limit);
    contentBased.forEach(rec => {
      results.set(rec.productId, {
        productId: rec.productId,
        score: (results.get(rec.productId)?.score || 0) + rec.score,
        reason: rec.reason
      });
    });

    // 2. Collaborative filtering: Products liked by similar users
    const collaborative = await this.getCollaborativeRecommendations(userId, limit);
    collaborative.forEach(rec => {
      results.set(rec.productId, {
        productId: rec.productId,
        score: (results.get(rec.productId)?.score || 0) + rec.score * 0.8,
        reason: results.get(rec.productId)?.reason || rec.reason
      });
    });

    // 3. Nutrition-based: Products matching user's health goals
    try {
      const nutritionRecs = await nutritionService.getNutritionBasedRecommendations(userId, limit);
      nutritionRecs.forEach(rec => {
        const productId = rec.product?.id || rec.product?._id;
        if (productId) {
          results.set(productId, {
            productId: productId,
            score: (results.get(productId)?.score || 0) + (rec.score || 0) * 0.7,
            reason: results.get(productId)?.reason || rec.reason || 'nutrition_match',
            healthGoal: rec.matchedGoal,
            nutritionExplanation: rec.explanation
          });
        }
      });
    } catch (error) {
      console.warn('Nutrition recommendations unavailable:', error.message);
    }

    // 4. Add trending products as fallback
    const trending = await this.getTrendingRecommendations(limit);
    trending.forEach(rec => {
      if (!results.has(rec.productId)) {
        results.set(rec.productId, {
          productId: rec.productId,
          score: rec.score * 0.5,
          reason: 'trending'
        });
      }
    });

    // Sort by score and return top results
    return Array.from(results.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // Content-based filtering: Find similar products based on user's history
  async getContentBasedRecommendations(userId, limit = 10) {
    const interactions = await UserInteraction.getUserInteractions(userId, 50);

    if (interactions.length === 0) {
      return [];
    }

    // Get categories and products the user has interacted with
    const interactedProductIds = [...new Set(interactions.map(i => i.productId))];
    const interactedProducts = await Product.find({
      id: { $in: interactedProductIds },
      isArchived: { $ne: true }
    });

    // Extract categories with weights
    const categoryWeights = {};
    interactions.forEach(interaction => {
      const product = interactedProducts.find(p => p.id === interaction.productId);
      if (product) {
        categoryWeights[product.category] = (categoryWeights[product.category] || 0) + interaction.weight;
      }
    });

    // Find products in same categories that user hasn't seen
    const recommendations = await Product.find({
      id: { $nin: interactedProductIds },
      category: { $in: Object.keys(categoryWeights) },
      isArchived: { $ne: true }
    })
    .sort({ totalSales: -1, rating: -1 })
    .limit(limit * 2);

    return recommendations.map(product => ({
      productId: product.id,
      score: (categoryWeights[product.category] || 1) * (product.rating || 3) * 0.5,
      reason: 'similar_category'
    })).slice(0, limit);
  }

  // Collaborative filtering: Find products that similar users liked
  async getCollaborativeRecommendations(userId, limit = 10) {
    const similarUsers = await UserInteraction.getSimilarUsers(userId, 20);

    if (similarUsers.length === 0) {
      return [];
    }

    const similarUserIds = similarUsers.map(u => u.userId);

    // Get user's own products to exclude
    const userProducts = await UserInteraction.distinct('productId', { userId });

    // Find products that similar users interacted with positively
    const recommendations = await UserInteraction.aggregate([
      {
        $match: {
          userId: { $in: similarUserIds },
          productId: { $nin: userProducts },
          actionType: { $in: ['purchase', 'review', 'cart_add'] }
        }
      },
      {
        $group: {
          _id: '$productId',
          totalScore: { $sum: '$weight' },
          userCount: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          productId: '$_id',
          score: {
            $multiply: ['$totalScore', { $size: '$userCount' }]
          }
        }
      },
      { $sort: { score: -1 } },
      { $limit: limit }
    ]);

    // Filter out archived products
    const validProducts = await Product.find({
      id: { $in: recommendations.map(r => r.productId) },
      isArchived: { $ne: true }
    }).select('id');

    const validIds = new Set(validProducts.map(p => p.id));

    return recommendations
      .filter(r => validIds.has(r.productId))
      .map(r => ({
        productId: r.productId,
        score: r.score,
        reason: 'purchased_together'
      }));
  }

  // Get trending products
  async getTrendingRecommendations(limit = 10) {
    const trending = await UserInteraction.getTrendingProducts(7, limit);

    // Filter out archived products
    const validProducts = await Product.find({
      id: { $in: trending.map(t => t.productId) },
      isArchived: { $ne: true }
    }).select('id');

    const validIds = new Set(validProducts.map(p => p.id));

    return trending
      .filter(t => validIds.has(t.productId))
      .map(t => ({
        productId: t.productId,
        score: t.score,
        reason: 'trending'
      }));
  }

  // Get similar products (for product detail page)
  async getSimilarProducts(productId, limit = 6) {
    const product = await Product.findOne({ id: productId });

    if (!product) {
      return [];
    }

    // Find products in same category with similar tags
    const similar = await Product.find({
      id: { $ne: productId },
      isArchived: { $ne: true },
      $or: [
        { category: product.category },
        { tags: { $in: product.tags || [] } }
      ]
    })
    .sort({ totalSales: -1, rating: -1 })
    .limit(limit);

    return similar.map(p => ({
      productId: p.id,
      score: p.category === product.category ? 2 : 1,
      reason: 'similar_category'
    }));
  }

  // Get "Customers also bought" recommendations
  async getFrequentlyBoughtTogether(productId, limit = 4) {
    // Find users who purchased this product
    const purchasers = await UserInteraction.distinct('userId', {
      productId,
      actionType: 'purchase'
    });

    if (purchasers.length === 0) {
      return this.getSimilarProducts(productId, limit);
    }

    // Find other products these users purchased
    const otherProducts = await UserInteraction.aggregate([
      {
        $match: {
          userId: { $in: purchasers },
          productId: { $ne: productId },
          actionType: 'purchase'
        }
      },
      {
        $group: {
          _id: '$productId',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: limit }
    ]);

    // Filter out archived products
    const validProducts = await Product.find({
      id: { $in: otherProducts.map(p => p._id) },
      isArchived: { $ne: true }
    }).select('id');

    const validIds = new Set(validProducts.map(p => p.id));

    return otherProducts
      .filter(p => validIds.has(p._id))
      .map(p => ({
        productId: p._id,
        score: p.count,
        reason: 'purchased_together'
      }));
  }

  // Get recommendations for new users (cold start)
  async getColdStartRecommendations(limit = 10) {
    // Combine trending and featured products
    const [trending, featured] = await Promise.all([
      this.getTrendingRecommendations(limit),
      Product.find({
        featured: true,
        isArchived: { $ne: true }
      })
      .sort({ totalSales: -1 })
      .limit(limit)
    ]);

    const results = new Map();

    trending.forEach(t => {
      results.set(t.productId, {
        productId: t.productId,
        score: t.score,
        reason: 'trending'
      });
    });

    featured.forEach(p => {
      if (!results.has(p.id)) {
        results.set(p.id, {
          productId: p.id,
          score: 50,
          reason: 'popular'
        });
      }
    });

    return Array.from(results.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // Log user interaction (helper method)
  async logInteraction(userId, productId, actionType, product = null) {
    const productSnapshot = product ? {
      name: product.name,
      price: product.price,
      category: product.category
    } : null;

    return UserInteraction.logInteraction(userId, productId, actionType, productSnapshot);
  }

  // Batch update recommendations for all active users
  async batchUpdateRecommendations() {
    const activeUsers = await UserInteraction.distinct('userId', {
      timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    let updated = 0;
    for (const userId of activeUsers) {
      try {
        await this.getPersonalizedRecommendations(userId, 20);
        updated++;
      } catch (error) {
        console.error(`Failed to update recommendations for user ${userId}:`, error.message);
      }
    }

    return { updated, total: activeUsers.length };
  }
}

module.exports = new RecommendationService();
