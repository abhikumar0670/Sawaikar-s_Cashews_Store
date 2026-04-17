const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const AdminRole = require('../models/AdminRole');
const Referral = require('../models/Referral');
const UserLoyalty = require('../models/UserLoyalty');
const { 
  sendOrderConfirmationEmail,
  sendOrderProcessingEmail,
  sendOrderShippedEmail,
  sendOutForDeliveryEmail,
  sendOrderDeliveredEmail,
  sendOrderCancelledEmail,
  sendInStoreOrderEmail
} = require('../config/email');
const { isAdmin } = require('../middleware/auth');
const { requireAuth, isAdminEmail } = require('../middleware/clerkAuth');

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const normalizeToken = (value = '') => value.toLowerCase().replace(/[^a-z0-9]/g, '');
const normalizeName = (value = '') => value
  .toLowerCase()
  .replace(/\([^)]*\)/g, '')
  .replace(/\s+-\s+.*$/g, '')
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const findAvailableProductForReorder = async (item) => {
  const archivedFilter = { isArchived: { $ne: true } };
  const rawProductId = String(item?.productId || '').trim();

  // 1) Canonical product id lookup (normal case)
  if (rawProductId) {
    const exactMatch = await Product.findOne({ id: rawProductId, ...archivedFilter });
    if (exactMatch) return exactMatch;

    // 2) Legacy cart unique ID may contain appended color/weight, e.g. id#F5DEB3250g
    const colorMatch = rawProductId.match(/#[0-9a-fA-F]{3,8}/);
    if (colorMatch && colorMatch.index > 0) {
      const extractedId = rawProductId.slice(0, colorMatch.index);
      const extractedMatch = await Product.findOne({ id: extractedId, ...archivedFilter });
      if (extractedMatch) return extractedMatch;
    }

    // 3) Legacy IDs may append color/weight without separators. Find any product whose id is a prefix.
    const allProducts = await Product.find(archivedFilter).select('id name price colors variants defaultWeight image stock');
    const normalizedRawId = normalizeToken(rawProductId);
    if (normalizedRawId) {
      const prefixMatched = allProducts
        .filter((p) => p?.id)
        .sort((a, b) => String(b.id).length - String(a.id).length)
        .find((p) => {
          const normalizedProductId = normalizeToken(String(p.id));
          return normalizedRawId.startsWith(normalizedProductId);
        });
      if (prefixMatched) return prefixMatched;
    }

    // 4) Sometimes old data stored Mongo _id string instead of product id.
    if (/^[a-fA-F0-9]{24}$/.test(rawProductId)) {
      const objectIdMatch = await Product.findOne({ _id: rawProductId, ...archivedFilter });
      if (objectIdMatch) return objectIdMatch;
    }
  }

  // 5) Fallback by product name for older/incorrectly stored order items
  const name = String(item?.name || '').trim();
  if (name) {
    const exactNameMatch = await Product.findOne({ name: new RegExp(`^${escapeRegex(name)}$`, 'i'), ...archivedFilter });
    if (exactNameMatch) return exactNameMatch;

    const normalizedItemName = normalizeName(name);
    const allProductsByName = await Product.find(archivedFilter).select('id name price colors variants defaultWeight image stock');
    const fuzzyMatch = allProductsByName.find((p) => {
      const normalizedProductName = normalizeName(String(p?.name || ''));
      return normalizedProductName && (
        normalizedProductName === normalizedItemName ||
        normalizedProductName.includes(normalizedItemName) ||
        normalizedItemName.includes(normalizedProductName)
      );
    });
    if (fuzzyMatch) return fuzzyMatch;
  }

  return null;
};

const isRequesterAdmin = async (req) => {
  try {
    const authEmail = req.auth?.email?.toLowerCase();
    const authUserId = req.auth?.userId;

    // Check if user is admin via email in AdminRole collection
    if (authEmail) {
      const adminRole = await AdminRole.findOne({
        email: authEmail,
        status: 'active'
      });
      if (adminRole) {
        console.log(`[ADMIN CHECK] ✅ User ${authEmail} is admin`);
        return true;
      }
    }

    // Check if user has admin role in User collection
    if (authUserId) {
      const dbUser = await User.findOne({ clerkId: authUserId }).select('role');
      if (dbUser?.role === 'admin') {
        console.log(`[ADMIN CHECK] ✅ User ${authUserId} has admin role`);
        return true;
      }
    }

    console.log(`[ADMIN CHECK] ❌ User ${authEmail || authUserId} is NOT admin`);
    return false;
  } catch (error) {
    console.error('[ADMIN CHECK] Error checking admin status:', error);
    return false;
  }
};

const canAccessOrder = (req, order) => {
  const authEmail = req.auth?.email?.toLowerCase();
  const orderEmail = order.userEmail?.toLowerCase();
  return Boolean(
    (req.auth?.userId && order.userId && req.auth.userId === order.userId) ||
    (authEmail && orderEmail && authEmail === orderEmail)
  );
};

// @route   GET /api/orders
// @desc    Get all orders (Admin) or user's orders
// @access  Private
router.get('/', requireAuth, async (req, res) => {
  try {
    const { email, status, limit, includeArchived } = req.query;
    const requesterIsAdmin = await isRequesterAdmin(req);
    
    const authUserId = req.auth?.userId;
    const authEmail = req.auth?.email?.toLowerCase();
    
    console.log(`\n[ORDERS GET] Auth Info:`, {
      userId: authUserId,
      email: authEmail,
      isAdmin: requesterIsAdmin
    });
    
    let query = {};
    
    // Exclude archived by default
    if (includeArchived !== 'true') {
      query.isArchived = { $ne: true };
    }
    
    if (requesterIsAdmin) {
      if (email) {
        query.userEmail = email.toLowerCase();
        console.log(`[ORDERS GET] Admin query by email: ${email}`);
      }
    } else {
      // For non-admin users, search by userId OR email (both should match)
      const emailQuery = authEmail ? { userEmail: authEmail } : null;
      const userIdQuery = authUserId ? { userId: authUserId } : null;
      
      if (emailQuery && userIdQuery) {
        query.$or = [userIdQuery, emailQuery];
      } else if (emailQuery) {
        query = { ...query, ...emailQuery };
      } else if (userIdQuery) {
        query = { ...query, ...userIdQuery };
      }
      
      console.log(`[ORDERS GET] User query:`, JSON.stringify(query));
    }
    
    if (status) {
      query.orderStatus = status;
    }
    
    let ordersQuery = Order.find(query).sort({ createdAt: -1 });
    const parsedLimit = Number.parseInt(limit, 10);
    if (Number.isFinite(parsedLimit) && parsedLimit > 0) {
      ordersQuery = ordersQuery.limit(parsedLimit);
    }

    const orders = await ordersQuery.lean();
    
    console.log(`[ORDERS GET] ✅ Found ${orders.length} orders for user ${authUserId}`);
    
    if (orders.length === 0) {
      console.log(`[ORDERS GET] ⚠️  No orders found. Checking all orders in DB...`);
      const allOrders = await Order.find({})
        .select('orderId userId userEmail createdAt totalAmount')
        .limit(10)
        .lean();
      
      console.log(`[ORDERS GET] Sample orders in DB (first 10):`, 
        allOrders.map(o => ({ 
          orderId: o.orderId, 
          userId: o.userId, 
          email: o.userEmail,
          date: o.createdAt
        }))
      );
    }
    
    res.json(orders);
  } catch (error) {
    console.error('[ORDERS GET] Error fetching orders:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   GET /api/orders/:orderId
// @desc    Get single order by order ID
// @access  Private
router.get('/:orderId', requireAuth, async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    const requesterIsAdmin = await isRequesterAdmin(req);
    if (!requesterIsAdmin && !canAccessOrder(req, order)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   POST /api/orders
// @desc    Create a new order and send confirmation email
// @access  Public
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      userId,           // Clerk ID
      userEmail,
      userName,
      userPhone,
      shippingInfo,     // New structured shipping info
      shippingAddress,  // Legacy field
      items,
      totalAmount,
      totalPrice,       // Alias
      shippingFee,
      paymentInfo,      // New structured payment info
      paymentStatus,
      paymentMethod,
      transactionId,
      paidAt,
      notes,
      orderType         // 'instore' or 'online'
    } = req.body;
    
    // Validate required fields
    if (!userEmail) {
      return res.status(400).json({ message: 'User email is required' });
    }

    if (!req.auth?.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (userId && userId !== req.auth.userId) {
      return res.status(403).json({ message: 'Cannot create order for another user' });
    }

    if (req.auth?.email && userEmail.toLowerCase() !== req.auth.email.toLowerCase()) {
      return res.status(403).json({ message: 'Email mismatch for authenticated user' });
    }
    
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }
    
    const amount = totalAmount || totalPrice;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid total amount is required' });
    }
    
    // Determine payment status from paymentInfo or direct field
    let finalPaymentStatus = paymentStatus || 'pending';
    let finalPaymentMethod = paymentMethod || 'upi';
    let finalTransactionId = transactionId || '';
    
    if (paymentInfo) {
      finalPaymentStatus = paymentInfo.status || finalPaymentStatus;
      finalPaymentMethod = paymentInfo.type || finalPaymentMethod;
      finalTransactionId = paymentInfo.id || finalTransactionId;
    }
    
    // Create new order
    const order = new Order({
      userId: req.auth.userId,
      userEmail: req.auth.email || userEmail,
      userName,
      userPhone,
      shippingInfo: shippingInfo || shippingAddress,
      shippingAddress,
      items,
      totalAmount: amount,
      totalPrice: amount,
      shippingFee: shippingFee || 0,
      paymentInfo,
      paymentStatus: finalPaymentStatus,
      paymentMethod: finalPaymentMethod,
      transactionId: finalTransactionId,
      paidAt: finalPaymentStatus === 'completed' ? (paidAt || new Date()) : null,
      notes
    });
    
    await order.save();
    console.log(`✅ Order created: ${order.orderId} for user ${userEmail}`);

    // Check and complete referral if this is user's first order
    try {
      const userClerkId = req.auth.userId;

      // Check if user has a pending referral (they were referred by someone)
      const pendingReferral = await Referral.findOne({
        referredId: userClerkId,
        status: 'pending'
      });

      if (pendingReferral) {
        // Check if this is user's first order (including current order)
        const userOrderCount = await Order.countDocuments({
          userId: userClerkId,
          paymentStatus: { $in: ['completed', 'paid'] }
        });

        // If this is their first paid order (count is 1 because we just saved it)
        if (userOrderCount <= 1) {
          console.log(`🎉 Completing referral for user ${userClerkId}`);

          // Complete the referral
          pendingReferral.status = 'completed';
          pendingReferral.firstOrderId = order.orderId;
          pendingReferral.completedAt = new Date();
          pendingReferral.rewardsDistributed = true;
          await pendingReferral.save();

          // Award points to referrer (200 points)
          const referrerLoyalty = await UserLoyalty.getOrCreate(pendingReferral.referrerId);
          await referrerLoyalty.addPoints(
            pendingReferral.reward?.referrerPoints || 200,
            'referral',
            `Referral bonus - ${userName || userEmail} made their first order`,
            order.orderId
          );
          console.log(`💰 Awarded ${pendingReferral.reward?.referrerPoints || 200} points to referrer ${pendingReferral.referrerId}`);

          // Award points to referred user (100 points)
          const referredLoyalty = await UserLoyalty.getOrCreate(userClerkId);
          await referredLoyalty.addPoints(
            pendingReferral.reward?.referredPoints || 100,
            'referral',
            'Welcome bonus for using referral code',
            order.orderId
          );
          console.log(`💰 Awarded ${pendingReferral.reward?.referredPoints || 100} points to referred user ${userClerkId}`);

          // Update referrer's completed referral count
          referrerLoyalty.stats = referrerLoyalty.stats || {};
          referrerLoyalty.stats.completedReferrals = (referrerLoyalty.stats.completedReferrals || 0) + 1;
          await referrerLoyalty.save();
        }
      }
    } catch (referralError) {
      console.error('Error processing referral completion:', referralError);
      // Don't fail the order if referral processing fails
    }

    // Update user loyalty stats (totalOrders and totalSpent) for achievement tracking
    try {
      const userClerkId = req.auth.userId;
      if (userClerkId) {
        const userLoyalty = await UserLoyalty.getOrCreate(userClerkId);
        userLoyalty.stats = userLoyalty.stats || { totalOrders: 0, totalSpent: 0, totalReviews: 0, totalReferrals: 0 };
        userLoyalty.stats.totalOrders = (userLoyalty.stats.totalOrders || 0) + 1;
        userLoyalty.stats.totalSpent = (userLoyalty.stats.totalSpent || 0) + (amount * 100); // Store in paise for consistency
        await userLoyalty.save();
        console.log(`📊 Updated loyalty stats for user ${userClerkId}: Orders=${userLoyalty.stats.totalOrders}, Spent=${userLoyalty.stats.totalSpent}`);
      }
    } catch (loyaltyError) {
      console.error('Error updating loyalty stats:', loyaltyError);
      // Don't fail the order if loyalty update fails
    }

    // If userId (Clerk ID) is provided, push order to User's orders array
    if (userId) {
      try {
        const userUpdate = await User.findOneAndUpdate(
          { clerkId: userId },
          { $push: { orders: order._id } },
          { new: true }
        );
        if (userUpdate) {
          console.log(`✅ Order ${order.orderId} linked to user ${userId}`);
        } else {
          console.log(`⚠️ User with clerkId ${userId} not found - order not linked`);
        }
      } catch (userError) {
        console.error('Error linking order to user:', userError.message);
        // Don't fail the order creation if user linking fails
      }
    }
    
    // Send confirmation email for successful orders
    let emailResult = { success: false };
    if (finalPaymentStatus === 'completed') {
      // For in-store orders, send combined confirmation + delivery email
      if (orderType === 'instore') {
        console.log(`📧 Sending in-store combined email for order ${order.orderId}`);
        emailResult = await sendInStoreOrderEmail(order);
      } else {
        // For online orders, send standard confirmation email
        console.log(`📧 Sending standard confirmation email for order ${order.orderId}`);
        emailResult = await sendOrderConfirmationEmail(order);
      }
    }
    
    res.status(201).json({
      message: 'Order placed successfully',
      order,
      emailSent: emailResult.success,
      orderType: orderType || 'online'
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(400).json({ message: 'Error creating order', error: error.message });
  }
});

// Status messages for timeline
const statusMessages = {
  placed: 'Order placed successfully',
  confirmed: 'Order has been confirmed',
  processing: 'Order is being processed',
  shipped: 'Order has been shipped',
  out_for_delivery: 'Order is out for delivery',
  delivered: 'Order has been delivered',
  return_initiated: 'Return request has been initiated',
  cancelled: 'Order has been cancelled',
  returned: 'Order has been returned'
};

const normalizeStatusKey = (status = '') =>
  String(status).toLowerCase().trim().replace(/[\s-]+/g, '_');

const triggerOrderStatusEmail = (order, rawStatus) => {
  console.log(`🔔 Triggering email for status: ${rawStatus}`);
  const orderEmail = String(order?.userEmail || '').trim();
  if (!orderEmail) {
    console.warn(`Skipping status email for ${order?.orderId || 'unknown order'}: missing userEmail`);
    return;
  }

  const status = normalizeStatusKey(rawStatus);
  console.log(`✉️ Normalized status: ${rawStatus} → ${status}`);
  
  const emailByStatus = {
    confirmed: sendOrderConfirmationEmail,
    processing: sendOrderProcessingEmail,
    shipped: sendOrderShippedEmail,
    out_for_delivery: sendOutForDeliveryEmail,
    delivered: sendOrderDeliveredEmail,
    cancelled: sendOrderCancelledEmail
  };

  const sendFn = emailByStatus[status];
  if (!sendFn) {
    console.warn(`❌ No email function found for status: ${status}`);
    return;
  }

  console.log(`📧 Sending ${status} email to ${orderEmail}`);
  sendFn(order).catch((err) => {
    console.error(`Email error for status ${status} on ${order.orderId}:`, err.message);
  });
};

// @route   PUT /api/orders/:id/status
// @desc    Update order status by MongoDB _id
// @access  Private (Admin only)
router.put('/:id/status', isAdmin, async (req, res) => {
  try {
    const { orderStatus, paymentStatus } = req.body;
    const normalizedIncomingStatus = normalizeStatusKey(orderStatus);
    
    // Find order first (by _id or orderId)
    let order = await Order.findById(req.params.id);
    if (!order) {
      order = await Order.findOne({ orderId: req.params.id });
    }
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Update order status and add to timeline
    if (normalizedIncomingStatus && normalizedIncomingStatus !== order.orderStatus) {
      order.orderStatus = normalizedIncomingStatus;
      order.addStatusUpdate(
        normalizedIncomingStatus,
        statusMessages[normalizedIncomingStatus] || `Order status updated to ${normalizedIncomingStatus}`,
        '',
        'Admin'
      );
      
      // Set actual delivery date if delivered
      if (normalizedIncomingStatus === 'delivered') {
        order.actualDeliveryDate = new Date();
      }
    }
    
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
      if (paymentStatus === 'completed' && !order.paidAt) {
        order.paidAt = new Date();
      }
    }
    
    await order.save();
    
    console.log(`✅ Order status updated: ${order.orderId} -> ${normalizedIncomingStatus || paymentStatus}`);
    
    // Send status update email for supported fulfillment states
    triggerOrderStatusEmail(order, normalizedIncomingStatus);
    
    res.json({ success: true, order });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(400).json({ message: 'Error updating order status', error: error.message });
  }
});

// @route   PUT /api/orders/:orderId
// @desc    Update order status (Admin) or initiate return (Customer)
// @access  Private
router.put('/:orderId', requireAuth, async (req, res) => {
  try {
    const { orderStatus, paymentStatus, transactionId } = req.body;
    const normalizedIncomingStatus = normalizeStatusKey(orderStatus);
    
    const order = await Order.findOne({ orderId: req.params.orderId });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const requesterIsAdmin = await isRequesterAdmin(req);

    if (!requesterIsAdmin) {
      if (!canAccessOrder(req, order)) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const isReturnInitiation = normalizedIncomingStatus === 'return_initiated';
      const hasRestrictedUpdates = Boolean(paymentStatus || transactionId);

      if (!isReturnInitiation || hasRestrictedUpdates) {
        return res.status(403).json({ message: 'Only return initiation is allowed for customers' });
      }

      if (order.orderStatus !== 'delivered') {
        return res.status(400).json({ message: 'Return can only be initiated for delivered orders' });
      }
    }
    
    // Update order status and add to timeline
    if (normalizedIncomingStatus && normalizedIncomingStatus !== order.orderStatus) {
      order.orderStatus = normalizedIncomingStatus;
      order.addStatusUpdate(
        normalizedIncomingStatus,
        statusMessages[normalizedIncomingStatus] || `Order status updated to ${normalizedIncomingStatus}`,
        '',
        requesterIsAdmin ? 'Admin' : 'Customer'
      );
      
      // Set actual delivery date if delivered
      if (normalizedIncomingStatus === 'delivered') {
        order.actualDeliveryDate = new Date();
      }
    }
    
    if (requesterIsAdmin && paymentStatus) {
      order.paymentStatus = paymentStatus;
      if (paymentStatus === 'completed' && !order.paidAt) {
        order.paidAt = new Date();
      }
    }
    
    if (requesterIsAdmin && transactionId) {
      order.transactionId = transactionId;
    }
    
    await order.save();
    
    console.log(`✅ Order updated: ${order.orderId}`);
    
    // Send status update emails for admin-led fulfillment changes
    if (requesterIsAdmin) {
      triggerOrderStatusEmail(order, normalizedIncomingStatus);
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(400).json({ message: 'Error updating order', error: error.message });
  }
});

// @route   DELETE /api/orders/:orderId
// @desc    Cancel/Delete an order
// @access  Private
router.delete('/:orderId', requireAuth, async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });
        const requesterIsAdmin = await isRequesterAdmin(req);
        if (!requesterIsAdmin && !canAccessOrder(req, order)) {
          return res.status(403).json({ message: 'Access denied' });
        }

    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Only allow cancellation of orders that haven't been delivered yet
    // Statuses that allow cancellation: placed, confirmed, processing, shipped, out_for_delivery
    const cancellableStatuses = ['placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery'];
    const deliveredStatuses = ['delivered', 'returned', 'cancelled'];
    
    if (!cancellableStatuses.includes(order.orderStatus)) {
      if (deliveredStatuses.includes(order.orderStatus)) {
        if (order.orderStatus === 'delivered') {
          return res.status(400).json({ 
            message: 'Order cannot be cancelled as it has already been delivered. You can request a replacement instead.' 
          });
        } else {
          return res.status(400).json({ 
            message: `Order cannot be cancelled as its status is ${order.orderStatus}` 
          });
        }
      }
      return res.status(400).json({ 
        message: 'Cannot cancel order in its current state' 
      });
    }
    
    order.orderStatus = 'cancelled';
    order.addStatusUpdate('cancelled', 'Order cancelled by customer', '', 'Customer');
    await order.save();
    
    // Send cancellation email
    sendOrderCancelledEmail(order).catch(err => console.error('Cancellation email error:', err));
    
    console.log(`🗑️ Order cancelled: ${order.orderId}`);
    res.json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   POST /api/orders/bulk-update
// @desc    Bulk update order statuses (Admin)
// @access  Private (Admin only)
router.post('/bulk-update', isAdmin, async (req, res) => {
  try {
    const { orderIds, orderStatus, updatedBy } = req.body;
    
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ message: 'Order IDs array is required' });
    }
    
    if (!orderStatus) {
      return res.status(400).json({ message: 'New status is required' });
    }
    
    const results = {
      success: [],
      failed: []
    };
    
    for (const orderId of orderIds) {
      try {
        const order = await Order.findOne({ 
          $or: [{ orderId }, { _id: orderId }] 
        });
        
        if (order) {
          const normalizedBulkStatus = normalizeStatusKey(orderStatus);
          if (normalizedBulkStatus !== order.orderStatus) {
            order.orderStatus = normalizedBulkStatus;
            order.addStatusUpdate(
              normalizedBulkStatus, 
              statusMessages[normalizedBulkStatus] || `Status updated to ${normalizedBulkStatus}`, 
              '', 
              updatedBy || 'Admin'
            );
            
            // Set actual delivery date if delivered
            if (normalizedBulkStatus === 'delivered') {
              order.actualDeliveryDate = new Date();
            }
          }
          await order.save();
          triggerOrderStatusEmail(order, order.orderStatus);
          results.success.push(orderId);
        } else {
          results.failed.push({ orderId, reason: 'Not found' });
        }
      } catch (err) {
        results.failed.push({ orderId, reason: err.message });
      }
    }
    
    console.log(`📦 Bulk updated ${results.success.length} orders to ${orderStatus}`);
    res.json({
      success: true,
      message: `Updated ${results.success.length} orders`,
      results
    });
  } catch (error) {
    console.error('Error in bulk update:', error);
    res.status(500).json({ message: 'Error in bulk update', error: error.message });
  }
});

// @route   POST /api/orders/:orderId/notes
// @desc    Add admin note to order
// @access  Private (Admin only)
router.post('/:orderId/notes', isAdmin, async (req, res) => {
  try {
    const { note, addedBy, isInternal } = req.body;
    
    if (!note) {
      return res.status(400).json({ message: 'Note content is required' });
    }
    
    const order = await Order.findOne({ orderId: req.params.orderId });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    order.adminNotes.push({
      note,
      addedBy: addedBy || 'Admin',
      isInternal: isInternal !== false
    });
    
    await order.save();
    
    console.log(`📝 Note added to order ${order.orderId}`);
    res.json({ success: true, order });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ message: 'Error adding note', error: error.message });
  }
});

// @route   DELETE /api/orders/:orderId/notes/:noteId
// @desc    Delete admin note from order
// @access  Private (Admin only)
router.delete('/:orderId/notes/:noteId', isAdmin, async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    order.adminNotes = order.adminNotes.filter(
      n => n._id.toString() !== req.params.noteId
    );
    
    await order.save();
    
    res.json({ success: true, message: 'Note deleted', order });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ message: 'Error deleting note', error: error.message });
  }
});

// @route   PUT /api/orders/:orderId/tracking
// @desc    Update tracking info
// @access  Private (Admin only)
router.put('/:orderId/tracking', isAdmin, async (req, res) => {
  try {
    const { trackingNumber, shippingCarrier, statusMessage, location, updatedBy } = req.body;
    
    const order = await Order.findOne({ orderId: req.params.orderId });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (shippingCarrier) order.shippingCarrier = shippingCarrier;
    
    // Add to timeline
    order.addStatusUpdate(
      order.orderStatus,
      statusMessage || `Tracking updated: ${trackingNumber}`,
      location || '',
      updatedBy || 'Admin'
    );
    
    await order.save();
    
    console.log(`📍 Tracking updated for ${order.orderId}: ${trackingNumber}`);
    res.json({ success: true, order });
  } catch (error) {
    console.error('Error updating tracking:', error);
    res.status(500).json({ message: 'Error updating tracking', error: error.message });
  }
});

// @route   GET /api/orders/:orderId/timeline
// @desc    Get order status timeline
// @access  Private
router.get('/:orderId/timeline', requireAuth, async (req, res) => {
  try {
    // Include userId and userEmail in select for ownership verification
    const order = await Order.findOne({ orderId: req.params.orderId })
      .select('orderId orderStatus orderType statusTimeline estimatedDeliveryDate actualDeliveryDate trackingNumber shippingCarrier userId userEmail');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const requesterIsAdmin = await isRequesterAdmin(req);
    if (!requesterIsAdmin && !canAccessOrder(req, order)) {
      console.log(`Access denied for timeline: user ${req.auth?.userId}/${req.auth?.email} vs order ${order.userId}/${order.userEmail}`);
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      orderId: order.orderId,
      currentStatus: order.orderStatus,
      orderType: order.orderType || 'online',
      trackingNumber: order.trackingNumber,
      shippingCarrier: order.shippingCarrier,
      estimatedDelivery: order.estimatedDeliveryDate,
      actualDelivery: order.actualDeliveryDate,
      timeline: order.statusTimeline
    });
  } catch (error) {
    console.error('Error fetching timeline:', error);
    res.status(500).json({ message: 'Error fetching timeline', error: error.message });
  }
});

// @route   POST /api/orders/:orderId/reorder
// @desc    Create a new order with same items as previous order
// @access  Private
router.post('/:orderId/reorder', requireAuth, async (req, res) => {
  try {
    const originalOrder = await Order.findOne({ orderId: req.params.orderId });

    if (!originalOrder) {
      return res.status(404).json({ message: 'Original order not found' });
    }

    const requesterIsAdmin = await isRequesterAdmin(req);
    if (!requesterIsAdmin && !canAccessOrder(req, originalOrder)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Verify items are still available
    const itemsToOrder = [];
    const unavailableItems = [];
    
    for (const item of originalOrder.items) {
      const product = await findAvailableProductForReorder(item);
      
      if (product) {
        const matchedVariant = (item.weight && Array.isArray(product.variants))
          ? product.variants.find((v) => v.weight === item.weight)
          : null;
        const currentPrice = matchedVariant?.price ?? product.price ?? item.price;

        // Product exists - add it regardless of stock (stock can be replenished)
        itemsToOrder.push({
          productId: product.id,
          name: product.name || item.name,
          price: currentPrice, // Use current price for selected variant when available
          quantity: item.quantity,
          image: item.image || product.image,
          color: item.color || (product.colors && product.colors[0]) || '#F5DEB3',
          weight: item.weight || product.defaultWeight,
          stock: product.stock,
          variants: product.variants || []
        });
      } else {
        // Product doesn't exist or is archived
        unavailableItems.push({ name: item.name, reason: 'Product no longer available' });
      }
    }
    
    if (itemsToOrder.length === 0) {
      return res.status(400).json({ 
        message: 'All items from this order are no longer available',
        unavailableItems
      });
    }
    
    // Calculate new total
    const totalAmount = itemsToOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingFee = totalAmount >= 200000 ? 0 : 15000; // Free shipping over ₹2000
    
    res.json({
      success: true,
      message: unavailableItems.length > 0 
        ? 'Some items are unavailable' 
        : 'Ready to reorder',
      reorderData: {
        items: itemsToOrder,
        totalAmount: totalAmount + shippingFee,
        shippingFee,
        originalOrderId: req.params.orderId,
        unavailableItems
      }
    });
  } catch (error) {
    console.error('Error preparing reorder:', error);
    res.status(500).json({ message: 'Error preparing reorder', error: error.message });
  }
});

// @route   GET /api/orders/stats/summary
// @desc    Get order statistics for admin
// @access  Private (Admin only)
router.get('/stats/summary', isAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }
    
    const [
      totalOrders,
      completedOrders,
      pendingOrders,
      cancelledOrders,
      totalRevenue
    ] = await Promise.all([
      Order.countDocuments({ ...dateFilter, isArchived: { $ne: true } }),
      Order.countDocuments({ ...dateFilter, orderStatus: 'delivered', isArchived: { $ne: true } }),
      Order.countDocuments({ ...dateFilter, orderStatus: { $in: ['placed', 'confirmed', 'processing'] }, isArchived: { $ne: true } }),
      Order.countDocuments({ ...dateFilter, orderStatus: 'cancelled', isArchived: { $ne: true } }),
      Order.aggregate([
        { $match: { ...dateFilter, paymentStatus: 'completed', isArchived: { $ne: true } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);
    
    res.json({
      totalOrders,
      completedOrders,
      pendingOrders,
      cancelledOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      averageOrderValue: totalOrders > 0 ? (totalRevenue[0]?.total || 0) / totalOrders : 0
    });
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
});

// @route   GET /api/orders/analytics/dashboard
// @desc    Get comprehensive analytics for admin dashboard
// @access  Private (Admin only)
router.get('/analytics/dashboard', isAdmin, async (req, res) => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Get orders for different time periods
    const [
      todayOrders,
      weekOrders,
      monthOrders,
      yearOrders,
      recentOrders,
      topProducts,
      ordersByStatus,
      salesByDay
    ] = await Promise.all([
      // Today's stats
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfToday }, paymentStatus: 'completed' } },
        { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } }
      ]),
      // This week's stats
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfWeek }, paymentStatus: 'completed' } },
        { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } }
      ]),
      // This month's stats
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfMonth }, paymentStatus: 'completed' } },
        { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } }
      ]),
      // This year's stats
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfYear }, paymentStatus: 'completed' } },
        { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } }
      ]),
      // Recent 10 orders
      Order.find({}).sort({ createdAt: -1 }).limit(10).select('orderId userName totalAmount orderStatus createdAt'),
      // Top selling products
      Order.aggregate([
        { $match: { paymentStatus: 'completed' } },
        { $unwind: '$items' },
        { $group: { _id: '$items.name', totalSold: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
        { $sort: { totalSold: -1 } },
        { $limit: 5 }
      ]),
      // Orders by status
      Order.aggregate([
        { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
      ]),
      // Sales by day (last 7 days)
      Order.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, paymentStatus: 'completed' } },
        { $group: { 
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }},
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json({
      today: { orders: todayOrders[0]?.count || 0, revenue: todayOrders[0]?.revenue || 0 },
      thisWeek: { orders: weekOrders[0]?.count || 0, revenue: weekOrders[0]?.revenue || 0 },
      thisMonth: { orders: monthOrders[0]?.count || 0, revenue: monthOrders[0]?.revenue || 0 },
      thisYear: { orders: yearOrders[0]?.count || 0, revenue: yearOrders[0]?.revenue || 0 },
      recentOrders,
      topProducts: topProducts.map(p => ({ name: p._id, sold: p.totalSold, revenue: p.revenue / 100 })),
      ordersByStatus: ordersByStatus.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
      salesByDay: salesByDay.map(d => ({ date: d._id, orders: d.orders, revenue: d.revenue }))
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
});

// @route   POST /api/orders/admin/sync-loyalty-stats
// @desc    Sync loyalty stats for all users based on their orders (for fixing existing data)
// @access  Private (Admin only)
router.post('/admin/sync-loyalty-stats', isAdmin, async (req, res) => {
  try {
    // Get all unique userIds from orders
    const userOrders = await Order.aggregate([
      { $match: { userId: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$userId',
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' }
        }
      }
    ]);

    let updated = 0;
    for (const userOrder of userOrders) {
      try {
        const loyalty = await UserLoyalty.getOrCreate(userOrder._id);
        loyalty.stats = loyalty.stats || { totalOrders: 0, totalSpent: 0, totalReviews: 0, totalReferrals: 0 };
        loyalty.stats.totalOrders = userOrder.totalOrders;
        loyalty.stats.totalSpent = userOrder.totalSpent * 100; // Store in paise
        await loyalty.save();
        updated++;
      } catch (err) {
        console.error(`Error updating user ${userOrder._id}:`, err.message);
      }
    }

    res.json({
      success: true,
      message: `Updated loyalty stats for ${updated} users`,
      usersProcessed: updated
    });
  } catch (error) {
    console.error('Error syncing loyalty stats:', error);
    res.status(500).json({ message: 'Error syncing loyalty stats', error: error.message });
  }
});


// ===== DEBUG ENDPOINT - PUBLIC TEST EMAIL =====
// @route   GET /api/orders/test-email/:email
// @desc    Test email sending with detailed logging (PUBLIC - NO AUTH REQUIRED)
// @access  Public (for testing only - should be removed in production)
router.get('/test-email/:email', async (req, res) => {
  try {
    const recipientEmail = req.params.email;
    
    if (!recipientEmail) {
      return res.status(400).json({ message: 'Email parameter required in URL' });
    }

    console.log('\n' + '='.repeat(60));
    console.log('🧪 TEST EMAIL ENDPOINT CALLED');
    console.log('='.repeat(60));
    console.log('📧 Recipient:', recipientEmail);
    console.log('🔍 Email Configuration:');
    console.log('   GMAIL_CLIENT_ID:', process.env.GMAIL_CLIENT_ID ? '✅ Set' : '❌ Not set');
    console.log('   GMAIL_CLIENT_SECRET:', process.env.GMAIL_CLIENT_SECRET ? '✅ Set' : '❌ Not set');
    console.log('   GMAIL_REFRESH_TOKEN:', process.env.GMAIL_REFRESH_TOKEN ? '✅ Set' : '❌ Not set');
    console.log('   MAILJET_API_KEY:', process.env.MAILJET_API_KEY ? '✅ Set' : '❌ Not set');
    console.log('   BREVO_API_KEY:', process.env.BREVO_API_KEY ? '✅ Set' : '❌ Not set');
    console.log('   RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ Set' : '❌ Not set');
    console.log('   EMAIL_USER:', process.env.EMAIL_USER || '❌ Not set');
    console.log('   EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Set' : '❌ Not set');
    console.log('='.repeat(60) + '\n');

    // Create a minimal test order
    const testOrder = {
      orderId: 'TEST-' + Date.now(),
      userEmail: recipientEmail,
      userName: 'Test User',
      totalAmount: 50000,  // ₹500 in paise
      shippingFee: 0,
      items: [{ name: 'Test Product', quantity: 1, price: 50000 }],
      paymentStatus: 'completed',
      transactionId: 'test-transaction-id',
      createdAt: new Date(),
      shippingInfo: {
        name: 'Test User',
        street: '123 Test Street',
        city: 'Test City',
        state: 'TS',
        pincode: '123456',
        country: 'India',
        phone: '+91 98765 43210'
      }
    };

    console.log('📨 Sending test email...\n');
    const result = await sendOrderConfirmationEmail(testOrder);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Email Result:', JSON.stringify(result, null, 2));
    console.log('='.repeat(60) + '\n');

    res.json({
      success: true,
      message: 'Test email sending initiated - check server logs for detailed output',
      result,
      orderId: testOrder.orderId,
      instructions: 'Check the server console output above for detailed email sending logs'
    });
  } catch (error) {
    console.error('\n❌ TEST EMAIL ERROR:', error.message);
    console.error('Stack:', error.stack);
    console.log('='.repeat(60) + '\n');
    res.status(500).json({
      success: false,
      message: 'Error sending test email',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ===== DEBUG ENDPOINT - ADMIN ONLY TEST EMAIL =====
// @route   POST /api/orders/test/send-email
// @desc    Test email sending with detailed logging
// @access  Admin only
router.post('/test/send-email', isAdmin, async (req, res) => {
  res.json({
    message: 'Use GET /api/orders/test-email/:email instead',
    example: 'GET http://localhost:5000/api/orders/test-email/youremail@gmail.com'
  });
});

module.exports = router;
