const express = require('express');
const router = express.Router();
const Analytics = require('../models/Analytics');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const UserInteraction = require('../models/UserInteraction');
const UserLoyalty = require('../models/UserLoyalty');
const { requireAuth, requireAdmin } = require('../middleware/clerkAuth');

router.use(requireAuth, requireAdmin);

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard summary metrics
// @access  Admin
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const last30Days = new Date(today);
    last30Days.setDate(last30Days.getDate() - 30);

    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);

    // Get order stats
    const [todayOrders, weekOrders, monthOrders, totalOrders] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: today }, status: { $ne: 'cancelled' } }),
      Order.countDocuments({ createdAt: { $gte: last7Days }, status: { $ne: 'cancelled' } }),
      Order.countDocuments({ createdAt: { $gte: last30Days }, status: { $ne: 'cancelled' } }),
      Order.countDocuments({ status: { $ne: 'cancelled' } })
    ]);

    // Get revenue stats
    const revenueStats = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          avgOrderValue: { $avg: '$totalAmount' }
        }
      }
    ]);

    const monthRevenueStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: last30Days },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Get customer stats
    const [totalCustomers, newCustomersThisMonth] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: last30Days } })
    ]);

    // Get product stats
    const [totalProducts, lowStockProducts] = await Promise.all([
      Product.countDocuments({ isArchived: { $ne: true } }),
      Product.countDocuments({ stock: { $lt: 10 }, isArchived: { $ne: true } })
    ]);

    // Pending orders
    const pendingOrders = await Order.countDocuments({ status: 'placed' });

    // Get forecast
    const forecast = await Analytics.generateForecast(7);

    res.json({
      success: true,
      data: {
        orders: {
          today: todayOrders,
          thisWeek: weekOrders,
          thisMonth: monthOrders,
          total: totalOrders,
          pending: pendingOrders
        },
        revenue: {
          total: revenueStats[0]?.totalRevenue || 0,
          thisMonth: monthRevenueStats[0]?.revenue || 0,
          averageOrderValue: Math.round(revenueStats[0]?.avgOrderValue || 0)
        },
        customers: {
          total: totalCustomers,
          newThisMonth: newCustomersThisMonth
        },
        products: {
          total: totalProducts,
          lowStock: lowStockProducts
        },
        forecast
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data'
    });
  }
});

// @route   GET /api/analytics/sales/trends
// @desc    Get sales trends over time
// @access  Admin
router.get('/sales/trends', async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    let startDate = new Date();
    let groupBy = '%Y-%m-%d';

    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        groupBy = '%Y-%U'; // Week
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        groupBy = '%Y-%m'; // Month
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    const trends = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: groupBy, date: '$createdAt' }
          },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
          items: { $sum: { $size: '$items' } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: trends.map(t => ({
        date: t._id,
        revenue: t.revenue,
        orders: t.orders,
        items: t.items
      }))
    });
  } catch (error) {
    console.error('Sales trends error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sales trends'
    });
  }
});

// @route   GET /api/analytics/products/top
// @desc    Get top selling products
// @access  Admin
router.get('/products/top', async (req, res) => {
  try {
    const { limit = 10, period = '30d' } = req.query;

    let startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case 'all':
        startDate = new Date(0);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    const topProducts = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $ne: 'cancelled' }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.name' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: parseInt(limit) }
    ]);

    // Get product images
    const productIds = topProducts.map(p => p._id);
    const products = await Product.find({ id: { $in: productIds } }).select('id image');
    const productMap = new Map(products.map(p => [p.id, p.image?.[0]]));

    res.json({
      success: true,
      data: topProducts.map(p => ({
        productId: p._id,
        name: p.name,
        image: productMap.get(p._id) || './images/default.jpg',
        totalQuantity: p.totalQuantity,
        totalRevenue: p.totalRevenue,
        orderCount: p.orderCount
      }))
    });
  } catch (error) {
    console.error('Top products error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top products'
    });
  }
});

// @route   GET /api/analytics/customers/rfm
// @desc    Get RFM (Recency, Frequency, Monetary) analysis
// @access  Admin
router.get('/customers/rfm', async (req, res) => {
  try {
    const rfmData = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: '$userClerkId',
          lastOrder: { $max: '$createdAt' },
          orderCount: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' }
        }
      },
      {
        $project: {
          userId: '$_id',
          recency: {
            $divide: [
              { $subtract: [new Date(), '$lastOrder'] },
              86400000 // Days
            ]
          },
          frequency: '$orderCount',
          monetary: '$totalSpent'
        }
      },
      { $sort: { monetary: -1 } },
      { $limit: 100 }
    ]);

    // Segment customers
    const segments = {
      champions: [],
      loyalCustomers: [],
      potentialLoyalists: [],
      atRisk: [],
      lostCustomers: []
    };

    rfmData.forEach(customer => {
      const r = customer.recency;
      const f = customer.frequency;
      const m = customer.monetary;

      if (r <= 30 && f >= 5 && m >= 500000) {
        segments.champions.push(customer);
      } else if (r <= 60 && f >= 3) {
        segments.loyalCustomers.push(customer);
      } else if (r <= 30 && f <= 2) {
        segments.potentialLoyalists.push(customer);
      } else if (r > 60 && r <= 120 && f >= 2) {
        segments.atRisk.push(customer);
      } else if (r > 120) {
        segments.lostCustomers.push(customer);
      }
    });

    res.json({
      success: true,
      data: {
        segments: {
          champions: segments.champions.length,
          loyalCustomers: segments.loyalCustomers.length,
          potentialLoyalists: segments.potentialLoyalists.length,
          atRisk: segments.atRisk.length,
          lostCustomers: segments.lostCustomers.length
        },
        topCustomers: rfmData.slice(0, 10).map(c => ({
          userId: c.userId,
          recencyDays: Math.round(c.recency),
          orderCount: c.frequency,
          totalSpent: c.monetary
        }))
      }
    });
  } catch (error) {
    console.error('RFM analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch RFM analysis'
    });
  }
});

// @route   GET /api/analytics/demand/forecast
// @desc    Get demand forecast
// @access  Admin
router.get('/demand/forecast', async (req, res) => {
  try {
    const { days = 7 } = req.query;

    const forecast = await Analytics.generateForecast(parseInt(days));

    // Get historical comparison
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const lastWeekStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: lastWeek },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        forecast,
        comparison: {
          lastWeekRevenue: lastWeekStats[0]?.revenue || 0,
          lastWeekOrders: lastWeekStats[0]?.orders || 0
        }
      }
    });
  } catch (error) {
    console.error('Forecast error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate forecast'
    });
  }
});

// @route   GET /api/analytics/inventory
// @desc    Get inventory analytics
// @access  Admin
router.get('/inventory', async (req, res) => {
  try {
    // Get stock levels
    const stockLevels = await Product.aggregate([
      { $match: { isArchived: { $ne: true } } },
      {
        $group: {
          _id: null,
          outOfStock: {
            $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] }
          },
          lowStock: {
            $sum: { $cond: [{ $and: [{ $gt: ['$stock', 0] }, { $lt: ['$stock', 10] }] }, 1, 0] }
          },
          inStock: {
            $sum: { $cond: [{ $gte: ['$stock', 10] }, 1, 0] }
          }
        }
      }
    ]);

    // Get low stock products
    const lowStockProducts = await Product.find({
      stock: { $lt: 10 },
      isArchived: { $ne: true }
    })
    .select('id name stock category image')
    .sort({ stock: 1 })
    .limit(10);

    // Stock value
    const stockValue = await Product.aggregate([
      { $match: { isArchived: { $ne: true } } },
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ['$stock', '$price'] } },
          totalUnits: { $sum: '$stock' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        levels: stockLevels[0] || { outOfStock: 0, lowStock: 0, inStock: 0 },
        lowStockProducts: lowStockProducts.map(p => ({
          productId: p.id,
          name: p.name,
          stock: p.stock,
          category: p.category,
          image: p.image?.[0]
        })),
        value: {
          totalValue: stockValue[0]?.totalValue || 0,
          totalUnits: stockValue[0]?.totalUnits || 0
        }
      }
    });
  } catch (error) {
    console.error('Inventory error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory analytics'
    });
  }
});

// @route   GET /api/analytics/loyalty
// @desc    Get loyalty program analytics
// @access  Admin
router.get('/loyalty', async (req, res) => {
  try {
    // Get tier distribution
    const tierDistribution = await UserLoyalty.aggregate([
      {
        $group: {
          _id: '$tier',
          count: { $sum: 1 },
          totalPoints: { $sum: '$lifetimePoints' }
        }
      }
    ]);

    // Get total stats
    const totalStats = await UserLoyalty.aggregate([
      {
        $group: {
          _id: null,
          totalMembers: { $sum: 1 },
          totalPointsIssued: { $sum: '$lifetimePoints' },
          totalPointsRedeemed: {
            $sum: {
              $subtract: ['$lifetimePoints', '$points']
            }
          },
          avgPointsPerMember: { $avg: '$lifetimePoints' }
        }
      }
    ]);

    // Recent activity
    const recentActivity = await UserLoyalty.find()
      .sort({ updatedAt: -1 })
      .limit(10)
      .select('userId tier points lifetimePoints updatedAt');

    res.json({
      success: true,
      data: {
        tierDistribution: tierDistribution.map(t => ({
          tier: t._id,
          count: t.count,
          totalPoints: t.totalPoints
        })),
        stats: totalStats[0] || {},
        recentActivity
      }
    });
  } catch (error) {
    console.error('Loyalty analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch loyalty analytics'
    });
  }
});

// @route   GET /api/analytics/engagement
// @desc    Get user engagement analytics
// @access  Admin
router.get('/engagement', async (req, res) => {
  try {
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    // Get interaction stats
    const interactionStats = await UserInteraction.aggregate([
      { $match: { timestamp: { $gte: last7Days } } },
      {
        $group: {
          _id: '$actionType',
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' }
        }
      }
    ]);

    // Daily active users
    const dauStats = await UserInteraction.aggregate([
      { $match: { timestamp: { $gte: last7Days } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          date: '$_id',
          dau: { $size: '$uniqueUsers' }
        }
      },
      { $sort: { date: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        interactions: interactionStats.map(i => ({
          type: i._id,
          count: i.count,
          uniqueUsers: i.uniqueUsers.length
        })),
        dailyActiveUsers: dauStats
      }
    });
  } catch (error) {
    console.error('Engagement analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch engagement analytics'
    });
  }
});

// @route   POST /api/analytics/compute-daily
// @desc    Compute and store daily analytics (run as cron job)
// @access  Admin
router.post('/compute-daily', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await Analytics.computeDailyStats(today);
    const forecast = await Analytics.generateForecast(7);

    await Analytics.findOneAndUpdate(
      { date: today, type: 'daily' },
      {
        date: today,
        type: 'daily',
        metrics: stats,
        forecast
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'Daily analytics computed successfully'
    });
  } catch (error) {
    console.error('Compute daily error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compute daily analytics'
    });
  }
});

module.exports = router;
