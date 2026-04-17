const express = require('express');
const router = express.Router();
const chatbotService = require('../services/chatbotService');
const Conversation = require('../models/Conversation');
const { requireAuth, requireAdmin } = require('../middleware/clerkAuth');

const requireConversationOwner = (req, res, next) => {
  if (!req.auth || req.auth.userId !== req.params.userId) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }
  return next();
};

// @route   POST /api/chatbot/message
// @desc    Send a message to the chatbot
// @access  Public
router.post('/message', async (req, res) => {
  try {
    const { sessionId, userId, message, metadata } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sessionId, message'
      });
    }

    // Process the message
    const result = await chatbotService.processMessage(
      sessionId,
      userId || null,
      message,
      metadata || {}
    );

    res.json({
      success: true,
      data: {
        response: result.response,
        escalated: result.escalated,
        conversationId: result.conversationId,
        sentiment: result.sentiment
      }
    });
  } catch (error) {
    console.error('Chatbot message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process message'
    });
  }
});

// @route   GET /api/chatbot/history/:sessionId
// @desc    Get conversation history for a session
// @access  Public
router.get('/history/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const conversation = await Conversation.findOne({ sessionId });

    if (!conversation) {
      return res.json({
        success: true,
        data: {
          messages: [],
          sessionId
        }
      });
    }

    res.json({
      success: true,
      data: {
        messages: conversation.messages,
        sessionId,
        sentiment: conversation.sentiment,
        escalated: conversation.escalated,
        createdAt: conversation.createdAt
      }
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch history'
    });
  }
});

// @route   GET /api/chatbot/conversations
// @desc    Get all conversations for a user
// @access  Public (should be authenticated in production)
router.get('/conversations/:userId', requireAuth, requireConversationOwner, async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const conversations = await Conversation.getRecentForUser(userId, limit);

    res.json({
      success: true,
      data: conversations.map(c => ({
        id: c._id,
        sessionId: c.sessionId,
        lastMessage: c.messages[c.messages.length - 1]?.content || '',
        messageCount: c.messages.length,
        sentiment: c.sentiment,
        escalated: c.escalated,
        resolved: c.resolved,
        updatedAt: c.updatedAt
      }))
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversations'
    });
  }
});

// @route   POST /api/chatbot/feedback
// @desc    Submit feedback for a chatbot response
// @access  Public
router.post('/feedback', async (req, res) => {
  try {
    const { conversationId, messageIndex, helpful, comment } = req.body;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        error: 'conversationId is required'
      });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    // Add feedback to metadata
    if (!conversation.metadata) {
      conversation.metadata = {};
    }
    if (!conversation.metadata.feedback) {
      conversation.metadata.feedback = [];
    }

    conversation.metadata.feedback.push({
      messageIndex,
      helpful,
      comment,
      submittedAt: new Date()
    });

    await conversation.save();

    res.json({
      success: true,
      message: 'Feedback submitted successfully'
    });
  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit feedback'
    });
  }
});

// @route   POST /api/chatbot/resolve/:conversationId
// @desc    Mark conversation as resolved
// @access  Public (should be admin only in production)
router.post('/resolve/:conversationId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      { resolved: true },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    res.json({
      success: true,
      message: 'Conversation marked as resolved'
    });
  } catch (error) {
    console.error('Resolve error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve conversation'
    });
  }
});

// @route   GET /api/chatbot/escalated
// @desc    Get all escalated conversations (for admin)
// @access  Admin
router.get('/escalated', requireAuth, requireAdmin, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      escalated: true,
      resolved: false
    })
    .sort({ updatedAt: -1 })
    .limit(50);

    res.json({
      success: true,
      data: conversations.map(c => ({
        id: c._id,
        sessionId: c.sessionId,
        userId: c.userId,
        escalationReason: c.escalationReason,
        messageCount: c.messages.length,
        lastMessage: c.messages[c.messages.length - 1]?.content || '',
        updatedAt: c.updatedAt
      }))
    });
  } catch (error) {
    console.error('Get escalated error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch escalated conversations'
    });
  }
});

// @route   GET /api/chatbot/suggested-replies
// @desc    Get suggested quick replies based on context
// @access  Public
router.get('/suggested-replies', async (req, res) => {
  try {
    const { context } = req.query;

    // Default quick replies
    let suggestions = [
      'Track my order',
      'What are your bestsellers?',
      'Shipping information',
      'Return policy'
    ];

    // Context-based suggestions
    if (context === 'product') {
      suggestions = [
        'Is this product available?',
        'What are the ingredients?',
        'How long does shipping take?',
        'Do you have bulk pricing?'
      ];
    } else if (context === 'order') {
      suggestions = [
        'Where is my order?',
        'Can I cancel my order?',
        'I received a damaged item',
        'Request a refund'
      ];
    } else if (context === 'checkout') {
      suggestions = [
        'What payment methods do you accept?',
        'Is COD available?',
        'Do you ship internationally?',
        'Apply a coupon code'
      ];
    }

    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get suggestions'
    });
  }
});

module.exports = router;
