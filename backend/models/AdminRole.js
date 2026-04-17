/**
 * AdminRole Schema
 * Dynamically manage admin users without hardcoding emails
 * Allows adding/removing admins through database
 */

const mongoose = require('mongoose');

const adminRoleSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    role: {
      type: String,
      enum: ['admin', 'super_admin', 'moderator'],
      default: 'admin',
      index: true
    },
    permissions: {
      type: [String],
      default: ['read_products', 'manage_products', 'view_orders', 'manage_coupons'],
      // Available permissions:
      // - read_products, manage_products, delete_products
      // - view_orders, manage_orders, cancel_orders
      // - view_analytics, export_analytics
      // - manage_coupons, delete_coupons
      // - manage_users, delete_users
      // - manage_admins (super_admin only)
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
      index: true
    },
    clerkId: {
      type: String,
      unique: true,
      sparse: true
    },
    firstName: String,
    lastName: String,
    phone: String,
    lastLogin: Date,
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockedUntil: Date,
    activityLog: [{
      action: String,
      timestamp: { type: Date, default: Date.now },
      details: mongoose.Schema.Types.Mixed
    }],
    notes: String,
  },
  {
    timestamps: true
  }
);

// Indexes for performance
adminRoleSchema.index({ email: 1, status: 1 });
adminRoleSchema.index({ role: 1 });
adminRoleSchema.index({ createdAt: -1 });

// Static method to check if user is admin
adminRoleSchema.statics.isAdmin = async function(email) {
  const admin = await this.findOne({ 
    email: email.toLowerCase(), 
    status: 'active',
    role: { $in: ['admin', 'super_admin'] }
  });
  return !!admin;
};

// Static method to check specific permissions
adminRoleSchema.statics.hasPermission = async function(email, permission) {
  const admin = await this.findOne({ 
    email: email.toLowerCase(), 
    status: 'active',
    permissions: permission
  });
  return !!admin;
};

// Static method to record activity
adminRoleSchema.statics.recordActivity = async function(email, action, details = {}) {
  return this.updateOne(
    { email: email.toLowerCase() },
    {
      $push: {
        activityLog: {
          action,
          timestamp: new Date(),
          details
        }
      },
      $set: { lastLogin: new Date() }
    }
  );
};

// Instance method to get all permissions
adminRoleSchema.methods.getPermissions = function() {
  return this.permissions;
};

// Instance method to check specific permission
adminRoleSchema.methods.hasPermission = function(permission) {
  return this.permissions.includes(permission);
};

// Lock account after failed login attempts
adminRoleSchema.methods.incrementLoginAttempts = async function() {
  if (this.lockedUntil && this.lockedUntil > Date.now()) {
    return; // Already locked
  }

  this.loginAttempts += 1;

  if (this.loginAttempts >= 5) {
    this.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
  }

  return this.save();
};

// Reset login attempts on successful login
adminRoleSchema.methods.resetLoginAttempts = async function() {
  this.loginAttempts = 0;
  this.lockedUntil = null;
  this.lastLogin = new Date();
  return this.save();
};

// Check if account is currently locked
adminRoleSchema.methods.isLocked = function() {
  return this.lockedUntil && this.lockedUntil > Date.now();
};

module.exports = mongoose.model('AdminRole', adminRoleSchema);
