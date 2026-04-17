const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    feedbackId: {
      type: String,
      unique: true,
      sparse: true
    },
    orderId: {
      type: String,
      index: true
    },
    userId: {
      type: String,
      index: true
    },
    userEmail: {
      type: String,
      index: true
    },
    userName: {
      type: String
    },
    userPhone: {
      type: String
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: ['quality', 'delivery', 'packaging', 'customer_service', 'other'],
      default: 'quality'
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'responded'],
      default: 'pending'
    },
    adminResponse: {
      type: String,
      default: null
    },
    respondedAt: {
      type: Date,
      default: null
    },
    respondedBy: {
      type: String,
      default: null
    },
    isAnonymous: {
      type: Boolean,
      default: false
    },
    isPublished: {
      type: Boolean,
      default: true
    },
    helpful: {
      type: Number,
      default: 0
    },
    unhelpful: {
      type: Number,
      default: 0
    },
    tags: [{
      type: String
    }],
    attachments: [{
      url: String,
      type: String
    }],
    createdAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Generate feedback ID before saving
feedbackSchema.pre('save', async function(next) {
  if (!this.feedbackId) {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    this.feedbackId = `FB-${timestamp}-${random}`;
  }
  next();
});

// Indexes for queries
feedbackSchema.index({ userId: 1, createdAt: -1 });
feedbackSchema.index({ orderId: 1 });
feedbackSchema.index({ rating: 1 });
feedbackSchema.index({ status: 1 });
feedbackSchema.index({ isPublished: 1, rating: 1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
