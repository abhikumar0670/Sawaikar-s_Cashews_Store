const mongoose = require('mongoose');

const bundleItemSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    default: 1
  },
  variantWeight: {
    type: String,
    default: '250g'
  }
}, { _id: false });

const bundleSchema = new mongoose.Schema({
  bundleId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  products: [bundleItemSchema],
  originalPrice: {
    type: Number,  // Sum of individual product prices (in paise)
    required: true
  },
  bundlePrice: {
    type: Number,  // Discounted bundle price (in paise)
    required: true
  },
  discountPercent: {
    type: Number,
    default: 0
  },
  image: {
    type: [String],
    default: ['./images/bundle-default.jpg']
  },
  bundleType: {
    type: String,
    enum: ['curated', 'seasonal', 'gift', 'subscription', 'flash', 'custom'],
    default: 'curated'
  },
  theme: {
    type: String  // e.g., 'Diwali Special', 'Health Pack', 'Party Pack'
  },
  tags: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  stock: {
    type: Number,
    default: 100
  },
  // For flash/limited time bundles
  validFrom: {
    type: Date
  },
  validUntil: {
    type: Date
  },
  // Stats
  totalSales: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for queries
bundleSchema.index({ isActive: 1, bundleType: 1 });
bundleSchema.index({ isFeatured: 1 });
bundleSchema.index({ validUntil: 1 });

// Calculate discount percentage
bundleSchema.pre('save', function(next) {
  if (this.originalPrice && this.bundlePrice) {
    this.discountPercent = Math.round(((this.originalPrice - this.bundlePrice) / this.originalPrice) * 100);
  }
  next();
});

// Check if bundle is currently valid
bundleSchema.methods.isValid = function() {
  if (!this.isActive) return false;

  const now = new Date();

  if (this.validFrom && now < this.validFrom) return false;
  if (this.validUntil && now > this.validUntil) return false;

  return true;
};

// Get active bundles
bundleSchema.statics.getActive = async function(type = null) {
  const query = {
    isActive: true,
    $or: [
      { validUntil: null },
      { validUntil: { $gt: new Date() } }
    ]
  };

  if (type) {
    query.bundleType = type;
  }

  return this.find(query).sort({ isFeatured: -1, totalSales: -1 });
};

// Get featured bundles
bundleSchema.statics.getFeatured = async function(limit = 4) {
  return this.find({
    isActive: true,
    isFeatured: true,
    $or: [
      { validUntil: null },
      { validUntil: { $gt: new Date() } }
    ]
  })
  .sort({ totalSales: -1 })
  .limit(limit);
};

module.exports = mongoose.model('Bundle', bundleSchema);
