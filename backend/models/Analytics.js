const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily'
  },
  metrics: {
    // Revenue metrics
    totalRevenue: { type: Number, default: 0 },
    orderCount: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 },

    // Customer metrics
    newCustomers: { type: Number, default: 0 },
    returningCustomers: { type: Number, default: 0 },
    totalCustomers: { type: Number, default: 0 },

    // Product metrics
    productsSold: { type: Number, default: 0 },
    topProducts: [{
      productId: String,
      name: String,
      quantity: Number,
      revenue: Number
    }],

    // Category breakdown
    categoryBreakdown: [{
      category: String,
      revenue: Number,
      quantity: Number
    }],

    // Traffic metrics
    pageViews: { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 },

    // Conversion metrics
    cartAbandonment: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 }
  },

  // Demand forecasting
  forecast: {
    predictedRevenue: { type: Number, default: 0 },
    predictedOrders: { type: Number, default: 0 },
    confidence: { type: Number, default: 0 },
    trend: {
      type: String,
      enum: ['up', 'down', 'stable'],
      default: 'stable'
    }
  }
}, {
  timestamps: true
});

// Compound index for efficient date range queries
analyticsSchema.index({ date: 1, type: 1 });

// Get analytics for date range
analyticsSchema.statics.getRange = async function(startDate, endDate, type = 'daily') {
  return this.find({
    date: { $gte: startDate, $lte: endDate },
    type
  }).sort({ date: 1 });
};

// Get latest analytics
analyticsSchema.statics.getLatest = async function(type = 'daily') {
  return this.findOne({ type }).sort({ date: -1 });
};

// Aggregate real-time stats from orders
analyticsSchema.statics.computeDailyStats = async function(date) {
  const Order = mongoose.model('Order');
  const User = mongoose.model('User');

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Orders stats
  const orderStats = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        status: { $ne: 'cancelled' }
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalAmount' },
        orderCount: { $sum: 1 },
        productsSold: { $sum: { $size: '$items' } }
      }
    }
  ]);

  // Top products
  const topProducts = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        status: { $ne: 'cancelled' }
      }
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.productId',
        name: { $first: '$items.name' },
        quantity: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
      }
    },
    { $sort: { revenue: -1 } },
    { $limit: 10 }
  ]);

  // Category breakdown
  const categoryBreakdown = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        status: { $ne: 'cancelled' }
      }
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.category',
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        quantity: { $sum: '$items.quantity' }
      }
    },
    { $sort: { revenue: -1 } }
  ]);

  // New vs returning customers
  const customerStats = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      }
    },
    {
      $count: 'newCustomers'
    }
  ]);

  const stats = orderStats[0] || { totalRevenue: 0, orderCount: 0, productsSold: 0 };

  return {
    totalRevenue: stats.totalRevenue || 0,
    orderCount: stats.orderCount || 0,
    averageOrderValue: stats.orderCount > 0 ? Math.round(stats.totalRevenue / stats.orderCount) : 0,
    productsSold: stats.productsSold || 0,
    newCustomers: customerStats[0]?.newCustomers || 0,
    topProducts: topProducts.map(p => ({
      productId: p._id,
      name: p.name,
      quantity: p.quantity,
      revenue: p.revenue
    })),
    categoryBreakdown: categoryBreakdown.map(c => ({
      category: c._id || 'Other',
      revenue: c.revenue,
      quantity: c.quantity
    }))
  };
};

// Simple demand forecasting using moving average
analyticsSchema.statics.generateForecast = async function(days = 7) {
  const historicalData = await this.find({ type: 'daily' })
    .sort({ date: -1 })
    .limit(30);

  if (historicalData.length < 7) {
    return {
      predictedRevenue: 0,
      predictedOrders: 0,
      confidence: 0,
      trend: 'stable'
    };
  }

  // Calculate moving averages
  const revenueValues = historicalData.map(d => d.metrics.totalRevenue || 0);
  const orderValues = historicalData.map(d => d.metrics.orderCount || 0);

  const avgRevenue = revenueValues.reduce((a, b) => a + b, 0) / revenueValues.length;
  const avgOrders = orderValues.reduce((a, b) => a + b, 0) / orderValues.length;

  // Calculate trend (compare last 7 days to previous 7 days)
  const recent = revenueValues.slice(0, 7).reduce((a, b) => a + b, 0) / 7;
  const previous = revenueValues.slice(7, 14).reduce((a, b) => a + b, 0) / Math.min(7, revenueValues.length - 7);

  let trend = 'stable';
  if (recent > previous * 1.1) trend = 'up';
  else if (recent < previous * 0.9) trend = 'down';

  // Confidence based on data consistency
  const variance = revenueValues.reduce((acc, val) => acc + Math.pow(val - avgRevenue, 2), 0) / revenueValues.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = avgRevenue > 0 ? stdDev / avgRevenue : 1;
  const confidence = Math.max(0, Math.min(100, Math.round((1 - coefficientOfVariation) * 100)));

  return {
    predictedRevenue: Math.round(avgRevenue * days),
    predictedOrders: Math.round(avgOrders * days),
    confidence,
    trend
  };
};

module.exports = mongoose.model('Analytics', analyticsSchema);
