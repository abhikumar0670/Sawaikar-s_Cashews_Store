const mongoose = require('mongoose');

// Schema for tracking nutrient preferences (auto-learned)
const preferredNutrientSchema = new mongoose.Schema({
  nutrient: {
    type: String,
    required: true,
    enum: ['protein', 'iron', 'calcium', 'magnesium', 'zinc', 'fiber',
           'potassium', 'vitaminE', 'vitaminB1', 'vitaminB6', 'folate',
           'unsaturatedFat', 'calories']
  },
  preference: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  score: {
    type: Number,
    default: 0  // Higher score = stronger preference
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Schema for nutrient consumption history
const nutrientHistorySchema = new mongoose.Schema({
  nutrient: {
    type: String,
    required: true
  },
  avgConsumption: {
    type: Number,
    default: 0
  },
  totalPurchased: {
    type: Number,
    default: 0  // Total grams purchased
  },
  purchaseCount: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

const userHealthProfileSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // User's declared health goals
  healthGoals: [{
    type: String,
    enum: ['muscle-building', 'weight-loss', 'heart-health',
           'immunity-boost', 'bone-health', 'energy-boost',
           'diabetes-friendly', 'brain-health']
  }],

  // Dietary restrictions
  dietaryRestrictions: [{
    type: String,
    enum: ['vegan', 'vegetarian', 'keto', 'low-sodium',
           'diabetic-friendly', 'gluten-free', 'low-fat', 'none']
  }],

  // Allergens to avoid
  allergens: [{
    type: String,
    enum: ['tree-nuts', 'peanuts', 'soy', 'gluten', 'dairy', 'none']
  }],

  // Auto-learned nutrient preferences (from purchase history)
  preferredNutrients: [preferredNutrientSchema],

  // Nutrient consumption tracking
  nutrientHistory: [nutrientHistorySchema],

  // Onboarding status
  onboardingCompleted: {
    type: Boolean,
    default: false
  },

  // Skip count (how many times user skipped onboarding)
  onboardingSkipCount: {
    type: Number,
    default: 0
  },

  // Profile completeness percentage
  profileCompleteness: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },

  // Last time preferences were recalculated
  lastPreferenceUpdate: {
    type: Date
  },

  // Recommendation preferences
  showNutritionRecommendations: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Calculate profile completeness
userHealthProfileSchema.methods.calculateCompleteness = function() {
  let score = 0;
  const totalFields = 3;  // healthGoals, dietaryRestrictions, allergens

  if (this.healthGoals && this.healthGoals.length > 0) score++;
  if (this.dietaryRestrictions && this.dietaryRestrictions.length > 0) score++;
  if (this.allergens && this.allergens.length > 0) score++;

  this.profileCompleteness = Math.round((score / totalFields) * 100);
  return this.profileCompleteness;
};

// Update nutrient history after a purchase
userHealthProfileSchema.methods.updateNutrientHistory = async function(productNutrition, quantityGrams) {
  const nutrients = ['protein', 'iron', 'calcium', 'magnesium', 'zinc', 'fiber',
                     'potassium', 'vitaminE', 'vitaminB1', 'vitaminB6', 'folate'];

  for (const nutrient of nutrients) {
    if (productNutrition[nutrient] && productNutrition[nutrient] > 0) {
      let historyEntry = this.nutrientHistory.find(h => h.nutrient === nutrient);

      if (!historyEntry) {
        this.nutrientHistory.push({
          nutrient,
          avgConsumption: productNutrition[nutrient],
          totalPurchased: (productNutrition[nutrient] * quantityGrams) / 100,
          purchaseCount: 1,
          lastUpdated: new Date()
        });
      } else {
        historyEntry.purchaseCount++;
        historyEntry.totalPurchased += (productNutrition[nutrient] * quantityGrams) / 100;
        historyEntry.avgConsumption = historyEntry.totalPurchased / historyEntry.purchaseCount;
        historyEntry.lastUpdated = new Date();
      }
    }
  }

  return this.save();
};

// Learn preferences from purchase history
userHealthProfileSchema.methods.learnPreferences = function() {
  if (this.nutrientHistory.length === 0) return;

  // Calculate scores based on purchase frequency and amounts
  const nutrientScores = {};

  for (const history of this.nutrientHistory) {
    // Score = purchaseCount * avgConsumption (normalized)
    nutrientScores[history.nutrient] = history.purchaseCount * Math.log(history.avgConsumption + 1);
  }

  // Find the max score for normalization
  const maxScore = Math.max(...Object.values(nutrientScores));

  // Update preferred nutrients
  this.preferredNutrients = Object.entries(nutrientScores).map(([nutrient, score]) => {
    const normalizedScore = (score / maxScore) * 100;
    let preference = 'medium';

    if (normalizedScore >= 70) preference = 'high';
    else if (normalizedScore <= 30) preference = 'low';

    return {
      nutrient,
      preference,
      score: normalizedScore,
      lastUpdated: new Date()
    };
  }).sort((a, b) => b.score - a.score);

  this.lastPreferenceUpdate = new Date();
  return this.save();
};

// Static method to get or create profile
userHealthProfileSchema.statics.getOrCreate = async function(userId) {
  let profile = await this.findOne({ userId });

  if (!profile) {
    profile = await this.create({ userId });
  }

  return profile;
};

// Static method to get users with similar health goals
userHealthProfileSchema.statics.getSimilarUsers = async function(userId, limit = 10) {
  const userProfile = await this.findOne({ userId });
  if (!userProfile || !userProfile.healthGoals.length) return [];

  return await this.find({
    userId: { $ne: userId },
    healthGoals: { $in: userProfile.healthGoals },
    onboardingCompleted: true
  })
  .select('userId healthGoals preferredNutrients')
  .limit(limit);
};

// Index for faster queries
userHealthProfileSchema.index({ healthGoals: 1 });
userHealthProfileSchema.index({ onboardingCompleted: 1 });
userHealthProfileSchema.index({ 'preferredNutrients.nutrient': 1 });

module.exports = mongoose.model('UserHealthProfile', userHealthProfileSchema);
