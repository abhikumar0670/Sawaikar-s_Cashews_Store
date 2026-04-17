const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');
const { sendOrderConfirmationEmail } = require('../config/email');
require('dotenv').config();
const StockManagementService = require('../services/stockManagementService');

// Initialize Razorpay instance with your Test API Keys
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * POST /api/payment/create-order
 * Creates a Razorpay order
 * Body: { amount: number (in rupees) }
 * Returns: { orderId, currency, amount, keyId }
 */
router.post('/create-order', async (req, res) => {
  try {
    const { amount, couponCode, items } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount. Amount must be greater than 0.'
      });
    }

    // SERVER-SIDE COUPON VALIDATION (if coupon provided)
    let finalAmount = amount;
    let validatedDiscount = 0;

    if (couponCode && items) {
      try {
        const Coupon = require('../models/Coupon');
        const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });

        if (!coupon) {
          return res.status(400).json({
            success: false,
            error: 'Invalid coupon code',
            type: 'invalid_coupon'
          });
        }

        // Calculate subtotal from items
        const subtotal = items.reduce((sum, item) => sum + (item.price * item.amount), 0);

        // Validate coupon (basic validation without email for order creation)
        if (!coupon.isActive) {
          return res.status(400).json({
            success: false,
            error: 'Coupon is no longer active',
            type: 'invalid_coupon'
          });
        }

        if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
          return res.status(400).json({
            success: false,
            error: 'Coupon has expired',
            type: 'invalid_coupon'
          });
        }

        if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
          return res.status(400).json({
            success: false,
            error: `Minimum order value of ₹${coupon.minOrderValue / 100} required`,
            type: 'invalid_coupon'
          });
        }

        if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
          return res.status(400).json({
            success: false,
            error: 'Coupon usage limit reached',
            type: 'invalid_coupon'
          });
        }

        // Calculate discount
        validatedDiscount = coupon.calculateDiscount(subtotal);
        finalAmount = Math.max(0, amount - validatedDiscount);

        console.log('✅ Coupon validated for order creation. Discount:', validatedDiscount);
      } catch (couponError) {
        console.error('❌ Coupon validation error:', couponError);
        return res.status(500).json({
          success: false,
          error: 'Failed to validate coupon',
          type: 'coupon_error'
        });
      }
    }

    // Convert amount from rupees to paise (Razorpay expects amount in smallest currency unit)
    const amountInPaise = Math.round(finalAmount * 100);

    // Create Razorpay order options
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1 // Auto capture payment
    };

    // Create order using Razorpay API
    const order = await razorpay.orders.create(options);

    console.log('✅ Razorpay Order Created:', order.id);

    // Return order details to frontend
    res.status(200).json({
      success: true,
      orderId: order.id,
      currency: order.currency,
      amount: order.amount,
      keyId: process.env.RAZORPAY_KEY_ID // Send Key ID to frontend for checkout
    });

  } catch (error) {
    console.error('❌ Error creating Razorpay order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment order. Please try again.'
    });
  }
});

/**
 * POST /api/payment/verify
 * Legacy verify endpoint - kept for backward compatibility
 * Body: { orderId, paymentId, signature }
 * Returns: { success: boolean }
 */
router.post('/verify', async (req, res) => {
  try {
    const { orderId, paymentId, signature } = req.body;

    // Create signature verification string
    const body = orderId + "|" + paymentId;
    
    // Generate expected signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    // Compare signatures
    const isAuthentic = expectedSignature === signature;

    if (isAuthentic) {
      console.log('✅ Payment Verified Successfully');
      res.status(200).json({
        success: true,
        message: 'Payment verified successfully'
      });
    } else {
      console.log('❌ Payment Verification Failed');
      res.status(400).json({
        success: false,
        error: 'Payment verification failed'
      });
    }

  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    res.status(500).json({
      success: false,
      error: 'Payment verification error'
    });
  }
});

/**
 * POST /api/payment/verify-payment
 * Comprehensive payment verification with order creation and cart clearing
 * Body: {
 *   razorpay_order_id, 
 *   razorpay_payment_id, 
 *   razorpay_signature,
 *   orderData: { user, items, totalAmount, shippingAddress }
 * }
 * Returns: { success: boolean, orderId: string }
 */
router.post('/verify-payment', async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      orderData 
    } = req.body;

    // Validate required payment parameters
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.error('❌ Missing Razorpay parameters');
      return res.status(400).json({
        success: false,
        error: 'Missing required payment parameters'
      });
    }

    if (!orderData || !orderData.user || !orderData.items) {
      console.error('❌ Missing orderData parameters');
      return res.status(400).json({
        success: false,
        error: 'Missing required order data'
      });
    }

    // Validate user email
    if (!orderData.user.email || !orderData.user.email.toString().trim()) {
      console.error('❌ Missing user email:', orderData.user.email);
      return res.status(400).json({
        success: false,
        error: 'User email is required. Please provide a valid email address.'
      });
    }

    // Step 1: Verify Razorpay signature (CRUCIAL SECURITY STEP)
    const signatureBody = razorpay_order_id + "|" + razorpay_payment_id;
    
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(signatureBody.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      console.error('❌ Payment signature verification failed');
      return res.status(400).json({
        success: false,
        error: 'Invalid payment signature. Payment verification failed.'
      });
    }

    // Step 2: Fetch Payment Details from Razorpay
    let paymentInfo = {
      id: razorpay_payment_id,
      status: 'completed',
      type: 'upi', // default
      method: 'Razorpay'
    };

    try {
      const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
      
      // Extract payment method details
      paymentInfo.type = paymentDetails.method || 'upi';
      paymentInfo.status = paymentDetails.status === 'captured' ? 'completed' : paymentDetails.status;
      
      // UPI Payment
      if (paymentDetails.method === 'upi') {
        paymentInfo.method = 'UPI';
        paymentInfo.upiId = paymentDetails.vpa || null;
        paymentInfo.vpa = paymentDetails.vpa || null;
      }
      // Card Payment
      else if (paymentDetails.method === 'card') {
        paymentInfo.method = 'Card';
        if (paymentDetails.card) {
          paymentInfo.cardLast4 = paymentDetails.card.last4 || null;
          paymentInfo.network = paymentDetails.card.network || null;
        }
      }
      // Netbanking Payment
      else if (paymentDetails.method === 'netbanking') {
        paymentInfo.method = 'Netbanking';
        paymentInfo.bank = paymentDetails.bank || null;
      }
      // Wallet Payment
      else if (paymentDetails.method === 'wallet') {
        paymentInfo.method = 'Wallet';
        paymentInfo.wallet = paymentDetails.wallet || null;
      }
    } catch (fetchError) {
      // Continue with default payment info if Razorpay fetch fails
    }

    // Step 3: Create Order in MongoDB
    const Order = require('../models/Order');

    // Check if this is an in-store order (customer picked up at store)
    const isInStoreOrder = orderData.orderType === 'instore';

    // Sanitize email: trim and lowercase
    const sanitizedEmail = (orderData.user.email || '')
      .toString()
      .trim()
      .toLowerCase();

    // Map shipping address from frontend format to backend schema
    const shippingAddr = orderData.shippingAddress || {};
    const mappedShippingInfo = {
      address: shippingAddr.address || shippingAddr.street || '',
      street: shippingAddr.street || '',
      city: shippingAddr.city || '',
      state: shippingAddr.state || '',
      postalCode: shippingAddr.zipCode || shippingAddr.pincode || '',
      pincode: shippingAddr.pincode || '',
      country: shippingAddr.country || 'India',
      phone: shippingAddr.phone || ''
    };

    // Step 3.4: VALIDATE COUPON SERVER-SIDE (CRITICAL SECURITY)
    let validatedDiscount = 0;
    let appliedCouponCode = null;
    
    if (orderData.couponCode) {
      console.log('🎫 Validating coupon:', orderData.couponCode);
      
      try {
        const Coupon = require('../models/Coupon');
        const coupon = await Coupon.findOne({ code: orderData.couponCode.toUpperCase() });
        
        if (!coupon) {
          console.error('❌ Invalid coupon code:', orderData.couponCode);
          return res.status(400).json({
            success: false,
            error: 'Invalid coupon code',
            type: 'invalid_coupon'
          });
        }
        
        // Calculate subtotal (before shipping, before discount)
        const subtotal = orderData.items.reduce((sum, item) => sum + (item.price * item.amount), 0);
        
        // Validate coupon
        const validation = coupon.isValid(sanitizedEmail, subtotal);
        
        if (!validation.valid) {
          console.error('❌ Coupon validation failed:', validation.message);
          return res.status(400).json({
            success: false,
            error: validation.message,
            type: 'invalid_coupon'
          });
        }
        
        // Calculate discount server-side
        validatedDiscount = coupon.calculateDiscount(subtotal);
        appliedCouponCode = coupon.code;
        
        // Mark coupon as used
        coupon.usedCount += 1;
        coupon.usedBy.push({
          userEmail: sanitizedEmail,
          usedAt: new Date(),
          orderAmount: subtotal
        });
        await coupon.save();
        
        console.log('✅ Coupon validated. Discount:', validatedDiscount);
      } catch (couponError) {
        console.error('❌ Coupon validation error:', couponError);
        return res.status(500).json({
          success: false,
          error: 'Failed to validate coupon',
          type: 'coupon_error'
        });
      }
    }

    // Prepare order object
    const orderObject = {
      userId: orderData.user.clerkId,
      userEmail: sanitizedEmail,
      userName: orderData.user.name,
      items: orderData.items,
      totalAmount: orderData.totalAmount,
      couponCode: appliedCouponCode,
      couponDiscount: validatedDiscount,
      shippingInfo: mappedShippingInfo,  // Use new structured shipping info
      shippingAddress: orderData.shippingAddress,  // Keep legacy field for backward compatibility
      paymentMethod: paymentInfo.type || 'razorpay',
      paymentStatus: 'completed',
      // For in-store orders, mark as delivered immediately (customer already has the product)
      orderStatus: isInStoreOrder ? 'delivered' : 'confirmed',
      transactionId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      paymentInfo: paymentInfo,
      paidAt: new Date(),
      // Set order type: 'instore' for in-store pickup, 'online' for delivery
      orderType: orderData.orderType || 'online'
    };

    // Log item details for debugging bundle orders
    console.log('📋 Order Items Detail:');
    orderData.items.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.name} - Price: ₹${(item.price / 100).toFixed(2)}, Qty: ${item.quantity}`);
      console.log(`     Product ID: ${item.productId || item.id || 'NO ID'}`);
      if (item.productId && item.productId.startsWith('bundle-')) {
        console.log(`     ⚠️  BUNDLE ITEM ID: ${item.productId}`);
      }
    });

    // Step 3.5: VALIDATE STOCK BEFORE ORDER CREATION
    console.log('📦 Validating stock availability for', orderData.items.length, 'items...');
    const stockValidation = await StockManagementService.validateStockAvailability(orderData.items);
    
    if (!stockValidation.isValid) {
      console.error('❌ Stock validation failed:', stockValidation.message);
      console.error('❌ Failed items:', orderData.items.filter(item => {
        // Log items that might fail validation
        if (!item.productId) return true;
        if (!item.productId.startsWith('bundle-') && !item.productId.match(/^product/)) return true;
        return false;
      }));
      return res.status(400).json({
        success: false,
        error: stockValidation.message,
        type: 'insufficient_stock',
        debugInfo: process.env.NODE_ENV === 'development' ? {
          items: orderData.items,
          validation: stockValidation
        } : undefined
      });
    }
    
    // For in-store orders, set delivered date immediately
    if (isInStoreOrder) {
      orderObject.actualDeliveryDate = new Date();
    }

    const newOrder = new Order(orderObject);
    
    try {
      await newOrder.save();
      console.log('✅ Order saved successfully. Order ID:', newOrder.orderId);
      
      // Step 3.6: DEDUCT STOCK AFTER ORDER IS SAVED
      console.log('📦 Deducting stock for order items...');
      const stockDeduction = await StockManagementService.deductStockForOrder(
        orderData.items,
        newOrder.orderId
      );
      
      if (!stockDeduction.success) {
        console.error('❌ Stock deduction failed:', stockDeduction.message);
        // Even if stock deduction fails, order is already created
        // Log this for manual review
      } else {
        console.log('✅ Stock deducted successfully');
        
        // If there are low stock alerts, log them
        if (stockDeduction.lowStockProducts && stockDeduction.lowStockProducts.length > 0) {
          console.warn('⚠️ LOW STOCK ALERT for:', stockDeduction.lowStockProducts.map(p => p.productName).join(', '));
          newOrder.lowStockAlert = true;
          await newOrder.save();
        }
      }
    } catch (saveError) {
      console.error('❌ Order save error:', saveError.message);
      console.error('❌ Order save error details:', saveError.errors || saveError);
      console.error('❌ Attempted order object:', JSON.stringify(orderObject, null, 2));
      throw saveError;
    }

    // Step 4: Send response immediately (don't wait for email)
    res.status(200).json({
      success: true,
      message: 'Payment verified and order created successfully',
      orderId: newOrder.orderId,
      mongoOrderId: newOrder._id,
      emailSent: 'pending' // Email will be sent asynchronously
    });

    // Step 5: Send Order Confirmation Email ASYNCHRONOUSLY (after response)
    // This prevents the email from blocking the response
    setImmediate(async () => {
      try {
        // Fetch user from database to get the most accurate email
        let userEmail = orderData.user.email;
        let userName = orderData.user.name || 'Valued Customer';
        
        if (orderData.user.clerkId) {
          const dbUser = await User.findOne({ clerkId: orderData.user.clerkId });
          if (dbUser && dbUser.email) {
            userEmail = dbUser.email;
            userName = dbUser.name || userName;
          }
        }
        
        // Prepare order object for email
        const orderForEmail = {
          orderId: newOrder.orderId,
          userEmail: userEmail,
          userName: userName,
          items: newOrder.items,
          totalAmount: newOrder.totalAmount,
          shippingFee: newOrder.shippingFee || 0,
          paymentStatus: newOrder.paymentStatus,
          transactionId: newOrder.transactionId,
          shippingAddress: newOrder.shippingAddress,
          createdAt: newOrder.createdAt
        };
        
        console.log('📧 Attempting to send email to:', userEmail);
        console.log('📧 Order ID:', newOrder.orderId);
        
        const emailResult = await sendOrderConfirmationEmail(orderForEmail);
        console.log('📧 Email result:', emailResult);
        
        if (emailResult.success) {
          console.log('✅ Email sent successfully to:', userEmail);
        } else {
          console.error('❌ Email failed:', emailResult.error);
        }
      } catch (emailError) {
        console.error('❌ Email sending failed (async):', emailError.message);
        console.error('❌ Full error:', emailError);
      }
    });

  } catch (error) {
    console.error('❌ Payment verification failed:', error.message);
    console.error('❌ Full error:', error);
    
    // Extract validation errors if they exist
    let errorMessage = 'Failed to verify payment and create order.';
    if (error.errors) {
      const validationErrors = Object.keys(error.errors).map(key => 
        `${key}: ${error.errors[key].message || error.errors[key]}`
      ).join(', ');
      errorMessage += ` Validation errors: ${validationErrors}`;
    } else if (error.message) {
      errorMessage += ` ${error.message}`;
    }
    
    // Send error response
    res.status(500).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        validationErrors: error.errors || {},
        stack: error.stack
      } : undefined,
      message: 'Please contact support with your payment ID: ' + (req.body.razorpay_payment_id || 'N/A')
    });
  }
});

module.exports = router;
