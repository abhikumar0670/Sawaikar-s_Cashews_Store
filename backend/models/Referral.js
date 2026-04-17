const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  referrerId: {
    type: String,  // Clerk ID of person who referred
    required: true,
    index: true
  },
  referredId: {
    type: String,  // Clerk ID of person who was referred
    required: true,
    index: true
  },
  referralCode: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'expired', 'cancelled'],
    default: 'pending'
  },
  reward: {
    referrerPoints: {
      type: Number,
      default: 200
    },
    referredPoints: {
      type: Number,
      default: 100
    },
    referrerDiscount: {
      type: Number,
      default: 0  // percentage
    },
    referredDiscount: {
      type: Number,
      default: 10  // 10% off first order
    }
  },
  rewardsDistributed: {
    type: Boolean,
    default: false
  },
  firstOrderId: {
    type: String  // Order ID of referred user's first purchase
  },
  completedAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Referral expires after 30 days if not completed
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
referralSchema.index({ referralCode: 1 });
referralSchema.index({ status: 1, expiresAt: 1 });

// Complete referral when referred user makes first purchase
referralSchema.methods.complete = async function(orderId) {
  if (this.status !== 'pending') {
    throw new Error('Referral is not pending');
  }

  this.status = 'completed';
  this.firstOrderId = orderId;
  this.completedAt = new Date();
  this.rewardsDistributed = true;

  return this.save();
};

// Get referral stats for a user
referralSchema.statics.getReferralStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { referrerId: userId } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const result = {
    total: 0,
    pending: 0,
    completed: 0,
    expired: 0
  };

  stats.forEach(s => {
    result[s._id] = s.count;
    result.total += s.count;
  });

  return result;
};

// Get pending referrals for a user
referralSchema.statics.getPendingReferrals = async function(userId) {
  return this.find({
    referrerId: userId,
    status: 'pending',
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });
};

// Create new referral
referralSchema.statics.createReferral = async function(referrerId, referredId, referralCode) {
  // Check if this user was already referred
  const existing = await this.findOne({ referredId });
  if (existing) {
    throw new Error('User has already been referred');
  }

  return this.create({
    referrerId,
    referredId,
    referralCode
  });
};

// Expire old referrals (run as cron job)
referralSchema.statics.expireOldReferrals = async function() {
  return this.updateMany(
    {
      status: 'pending',
      expiresAt: { $lt: new Date() }
    },
    {
      status: 'expired'
    }
  );
};

module.exports = mongoose.model('Referral', referralSchema);
