const express = require('express');
const router = express.Router();
const recommendationService = require('../services/recommendationService');
const UserInteraction = require('../models/UserInteraction');
const Product = require('../models/Product');

// @route   GET /api/recommendations/user/:userId
// @desc    Get personalized recommendations for a user
// @access  Public
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    // Check if user has any interactions
    const hasInteractions = await UserInteraction.findOne({ userId });

    let recommendations;
    if (hasInteractions) {
      recommendations = await recommendationService.getPersonalizedRecommendations(userId, limit);
    } else {
      // Cold start: return trending/featured products
      recommendations = await recommendationService.getColdStartRecommendations(limit);
    }

    // Fetch full product details
    const productIds = recommendations.map(r => r.productId);
    const products = await Product.find({
      id: { $in: productIds },
      isArchived: { $ne: true }
    });

    // Merge product details with recommendation data
    const enrichedRecommendations = recommendations.map(rec => {
      const product = products.find(p => p.id === rec.productId);
      return {
        ...rec,
        product: product || null
      };
    }).filter(rec => rec.product !== null);

    res.json({
      success: true,
      data: enrichedRecommendations,
      type: hasInteractions ? 'personalized' : 'cold_start'
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recommendations'
    });
  }
});

// @route   GET /api/recommendations/similar/:productId
// @desc    Get similar products for a product
// @access  Public
router.get('/similar/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const limit = parseInt(req.query.limit) || 6;

    const recommendations = await recommendationService.getSimilarProducts(productId, limit);

    // Fetch full product details
    const productIds = recommendations.map(r => r.productId);
    const products = await Product.find({
      id: { $in: productIds },
      isArchived: { $ne: true }
    });

    const enrichedRecommendations = recommendations.map(rec => {
      const product = products.find(p => p.id === rec.productId);
      return {
        ...rec,
        product: product || null
      };
    }).filter(rec => rec.product !== null);

    res.json({
      success: true,
      data: enrichedRecommendations
    });
  } catch (error) {
    console.error('Similar products error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch similar products'
    });
  }
});

// @route   GET /api/recommendations/bought-together/:productId
// @desc    Get "Customers also bought" recommendations
// @access  Public
router.get('/bought-together/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const limit = parseInt(req.query.limit) || 4;

    const recommendations = await recommendationService.getFrequentlyBoughtTogether(productId, limit);

    // Fetch full product details
    const productIds = recommendations.map(r => r.productId);
    const products = await Product.find({
      id: { $in: productIds },
      isArchived: { $ne: true }
    });

    const enrichedRecommendations = recommendations.map(rec => {
      const product = products.find(p => p.id === rec.productId);
      return {
        ...rec,
        product: product || null
      };
    }).filter(rec => rec.product !== null);

    res.json({
      success: true,
      data: enrichedRecommendations
    });
  } catch (error) {
    console.error('Bought together error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recommendations'
    });
  }
});

// @route   GET /api/recommendations/trending
// @desc    Get trending products
// @access  Public
router.get('/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const days = parseInt(req.query.days) || 7;

    const trending = await UserInteraction.getTrendingProducts(days, limit);

    // Fetch full product details
    const productIds = trending.map(t => t.productId);
    const products = await Product.find({
      id: { $in: productIds },
      isArchived: { $ne: true }
    });

    const enrichedTrending = trending.map(t => {
      const product = products.find(p => p.id === t.productId);
      return {
        productId: t.productId,
        score: t.score,
        interactionCount: t.interactionCount,
        product: product || null
      };
    }).filter(t => t.product !== null);

    res.json({
      success: true,
      data: enrichedTrending
    });
  } catch (error) {
    console.error('Trending error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trending products'
    });
  }
});

// @route   POST /api/recommendations/track
// @desc    Track user interaction (view, click, cart_add, etc.)
// @access  Public
router.post('/track', async (req, res) => {
  try {
    const { userId, productId, actionType, sessionId } = req.body;

    if (!userId || !productId || !actionType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, productId, actionType'
      });
    }

    // Validate action type
    const validActions = ['view', 'click', 'purchase', 'review', 'wishlist_add', 'wishlist_remove', 'cart_add', 'cart_remove'];
    if (!validActions.includes(actionType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid actionType'
      });
    }

    // Get product snapshot
    const product = await Product.findOne({ id: productId });
    const productSnapshot = product ? {
      name: product.name,
      price: product.price,
      category: product.category
    } : null;

    await UserInteraction.logInteraction(userId, productId, actionType, productSnapshot, sessionId);

    res.json({
      success: true,
      message: 'Interaction tracked'
    });
  } catch (error) {
    console.error('Track interaction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track interaction'
    });
  }
});

// @route   POST /api/recommendations/batch-update
// @desc    Manually trigger batch update of recommendations (admin only)
// @access  Admin
router.post('/batch-update', async (req, res) => {
  try {
    // In production, add admin middleware here
    const result = await recommendationService.batchUpdateRecommendations();

    res.json({
      success: true,
      message: `Updated recommendations for ${result.updated}/${result.total} users`
    });
  } catch (error) {
    console.error('Batch update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update recommendations'
    });
  }
});

module.exports = router;
