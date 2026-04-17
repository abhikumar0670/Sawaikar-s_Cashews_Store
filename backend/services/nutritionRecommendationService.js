const Product = require('../models/Product');
const UserHealthProfile = require('../models/UserHealthProfile');
const UserInteraction = require('../models/UserInteraction');

// Health Goal to Nutrient Mapping
const HEALTH_GOAL_NUTRIENTS = {
  'muscle-building': {
    primary: 'protein',
    secondary: ['zinc', 'magnesium'],
    avoid: [],
    minThreshold: { protein: 15 }  // g per 100g
  },
  'heart-health': {
    primary: 'unsaturatedFat',
    secondary: ['magnesium', 'potassium', 'fiber'],
    avoid: ['saturatedFat'],
    minThreshold: { unsaturatedFat: 20 }
  },
  'weight-loss': {
    primary: 'fiber',
    secondary: ['protein'],
    avoid: ['sugars', 'calories'],
    minThreshold: { fiber: 3, protein: 10 }
  },
  'immunity-boost': {
    primary: 'zinc',
    secondary: ['vitaminE', 'selenium', 'copper'],
    avoid: [],
    minThreshold: { zinc: 4 }
  },
  'bone-health': {
    primary: 'calcium',
    secondary: ['phosphorus', 'magnesium'],
    avoid: [],
    minThreshold: { calcium: 30, magnesium: 200 }
  },
  'energy-boost': {
    primary: 'iron',
    secondary: ['vitaminB1', 'calories', 'magnesium'],
    avoid: [],
    minThreshold: { iron: 4, calories: 500 }
  },
  'diabetes-friendly': {
    primary: 'fiber',
    secondary: ['protein', 'magnesium'],
    avoid: ['sugars', 'carbohydrates'],
    minThreshold: { fiber: 3 },
    maxThreshold: { sugars: 6 }
  },
  'brain-health': {
    primary: 'vitaminE',
    secondary: ['unsaturatedFat', 'folate', 'zinc'],
    avoid: [],
    minThreshold: { vitaminE: 3 }
  }
};

// Nutrient high thresholds (for badge calculation)
const HIGH_NUTRIENT_THRESHOLDS = {
  protein: 18,        // g per 100g
  iron: 5,            // mg per 100g
  fiber: 5,           // g per 100g
  calcium: 40,        // mg per 100g
  magnesium: 250,     // mg per 100g
  zinc: 5,            // mg per 100g
  potassium: 600,     // mg per 100g
  vitaminE: 4,        // mg per 100g
  unsaturatedFat: 25  // g per 100g
};

class NutritionRecommendationService {
  /**
   * Get nutrition-based recommendations for a user
   */
  async getNutritionBasedRecommendations(userId, limit = 10) {
    try {
      const profile = await UserHealthProfile.findOne({ userId });

      if (!profile || !profile.healthGoals.length) {
        // No profile or goals - return general healthy products
        return await this.getGeneralHealthyProducts(limit);
      }

      const recommendations = [];
      const seenProducts = new Set();

      // Get recommendations based on each health goal
      for (const goal of profile.healthGoals) {
        const goalProducts = await this.getProductsForHealthGoal(goal, Math.ceil(limit / profile.healthGoals.length));

        for (const product of goalProducts) {
          if (!seenProducts.has(product.id)) {
            seenProducts.add(product.id);
            recommendations.push({
              product,
              score: this.calculateNutritionScore(product, profile),
              reason: `nutrition_match`,
              matchedGoal: goal,
              explanation: this.getRecommendationExplanation(product, goal)
            });
          }
        }
      }

      // Also consider preferred nutrients from purchase history
      if (profile.preferredNutrients && profile.preferredNutrients.length > 0) {
        const topPreferredNutrient = profile.preferredNutrients[0];
        const preferredProducts = await this.getHighNutrientProducts(topPreferredNutrient.nutrient, 5);

        for (const product of preferredProducts) {
          if (!seenProducts.has(product.id)) {
            seenProducts.add(product.id);
            recommendations.push({
              product,
              score: this.calculateNutritionScore(product, profile) * 0.8,  // Slightly lower weight
              reason: 'learned_preference',
              matchedNutrient: topPreferredNutrient.nutrient,
              explanation: `High in ${topPreferredNutrient.nutrient} - based on your purchase history`
            });
          }
        }
      }

      // Sort by score and return top results
      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    } catch (error) {
      console.error('Error getting nutrition recommendations:', error);
      return [];
    }
  }

  /**
   * Get products matching a specific health goal
   */
  async getProductsForHealthGoal(healthGoal, limit = 10) {
    const goalConfig = HEALTH_GOAL_NUTRIENTS[healthGoal];
    if (!goalConfig) return [];

    try {
      // Build query based on nutrient requirements
      const query = {
        isArchived: { $ne: true }
      };

      // Add minimum threshold conditions
      if (goalConfig.minThreshold) {
        for (const [nutrient, minValue] of Object.entries(goalConfig.minThreshold)) {
          query[`nutritionInfo.${nutrient}`] = { $gte: minValue };
        }
      }

      // Get products matching health tags or nutrient criteria
      let products = await Product.find(query)
        .sort({ [`nutritionInfo.${goalConfig.primary}`]: -1, rating: -1 })
        .limit(limit * 2);  // Get more to filter

      // Filter out products with nutrients to avoid (if threshold exceeded)
      if (goalConfig.avoid && goalConfig.avoid.length > 0) {
        products = products.filter(product => {
          for (const avoidNutrient of goalConfig.avoid) {
            const value = product.nutritionInfo?.[avoidNutrient] || 0;
            // Filter out if saturated fat > 10g or sugars > 10g
            if (avoidNutrient === 'saturatedFat' && value > 10) return false;
            if (avoidNutrient === 'sugars' && value > 10) return false;
          }
          return true;
        });
      }

      return products.slice(0, limit);

    } catch (error) {
      console.error('Error getting products for health goal:', error);
      return [];
    }
  }

  /**
   * Get products high in a specific nutrient
   */
  async getHighNutrientProducts(nutrient, limit = 10) {
    try {
      const nutrientPath = `nutritionInfo.${nutrient}`;
      const threshold = HIGH_NUTRIENT_THRESHOLDS[nutrient] || 0;

      return await Product.find({
        [nutrientPath]: { $gte: threshold },
        isArchived: { $ne: true }
      })
      .sort({ [nutrientPath]: -1 })
      .limit(limit);

    } catch (error) {
      console.error('Error getting high nutrient products:', error);
      return [];
    }
  }

  /**
   * Get products with similar nutritional profile
   */
  async getSimilarNutritionProducts(productId, limit = 6) {
    try {
      const sourceProduct = await Product.findOne({ id: productId });
      if (!sourceProduct || !sourceProduct.nutritionInfo) return [];

      const allProducts = await Product.find({
        id: { $ne: productId },
        isArchived: { $ne: true },
        'nutritionInfo.calories': { $gt: 0 }  // Has nutrition data
      }).limit(100);

      // Calculate similarity scores
      const similarities = allProducts.map(product => ({
        product,
        similarity: this.calculateNutritionSimilarity(sourceProduct, product)
      }));

      // Sort by similarity and return top matches
      return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        .map(s => ({
          ...s.product.toObject(),
          similarityScore: s.similarity
        }));

    } catch (error) {
      console.error('Error getting similar nutrition products:', error);
      return [];
    }
  }

  /**
   * Calculate nutritional similarity between two products using cosine similarity
   */
  calculateNutritionSimilarity(product1, product2) {
    const nutrients = ['protein', 'totalFat', 'carbohydrates', 'fiber', 'iron',
                       'calcium', 'magnesium', 'zinc', 'potassium', 'vitaminE'];

    const vector1 = nutrients.map(n => product1.nutritionInfo?.[n] || 0);
    const vector2 = nutrients.map(n => product2.nutritionInfo?.[n] || 0);

    // Normalize vectors
    const normalizedV1 = this.normalizeVector(vector1);
    const normalizedV2 = this.normalizeVector(vector2);

    // Calculate cosine similarity
    let dotProduct = 0;
    for (let i = 0; i < normalizedV1.length; i++) {
      dotProduct += normalizedV1[i] * normalizedV2[i];
    }

    return Math.round(dotProduct * 100) / 100;  // Return as percentage (0-1)
  }

  /**
   * Normalize a vector
   */
  normalizeVector(vector) {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude === 0) return vector.map(() => 0);
    return vector.map(val => val / magnitude);
  }

  /**
   * Calculate nutrition score for a product based on user profile
   */
  calculateNutritionScore(product, profile) {
    let score = 0;
    const nutrition = product.nutritionInfo || {};

    // Score based on health goals
    for (const goal of profile.healthGoals) {
      const goalConfig = HEALTH_GOAL_NUTRIENTS[goal];
      if (!goalConfig) continue;

      // Primary nutrient match
      const primaryValue = nutrition[goalConfig.primary] || 0;
      const threshold = goalConfig.minThreshold?.[goalConfig.primary] || 0;
      if (primaryValue >= threshold) {
        score += 30 * (primaryValue / Math.max(threshold, 1));
      }

      // Secondary nutrient matches
      for (const secondaryNutrient of goalConfig.secondary) {
        const secondaryValue = nutrition[secondaryNutrient] || 0;
        if (secondaryValue > 0) {
          score += 10;
        }
      }

      // Penalty for nutrients to avoid
      for (const avoidNutrient of goalConfig.avoid || []) {
        const avoidValue = nutrition[avoidNutrient] || 0;
        if (avoidValue > 10) {
          score -= 20;
        }
      }
    }

    // Bonus for health tags matching
    const healthTags = nutrition.healthTags || [];
    for (const goal of profile.healthGoals) {
      const relatedTags = this.getRelatedTags(goal);
      for (const tag of relatedTags) {
        if (healthTags.includes(tag)) {
          score += 15;
        }
      }
    }

    // Factor in product rating
    score += (product.rating || 0) * 5;

    return Math.max(0, score);
  }

  /**
   * Get health tags related to a goal
   */
  getRelatedTags(goal) {
    const tagMapping = {
      'muscle-building': ['high-protein'],
      'heart-health': ['heart-healthy'],
      'weight-loss': ['high-fiber', 'weight-loss'],
      'immunity-boost': ['immunity-boost'],
      'bone-health': ['bone-health'],
      'energy-boost': ['energy-boost', 'iron-rich'],
      'diabetes-friendly': ['diabetic-friendly', 'low-sodium'],
      'brain-health': ['brain-health']
    };
    return tagMapping[goal] || [];
  }

  /**
   * Get human-readable recommendation explanation
   */
  getRecommendationExplanation(product, goal) {
    const goalConfig = HEALTH_GOAL_NUTRIENTS[goal];
    if (!goalConfig) return 'Recommended for you';

    const nutrition = product.nutritionInfo || {};
    const primaryValue = nutrition[goalConfig.primary];

    const goalLabels = {
      'muscle-building': 'muscle building',
      'heart-health': 'heart health',
      'weight-loss': 'weight management',
      'immunity-boost': 'immunity',
      'bone-health': 'bone health',
      'energy-boost': 'energy',
      'diabetes-friendly': 'blood sugar management',
      'brain-health': 'brain health'
    };

    const nutrientLabels = {
      protein: 'protein',
      unsaturatedFat: 'healthy fats',
      fiber: 'fiber',
      zinc: 'zinc',
      calcium: 'calcium',
      iron: 'iron',
      vitaminE: 'vitamin E'
    };

    const goalLabel = goalLabels[goal] || goal;
    const nutrientLabel = nutrientLabels[goalConfig.primary] || goalConfig.primary;

    if (primaryValue) {
      return `High in ${nutrientLabel} (${primaryValue}g) - great for ${goalLabel}`;
    }

    return `Recommended for ${goalLabel}`;
  }

  /**
   * Get general healthy products (for users without profile)
   */
  async getGeneralHealthyProducts(limit = 10) {
    try {
      return await Product.find({
        isArchived: { $ne: true },
        'nutritionInfo.protein': { $gte: 10 },
        rating: { $gte: 3 }
      })
      .sort({ rating: -1, totalSales: -1 })
      .limit(limit);

    } catch (error) {
      console.error('Error getting general healthy products:', error);
      return [];
    }
  }

  /**
   * Get product nutrition badges
   */
  getProductBadges(product) {
    const badges = [];
    const nutrition = product.nutritionInfo || {};

    if (nutrition.protein >= HIGH_NUTRIENT_THRESHOLDS.protein) {
      badges.push({ type: 'high-protein', label: 'High Protein', icon: '💪' });
    }

    if (nutrition.unsaturatedFat >= HIGH_NUTRIENT_THRESHOLDS.unsaturatedFat &&
        (nutrition.saturatedFat || 0) < 8) {
      badges.push({ type: 'heart-healthy', label: 'Heart Healthy', icon: '❤️' });
    }

    if (nutrition.iron >= HIGH_NUTRIENT_THRESHOLDS.iron) {
      badges.push({ type: 'iron-rich', label: 'Iron Rich', icon: '🔋' });
    }

    if (nutrition.fiber >= HIGH_NUTRIENT_THRESHOLDS.fiber) {
      badges.push({ type: 'high-fiber', label: 'High Fiber', icon: '🥗' });
    }

    if (nutrition.calories >= 500 && nutrition.iron >= 4) {
      badges.push({ type: 'energy-boost', label: 'Energy Boost', icon: '⚡' });
    }

    if (nutrition.zinc >= HIGH_NUTRIENT_THRESHOLDS.zinc) {
      badges.push({ type: 'immunity-boost', label: 'Immunity Boost', icon: '🛡️' });
    }

    return badges;
  }

  /**
   * Learn user preferences from their purchase history
   */
  async learnUserPreferences(userId) {
    try {
      const profile = await UserHealthProfile.getOrCreate(userId);

      // Get user's purchase interactions
      const purchases = await UserInteraction.find({
        userId,
        actionType: 'purchase'
      })
      .sort({ timestamp: -1 })
      .limit(50);

      if (purchases.length === 0) return profile;

      // Get nutrition info for purchased products
      const productIds = purchases.map(p => p.productId);
      const products = await Product.find({ id: { $in: productIds } });

      // Update nutrient history based on purchases
      for (const purchase of purchases) {
        const product = products.find(p => p.id === purchase.productId);
        if (product && product.nutritionInfo) {
          // Assume 250g average purchase per interaction
          await profile.updateNutrientHistory(product.nutritionInfo, 250);
        }
      }

      // Re-learn preferences
      await profile.learnPreferences();

      return profile;

    } catch (error) {
      console.error('Error learning user preferences:', error);
      throw error;
    }
  }

  /**
   * Get recommendations based on collaborative filtering with health goals
   */
  async getHealthGoalCollaborativeRecommendations(userId, limit = 10) {
    try {
      // Find users with similar health goals
      const similarUsers = await UserHealthProfile.getSimilarUsers(userId, 20);

      if (similarUsers.length === 0) return [];

      const similarUserIds = similarUsers.map(u => u.userId);

      // Get products purchased by similar users
      const interactions = await UserInteraction.find({
        userId: { $in: similarUserIds },
        actionType: { $in: ['purchase', 'review'] }
      });

      // Count product occurrences
      const productCounts = {};
      for (const interaction of interactions) {
        if (!productCounts[interaction.productId]) {
          productCounts[interaction.productId] = 0;
        }
        productCounts[interaction.productId]++;
      }

      // Get user's already purchased products
      const userPurchases = await UserInteraction.find({
        userId,
        actionType: 'purchase'
      }).select('productId');
      const userProductIds = new Set(userPurchases.map(p => p.productId));

      // Filter and sort recommendations
      const recommendedIds = Object.entries(productCounts)
        .filter(([id]) => !userProductIds.has(id))
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id]) => id);

      const products = await Product.find({
        id: { $in: recommendedIds },
        isArchived: { $ne: true }
      });

      return products.map(product => ({
        product,
        reason: 'similar_health_goals',
        explanation: 'Popular among users with similar health goals'
      }));

    } catch (error) {
      console.error('Error getting collaborative recommendations:', error);
      return [];
    }
  }
}

module.exports = new NutritionRecommendationService();
