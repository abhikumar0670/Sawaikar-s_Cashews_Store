const mongoose = require('mongoose');

const pointsTransactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['earn', 'redeem', 'expire', 'bonus', 'referral', 'adjustment'],
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  source: {
    type: String,
    enum: ['purchase', 'review', 'referral', 'signup', 'birthday', 'spin', 'social_share', 'admin', 'redemption'],
    required: true
  },
  referenceId: {
    type: String  // orderId, reviewId, etc.
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const userLoyaltySchema = new mongoose.Schema({
  userId: {
    type: String,  // Clerk ID
    required: true,
    unique: true,
    index: true
  },
  points: {
    type: Number,
    default: 0
  },
  lifetimePoints: {
    type: Number,
    default: 0
  },
  tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    default: 'bronze'
  },
  badges: [{
    badgeId: String,
    name: String,
    description: String,
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  achievements: [{
    achievementId: String,
    name: String,
    unlockedAt: {
      type: Date,
      default: Date.now
    },
    claimed: {
      type: Boolean,
      default: false
    },
    claimedAt: {
      type: Date
    }
  }],
  transactions: [pointsTransactionSchema],
  spinCount: {
    type: Number,
    default: 0
  },
  lastSpinDate: {
    type: Date
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referredBy: {
    type: String  // referral code of referrer
  },
  stats: {
    totalOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    totalReferrals: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Tier thresholds
const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 1000,
  gold: 5000,
  platinum: 15000
};

// Points earning rules
const POINTS_RULES = {
  purchase: 1,         // 1 point per ₹100 spent
  review: 50,          // 50 points per review
  signup: 100,         // 100 points for signup
  referral: 200,       // 200 points for successful referral
  birthday: 100,       // 100 points on birthday
  spin_min: 10,        // Minimum spin reward
  spin_max: 100        // Maximum spin reward
};

// Calculate tier based on lifetime points
userLoyaltySchema.methods.calculateTier = function() {
  const points = this.lifetimePoints;

  if (points >= TIER_THRESHOLDS.platinum) return 'platinum';
  if (points >= TIER_THRESHOLDS.gold) return 'gold';
  if (points >= TIER_THRESHOLDS.silver) return 'silver';
  return 'bronze';
};

// Add points
userLoyaltySchema.methods.addPoints = async function(points, source, description, referenceId = null) {
  this.points += points;
  this.lifetimePoints += points;

  this.transactions.push({
    type: 'earn',
    points,
    description,
    source,
    referenceId
  });

  // Update tier
  this.tier = this.calculateTier();

  return this.save();
};

// Redeem points
userLoyaltySchema.methods.redeemPoints = async function(points, description, referenceId = null) {
  if (this.points < points) {
    throw new Error('Insufficient points');
  }

  this.points -= points;

  this.transactions.push({
    type: 'redeem',
    points: -points,
    description,
    source: 'redemption',
    referenceId
  });

  return this.save();
};

// Add badge
userLoyaltySchema.methods.addBadge = async function(badgeId, name, description) {
  // Check if already has badge
  const hasBadge = this.badges.some(b => b.badgeId === badgeId);
  if (hasBadge) return this;

  this.badges.push({
    badgeId,
    name,
    description,
    earnedAt: new Date()
  });

  return this.save();
};

// Check spin eligibility (once per day)
userLoyaltySchema.methods.canSpin = function() {
  if (!this.lastSpinDate) return true;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastSpin = new Date(this.lastSpinDate);
  lastSpin.setHours(0, 0, 0, 0);

  return today > lastSpin;
};

// Perform daily spin
userLoyaltySchema.methods.spin = async function() {
  if (!this.canSpin()) {
    throw new Error('Already used daily spin');
  }

  // Random points between min and max
  const points = Math.floor(Math.random() * (POINTS_RULES.spin_max - POINTS_RULES.spin_min + 1)) + POINTS_RULES.spin_min;

  this.points += points;
  this.lifetimePoints += points;
  this.spinCount += 1;
  this.lastSpinDate = new Date();

  this.transactions.push({
    type: 'bonus',
    points,
    description: 'Daily spin reward',
    source: 'spin'
  });

  await this.save();

  return points;
};

// Generate unique referral code
userLoyaltySchema.statics.generateReferralCode = function() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'SAW';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Get or create loyalty profile
userLoyaltySchema.statics.getOrCreate = async function(userId) {
  let loyalty = await this.findOne({ userId });

  if (!loyalty) {
    const referralCode = this.generateReferralCode();
    loyalty = await this.create({
      userId,
      referralCode,
      points: POINTS_RULES.signup,
      lifetimePoints: POINTS_RULES.signup,
      transactions: [{
        type: 'earn',
        points: POINTS_RULES.signup,
        description: 'Welcome bonus',
        source: 'signup'
      }]
    });
  }

  return loyalty;
};

// Calculate points for order
userLoyaltySchema.statics.calculateOrderPoints = function(orderAmount, tier = 'bronze') {
  const multipliers = {
    bronze: 1,
    silver: 1.25,
    gold: 1.5,
    platinum: 2
  };

  const basePoints = Math.floor(orderAmount / 10000); // 1 point per ₹100 (amount in paise)
  return Math.floor(basePoints * (multipliers[tier] || 1));
};

// Get leaderboard
userLoyaltySchema.statics.getLeaderboard = async function(limit = 10) {
  return this.find()
    .sort({ lifetimePoints: -1 })
    .limit(limit)
    .select('userId lifetimePoints tier badges.length');
};

module.exports = mongoose.model('UserLoyalty', userLoyaltySchema);
