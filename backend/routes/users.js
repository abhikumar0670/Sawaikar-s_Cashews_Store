const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { requireAuth, requireAdmin, requireOwnership } = require('../middleware/clerkAuth');

// @route   POST /api/users/sync
// @desc    Sync Clerk user to MongoDB (create or update)
// @access  Private - authenticated user only
router.post('/sync', requireAuth, async (req, res) => {
  try {
    const { clerkId, name, email } = req.body;

    console.log('[SYNC] Incoming sync request:', { clerkId, email, reqAuthId: req.auth?.userId });

    if (!clerkId) {
      return res.status(400).json({ 
        success: false, 
        message: 'clerkId is required' 
      });
    }

    // Prevent users from syncing arbitrary Clerk IDs.
    if (req.auth.userId !== clerkId) {
      console.warn(`[SYNC] Access denied: token user ${req.auth.userId} != clerkId ${clerkId}`);
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        error: 'You can only sync your own user record'
      });
    }

    // Use findOneAndUpdate with upsert to create or update user atomically
    // Don't use runValidators: true as it will fail on required nested fields (addresses)
    const user = await User.findOneAndUpdate(
      { clerkId },
      { 
        $set: { 
          name: name || '', 
          email: email || '' 
        },
        $setOnInsert: { 
          role: 'user', 
          orders: [],
          addresses: [],
          recentlyViewed: [],
          newsletterSubscribed: false
        }
      },
      { 
        upsert: true, 
        new: true,
        runValidators: false  // Don't validate nested schemas on upsert
      }
    );

    console.log(`✅ User synced successfully: ${email} (ID: ${clerkId})`);
    return res.status(200).json({ 
      success: true, 
      message: 'User synced successfully',
      user
    });
  } catch (error) {
    console.error('❌ User sync error:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during sync',
      error: error.message 
    });
  }
});

// @route   GET /api/users/:clerkId
// @desc    Get user by Clerk ID
// @access  Private - Owner or Admin
router.get('/:clerkId', requireAuth, requireOwnership, async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.params.clerkId })
      .populate('orders');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('❌ Get user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private - Admin only
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().populate('orders');
    res.json({ success: true, users });
  } catch (error) {
    console.error('❌ Get users error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// @route   PATCH /api/users/:clerkId/role
// @desc    Update user role (admin only)
// @access  Private - Admin only
router.patch('/:clerkId/role', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid role. Must be "user" or "admin"' 
      });
    }

    const user = await User.findOneAndUpdate(
      { clerkId: req.params.clerkId },
      { role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    console.log(`✅ User role updated: ${user.email} -> ${role}`);
    res.json({ success: true, user });
  } catch (error) {
    console.error('❌ Update role error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// @route   PATCH /api/users/:clerkId/add-order
// @desc    Add order to user's orders array
// @access  Private - Owner or Admin
router.patch('/:clerkId/add-order', requireAuth, requireOwnership, async (req, res) => {
  try {
    const { orderId } = req.body;

    const user = await User.findOneAndUpdate(
      { clerkId: req.params.clerkId },
      { $push: { orders: orderId } },
      { new: true }
    ).populate('orders');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('❌ Add order error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// @route   PATCH /api/users/:clerkId/profile
// @desc    Update user profile (phone, etc.)
// @access  Private - Owner or Admin
router.patch('/:clerkId/profile', requireAuth, requireOwnership, async (req, res) => {
  try {
    const { phone, name, email } = req.body;

    const updateData = {};
    if (phone !== undefined) updateData.phone = phone;
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;

    const user = await User.findOneAndUpdate(
      { clerkId: req.params.clerkId },
      { $set: updateData },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    console.log(`✅ User profile updated: ${user.email}`);
    res.json({ success: true, user });
  } catch (error) {
    console.error('❌ Update profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});

// ===========================================
// ADDRESS MANAGEMENT ROUTES
// ===========================================

// @route   GET /api/users/:clerkId/addresses
// @desc    Get all addresses for user
// @access  Private - Owner or Admin
router.get('/:clerkId/addresses', requireAuth, requireOwnership, async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.params.clerkId });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, addresses: user.addresses });
  } catch (error) {
    console.error('❌ Get addresses error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   POST /api/users/:clerkId/addresses
// @desc    Add new address
// @access  Private - Owner or Admin
router.post('/:clerkId/addresses', requireAuth, requireOwnership, async (req, res) => {
  try {
    const { label, name, phone, address, city, state, pincode, country, isDefault } = req.body;

    if (!name || !phone || !address || !city || !state || !pincode) {
      return res.status(400).json({ success: false, message: 'All address fields are required' });
    }

    const user = await User.findOne({ clerkId: req.params.clerkId });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    // If this is first address, make it default
    const makeDefault = isDefault || user.addresses.length === 0;

    user.addresses.push({
      label: label || 'Home',
      name,
      phone,
      address,
      city,
      state,
      pincode,
      country: country || 'India',
      isDefault: makeDefault
    });

    await user.save();

    console.log(`📍 Address added for user: ${user.email}`);
    res.status(201).json({ success: true, addresses: user.addresses });
  } catch (error) {
    console.error('❌ Add address error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/users/:clerkId/addresses/:addressId
// @desc    Update address
// @access  Private - Owner or Admin
router.put('/:clerkId/addresses/:addressId', requireAuth, requireOwnership, async (req, res) => {
  try {
    const { label, name, phone, address, city, state, pincode, country, isDefault } = req.body;

    const user = await User.findOne({ clerkId: req.params.clerkId });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const addressIndex = user.addresses.findIndex(a => a._id.toString() === req.params.addressId);

    if (addressIndex === -1) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    // If setting as default, unset others
    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    // Update address fields
    if (label) user.addresses[addressIndex].label = label;
    if (name) user.addresses[addressIndex].name = name;
    if (phone) user.addresses[addressIndex].phone = phone;
    if (address) user.addresses[addressIndex].address = address;
    if (city) user.addresses[addressIndex].city = city;
    if (state) user.addresses[addressIndex].state = state;
    if (pincode) user.addresses[addressIndex].pincode = pincode;
    if (country) user.addresses[addressIndex].country = country;
    if (typeof isDefault !== 'undefined') user.addresses[addressIndex].isDefault = isDefault;

    await user.save();

    res.json({ success: true, addresses: user.addresses });
  } catch (error) {
    console.error('❌ Update address error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/users/:clerkId/addresses/:addressId
// @desc    Delete address
// @access  Private - Owner or Admin
router.delete('/:clerkId/addresses/:addressId', requireAuth, requireOwnership, async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.params.clerkId });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const addressIndex = user.addresses.findIndex(a => a._id.toString() === req.params.addressId);

    if (addressIndex === -1) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    const wasDefault = user.addresses[addressIndex].isDefault;
    user.addresses.splice(addressIndex, 1);

    // If deleted address was default, make first remaining address default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    console.log(`🗑️ Address deleted for user: ${user.email}`);
    res.json({ success: true, addresses: user.addresses });
  } catch (error) {
    console.error('❌ Delete address error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/users/:clerkId/addresses/:addressId/default
// @desc    Set address as default
// @access  Private - Owner or Admin
router.put('/:clerkId/addresses/:addressId/default', requireAuth, requireOwnership, async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.params.clerkId });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Unset all defaults
    user.addresses.forEach(addr => addr.isDefault = false);

    // Set new default
    const address = user.addresses.find(a => a._id.toString() === req.params.addressId);
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    address.isDefault = true;
    await user.save();

    res.json({ success: true, addresses: user.addresses });
  } catch (error) {
    console.error('❌ Set default address error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// ===========================================
// RECENTLY VIEWED ROUTES
// ===========================================

// @route   GET /api/users/:clerkId/recently-viewed
// @desc    Get user's recently viewed products
// @access  Private - Owner or Admin
router.get('/:clerkId/recently-viewed', requireAuth, requireOwnership, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const Product = require('../models/Product');

    const user = await User.findOne({ clerkId: req.params.clerkId });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get product details for recently viewed
    const productIds = user.recentlyViewed.slice(0, parseInt(limit)).map(rv => rv.productId);
    
    const products = await Product.find({ 
      id: { $in: productIds },
      isArchived: { $ne: true }
    });

    // Sort products in the order they were viewed
    const sortedProducts = productIds.map(id => products.find(p => p.id === id)).filter(Boolean);

    res.json({ 
      success: true, 
      recentlyViewed: sortedProducts,
      viewHistory: user.recentlyViewed.slice(0, parseInt(limit))
    });
  } catch (error) {
    console.error('❌ Get recently viewed error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   POST /api/users/:clerkId/recently-viewed
// @desc    Add product to recently viewed
// @access  Private - Owner or Admin
router.post('/:clerkId/recently-viewed', requireAuth, requireOwnership, async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    const user = await User.findOne({ clerkId: req.params.clerkId });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await user.addRecentlyViewed(productId);

    res.json({ success: true, message: 'Added to recently viewed' });
  } catch (error) {
    console.error('❌ Add recently viewed error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/users/:clerkId/recently-viewed
// @desc    Clear recently viewed history
// @access  Private - Owner or Admin
router.delete('/:clerkId/recently-viewed', requireAuth, requireOwnership, async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { clerkId: req.params.clerkId },
      { recentlyViewed: [] },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'Recently viewed cleared' });
  } catch (error) {
    console.error('❌ Clear recently viewed error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
