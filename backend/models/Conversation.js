const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const conversationSchema = new mongoose.Schema({
  userId: {
    type: String,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  messages: [messageSchema],
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative', 'frustrated'],
    default: 'neutral'
  },
  resolved: {
    type: Boolean,
    default: false
  },
  escalated: {
    type: Boolean,
    default: false
  },
  escalationReason: {
    type: String
  },
  metadata: {
    userAgent: String,
    platform: String,
    lastProductViewed: String,
    orderId: String
  },
  context: {
    userName: String,
    userEmail: String,
    recentOrders: [{
      orderId: String,
      status: String,
      totalAmount: Number
    }]
  }
}, {
  timestamps: true
});

// Index for efficient queries
conversationSchema.index({ createdAt: -1 });
conversationSchema.index({ userId: 1, createdAt: -1 });

// Add a message to conversation
conversationSchema.methods.addMessage = function(role, content) {
  this.messages.push({
    role,
    content,
    timestamp: new Date()
  });
  return this.save();
};

// Get recent conversations for a user
conversationSchema.statics.getRecentForUser = async function(userId, limit = 10) {
  return this.find({ userId })
    .sort({ updatedAt: -1 })
    .limit(limit);
};

// Get or create conversation by session
conversationSchema.statics.getOrCreateBySession = async function(sessionId, userId = null) {
  let conversation = await this.findOne({ sessionId });

  if (!conversation) {
    conversation = await this.create({
      sessionId,
      userId,
      messages: []
    });
  }

  return conversation;
};

// Mark as escalated
conversationSchema.methods.escalate = async function(reason) {
  this.escalated = true;
  this.escalationReason = reason;
  this.sentiment = 'frustrated';
  return this.save();
};

module.exports = mongoose.model('Conversation', conversationSchema);
