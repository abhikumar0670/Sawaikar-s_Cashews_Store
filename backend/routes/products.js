const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const User = require('../models/User');
const Review = require('../models/Review');
const { isAdmin } = require('../middleware/auth');
const { sendLowStockAlertEmail } = require('../config/email');
const nutritionService = require('../services/nutritionRecommendationService');

const NUTRITION_KEYS = [
  'calories', 'protein', 'totalFat', 'saturatedFat', 'unsaturatedFat',
  'carbohydrates', 'fiber', 'sugars', 'iron', 'calcium', 'magnesium',
  'zinc', 'potassium', 'phosphorus', 'copper', 'selenium', 'vitaminE',
  'vitaminB1', 'vitaminB6', 'folate'
];

const BASE_NUTRITION_TEMPLATES = {
  cashews: {
    calories: 553, protein: 18, totalFat: 44, saturatedFat: 8, unsaturatedFat: 34,
    carbohydrates: 30, fiber: 3.3, sugars: 6, iron: 6.7, calcium: 37, magnesium: 292,
    zinc: 5.8, potassium: 660, phosphorus: 593, copper: 2.2, selenium: 19.9,
    vitaminE: 0.9, vitaminB1: 0.42, vitaminB6: 0.42, folate: 25
  },
  almonds: {
    calories: 579, protein: 21, totalFat: 50, saturatedFat: 3.8, unsaturatedFat: 44,
    carbohydrates: 22, fiber: 12.5, sugars: 4.4, iron: 3.7, calcium: 269, magnesium: 270,
    zinc: 3.1, potassium: 733, phosphorus: 481, copper: 1.0, selenium: 4.1,
    vitaminE: 25.6, vitaminB1: 0.21, vitaminB6: 0.14, folate: 50
  },
  pistachios: {
    calories: 562, protein: 20, totalFat: 45, saturatedFat: 5.6, unsaturatedFat: 37,
    carbohydrates: 28, fiber: 10, sugars: 7.7, iron: 3.9, calcium: 105, magnesium: 121,
    zinc: 2.2, potassium: 1025, phosphorus: 490, copper: 1.3, selenium: 7,
    vitaminE: 2.2, vitaminB1: 0.87, vitaminB6: 1.7, folate: 51
  },
  walnuts: {
    calories: 654, protein: 15, totalFat: 65, saturatedFat: 6, unsaturatedFat: 56,
    carbohydrates: 14, fiber: 6.7, sugars: 2.6, iron: 2.9, calcium: 98, magnesium: 158,
    zinc: 3.1, potassium: 441, phosphorus: 346, copper: 1.6, selenium: 4.9,
    vitaminE: 0.7, vitaminB1: 0.34, vitaminB6: 0.54, folate: 98
  },
  peanuts: {
    calories: 567, protein: 26, totalFat: 49, saturatedFat: 6.8, unsaturatedFat: 39,
    carbohydrates: 16, fiber: 8.5, sugars: 4.7, iron: 4.6, calcium: 92, magnesium: 168,
    zinc: 3.3, potassium: 705, phosphorus: 376, copper: 1.1, selenium: 7.2,
    vitaminE: 8.3, vitaminB1: 0.64, vitaminB6: 0.35, folate: 240
  },
  chickpeas: {
    calories: 364, protein: 19, totalFat: 6, saturatedFat: 0.6, unsaturatedFat: 5,
    carbohydrates: 61, fiber: 17, sugars: 11, iron: 6.2, calcium: 49, magnesium: 79,
    zinc: 3.4, potassium: 875, phosphorus: 252, copper: 0.85, selenium: 8.2,
    vitaminE: 0.8, vitaminB1: 0.48, vitaminB6: 0.54, folate: 557
  },
  dates: {
    calories: 277, protein: 1.8, totalFat: 0.2, saturatedFat: 0, unsaturatedFat: 0.1,
    carbohydrates: 75, fiber: 6.7, sugars: 66, iron: 0.9, calcium: 64, magnesium: 54,
    zinc: 0.4, potassium: 696, phosphorus: 62, copper: 0.36, selenium: 1.9,
    vitaminE: 0.05, vitaminB1: 0.05, vitaminB6: 0.2, folate: 15
  },
  figs: {
    calories: 249, protein: 3.3, totalFat: 0.9, saturatedFat: 0.1, unsaturatedFat: 0.6,
    carbohydrates: 64, fiber: 9.8, sugars: 48, iron: 2.0, calcium: 162, magnesium: 68,
    zinc: 0.6, potassium: 680, phosphorus: 67, copper: 0.3, selenium: 0.6,
    vitaminE: 0.4, vitaminB1: 0.1, vitaminB6: 0.1, folate: 9
  },
  raisins: {
    calories: 299, protein: 3.1, totalFat: 0.5, saturatedFat: 0.1, unsaturatedFat: 0.4,
    carbohydrates: 79, fiber: 3.7, sugars: 59, iron: 1.9, calcium: 50, magnesium: 32,
    zinc: 0.2, potassium: 749, phosphorus: 101, copper: 0.3, selenium: 0.6,
    vitaminE: 0.1, vitaminB1: 0.1, vitaminB6: 0.2, folate: 5
  }
};

const TEMPLATE_NAME_HINTS = [
  { includes: ['cashew'], template: 'cashews', allergens: ['tree-nuts'] },
  { includes: ['almond'], template: 'almonds', allergens: ['tree-nuts'] },
  { includes: ['pista', 'pistachio'], template: 'pistachios', allergens: ['tree-nuts'] },
  { includes: ['walnut'], template: 'walnuts', allergens: ['tree-nuts'] },
  { includes: ['peanut'], template: 'peanuts', allergens: ['peanuts'] },
  { includes: ['chickpea'], template: 'chickpeas', allergens: ['none'] },
  { includes: ['date'], template: 'dates', allergens: ['none'] },
  { includes: ['fig'], template: 'figs', allergens: ['none'] },
  { includes: ['raisin', 'resin'], template: 'raisins', allergens: ['none'] }
];

const toNum = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const pickNutritionTemplate = (name = '', category = '') => {
  const normalized = String(name).toLowerCase();
  const matchedByName = TEMPLATE_NAME_HINTS.find((item) => item.includes.some((token) => normalized.includes(token)));
  if (matchedByName) return matchedByName;

  const normalizedCategory = String(category).toLowerCase();
  if (normalizedCategory.includes('almond')) return { template: 'almonds', allergens: ['tree-nuts'] };
  if (normalizedCategory.includes('pista') || normalizedCategory.includes('pistachio')) return { template: 'pistachios', allergens: ['tree-nuts'] };
  if (normalizedCategory.includes('walnut')) return { template: 'walnuts', allergens: ['tree-nuts'] };
  if (normalizedCategory.includes('peanut')) return { template: 'peanuts', allergens: ['peanuts'] };
  if (normalizedCategory.includes('chickpea')) return { template: 'chickpeas', allergens: ['none'] };
  if (normalizedCategory.includes('date')) return { template: 'dates', allergens: ['none'] };
  if (normalizedCategory.includes('fig')) return { template: 'figs', allergens: ['none'] };

  return { template: 'cashews', allergens: ['tree-nuts'] };
};

const deriveHealthTags = (nutrition = {}) => {
  const tags = [];

  if (nutrition.protein >= 18) tags.push('high-protein');
  if (nutrition.unsaturatedFat >= 20 && nutrition.saturatedFat <= 10) tags.push('heart-healthy');
  if (nutrition.fiber >= 5) tags.push('high-fiber');
  if (nutrition.iron >= 4) tags.push('iron-rich');
  if (nutrition.calories >= 500 && nutrition.iron >= 4) tags.push('energy-boost');
  if (nutrition.zinc >= 4 || nutrition.selenium >= 10) tags.push('immunity-boost');
  if (nutrition.calcium >= 40 || nutrition.magnesium >= 200) tags.push('bone-health');
  if (nutrition.vitaminE >= 3 || nutrition.unsaturatedFat >= 20) tags.push('brain-health');
  if (nutrition.fiber >= 3 && nutrition.sugars <= 6) tags.push('diabetic-friendly');
  if (nutrition.carbohydrates <= 20 && nutrition.totalFat >= 35) tags.push('keto-friendly');

  return [...new Set(tags)];
};

const deriveHealthBenefits = (healthTags = []) => {
  const map = {
    'high-protein': 'Helps in muscle maintenance and recovery',
    'heart-healthy': 'Supports cardiovascular health with healthy fats',
    'high-fiber': 'Supports digestion and satiety',
    'iron-rich': 'Helps reduce fatigue and supports blood health',
    'energy-boost': 'Provides sustained natural energy',
    'immunity-boost': 'Supports immune system function',
    'bone-health': 'Supports bone and mineral health',
    'brain-health': 'Supports focus and cognitive function',
    'diabetic-friendly': 'Better suited for blood sugar conscious diets',
    'keto-friendly': 'Fits low-carb high-fat dietary patterns'
  };

  return healthTags.map((tag) => map[tag]).filter(Boolean);
};

const buildNutritionInfo = ({ name, category, nutritionInfo }) => {
  const provided = nutritionInfo && typeof nutritionInfo === 'object' ? nutritionInfo : {};
  const { template: templateName, allergens: defaultAllergens } = pickNutritionTemplate(name, category);
  const template = BASE_NUTRITION_TEMPLATES[templateName] || BASE_NUTRITION_TEMPLATES.cashews;

  const hasMeaningfulNumericInput = NUTRITION_KEYS.some((key) => toNum(provided[key], 0) > 0);

  const merged = {};
  NUTRITION_KEYS.forEach((key) => {
    if (!hasMeaningfulNumericInput) {
      merged[key] = toNum(template[key], 0);
      return;
    }

    const hasProvidedKey = Object.prototype.hasOwnProperty.call(provided, key);
    merged[key] = hasProvidedKey ? toNum(provided[key], toNum(template[key], 0)) : toNum(template[key], 0);
  });

  const healthTags = Array.isArray(provided.healthTags) && provided.healthTags.length > 0
    ? [...new Set(provided.healthTags)]
    : deriveHealthTags(merged);

  const healthBenefits = Array.isArray(provided.healthBenefits) && provided.healthBenefits.length > 0
    ? provided.healthBenefits
    : deriveHealthBenefits(healthTags);

  return {
    ...merged,
    healthTags,
    healthBenefits,
    allergens: Array.isArray(provided.allergens) && provided.allergens.length > 0 ? provided.allergens : defaultAllergens,
    servingSize: provided.servingSize || '100g'
  };
};

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products with filtering and search
 *     description: Retrieve all products with optional category, featured status, search, sorting, and pagination
 *     tags:
 *       - Products
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: ['cashews', 'almonds', 'pistachios', 'premium', 'roasted', 'flavored']
 *         description: Filter by category (use 'all' for all categories)
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
 *         description: Filter by featured status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by product name
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: ['newest', 'price-low', 'price-high', 'popular']
 *         description: Sort products
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *         description: Number of products per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *     responses:
 *       200:
 *         description: Successfully retrieved products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 products:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 total:
 *                   type: integer
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', async (req, res) => {
  try {
    const { category, featured, search, sort, limit } = req.query;
    
    // Build query
    let query = {};
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (featured === 'true') {
      query.featured = true;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Build sort options
    let sortOption = {};
    if (sort) {
      switch (sort) {
        case 'price-asc':
          sortOption.price = 1;
          break;
        case 'price-desc':
          sortOption.price = -1;
          break;
        case 'name-asc':
          sortOption.name = 1;
          break;
        case 'name-desc':
          sortOption.name = -1;
          break;
        case 'newest':
          sortOption.createdAt = -1;
          break;
        default:
          sortOption.createdAt = -1;
      }
    }
    
    let productsQuery = Product.find(query).sort(sortOption);
    
    if (limit) {
      productsQuery = productsQuery.limit(parseInt(limit));
    }
    
    const products = await productsQuery;
    
    console.log(`📦 Fetched ${products.length} products`);
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   GET /api/products/alerts/low-stock
// @desc    Get products with low stock (Admin)
// @access  Private (Admin only)
router.get('/alerts/low-stock', isAdmin, async (req, res) => {
  try {
    const { threshold = 10, sendEmail = false } = req.query;
    const stockThreshold = parseInt(threshold);
    
    const lowStockProducts = await Product.find({ stock: { $lt: stockThreshold } })
      .sort({ stock: 1 })
      .select('id name price stock category image');
    
    // Send email alert if requested and there are low stock products
    let emailSent = false;
    if (sendEmail === 'true' && lowStockProducts.length > 0) {
      const emailResult = await sendLowStockAlertEmail(lowStockProducts);
      emailSent = emailResult.success;
    }
    
    res.json({
      count: lowStockProducts.length,
      threshold: stockThreshold,
      products: lowStockProducts,
      emailSent
    });
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     description: Retrieve a single product by its unique identifier
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Product details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 product:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.id });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    console.log(`📦 Fetched product: ${product.name}`);
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

/**
 * @swagger
 * /api/products/add:
 *   post:
 *     summary: Create a new product (Admin)
 *     description: Add a new product to the catalog with full details and variants
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *                 example: 'Premium Cashews W180'
 *               price:
 *                 type: number
 *                 example: 599.99
 *               category:
 *                 type: string
 *                 enum: ['cashews', 'almonds', 'pistachios', 'premium', 'roasted', 'flavored']
 *               stock:
 *                 type: integer
 *                 default: 50
 *               description:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               featured:
 *                 type: boolean
 *                 default: false
 *               variants:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     weight:
 *                       type: string
 *                       example: '250g'
 *                     price:
 *                       type: number
 *                     stock:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 product:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized - Must be admin
 *       500:
 *         description: Server error
 */
// @route   POST /api/products/add
// @desc    Create a new product with validation (Admin)
// @access  Private (Admin only)
router.post('/add', isAdmin, async (req, res) => {
  try {
    const { name, price, stock, category, rating, description, images, featured, shipping, variants, defaultWeight, priceUnit, nutritionInfo } = req.body;
    
    // Validation
    if (!name || !price || !category) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields: name, price, and category are required' 
      });
    }

    // Validate price
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Price must be a positive number' 
      });
    }

    // Validate stock
    const parsedStock = stock !== undefined && stock !== '' ? parseInt(stock) : 50;
    if (isNaN(parsedStock) || parsedStock < 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Stock must be a non-negative number' 
      });
    }

    // Generate unique product ID
    const productId = `product-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

    // Parse and validate variants with automatic barcode generation
    let parsedVariants = [];
    if (variants && Array.isArray(variants) && variants.length > 0) {
      parsedVariants = variants.map((v, index) => ({
        weight: v.weight,
        price: parseFloat(v.price) || parsedPrice,
        stock: parseInt(v.stock) || 0,
        sku: v.sku || `${productId}-${v.weight}`,
        // AUTO-GENERATE BARCODE: Format SAW-{productId}-{weight}
        barcode: `SAW-${productId}-${v.weight}`
      }));
    } else {
      // If no variants provided, create default variants with auto-generated barcodes
      const defaultWeights = ['250g', '500g', '1kg'];
      parsedVariants = defaultWeights.map(weight => ({
        weight: weight,
        price: parsedPrice,
        stock: Math.floor(parsedStock / 3) || 10,
        sku: `${productId}-${weight}`,
        // AUTO-GENERATE BARCODE: Format SAW-{productId}-{weight}
        barcode: `SAW-${productId}-${weight}`
      }));
    }

    // Prepare product data
    const productData = {
      id: productId,
      name: name.trim(),
      price: parsedPrice,
      stock: parsedStock,
      category: category,
      rating: rating ? parseFloat(rating) : 0,
      description: description || `Premium quality ${name} from Sawaikar's Cashew Store.`,
      image: Array.isArray(images) && images.length > 0 ? images : ['./images/premium.jpg'],
      featured: featured === true || featured === 'true',
      shipping: shipping !== false && shipping !== 'false',
      company: "Sawaikar's",
      variants: parsedVariants,
      defaultWeight: defaultWeight || '250g',
      priceUnit: priceUnit || 'per kg',
      nutritionInfo: buildNutritionInfo({
        name: name.trim(),
        category,
        nutritionInfo
      })
    };

    const product = new Product(productData);
    await product.save();
    
    console.log(`\n✅ ===== NEW PRODUCT ADDED =====`);
    console.log(`   Name: ${product.name}`);
    console.log(`   ID: ${product.id}`);
    console.log(`   Price: ₹${product.price}`);
    console.log(`   Stock: ${product.stock}`);
    console.log(`   Category: ${product.category}`);
    console.log(`   Featured: ${product.featured}`);
    console.log(`   Free Shipping: ${product.shipping}`);
    console.log(`\n   [QR CODE & BARCODE INFO]:`);
    product.variants.forEach(v => {
      console.log(`   ✓ ${v.weight}: Barcode: ${v.barcode}`);
    });
    console.log(`================================\n`);
    
    res.status(201).json({
      success: true,
      message: 'Product added successfully!',
      product: product
    });
  } catch (error) {
    console.error('❌ Error creating product:', error);
    res.status(400).json({ 
      success: false,
      message: error.message || 'Error creating product',
      error: error.message 
    });
  }
});

// @route   POST /api/products
// @desc    Create a new product (Admin)
// @access  Private (Admin only)
router.post('/', isAdmin, async (req, res) => {
  try {
    const payload = {
      ...req.body,
      nutritionInfo: buildNutritionInfo({
        name: req.body?.name,
        category: req.body?.category,
        nutritionInfo: req.body?.nutritionInfo
      })
    };

    const product = new Product(payload);
    await product.save();
    
    console.log(`✅ Created product: ${product.name}`);
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(400).json({ message: 'Error creating product', error: error.message });
  }
});

// @route   PUT /api/products/:id
// @desc    Update a product (Admin)
// @access  Private (Admin only)
router.put('/:id', isAdmin, async (req, res) => {
  try {
    const existingProduct = await Product.findOne({ id: req.params.id });

    const updatePayload = {
      ...req.body,
      nutritionInfo: buildNutritionInfo({
        name: req.body?.name || existingProduct?.name,
        category: req.body?.category || existingProduct?.category,
        nutritionInfo: req.body?.nutritionInfo || existingProduct?.nutritionInfo
      })
    };

    const product = await Product.findOneAndUpdate(
      { id: req.params.id },
      updatePayload,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    console.log(`✅ Updated product: ${product.name}`);
    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(400).json({ message: 'Error updating product', error: error.message });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete a product (Admin)
// @access  Private (Admin only)
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ id: req.params.id });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    console.log(`🗑️ Deleted product: ${product.name}`);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   POST /api/products/:id/reviews
// @desc    Add a review to a product
// @access  Private (requires user to be logged in)
router.post('/:id/reviews', async (req, res) => {
  try {
    const { rating, comment, userClerkId, userName, name } = req.body;
    const reviewerName = name || userName; // Accept both 'name' and 'userName'
    
    // Validate required fields
    if (!userClerkId || !reviewerName || !rating || !comment) {
      return res.status(400).json({ message: 'All fields are required (userClerkId, name, rating, comment)' });
    }
    
    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    
    // Verify user exists in database using userClerkId
    const user = await User.findOne({ clerkId: userClerkId });
    if (!user) {
      return res.status(401).json({ message: 'User not found. Please sign in again.' });
    }
    
    // Find product by custom id field
    const product = await Product.findOne({ id: req.params.id });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check if user already reviewed this product
    const alreadyReviewed = product.reviews.find(r => r.userClerkId === userClerkId);
    if (alreadyReviewed) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }
    
    // Create new review object matching MongoDB schema
    const review = {
      user: user._id,
      userClerkId,
      name: reviewerName,
      rating: Number(rating),
      comment,
      createdAt: new Date()
    };
    
    // Push review to reviews array (embedded in product)
    product.reviews.push(review);
    
    // Update numReviews count
    product.numReviews = product.reviews.length;
    
    // Calculate new average rating
    const totalRatings = product.reviews.reduce((sum, r) => sum + r.rating, 0);
    product.rating = Math.round((totalRatings / product.reviews.length) * 10) / 10;
    
    // CRUCIAL: Save to MongoDB
    await product.save();
    
    // Also save to separate Reviews collection for easy viewing
    const separateReview = new Review({
      product: product.id,
      productName: product.name,
      user: user._id,
      userClerkId,
      name: reviewerName,
      rating: Number(rating),
      comment
    });
    await separateReview.save();
    
    console.log(`⭐ Review saved to MongoDB for product: ${product.name} by ${reviewerName}`);
    console.log(`   New rating: ${product.rating}, Total reviews: ${product.numReviews}`);
    
    res.status(201).json({ 
      message: 'Review added successfully', 
      review: review,
      averageRating: product.rating,
      numReviews: product.numReviews
    });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   GET /api/products/:id/reviews
// @desc    Get all reviews for a product
// @access  Public
router.get('/:id/reviews', async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.id }).populate('reviews.user', 'name email');
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Sort reviews by newest first
    const sortedReviews = [...product.reviews].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    res.json({
      reviews: sortedReviews,
      averageRating: product.rating,
      numReviews: product.numReviews
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// @route   PUT /api/products/:id/archive
// @desc    Archive a product (soft delete)
// @access  Private (Admin only)
router.put('/:id/archive', isAdmin, async (req, res) => {
  try {
    const { archivedBy } = req.body;
    
    const product = await Product.findOne({ id: req.params.id });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    product.isArchived = true;
    product.archivedAt = new Date();
    product.archivedBy = archivedBy || 'Admin';
    await product.save();
    
    console.log(`📦 Product archived: ${product.name}`);
    res.json({ success: true, message: 'Product archived', product });
  } catch (error) {
    console.error('Error archiving product:', error);
    res.status(500).json({ message: 'Error archiving product', error: error.message });
  }
});

// @route   PUT /api/products/:id/restore
// @desc    Restore an archived product
// @access  Private (Admin only)
router.put('/:id/restore', isAdmin, async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.id });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    product.isArchived = false;
    product.archivedAt = null;
    product.archivedBy = null;
    await product.save();
    
    console.log(`♻️ Product restored: ${product.name}`);
    res.json({ success: true, message: 'Product restored', product });
  } catch (error) {
    console.error('Error restoring product:', error);
    res.status(500).json({ message: 'Error restoring product', error: error.message });
  }
});

// @route   GET /api/products/:id/related
// @desc    Get related products based on nutrition similarity
// @access  Public
router.get('/:id/related', async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    const product = await Product.findOne({ id: req.params.id });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Get nutrition-similar products
    let related = [];

    if (product.nutritionInfo && product.nutritionInfo.calories > 0) {
      // Use nutrition-based similarity
      related = await nutritionService.getSimilarNutritionProducts(req.params.id, parseInt(limit));
    }

    // If not enough nutrition-similar products, fall back to category-based
    if (related.length < parseInt(limit)) {
      const existingIds = related.map(r => r.id);
      const remaining = parseInt(limit) - related.length;

      const categoryProducts = await Product.find({
        id: { $nin: [req.params.id, ...existingIds] },
        category: product.category,
        isArchived: { $ne: true }
      })
      .sort({ rating: -1 })
      .limit(remaining);

      related = [...related, ...categoryProducts];
    }

    // If still not enough, get from other categories
    if (related.length < parseInt(limit)) {
      const existingIds = related.map(r => r.id);
      const remaining = parseInt(limit) - related.length;

      const additional = await Product.find({
        id: { $nin: [req.params.id, ...existingIds] },
        isArchived: { $ne: true }
      })
      .sort({ featured: -1, rating: -1 })
      .limit(remaining);

      related = [...related, ...additional];
    }

    res.json(related);
  } catch (error) {
    console.error('Error fetching related products:', error);
    res.status(500).json({ message: 'Error fetching related products', error: error.message });
  }
});

// @route   POST /api/products/bulk-import
// @desc    Bulk import products from CSV data
// @access  Private (Admin only)
router.post('/bulk-import', isAdmin, async (req, res) => {
  try {
    const { products } = req.body;
    
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'Products array is required' });
    }
    
    const results = {
      success: [],
      failed: []
    };
    
    for (const productData of products) {
      try {
        // Generate unique ID
        const productId = productData.id || `product-${productData.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
        
        // Check if product already exists
        const existing = await Product.findOne({ 
          $or: [{ id: productId }, { name: productData.name }] 
        });
        
        if (existing) {
          results.failed.push({ name: productData.name, reason: 'Product already exists' });
          continue;
        }
        
        const resolvedCategory = productData.category || 'cashews';
        const resolvedName = productData.name;

        const product = new Product({
          id: productId,
          name: resolvedName,
          price: parseFloat(productData.price) || 0,
          stock: parseInt(productData.stock) || 50,
          category: resolvedCategory,
          description: productData.description || `Premium quality ${resolvedName}`,
          image: productData.image ? [productData.image] : ['./images/premium.jpg'],
          featured: productData.featured === 'true' || productData.featured === true,
          shipping: productData.shipping !== 'false' && productData.shipping !== false,
          company: "Sawaikar's",
          nutritionInfo: buildNutritionInfo({
            name: resolvedName,
            category: resolvedCategory,
            nutritionInfo: productData.nutritionInfo
          })
        });
        
        await product.save();
        results.success.push(productData.name);
      } catch (err) {
        results.failed.push({ name: productData.name || 'Unknown', reason: err.message });
      }
    }
    
    console.log(`📦 Bulk import: ${results.success.length} success, ${results.failed.length} failed`);
    res.json({
      success: true,
      message: `Imported ${results.success.length} products`,
      results
    });
  } catch (error) {
    console.error('Error in bulk import:', error);
    res.status(500).json({ message: 'Error in bulk import', error: error.message });
  }
});

// @route   GET /api/products/archived
// @desc    Get all archived products (Admin)
// @access  Private (Admin only)
router.get('/archived/list', isAdmin, async (req, res) => {
  try {
    const products = await Product.find({ isArchived: true })
      .sort({ archivedAt: -1 });
    
    res.json(products);
  } catch (error) {
    console.error('Error fetching archived products:', error);
    res.status(500).json({ message: 'Error fetching archived products', error: error.message });
  }
});

// @route   POST /api/products/:id/view
// @desc    Record product view and update user's recently viewed
// @access  Public
router.post('/:id/view', async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Increment view count
    const product = await Product.findOneAndUpdate(
      { id: req.params.id },
      { $inc: { viewCount: 1 } },
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Update user's recently viewed if userId provided
    if (userId) {
      try {
        const user = await User.findOne({ clerkId: userId });
        if (user) {
          await user.addRecentlyViewed(req.params.id);
        }
      } catch (userError) {
        console.error('Error updating recently viewed:', userError);
        // Don't fail the request
      }
    }
    
    res.json({ success: true, viewCount: product.viewCount });
  } catch (error) {
    console.error('Error recording view:', error);
    res.status(500).json({ message: 'Error recording view', error: error.message });
  }
});

module.exports = router;

// ============================================================================
// STOCK MANAGEMENT ENDPOINTS (Admin Only)
// ============================================================================

const StockManagementService = require('../services/stockManagementService');

/**
 * GET /api/products/stock/alerts
 * Get all products with low or out-of-stock items (ADMIN ONLY)
 * Returns array of low stock alerts
 */
router.get('/stock/alerts', isAdmin, async (req, res) => {
  try {
    const alerts = await StockManagementService.getLowStockAlerts();
    
    const grouped = {
      outOfStock: alerts.filter(a => a.status === 'OUT_OF_STOCK'),
      lowStock: alerts.filter(a => a.status === 'LOW_STOCK')
    };
    
    res.json({
      success: true,
      totalAlerts: alerts.length,
      outOfStockCount: grouped.outOfStock.length,
      lowStockCount: grouped.lowStock.length,
      alerts: grouped
    });
  } catch (error) {
    console.error('❌ Error fetching stock alerts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch stock alerts',
      error: error.message 
    });
  }
});

/**
 * POST /api/products/:productId/restock
 * Restock a product or variant (ADMIN ONLY)
 * Body: { quantity: number, weight?: string, reason?: string }
 * Returns updated stock information
 */
router.post('/:productId/restock', isAdmin, async (req, res) => {
  try {
    const { quantity, weight, reason } = req.body;
    
    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive number'
      });
    }
    
    // Admin email from session/auth
    const adminEmail = req.adminEmail || 'admin';
    
    const result = await StockManagementService.restockProduct(
      req.params.productId,
      quantity,
      weight,
      reason || 'Admin restock from dashboard',
      adminEmail
    );
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json({
      success: true,
      message: result.message,
      productName: result.product,
      newStock: result.newStock
    });
  } catch (error) {
    console.error('❌ Error restocking product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restock product',
      error: error.message
    });
  }
});

/**
 * GET /api/products/:productId/stock-history
 * Get stock movement history for a product (ADMIN ONLY)
 * Query: weight (optional) for variant history
 * Returns array of stock transactions
 */
router.get('/:productId/stock-history', isAdmin, async (req, res) => {
  try {
    const { weight } = req.query;
    
    const history = await StockManagementService.getStockHistory(
      req.params.productId,
      weight
    );
    
    if (!history.length) {
      return res.json({
        success: true,
        message: 'No stock history found',
        history: []
      });
    }
    
    // Sort by timestamp descending (newest first)
    history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json({
      success: true,
      count: history.length,
      weight: weight || 'all variants',
      history: history
    });
  } catch (error) {
    console.error('❌ Error fetching stock history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stock history',
      error: error.message
    });
  }
});

/**
 * GET /api/products/stock/status/:productId
 * Get current stock status for a product (ALL USERS)
 * Returns current stock levels and availability
 */
router.get('/stock/status/:productId', async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.productId });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    const status = {
      productId: product.id,
      productName: product.name,
      mainStock: product.stock,
      isOutOfStock: product.stock === 0,
      isLowStock: product.stock <= (product.reorderLevel || 5),
      variants: product.variants.map(v => ({
        weight: v.weight,
        stock: v.stock,
        isOutOfStock: v.stock === 0,
        isLowStock: v.stock <= (v.reorderLevel || 3)
      }))
    };
    
    res.json({
      success: true,
      status: status
    });
  } catch (error) {
    console.error('❌ Error fetching stock status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stock status',
      error: error.message
    });
  }
});

module.exports = router;
