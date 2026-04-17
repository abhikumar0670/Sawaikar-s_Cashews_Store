const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  achievementId: {
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
  icon: {
    type: String,
    default: '🏆'
  },
  category: {
    type: String,
    enum: ['purchase', 'review', 'social', 'loyalty', 'referral', 'special'],
    default: 'special'
  },
  criteria: {
    type: {
      type: String,
      enum: ['count', 'amount', 'streak', 'milestone'],
      required: true
    },
    target: {
      type: Number,
      required: true
    },
    field: {
      type: String  // e.g., 'totalOrders', 'totalSpent', 'totalReviews'
    }
  },
  reward: {
    points: {
      type: Number,
      default: 0
    },
    badge: {
      type: String
    },
    discountCode: {
      type: String
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    default: 'common'
  }
}, {
  timestamps: true
});

// Pre-defined achievements
const DEFAULT_ACHIEVEMENTS = [
  {
    achievementId: 'first_purchase',
    name: 'First Purchase',
    description: 'Complete your first order',
    icon: '🛒',
    category: 'purchase',
    criteria: { type: 'count', target: 1, field: 'totalOrders' },
    reward: { points: 50 },
    rarity: 'common'
  },
  {
    achievementId: 'loyal_customer',
    name: 'Loyal Customer',
    description: 'Place 5 orders',
    icon: '💎',
    category: 'purchase',
    criteria: { type: 'count', target: 5, field: 'totalOrders' },
    reward: { points: 200 },
    rarity: 'uncommon'
  },
  {
    achievementId: 'cashew_connoisseur',
    name: 'Cashew Connoisseur',
    description: 'Place 20 orders',
    icon: '👑',
    category: 'purchase',
    criteria: { type: 'count', target: 20, field: 'totalOrders' },
    reward: { points: 500 },
    rarity: 'rare'
  },
  {
    achievementId: 'big_spender',
    name: 'Big Spender',
    description: 'Spend ₹10,000 total',
    icon: '💰',
    category: 'purchase',
    criteria: { type: 'amount', target: 1000000, field: 'totalSpent' },
    reward: { points: 300 },
    rarity: 'uncommon'
  },
  {
    achievementId: 'premium_patron',
    name: 'Premium Patron',
    description: 'Spend ₹50,000 total',
    icon: '🌟',
    category: 'purchase',
    criteria: { type: 'amount', target: 5000000, field: 'totalSpent' },
    reward: { points: 1000 },
    rarity: 'epic'
  },
  {
    achievementId: 'first_review',
    name: 'Voice Heard',
    description: 'Write your first review',
    icon: '✍️',
    category: 'review',
    criteria: { type: 'count', target: 1, field: 'totalReviews' },
    reward: { points: 50 },
    rarity: 'common'
  },
  {
    achievementId: 'review_master',
    name: 'Review Master',
    description: 'Write 10 reviews',
    icon: '📝',
    category: 'review',
    criteria: { type: 'count', target: 10, field: 'totalReviews' },
    reward: { points: 250 },
    rarity: 'rare'
  },
  {
    achievementId: 'first_referral',
    name: 'Sharing is Caring',
    description: 'Successfully refer a friend',
    icon: '🤝',
    category: 'referral',
    criteria: { type: 'count', target: 1, field: 'totalReferrals' },
    reward: { points: 100 },
    rarity: 'common'
  },
  {
    achievementId: 'referral_champion',
    name: 'Referral Champion',
    description: 'Refer 5 friends',
    icon: '🏅',
    category: 'referral',
    criteria: { type: 'count', target: 5, field: 'totalReferrals' },
    reward: { points: 500 },
    rarity: 'rare'
  },
  {
    achievementId: 'silver_member',
    name: 'Silver Status',
    description: 'Reach Silver tier',
    icon: '🥈',
    category: 'loyalty',
    criteria: { type: 'milestone', target: 1000, field: 'lifetimePoints' },
    reward: { points: 100 },
    rarity: 'uncommon'
  },
  {
    achievementId: 'gold_member',
    name: 'Gold Status',
    description: 'Reach Gold tier',
    icon: '🥇',
    category: 'loyalty',
    criteria: { type: 'milestone', target: 5000, field: 'lifetimePoints' },
    reward: { points: 250 },
    rarity: 'rare'
  },
  {
    achievementId: 'platinum_member',
    name: 'Platinum Status',
    description: 'Reach Platinum tier',
    icon: '💎',
    category: 'loyalty',
    criteria: { type: 'milestone', target: 15000, field: 'lifetimePoints' },
    reward: { points: 500 },
    rarity: 'legendary'
  }
];

// Seed default achievements
achievementSchema.statics.seedDefaults = async function() {
  for (const achievement of DEFAULT_ACHIEVEMENTS) {
    await this.findOneAndUpdate(
      { achievementId: achievement.achievementId },
      achievement,
      { upsert: true, new: true }
    );
  }
  console.log('✅ Achievements seeded');
};

// Get all active achievements
achievementSchema.statics.getActive = async function() {
  return this.find({ isActive: true });
};

// Check if user qualifies for achievement
achievementSchema.statics.checkEligibility = async function(achievementId, userStats) {
  const achievement = await this.findOne({ achievementId, isActive: true });
  if (!achievement) return false;

  const { type, target, field } = achievement.criteria;
  const value = userStats[field] || 0;

  switch (type) {
    case 'count':
    case 'amount':
    case 'milestone':
      return value >= target;
    case 'streak':
      return value >= target;
    default:
      return false;
  }
};

module.exports = mongoose.model('Achievement', achievementSchema);
