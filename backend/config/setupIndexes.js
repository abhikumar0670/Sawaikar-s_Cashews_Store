/**
 * Database Setup & Indexes
 * Creates all necessary indexes for optimal performance
 * Run this once after initial setup or periodically to ensure indexes exist
 */

const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const AdminRole = require('../models/AdminRole');
const Coupon = require('../models/Coupon');
const UserLoyalty = require('../models/UserLoyalty');

/**
 * Create all indexes
 * Each index is labeled with expected usage pattern
 */
const createIndexes = async () => {
  try {
    console.log('📊 Creating database indexes...');

    // ==================
    // PRODUCT INDEXES
    // ==================
    await Product.collection.createIndex(
      { category: 1 },
      { name: 'idx_product_category', background: true }
    );
    console.log('✅ Product category index created');

    await Product.collection.createIndex(
      { featured: 1, createdAt: -1 },
      { name: 'idx_product_featured', background: true }
    );
    console.log('✅ Product featured index created');

    await Product.collection.createIndex(
      { name: 'text', description: 'text' },
      { name: 'idx_product_search', background: true }
    );
    console.log('✅ Product search index created');

    await Product.collection.createIndex(
      { barcode: 1 },
      { name: 'idx_product_barcode', sparse: true, background: true }
    );
    console.log('✅ Product barcode index created');

    // ==================
    // ORDER INDEXES
    // ==================
    await Order.collection.createIndex(
      { clerkId: 1, createdAt: -1 },
      { name: 'idx_order_user_date', background: true }
    );
    console.log('✅ Order user-date index created');

    await Order.collection.createIndex(
      { status: 1, createdAt: -1 },
      { name: 'idx_order_status_date', background: true }
    );
    console.log('✅ Order status-date index created');

    await Order.collection.createIndex(
      { orderId: 1 },
      { name: 'idx_order_id', unique: true, background: true }
    );
    console.log('✅ Order ID index created');

    await Order.collection.createIndex(
      { 'paymentInfo.status': 1, createdAt: -1 },
      { name: 'idx_order_payment_status', background: true }
    );
    console.log('✅ Order payment status index created');

    // ==================
    // USER INDEXES
    // ==================
    await User.collection.createIndex(
      { email: 1 },
      { name: 'idx_user_email', unique: true, sparse: true, background: true }
    );
    console.log('✅ User email index created');

    await User.collection.createIndex(
      { clerkId: 1 },
      { name: 'idx_user_clerkId', unique: true, background: true }
    );
    console.log('✅ User Clerk ID index created');

    await User.collection.createIndex(
      { createdAt: -1 },
      { name: 'idx_user_created', background: true }
    );
    console.log('✅ User creation date index created');

    // ==================
    // ADMIN ROLE INDEXES
    // ==================
    await AdminRole.collection.createIndex(
      { email: 1 },
      { name: 'idx_admin_email', unique: true, background: true }
    );
    console.log('✅ Admin email index created');

    await AdminRole.collection.createIndex(
      { status: 1, role: 1 },
      { name: 'idx_admin_status_role', background: true }
    );
    console.log('✅ Admin status-role index created');

    await AdminRole.collection.createIndex(
      { lastLogin: -1 },
      { name: 'idx_admin_lastlogin', background: true }
    );
    console.log('✅ Admin last login index created');

    // ==================
    // COUPON INDEXES
    // ==================
    await Coupon.collection.createIndex(
      { code: 1 },
      { name: 'idx_coupon_code', unique: true, background: true }
    );
    console.log('✅ Coupon code index created');

    await Coupon.collection.createIndex(
      { active: 1, expiryDate: 1 },
      { name: 'idx_coupon_active', background: true }
    );
    console.log('✅ Coupon active index created');

    // ==================
    // USER LOYALTY INDEXES
    // ==================
    await UserLoyalty.collection.createIndex(
      { userId: 1 },
      { name: 'idx_loyalty_userId', unique: true, background: true }
    );
    console.log('✅ User loyalty index created');

    await UserLoyalty.collection.createIndex(
      { tier: 1, points: -1 },
      { name: 'idx_loyalty_tier_points', background: true }
    );
    console.log('✅ User loyalty tier-points index created');

    console.log('\n✨ All indexes created successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    throw error;
  }
};

/**
 * Check existing indexes
 */
const listIndexes = async () => {
  try {
    console.log('\n📋 Existing Indexes:\n');

    const models = [
      { name: 'Product', model: Product },
      { name: 'Order', model: Order },
      { name: 'User', model: User },
      { name: 'AdminRole', model: AdminRole },
      { name: 'Coupon', model: Coupon },
      { name: 'UserLoyalty', model: UserLoyalty }
    ];

    for (const { name, model } of models) {
      const indexes = await model.collection.getIndexes();
      console.log(`${name} Indexes:`, Object.keys(indexes));
    }
  } catch (error) {
    console.error('Error fetching indexes:', error);
  }
};

/**
 * Drop all indexes except _id
 * Use with caution - for development/testing only
 */
const dropIndexes = async () => {
  try {
    console.log('⚠️  Dropping all indexes...');

    const models = [
      Product, Order, User, AdminRole, Coupon, UserLoyalty
    ];

    for (const model of models) {
      await model.collection.dropIndexes();
      console.log(`✅ Dropped indexes for ${model.modelName}`);
    }

    console.log('All indexes dropped successfully');
  } catch (error) {
    console.error('Error dropping indexes:', error);
  }
};

module.exports = {
  createIndexes,
  listIndexes,
  dropIndexes
};
