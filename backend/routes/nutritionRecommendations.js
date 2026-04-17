const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const UserHealthProfile = require('../models/UserHealthProfile');
const nutritionService = require('../services/nutritionRecommendationService');

// ============================================
// USER HEALTH PROFILE ENDPOINTS
// ============================================

/**
 * GET /api/nutrition/profile
 * Get user's health profile
 */
router.get('/profile', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    const profile = await UserHealthProfile.findOne({ userId });

    if (!profile) {
      return res.json({
        success: true,
        data: null,
        message: 'No health profile found'
      });
    }

    res.json({
      success: true,
      data: profile
    });

  } catch (error) {
    console.error('Error fetching health profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch health profile'
    });
  }
});

/**
 * POST /api/nutrition/profile
 * Create or update user's health profile
 */
router.post('/profile', async (req, res) => {
  try {
    const { userId, healthGoals, dietaryRestrictions, allergens } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    let profile = await UserHealthProfile.findOne({ userId });

    if (profile) {
      // Update existing profile
      if (healthGoals) profile.healthGoals = healthGoals;
      if (dietaryRestrictions) profile.dietaryRestrictions = dietaryRestrictions;
      if (allergens) profile.allergens = allergens;

      profile.calculateCompleteness();
      await profile.save();
    } else {
      // Create new profile
      profile = await UserHealthProfile.create({
        userId,
        healthGoals: healthGoals || [],
        dietaryRestrictions: dietaryRestrictions || [],
        allergens: allergens || []
      });
      profile.calculateCompleteness();
      await profile.save();
    }

    res.json({
      success: true,
      data: profile,
      message: 'Health profile updated successfully'
    });

  } catch (error) {
    console.error('Error updating health profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update health profile'
    });
  }
});

/**
 * POST /api/nutrition/profile/onboarding
 * Complete onboarding flow
 */
router.post('/profile/onboarding', async (req, res) => {
  try {
    const { userId, healthGoals, dietaryRestrictions, allergens, skipped } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    let profile = await UserHealthProfile.getOrCreate(userId);

    if (skipped) {
      profile.onboardingSkipCount++;
    } else {
      profile.healthGoals = healthGoals || [];
      profile.dietaryRestrictions = dietaryRestrictions || [];
      profile.allergens = allergens || [];
      profile.onboardingCompleted = true;
      profile.calculateCompleteness();
    }

    await profile.save();

    res.json({
      success: true,
      data: profile,
      message: skipped ? 'Onboarding skipped' : 'Onboarding completed'
    });

  } catch (error) {
    console.error('Error completing onboarding:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete onboarding'
    });
  }
});

// ============================================
// NUTRITION RECOMMENDATIONS ENDPOINTS
// ============================================

/**
 * GET /api/nutrition/recommendations
 * Get nutrition-based recommendations for user
 */
router.get('/recommendations', async (req, res) => {
  try {
    const { userId, limit = 10 } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    const recommendations = await nutritionService.getNutritionBasedRecommendations(
      userId,
      parseInt(limit)
    );

    res.json({
      success: true,
      data: recommendations,
      count: recommendations.length
    });

  } catch (error) {
    console.error('Error getting nutrition recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get recommendations'
    });
  }
});

/**
 * GET /api/nutrition/by-goal/:goal
 * Get products for a specific health goal
 */
router.get('/by-goal/:goal', async (req, res) => {
  try {
    const { goal } = req.params;
    const { limit = 10 } = req.query;

    const validGoals = [
      'muscle-building', 'weight-loss', 'heart-health',
      'immunity-boost', 'bone-health', 'energy-boost',
      'diabetes-friendly', 'brain-health'
    ];

    if (!validGoals.includes(goal)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid health goal',
        validGoals
      });
    }

    const products = await nutritionService.getProductsForHealthGoal(goal, parseInt(limit));

    res.json({
      success: true,
      data: products,
      goal,
      count: products.length
    });

  } catch (error) {
    console.error('Error getting products by goal:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get products'
    });
  }
});

/**
 * GET /api/nutrition/by-nutrient/:nutrient
 * Get products high in a specific nutrient
 */
router.get('/by-nutrient/:nutrient', async (req, res) => {
  try {
    const { nutrient } = req.params;
    const { limit = 10 } = req.query;

    const validNutrients = [
      'protein', 'iron', 'calcium', 'magnesium', 'zinc',
      'fiber', 'potassium', 'vitaminE', 'vitaminB1', 'vitaminB6',
      'folate', 'unsaturatedFat'
    ];

    if (!validNutrients.includes(nutrient)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid nutrient',
        validNutrients
      });
    }

    const products = await nutritionService.getHighNutrientProducts(nutrient, parseInt(limit));

    // Add badges to products
    const productsWithBadges = products.map(product => ({
      ...product.toObject(),
      badges: nutritionService.getProductBadges(product)
    }));

    res.json({
      success: true,
      data: productsWithBadges,
      nutrient,
      count: products.length
    });

  } catch (error) {
    console.error('Error getting products by nutrient:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get products'
    });
  }
});

/**
 * GET /api/nutrition/similar/:productId
 * Get nutritionally similar products
 */
router.get('/similar/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit = 6 } = req.query;

    const similarProducts = await nutritionService.getSimilarNutritionProducts(
      productId,
      parseInt(limit)
    );

    res.json({
      success: true,
      data: similarProducts,
      sourceProductId: productId,
      count: similarProducts.length
    });

  } catch (error) {
    console.error('Error getting similar products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get similar products'
    });
  }
});

/**
 * GET /api/nutrition/product/:productId
 * Get product nutrition details with badges
 */
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findOne({ id: productId });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    const nutritionInfo = product.nutritionInfo || {};
    const badges = nutritionService.getProductBadges(product);

    // Daily value percentages (based on standard daily values)
    const dailyValues = {
      calories: Math.round((nutritionInfo.calories / 2000) * 100),
      protein: Math.round((nutritionInfo.protein / 50) * 100),
      totalFat: Math.round((nutritionInfo.totalFat / 65) * 100),
      saturatedFat: Math.round((nutritionInfo.saturatedFat / 20) * 100),
      carbohydrates: Math.round((nutritionInfo.carbohydrates / 300) * 100),
      fiber: Math.round((nutritionInfo.fiber / 25) * 100),
      iron: Math.round((nutritionInfo.iron / 18) * 100),
      calcium: Math.round((nutritionInfo.calcium / 1000) * 100),
      potassium: Math.round((nutritionInfo.potassium / 3500) * 100),
      vitaminE: Math.round((nutritionInfo.vitaminE / 15) * 100)
    };

    res.json({
      success: true,
      data: {
        productId,
        productName: product.name,
        nutritionInfo,
        badges,
        dailyValues,
        servingSize: nutritionInfo.servingSize || '100g'
      }
    });

  } catch (error) {
    console.error('Error getting product nutrition:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get product nutrition'
    });
  }
});

/**
 * POST /api/nutrition/learn-preferences
 * Trigger preference learning from purchase history
 */
router.post('/learn-preferences', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    const profile = await nutritionService.learnUserPreferences(userId);

    res.json({
      success: true,
      data: {
        preferredNutrients: profile.preferredNutrients,
        lastPreferenceUpdate: profile.lastPreferenceUpdate
      },
      message: 'Preferences learned successfully'
    });

  } catch (error) {
    console.error('Error learning preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to learn preferences'
    });
  }
});

/**
 * GET /api/nutrition/collaborative
 * Get recommendations based on similar health goal users
 */
router.get('/collaborative', async (req, res) => {
  try {
    const { userId, limit = 10 } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    const recommendations = await nutritionService.getHealthGoalCollaborativeRecommendations(
      userId,
      parseInt(limit)
    );

    res.json({
      success: true,
      data: recommendations,
      count: recommendations.length
    });

  } catch (error) {
    console.error('Error getting collaborative recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get recommendations'
    });
  }
});

/**
 * GET /api/nutrition/health-goals
 * Get list of available health goals with descriptions
 */
router.get('/health-goals', async (req, res) => {
  try {
    const healthGoals = [
      {
        id: 'muscle-building',
        label: 'Muscle Building',
        description: 'High protein foods for muscle growth and recovery',
        icon: '💪',
        primaryNutrient: 'protein'
      },
      {
        id: 'weight-loss',
        label: 'Weight Loss',
        description: 'High fiber, low sugar options for weight management',
        icon: '⚖️',
        primaryNutrient: 'fiber'
      },
      {
        id: 'heart-health',
        label: 'Heart Health',
        description: 'Foods with healthy fats and minerals for cardiovascular health',
        icon: '❤️',
        primaryNutrient: 'unsaturatedFat'
      },
      {
        id: 'immunity-boost',
        label: 'Immunity Boost',
        description: 'Zinc and vitamin-rich foods to strengthen immune system',
        icon: '🛡️',
        primaryNutrient: 'zinc'
      },
      {
        id: 'bone-health',
        label: 'Bone Health',
        description: 'Calcium and phosphorus for strong bones',
        icon: '🦴',
        primaryNutrient: 'calcium'
      },
      {
        id: 'energy-boost',
        label: 'Energy Boost',
        description: 'Iron and B-vitamin rich foods for sustained energy',
        icon: '⚡',
        primaryNutrient: 'iron'
      },
      {
        id: 'diabetes-friendly',
        label: 'Diabetes Friendly',
        description: 'Low sugar, high fiber options for blood sugar management',
        icon: '🩺',
        primaryNutrient: 'fiber'
      },
      {
        id: 'brain-health',
        label: 'Brain Health',
        description: 'Vitamin E and healthy fats for cognitive function',
        icon: '🧠',
        primaryNutrient: 'vitaminE'
      }
    ];

    res.json({
      success: true,
      data: healthGoals
    });

  } catch (error) {
    console.error('Error getting health goals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get health goals'
    });
  }
});

module.exports = router;
