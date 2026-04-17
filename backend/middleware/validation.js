/**
 * Input Validation Middleware
 * Validates common fields and patterns
 */

const { body, validationResult, param, query } = require('express-validator');
const { ValidationError } = require('./errorHandler');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.param,
      message: err.msg,
      value: err.value
    }));
    throw new ValidationError('Input validation failed', formattedErrors);
  }
  next();
};

// Common validators
const validators = {
  // Email validation
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email format'),

  // Password validation (min 8, at least 1 uppercase, 1 number)
  password: body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),

  // Product name validation
  productName: body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters')
    .escape(),

  // Product price validation
  price: body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  // Product stock validation
  stock: body('stock')
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),

  // Order ID validation
  orderId: param('id')
    .isMongoId()
    .withMessage('Invalid order ID'),

  // Product ID validation
  productId: param('id')
    .isMongoId()
    .withMessage('Invalid product ID'),

  // User ID validation
  userId: param('id')
    .isMongoId()
    .withMessage('Invalid user ID'),

  // Quantity validation
  quantity: body('quantity')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Quantity must be between 1 and 1000'),

  // Coupon code validation
  couponCode: body('code')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Coupon code must be between 3 and 20 characters')
    .matches(/^[A-Z0-9-]+$/)
    .withMessage('Coupon code can only contain uppercase letters, numbers, and hyphens'),

  // Address validation
  address: body('address')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters')
    .escape(),

  // Phone number validation
  phone: body('phone')
    .isMobilePhone()
    .withMessage('Invalid phone number'),

  // Pagination validation
  page: query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  limit: query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  // Search validation
  search: query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters')
    .escape(),
};

// Combine validators for reusable chains
const validationChains = {
  createProduct: [
    validators.productName,
    validators.price,
    validators.stock,
    body('category')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Category must be between 2 and 50 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description cannot exceed 1000 characters')
      .escape(),
    handleValidationErrors,
  ],

  updateProduct: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Product name must be between 2 and 100 characters')
      .escape(),
    body('price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),
    body('stock')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Stock must be a non-negative integer'),
    handleValidationErrors,
  ],

  createOrder: [
    body('items')
      .isArray({ min: 1 })
      .withMessage('Order must contain at least one item'),
    body('items.*.productId')
      .isMongoId()
      .withMessage('Invalid product ID in items'),
    body('items.*.quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be at least 1'),
    body('shippingAddress')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Shipping address must be between 5 and 200 characters'),
    body('phone')
      .isMobilePhone()
      .withMessage('Invalid phone number'),
    handleValidationErrors,
  ],

  applyCoupon: [
    validators.couponCode,
    handleValidationErrors,
  ],

  updateProfile: [
    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('First name must be between 1 and 50 characters')
      .escape(),
    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name must be between 1 and 50 characters')
      .escape(),
    handleValidationErrors,
  ],
};

module.exports = {
  validators,
  validationChains,
  handleValidationErrors
};
