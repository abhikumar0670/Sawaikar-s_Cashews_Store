#!/usr/bin/env node

/**
 * Register Admin User Script
 * Usage: node scripts/registerAdmin.js
 * 
 * This script adds a user to the AdminRole collection with active status
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const AdminRole = require('../models/AdminRole');

const adminEmail = 'abhikumar0670@gmail.com';

async function registerAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await AdminRole.findOne({ email: adminEmail.toLowerCase() });
    
    if (existingAdmin) {
      console.log(`✅ Admin ${adminEmail} already exists with status: ${existingAdmin.status}`);
      
      // Update status to active if not already
      if (existingAdmin.status !== 'active') {
        existingAdmin.status = 'active';
        await existingAdmin.save();
        console.log(`✅ Updated ${adminEmail} status to active`);
      }
    } else {
      // Create new admin role
      const newAdmin = new AdminRole({
        email: adminEmail.toLowerCase(),
        status: 'active',
        permissions: ['view_orders', 'manage_orders', 'view_users', 'manage_products', 'view_analytics'],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await newAdmin.save();
      console.log(`✅ Successfully registered admin: ${adminEmail}`);
      console.log('Admin details:', {
        email: newAdmin.email,
        status: newAdmin.status,
        permissions: newAdmin.permissions,
        createdAt: newAdmin.createdAt
      });
    }

    // Verify the admin was created
    const verifyAdmin = await AdminRole.findOne({ email: adminEmail.toLowerCase() });
    if (verifyAdmin && verifyAdmin.status === 'active') {
      console.log(`\n✅ VERIFICATION SUCCESS: ${adminEmail} is now an active admin!`);
    } else {
      console.log(`\n❌ VERIFICATION FAILED: Could not verify admin status`);
    }

    await mongoose.disconnect();
    console.log('\n✅ MongoDB disconnected');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error registering admin:', error.message);
    process.exit(1);
  }
}

registerAdmin();
