const mongoose = require('mongoose');

// Schema for individual user reviews
const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userClerkId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const productSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true
  },
  image: {
    type: [String],
    default: ["./images/premium.jpg"]
  },
  category: {
    type: String,
    required: true,
    default: "cashews"
  },
  company: {
    type: String,
    default: "Sawaikar's"
  },
  description: {
    type: String,
    default: "Premium quality cashews from Goa."
  },
  colors: {
    type: [String],
    default: ["#F5DEB3", "#DEB887"]
  },
  stock: {
    type: Number,
    default: 50
  },
  numReviews: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviews: {
    type: [reviewSchema],
    default: []
  },
  featured: {
    type: Boolean,
    default: false
  },
  shipping: {
    type: Boolean,
    default: true
  },
  // Product variants (weight options)
  variants: [{
    weight: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    stock: {
      type: Number,
      default: 0,
      min: 0
    },
    sku: {
      type: String
    },
    barcode: {
      type: String,
      sparse: true,
      index: true
    }
  }],
  // Sales data
  totalSales: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  // Nutritional Information (per 100g serving)
  nutritionInfo: {
    // Macronutrients
    calories: { type: Number, default: 0 },           // kcal
    protein: { type: Number, default: 0 },            // grams
    totalFat: { type: Number, default: 0 },           // grams
    saturatedFat: { type: Number, default: 0 },       // grams
    unsaturatedFat: { type: Number, default: 0 },     // grams (heart-healthy fats)
    carbohydrates: { type: Number, default: 0 },      // grams
    fiber: { type: Number, default: 0 },              // grams
    sugars: { type: Number, default: 0 },             // grams

    // Key Minerals (important for dry fruits)
    iron: { type: Number, default: 0 },               // mg
    calcium: { type: Number, default: 0 },            // mg
    magnesium: { type: Number, default: 0 },          // mg
    zinc: { type: Number, default: 0 },               // mg
    potassium: { type: Number, default: 0 },          // mg
    phosphorus: { type: Number, default: 0 },         // mg
    copper: { type: Number, default: 0 },             // mg
    selenium: { type: Number, default: 0 },           // mcg

    // Vitamins
    vitaminE: { type: Number, default: 0 },           // mg
    vitaminB1: { type: Number, default: 0 },          // mg (Thiamine)
    vitaminB6: { type: Number, default: 0 },          // mg
    folate: { type: Number, default: 0 },             // mcg

    // Health classification
    healthTags: [{
      type: String,
      enum: ['high-protein', 'heart-healthy', 'keto-friendly', 'iron-rich',
             'high-fiber', 'energy-boost', 'immunity-boost', 'bone-health',
             'brain-health', 'low-sodium', 'diabetic-friendly', 'weight-loss']
    }],
    healthBenefits: [{ type: String }],  // ["Boosts immunity", "Good for heart"]
    allergens: [{
      type: String,
      enum: ['tree-nuts', 'peanuts', 'soy', 'gluten', 'dairy', 'none']
    }],
    servingSize: { type: String, default: '100g' }
  }
}, {
  timestamps: true
});

// Index for faster queries
productSchema.index({ category: 1 });
productSchema.index({ featured: 1 });
productSchema.index({ isArchived: 1 });
productSchema.index({ totalSales: -1 });
productSchema.index({ name: 'text', description: 'text' });
// Nutrition-related indexes
productSchema.index({ 'nutritionInfo.healthTags': 1 });
productSchema.index({ 'nutritionInfo.protein': -1 });
productSchema.index({ 'nutritionInfo.iron': -1 });
productSchema.index({ 'nutritionInfo.fiber': -1 });
// Barcode index for fast in-store checkout lookups
productSchema.index({ 'variants.barcode': 1 });

// Method to archive product
productSchema.methods.archive = function(archivedBy) {
  this.isArchived = true;
  this.archivedAt = new Date();
  this.archivedBy = archivedBy;
  return this.save();
};

// Method to restore product
productSchema.methods.restore = function() {
  this.isArchived = false;
  this.archivedAt = null;
  this.archivedBy = null;
  return this.save();
};

// Static method to get related products
productSchema.statics.getRelated = async function(productId, limit = 4) {
  const product = await this.findOne({ id: productId });
  if (!product) return [];

  // Get products in same category, excluding current product and archived
  const related = await this.find({
    id: { $ne: productId },
    category: product.category,
    isArchived: { $ne: true }
  })
  .sort({ totalSales: -1, rating: -1 })
  .limit(limit);

  return related;
};

// Static method to get products by health tag
productSchema.statics.getByHealthTag = async function(healthTag, limit = 10) {
  return await this.find({
    'nutritionInfo.healthTags': healthTag,
    isArchived: { $ne: true }
  })
  .sort({ rating: -1, totalSales: -1 })
  .limit(limit);
};

// Static method to get products high in specific nutrient
productSchema.statics.getHighNutrientProducts = async function(nutrient, limit = 10) {
  const nutrientPath = `nutritionInfo.${nutrient}`;
  return await this.find({
    [nutrientPath]: { $gt: 0 },
    isArchived: { $ne: true }
  })
  .sort({ [nutrientPath]: -1 })
  .limit(limit);
};

// Static method to get products matching health goals
productSchema.statics.getByHealthGoal = async function(healthGoal, limit = 10) {
  const goalTagMapping = {
    'muscle-building': ['high-protein'],
    'weight-loss': ['high-fiber', 'weight-loss'],
    'heart-health': ['heart-healthy'],
    'immunity-boost': ['immunity-boost'],
    'bone-health': ['bone-health'],
    'energy-boost': ['energy-boost', 'iron-rich'],
    'brain-health': ['brain-health'],
    'diabetes-friendly': ['diabetic-friendly', 'low-sodium']
  };

  const tags = goalTagMapping[healthGoal] || [];
  if (tags.length === 0) return [];

  return await this.find({
    'nutritionInfo.healthTags': { $in: tags },
    isArchived: { $ne: true }
  })
  .sort({ rating: -1, totalSales: -1 })
  .limit(limit);
};

// Pre-save hook: Auto-generate barcodes for variants if not present
productSchema.pre('save', function(next) {
  console.log(`[PRE-SAVE] Processing product: ${this.name}`);
  
  if (this.variants && this.variants.length > 0) {
    this.variants.forEach((variant, idx) => {
      // Generate barcode if missing or empty
      if (!variant.barcode || variant.barcode.trim() === '') {
        variant.barcode = `SAW-${this.id}-${variant.weight}`;
        console.log(`[BARCODE AUTO-GENERATED] ${this.name} (${variant.weight}): ${variant.barcode}`);
      } else {
        console.log(`[BARCODE EXISTS] ${this.name} (${variant.weight}): ${variant.barcode}`);
      }
    });
    console.log(`[PRE-SAVE] Total variants processed: ${this.variants.length}`);
  } else {
    console.log(`[PRE-SAVE] ⚠️ No variants found for ${this.name}`);
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
