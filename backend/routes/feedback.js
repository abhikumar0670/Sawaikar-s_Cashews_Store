const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const Order = require('../models/Order');
const User = require('../models/User');
const { requireAuth, requireAdmin } = require('../middleware/clerkAuth');
const { isAdmin } = require('../middleware/auth');

// @route   POST /api/feedback
// @desc    Submit new feedback
// @access  Public (can be submitted by anyone, but auth is preferred)
router.post('/', async (req, res) => {
  try {
    const { orderId, rating, title, message, category, userEmail, userName, userPhone, isAnonymous } = req.body;

    // Validate required fields
    if (!rating || !title || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rating, title, and message are required' 
      });
    }

    // Validate rating
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rating must be an integer between 1 and 5' 
      });
    }

    // Validate category
    const validCategories = ['quality', 'delivery', 'packaging', 'customer_service', 'other'];
    if (category && !validCategories.includes(category)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid feedback category' 
      });
    }

    // If orderId is provided, verify it exists
    if (orderId) {
      const order = await Order.findOne({ 
        $or: [{ orderId }, { _id: orderId }] 
      });

      if (!order) {
        return res.status(404).json({ 
          success: false, 
          message: 'Order not found' 
        });
      }
    }

    // Create feedback document
    const feedback = new Feedback({
      orderId,
      rating,
      title,
      message,
      category: category || 'quality',
      userEmail: userEmail || '',
      userName: isAnonymous ? 'Anonymous' : (userName || ''),
      userPhone: isAnonymous ? '' : (userPhone || ''),
      isAnonymous: isAnonymous === true
    });

    // Save feedback
    await feedback.save();

    // Populate order reference if exists
    if (orderId) {
      const order = await Order.findOne({ 
        $or: [{ orderId }, { _id: orderId }] 
      });

      if (order) {
        if (!order.reviews) {
          order.reviews = [];
        }
        order.reviews.push({
          feedbackId: feedback.feedbackId,
          rating,
          createdAt: new Date()
        });
        await order.save();
      }
    }

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully!',
      feedback: {
        feedbackId: feedback.feedbackId,
        message: 'Thank you for your valuable feedback! We will review it shortly and use it to improve our services.'
      }
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting feedback',
      error: error.message
    });
  }
});

// @route   GET /api/feedback
// @desc    Get all public feedback (paginated)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const rating = req.query.rating ? parseInt(req.query.rating) : null;
    const category = req.query.category || null;
    const skip = (page - 1) * limit;

    const query = { isPublished: true };

    if (rating) {
      query.rating = rating;
    }

    if (category) {
      query.category = category;
    }

    const feedbacks = await Feedback.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-adminResponse -respondedBy -userId');

    const total = await Feedback.countDocuments(query);

    // Calculate average rating
    const allFeedbacks = await Feedback.find({ isPublished: true });
    const avgRating = allFeedbacks.length > 0 
      ? (allFeedbacks.reduce((sum, f) => sum + f.rating, 0) / allFeedbacks.length).toFixed(1)
      : 0;

    // Count by rating
    const ratingCounts = {};
    for (let i = 1; i <= 5; i++) {
      ratingCounts[i] = allFeedbacks.filter(f => f.rating === i).length;
    }

    res.json({
      success: true,
      feedbacks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        avgRating,
        totalFeedbacks: allFeedbacks.length,
        ratingCounts
      }
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching feedback',
      error: error.message
    });
  }
});

// @route   GET /api/feedback/by/order/:orderId
// @desc    Get feedback for specific order
// @access  Public
router.get('/by/order/:orderId', async (req, res) => {
  try {
    const feedback = await Feedback.findOne({ 
      orderId: req.params.orderId,
      isPublished: true 
    });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    res.json({
      success: true,
      feedback
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching feedback',
      error: error.message
    });
  }
});

// @route   GET /api/feedback/admin/all
// @desc    Get all feedback (admin only)
// @access  Private (Admin only)
router.get('/admin/all', requireAuth, requireAdmin, async (req, res) => {
  try {
    const feedbacks = await Feedback.find({})
      .sort({ createdAt: -1 });

    res.json(feedbacks);
  } catch (error) {
    console.error('Error fetching all feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching feedback',
      error: error.message
    });
  }
});

// @route   GET /api/feedback/:feedbackId
// @desc    Get feedback by ID
// @access  Public
router.get('/:feedbackId', async (req, res) => {
  try {
    const feedback = await Feedback.findOne({
      $or: [
        { feedbackId: req.params.feedbackId },
        { _id: req.params.feedbackId }
      ],
      isPublished: true
    });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    res.json({
      success: true,
      feedback
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching feedback',
      error: error.message
    });
  }
});

// @route   PUT /api/feedback/:feedbackId
// @desc    Update feedback (admin only)
// @access  Private (Admin only)
router.put('/:feedbackId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { adminResponse, status, isPublished } = req.body;

    const feedback = await Feedback.findOne({
      $or: [
        { feedbackId: req.params.feedbackId },
        { _id: req.params.feedbackId }
      ]
    });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    if (adminResponse) {
      feedback.adminResponse = adminResponse;
      feedback.status = 'responded';
      feedback.respondedAt = new Date();
      feedback.respondedBy = req.auth?.email || 'admin';
    }

    if (status) {
      feedback.status = status;
    }

    if (isPublished !== undefined) {
      feedback.isPublished = isPublished;
    }

    await feedback.save();

    res.json({
      success: true,
      message: 'Feedback updated successfully',
      feedback
    });
  } catch (error) {
    console.error('Error updating feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating feedback',
      error: error.message
    });
  }
});

// @route   DELETE /api/feedback/:feedbackId
// @desc    Delete feedback (admin only)
// @access  Private (Admin only)
router.delete('/:feedbackId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const feedback = await Feedback.findOneAndDelete({
      $or: [
        { feedbackId: req.params.feedbackId },
        { _id: req.params.feedbackId }
      ]
    });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    res.json({
      success: true,
      message: 'Feedback deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting feedback',
      error: error.message
    });
  }
});

// @route   GET /api/feedback/admin/stats
// @desc    Get feedback statistics (admin only)
// @access  Private (Admin only)
router.get('/admin/stats', isAdmin, async (req, res) => {
  try {
    const total = await Feedback.countDocuments();
    const pending = await Feedback.countDocuments({ status: 'pending' });
    const reviewed = await Feedback.countDocuments({ status: 'reviewed' });
    const responded = await Feedback.countDocuments({ status: 'responded' });

    const avgRating = await Feedback.aggregate([
      { $match: {} },
      { $group: { _id: null, avg: { $avg: '$rating' } } }
    ]);

    const recentFeedbacks = await Feedback.find()
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      stats: {
        total,
        pending,
        reviewed,
        responded,
        avgRating: avgRating[0]?.avg?.toFixed(1) || 0
      },
      recentFeedbacks
    });
  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching feedback stats',
      error: error.message
    });
  }
});

module.exports = router;
