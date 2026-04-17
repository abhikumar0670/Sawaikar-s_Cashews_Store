const express = require('express');
const router = express.Router();
const UserLoyalty = require('../models/UserLoyalty');
const Referral = require('../models/Referral');
const Achievement = require('../models/Achievement');
const User = require('../models/User');
const Order = require('../models/Order');
const { requireAuth, requireAdmin } = require('../middleware/clerkAuth');

const requireMatchingUser = (req, res, next) => {
  const targetUserId = req.params.userId || req.body.userId;

  if (!targetUserId) {
    return res.status(400).json({
      success: false,
      error: 'userId is required'
    });
  }

  if (!req.auth || req.auth.userId !== targetUserId) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }

  return next();
};

// @route   GET /api/loyalty/user/:userId
// @desc    Get user's loyalty profile
// @access  Public
router.get('/user/:userId', requireAuth, requireMatchingUser, async (req, res) => {
  try {
    const { userId } = req.params;

    const loyalty = await UserLoyalty.getOrCreate(userId);

    // Get user name for display
    const user = await User.findOne({ clerkId: userId });

    // Get accurate referral stats from Referral collection
    const referralStats = await Referral.getReferralStats(userId);

    // Merge loyalty stats with accurate referral counts
    const stats = {
      ...loyalty.stats,
      totalReferrals: referralStats.total || loyalty.stats?.totalReferrals || 0,
      pendingReferrals: referralStats.pending || 0,
      completedReferrals: referralStats.completed || 0
    };

    res.json({
      success: true,
      data: {
        points: loyalty.points,
        lifetimePoints: loyalty.lifetimePoints,
        tier: loyalty.tier,
        badges: loyalty.badges,
        achievements: loyalty.achievements,
        referralCode: loyalty.referralCode,
        stats: stats,
        canSpin: loyalty.canSpin(),
        userName: user?.name || 'Guest'
      }
    });
  } catch (error) {
    console.error('Get loyalty profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch loyalty profile'
    });
  }
});

// @route   GET /api/loyalty/history/:userId
// @desc    Get user's points transaction history
// @access  Public
router.get('/history/:userId', requireAuth, requireMatchingUser, async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 20;

    const loyalty = await UserLoyalty.findOne({ userId });

    if (!loyalty) {
      return res.json({
        success: true,
        data: []
      });
    }

    const transactions = loyalty.transactions
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);

    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch history'
    });
  }
});

// @route   POST /api/loyalty/spin/:userId
// @desc    Perform daily spin
// @access  Public
router.post('/spin/:userId', requireAuth, requireMatchingUser, async (req, res) => {
  try {
    const { userId } = req.params;

    const loyalty = await UserLoyalty.getOrCreate(userId);

    if (!loyalty.canSpin()) {
      return res.status(400).json({
        success: false,
        error: 'Already used daily spin. Come back tomorrow!'
      });
    }

    const pointsWon = await loyalty.spin();

    res.json({
      success: true,
      data: {
        pointsWon,
        newTotal: loyalty.points,
        message: `Congratulations! You won ${pointsWon} points!`
      }
    });
  } catch (error) {
    console.error('Spin error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform spin'
    });
  }
});

// @route   POST /api/loyalty/redeem
// @desc    Redeem points for reward and create coupon
// @access  Public
router.post('/redeem', requireAuth, requireMatchingUser, async (req, res) => {
  try {
    const { userId, points, rewardType, rewardId } = req.body;

    if (!userId || !points || !rewardType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const loyalty = await UserLoyalty.findOne({ userId });

    if (!loyalty) {
      return res.status(404).json({
        success: false,
        error: 'Loyalty profile not found'
      });
    }

    if (loyalty.points < points) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient points'
      });
    }

    // Get reward details to determine values
    const rewards = {
      'discount_5': { value: 5, name: '5% Off Coupon' },
      'discount_10': { value: 10, name: '10% Off Coupon' },
      'discount_15': { value: 15, name: '15% Off Coupon' },
      'free_shipping': { value: 0, name: 'Free Shipping' },
      'cashew_50g': { value: 0, name: 'Free 50g Premium Cashews' }
    };

    const rewardDetails = rewards[rewardId] || {};
    const rewardCode = `SAW${Date.now().toString(36).toUpperCase()}`;
    
    // Deduct points
    await loyalty.redeemPoints(points, `Redeemed for ${rewardType} - Code: ${rewardCode}`, rewardId);

    // Create coupon in database for future validation
    const couponData = {
      code: rewardCode,
      discountType: rewardType === 'discount' ? 'percentage' : 'fixed',
      discountValue: rewardDetails.value || 0,
      discountAmount: 0,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      usageLimit: 1, // Single use
      usedCount: 0,
      description: `Loyalty Reward: ${rewardDetails.name}`,
      status: 'active',
      isLoyaltyReward: true,
      redeemedBy: userId,
      rewardType: rewardType
    };

    const Coupon = require('../models/Coupon');
    await Coupon.create(couponData);

    console.log(`✅ Reward redeemed - User: ${userId}, Type: ${rewardType}, Reward: ${rewardId}, Code: ${rewardCode}, Points: ${points}`);

    res.json({
      success: true,
      data: {
        pointsRedeemed: points,
        newBalance: loyalty.points,
        rewardCode,
        rewardType,
        rewardName: rewardDetails.name,
        message: `${rewardDetails.name} redeemed! Code: ${rewardCode}`,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Redeem error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to redeem points'
    });
  }
});

// @route   GET /api/loyalty/achievements
// @desc    Get all available achievements
// @access  Public
router.get('/achievements', async (req, res) => {
  try {
    const achievements = await Achievement.getActive();

    res.json({
      success: true,
      data: achievements
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch achievements'
    });
  }
});

// @route   POST /api/loyalty/achievements
// @desc    Create new achievement (admin only)
// @access  Admin
router.post('/achievements', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      icon,
      category,
      criteria,
      reward,
      isActive
    } = req.body;

    if (!name || !description) {
      return res.status(400).json({
        success: false,
        error: 'Name and description are required'
      });
    }

    const achievementId = name.toLowerCase().replace(/\s+/g, '-');

    // Map frontend criteria type to model enum values
    const criteriaTypeMap = {
      'order_count': 'count',
      'total_spent': 'amount',
      'referral_count': 'count',
      'review_count': 'count',
      'consecutive_days': 'streak'
    };

    // Map frontend criteria type to field names
    const criteriaFieldMap = {
      'order_count': 'totalOrders',
      'total_spent': 'totalSpent',
      'referral_count': 'totalReferrals',
      'review_count': 'totalReviews',
      'consecutive_days': 'consecutiveDays'
    };

    const achievement = new Achievement({
      achievementId,
      name,
      description,
      icon: icon || '🏆',
      category: category || 'special',
      criteria: {
        type: criteriaTypeMap[criteria?.type] || criteria?.type || 'count',
        target: parseInt(criteria?.value) || 1,
        field: criteriaFieldMap[criteria?.type] || 'totalOrders'
      },
      reward: {
        points: reward?.type === 'points' ? (parseInt(reward?.value) || 100) : 0,
        badge: reward?.type === 'badge' ? reward?.value : undefined,
        discountCode: reward?.type === 'discount' ? reward?.value : undefined
      },
      isActive: isActive !== false
    });

    await achievement.save();

    res.status(201).json({
      success: true,
      data: achievement
    });
  } catch (error) {
    console.error('Create achievement error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create achievement'
    });
  }
});

// @route   PUT /api/loyalty/achievements/:id
// @desc    Update achievement (admin only)
// @access  Admin
router.put('/achievements/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      icon,
      category,
      criteria,
      reward,
      isActive
    } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (icon) updateData.icon = icon;
    if (category) updateData.category = category;
    if (criteria) {
      // Map frontend criteria type to model enum values
      const criteriaTypeMap = {
        'order_count': 'count',
        'total_spent': 'amount',
        'referral_count': 'count',
        'review_count': 'count',
        'consecutive_days': 'streak'
      };

      // Map frontend criteria type to field names
      const criteriaFieldMap = {
        'order_count': 'totalOrders',
        'total_spent': 'totalSpent',
        'referral_count': 'totalReferrals',
        'review_count': 'totalReviews',
        'consecutive_days': 'consecutiveDays'
      };

      updateData.criteria = {
        type: criteriaTypeMap[criteria.type] || criteria.type || 'count',
        target: parseInt(criteria.value) || 1,
        field: criteriaFieldMap[criteria.type] || 'totalOrders'
      };
    }
    if (reward) {
      updateData.reward = {
        points: reward.type === 'points' ? (parseInt(reward.value) || 100) : 0,
        badge: reward.type === 'badge' ? reward.value : undefined,
        discountCode: reward.type === 'discount' ? reward.value : undefined
      };
    }
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    const achievement = await Achievement.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!achievement) {
      return res.status(404).json({
        success: false,
        error: 'Achievement not found'
      });
    }

    res.json({
      success: true,
      data: achievement
    });
  } catch (error) {
    console.error('Update achievement error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update achievement'
    });
  }
});

// @route   DELETE /api/loyalty/achievements/:id
// @desc    Delete achievement (admin only)
// @access  Admin
router.delete('/achievements/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const achievement = await Achievement.findByIdAndDelete(id);

    if (!achievement) {
      return res.status(404).json({
        success: false,
        error: 'Achievement not found'
      });
    }

    res.json({
      success: true,
      message: 'Achievement deleted'
    });
  } catch (error) {
    console.error('Delete achievement error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete achievement'
    });
  }
});

// @route   GET /api/loyalty/achievements/:userId
// @desc    Get user's achievements with progress
// @access  Public
router.get('/achievements/:userId', requireAuth, requireMatchingUser, async (req, res) => {
  try {
    const { userId } = req.params;

    let [loyalty, allAchievements] = await Promise.all([
      UserLoyalty.findOne({ userId }),
      Achievement.getActive()
    ]);

    // Auto-sync stats from orders if stats appear out of date
    if (loyalty && (!loyalty.stats?.totalOrders || loyalty.stats.totalOrders === 0)) {
      const orderStats = await Order.aggregate([
        { $match: { userId: userId } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalSpent: { $sum: '$totalAmount' }
          }
        }
      ]);

      if (orderStats.length > 0 && orderStats[0].totalOrders > 0) {
        loyalty.stats = loyalty.stats || { totalOrders: 0, totalSpent: 0, totalReviews: 0, totalReferrals: 0 };
        loyalty.stats.totalOrders = orderStats[0].totalOrders;
        loyalty.stats.totalSpent = orderStats[0].totalSpent * 100; // Store in paise
        await loyalty.save();
        console.log(`📊 Auto-synced stats for user ${userId}: Orders=${loyalty.stats.totalOrders}`);
      }
    }

    if (!loyalty) {
      return res.json({
        success: true,
        data: allAchievements.map(a => ({
          ...a.toObject(),
          unlocked: false,
          progress: 0,
          currentValue: 0,
          target: a.criteria?.target || 1
        }))
      });
    }

    const unlockedIds = new Set(loyalty.achievements.map(a => a.achievementId));

    const achievementsWithProgress = allAchievements.map(achievement => {
      const { field, target } = achievement.criteria;
      const currentValue = loyalty.stats?.[field] || loyalty[field] || 0;
      const progress = Math.min((currentValue / target) * 100, 100);
      const userAchievement = loyalty.achievements.find(a => a.achievementId === achievement.achievementId);
      const isUnlocked = !!userAchievement;

      return {
        ...achievement.toObject(),
        unlocked: isUnlocked,
        unlockedAt: userAchievement?.unlockedAt,
        claimed: userAchievement?.claimed || false,
        claimedAt: userAchievement?.claimedAt,
        progress,
        currentValue,
        target
      };
    });

    // Auto-unlock achievements that have been completed but not yet unlocked
    const achievementsToUnlock = achievementsWithProgress.filter(
      a => a.progress >= 100 && !a.unlocked
    );

    if (achievementsToUnlock.length > 0) {
      for (const achievement of achievementsToUnlock) {
        // Add to user's achievements (not claimed yet - user must click claim button)
        loyalty.achievements.push({
          achievementId: achievement.achievementId,
          name: achievement.name,
          unlockedAt: new Date(),
          claimed: false
        });

        console.log(`🏆 Auto-unlocked achievement "${achievement.name}" for user ${userId} (pending claim)`);
      }

      await loyalty.save();

      // Update the response to reflect the newly unlocked achievements
      achievementsToUnlock.forEach(a => {
        const idx = achievementsWithProgress.findIndex(ap => ap.achievementId === a.achievementId);
        if (idx !== -1) {
          achievementsWithProgress[idx].unlocked = true;
          achievementsWithProgress[idx].unlockedAt = new Date();
          achievementsWithProgress[idx].claimed = false;
        }
      });
    }

    res.json({
      success: true,
      data: achievementsWithProgress
    });
  } catch (error) {
    console.error('Get user achievements error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch achievements'
    });
  }
});

// @route   POST /api/loyalty/achievements/:achievementId/claim
// @desc    Claim achievement reward
// @access  Private
router.post('/achievements/:achievementId/claim', requireAuth, async (req, res) => {
  try {
    const { achievementId } = req.params;
    const userId = req.auth.userId;

    console.log(`🎯 Claim request: achievementId=${achievementId}, userId=${userId}`);

    // Find user's loyalty profile
    const loyalty = await UserLoyalty.findOne({ userId });
    if (!loyalty) {
      return res.status(404).json({
        success: false,
        error: 'Loyalty profile not found'
      });
    }

    // Find the achievement in user's unlocked achievements (check both achievementId and _id)
    let userAchievement = loyalty.achievements.find(a => a.achievementId === achievementId);
    if (!userAchievement) {
      // Try finding by MongoDB _id string match
      userAchievement = loyalty.achievements.find(a => String(a._id) === achievementId);
    }

    if (!userAchievement) {
      console.log(`❌ Achievement not found in user's list. User achievements:`, loyalty.achievements.map(a => a.achievementId));
      return res.status(400).json({
        success: false,
        error: 'Achievement not unlocked yet'
      });
    }

    // Check if already claimed
    if (userAchievement.claimed) {
      return res.status(400).json({
        success: false,
        error: 'Achievement reward already claimed'
      });
    }

    // Get achievement details for reward (search by achievementId or _id)
    let achievement = await Achievement.findOne({ achievementId: userAchievement.achievementId || achievementId });
    if (!achievement) {
      achievement = await Achievement.findById(achievementId);
    }
    if (!achievement) {
      // Try to find by name if achievementId doesn't match
      achievement = await Achievement.findOne({ name: userAchievement.name });
    }

    if (!achievement) {
      console.log(`❌ Achievement not found in database for id: ${achievementId}`);
      return res.status(404).json({
        success: false,
        error: 'Achievement not found'
      });
    }

    // Get reward points
    const rewardPoints = achievement.reward?.points || achievement.reward?.value || 0;

    // Mark as claimed
    userAchievement.claimed = true;
    userAchievement.claimedAt = new Date();

    // Award points
    if (rewardPoints > 0) {
      await loyalty.addPoints(
        rewardPoints,
        'admin',
        `Achievement claimed: ${achievement.name}`,
        achievementId
      );
    }

    await loyalty.save();

    console.log(`🎁 User ${userId} claimed achievement "${achievement.name}" for ${rewardPoints} points`);

    res.json({
      success: true,
      data: {
        achievementId,
        pointsAwarded: rewardPoints,
        newBalance: loyalty.points,
        message: `Congratulations! You earned ${rewardPoints} points!`
      }
    });
  } catch (error) {
    console.error('Claim achievement error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to claim achievement'
    });
  }
});

// @route   POST /api/loyalty/referral/generate
// @desc    Get or generate referral code
// @access  Public
router.post('/referral/generate', requireAuth, requireMatchingUser, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    const loyalty = await UserLoyalty.getOrCreate(userId);

    res.json({
      success: true,
      data: {
        referralCode: loyalty.referralCode,
        referralLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}?ref=${loyalty.referralCode}`
      }
    });
  } catch (error) {
    console.error('Generate referral error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate referral code'
    });
  }
});

// @route   POST /api/loyalty/referral/apply
// @desc    Apply referral code for new user
// @access  Public
router.post('/referral/apply', requireAuth, requireMatchingUser, async (req, res) => {
  try {
    const { userId, referralCode } = req.body;

    if (!userId || !referralCode) {
      return res.status(400).json({
        success: false,
        error: 'userId and referralCode are required'
      });
    }

    // Find referrer by code
    const referrer = await UserLoyalty.findOne({ referralCode });

    if (!referrer) {
      return res.status(404).json({
        success: false,
        error: 'Invalid referral code'
      });
    }

    if (referrer.userId === userId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot use your own referral code'
      });
    }

    // Create referral record
    await Referral.createReferral(referrer.userId, userId, referralCode);

    // Update referrer's stats - increment totalReferrals
    referrer.stats = referrer.stats || { totalOrders: 0, totalSpent: 0, totalReviews: 0, totalReferrals: 0 };
    referrer.stats.totalReferrals = (referrer.stats.totalReferrals || 0) + 1;
    await referrer.save();

    // Update referred user's profile
    const referredLoyalty = await UserLoyalty.getOrCreate(userId);
    referredLoyalty.referredBy = referralCode;
    await referredLoyalty.save();

    res.json({
      success: true,
      message: 'Referral code applied! You\'ll receive bonus points after your first purchase.'
    });
  } catch (error) {
    console.error('Apply referral error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to apply referral code'
    });
  }
});

// @route   GET /api/loyalty/referral/stats/:userId
// @desc    Get referral statistics
// @access  Public
router.get('/referral/stats/:userId', requireAuth, requireMatchingUser, async (req, res) => {
  try {
    const { userId } = req.params;

    const [loyalty, stats, pendingReferrals] = await Promise.all([
      UserLoyalty.findOne({ userId }),
      Referral.getReferralStats(userId),
      Referral.getPendingReferrals(userId)
    ]);

    res.json({
      success: true,
      data: {
        referralCode: loyalty?.referralCode,
        stats,
        pendingReferrals: pendingReferrals.map(r => ({
          referredId: r.referredId,
          status: r.status,
          createdAt: r.createdAt,
          expiresAt: r.expiresAt
        }))
      }
    });
  } catch (error) {
    console.error('Referral stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch referral stats'
    });
  }
});

// @route   GET /api/loyalty/leaderboard
// @desc    Get loyalty leaderboard
// @access  Public
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const leaderboard = await UserLoyalty.getLeaderboard(limit);

    // Get user names
    const userIds = leaderboard.map(l => l.userId);
    const users = await User.find({ clerkId: { $in: userIds } });
    const userMap = new Map(users.map(u => [u.clerkId, u.name]));

    const enrichedLeaderboard = leaderboard.map((entry, index) => ({
      rank: index + 1,
      userId: entry.userId,
      userName: userMap.get(entry.userId) || 'Anonymous',
      lifetimePoints: entry.lifetimePoints,
      tier: entry.tier,
      badgeCount: entry.badges?.length || 0
    }));

    res.json({
      success: true,
      data: enrichedLeaderboard
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard'
    });
  }
});

// @route   GET /api/loyalty/rewards
// @desc    Get available rewards for redemption
// @access  Public
router.get('/rewards', async (req, res) => {
  try {
    // Pre-defined rewards
    const rewards = [
      {
        id: 'discount_5',
        name: '5% Off Coupon',
        description: 'Get 5% off your next order',
        pointsCost: 500,
        type: 'discount',
        value: 5,
        icon: '🎫'
      },
      {
        id: 'discount_10',
        name: '10% Off Coupon',
        description: 'Get 10% off your next order',
        pointsCost: 900,
        type: 'discount',
        value: 10,
        icon: '🎟️'
      },
      {
        id: 'discount_15',
        name: '15% Off Coupon',
        description: 'Get 15% off your next order',
        pointsCost: 1200,
        type: 'discount',
        value: 15,
        icon: '🏷️'
      },
      {
        id: 'free_shipping',
        name: 'Free Shipping',
        description: 'Free shipping on your next order',
        pointsCost: 300,
        type: 'shipping',
        value: 0,
        icon: '🚚'
      },
      {
        id: 'cashew_50g',
        name: 'Free 50g Premium Cashews',
        description: 'Get a free 50g pack of W240 cashews',
        pointsCost: 800,
        type: 'product',
        value: 'sawaikar-premium-w240-50g',
        icon: '🥜'
      }
    ];

    res.json({
      success: true,
      data: rewards
    });
  } catch (error) {
    console.error('Get rewards error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rewards'
    });
  }
});

// @route   GET /api/loyalty/admin/referral-stats
// @desc    Get all referral stats (admin only)
// @access  Admin
router.get('/admin/referral-stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    console.log('Fetching referral stats for admin...');
    
    // Get all referrals with aggregated stats
    const referrals = await Referral.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalPointsAwarded: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'completed'] },
                {
                  $add: [
                    { $ifNull: ['$reward.referrerPoints', 0] },
                    { $ifNull: ['$reward.referredPoints', 0] }
                  ]
                },
                0
              ]
            }
          }
        }
      }
    ]);

    // Get recent referrals
    const recentReferrals = await Referral.find()
      .sort({ createdAt: -1 })
      .limit(20);

    // Get top referrers
    const topReferrers = await Referral.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$referrerId',
          referralCount: { $sum: 1 },
          totalPoints: { $sum: { $ifNull: ['$reward.referrerPoints', 0] } }
        }
      },
      { $sort: { referralCount: -1 } },
      { $limit: 10 }
    ]);

    // Get user names for recent referrals + top referrers
    const userIds = [...new Set([
      ...recentReferrals.map(r => r.referrerId).filter(Boolean),
      ...recentReferrals.map(r => r.referredId).filter(Boolean),
      ...topReferrers.map(r => r._id).filter(Boolean)
    ])];
    
    const users = userIds.length > 0 
      ? await User.find({ clerkId: { $in: userIds } })
      : [];
    
    const userMap = new Map(users.map(u => [u.clerkId, u.name]));

    // Format stats
    const stats = {
      total: 0,
      completed: 0,
      pending: 0,
      expired: 0,
      totalPointsAwarded: 0
    };

    referrals.forEach(r => {
      stats[r._id] = r.count;
      stats.total += r.count;
      stats.totalPointsAwarded += r.totalPointsAwarded || 0;
    });

    // Enrich top referrers with names
    const enrichedTopReferrers = topReferrers.map(r => ({
      userId: r._id,
      userName: userMap.get(r._id) || 'Anonymous',
      referralCount: r.referralCount,
      totalPoints: r.totalPoints
    }));

    console.log(`✅ Referral stats fetched - Total: ${stats.total}, Completed: ${stats.completed}, Top Referrers: ${enrichedTopReferrers.length}`);

    res.json({
      success: true,
      data: {
        stats,
        topReferrers: enrichedTopReferrers,
        recentReferrals: recentReferrals.map(r => ({
          ...r.toObject(),
          referrerName: userMap.get(r.referrerId) || 'Anonymous',
          referredName: userMap.get(r.referredId) || 'Anonymous'
        }))
      }
    });
  } catch (error) {
    console.error('❌ Admin referral stats error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch referral stats',
      message: error.message
    });
  }
});

// @route   POST /api/loyalty/seed-achievements
// @desc    Seed default achievements (admin only)
// @access  Admin
router.post('/seed-achievements', requireAuth, requireAdmin, async (req, res) => {
  try {
    await Achievement.seedDefaults();

    res.json({
      success: true,
      message: 'Achievements seeded successfully'
    });
  } catch (error) {
    console.error('Seed achievements error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to seed achievements'
    });
  }
});

// @route   POST /api/loyalty/admin/complete-referral/:referralId
// @desc    Manually complete a pending referral (admin only)
// @access  Admin
router.post('/admin/complete-referral/:referralId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { referralId } = req.params;

    const referral = await Referral.findById(referralId);
    if (!referral) {
      return res.status(404).json({
        success: false,
        error: 'Referral not found'
      });
    }

    if (referral.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Referral is already completed'
      });
    }

    // Complete the referral
    referral.status = 'completed';
    referral.completedAt = new Date();
    referral.rewardsDistributed = true;
    await referral.save();

    // Award points to referrer
    const referrerLoyalty = await UserLoyalty.getOrCreate(referral.referrerId);
    await referrerLoyalty.addPoints(
      referral.reward?.referrerPoints || 200,
      'referral',
      'Referral bonus (admin processed)',
      String(referral._id)
    );

    // Award points to referred user
    const referredLoyalty = await UserLoyalty.getOrCreate(referral.referredId);
    await referredLoyalty.addPoints(
      referral.reward?.referredPoints || 100,
      'referral',
      'Welcome bonus for using referral code',
      String(referral._id)
    );

    // Update referrer's stats
    referrerLoyalty.stats = referrerLoyalty.stats || {};
    referrerLoyalty.stats.completedReferrals = (referrerLoyalty.stats.completedReferrals || 0) + 1;
    await referrerLoyalty.save();

    // Get user names for response
    const referrerUser = await User.findOne({ clerkId: referral.referrerId });
    const referredUser = await User.findOne({ clerkId: referral.referredId });

    res.json({
      success: true,
      message: 'Referral completed successfully',
      data: {
        referralId: referral._id,
        referrer: {
          id: referral.referrerId,
          name: referrerUser?.name || 'Unknown',
          pointsAwarded: referral.reward?.referrerPoints || 200
        },
        referred: {
          id: referral.referredId,
          name: referredUser?.name || 'Unknown',
          pointsAwarded: referral.reward?.referredPoints || 100
        }
      }
    });
  } catch (error) {
    console.error('Complete referral error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete referral'
    });
  }
});

// @route   POST /api/loyalty/admin/fix-referral-points/:referralId
// @desc    Fix/re-award points for a referral that didn't get points (admin only)
// @access  Admin
router.post('/admin/fix-referral-points/:referralId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { referralId } = req.params;

    const referral = await Referral.findById(referralId);
    if (!referral) {
      return res.status(404).json({
        success: false,
        error: 'Referral not found'
      });
    }

    // Award points to referrer
    const referrerLoyalty = await UserLoyalty.getOrCreate(referral.referrerId);
    await referrerLoyalty.addPoints(
      referral.reward?.referrerPoints || 200,
      'referral',
      'Referral bonus (points fix)',
      String(referral._id)
    );

    // Award points to referred user
    const referredLoyalty = await UserLoyalty.getOrCreate(referral.referredId);
    await referredLoyalty.addPoints(
      referral.reward?.referredPoints || 100,
      'referral',
      'Welcome bonus (points fix)',
      String(referral._id)
    );

    // Get user names for response
    const referrerUser = await User.findOne({ clerkId: referral.referrerId });
    const referredUser = await User.findOne({ clerkId: referral.referredId });

    res.json({
      success: true,
      message: 'Referral points awarded successfully',
      data: {
        referralId: referral._id,
        referrer: {
          id: referral.referrerId,
          name: referrerUser?.name || 'Unknown',
          pointsAwarded: referral.reward?.referrerPoints || 200,
          newTotal: referrerLoyalty.points
        },
        referred: {
          id: referral.referredId,
          name: referredUser?.name || 'Unknown',
          pointsAwarded: referral.reward?.referredPoints || 100,
          newTotal: referredLoyalty.points
        }
      }
    });
  } catch (error) {
    console.error('Fix referral points error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fix referral points'
    });
  }
});

module.exports = router;
