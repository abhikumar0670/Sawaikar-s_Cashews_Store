const express = require('express');
const router = express.Router();
const Bundle = require('../models/Bundle');
const Product = require('../models/Product');
const { requireAuth, requireAdmin } = require('../middleware/clerkAuth');

// @route   GET /api/bundles
// @desc    Get all active bundles
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { type, featured } = req.query;

    let bundles;

    if (featured === 'true') {
      bundles = await Bundle.getFeatured();
    } else {
      bundles = await Bundle.getActive(type || null);
    }

    // Enrich with product details
    const enrichedBundles = await Promise.all(bundles.map(async (bundle) => {
      const productIds = bundle.products.map(p => p.productId);
      const products = await Product.find({ id: { $in: productIds } });

      return {
        ...bundle.toObject(),
        productDetails: bundle.products.map(bp => {
          const product = products.find(p => p.id === bp.productId);
          return {
            ...bp,
            product: product ? {
              id: product.id,
              name: product.name,
              price: product.price,
              image: product.image[0]
            } : null
          };
        }).filter(p => p.product !== null)
      };
    }));

    res.json({
      success: true,
      data: enrichedBundles
    });
  } catch (error) {
    console.error('Get bundles error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bundles'
    });
  }
});

// @route   GET /api/bundles/:bundleId
// @desc    Get single bundle by ID
// @access  Public
router.get('/:bundleId', async (req, res) => {
  try {
    const { bundleId } = req.params;

    const bundle = await Bundle.findOne({ bundleId });

    if (!bundle) {
      return res.status(404).json({
        success: false,
        error: 'Bundle not found'
      });
    }

    // Track view
    bundle.viewCount += 1;
    await bundle.save();

    // Get product details
    const productIds = bundle.products.map(p => p.productId);
    const products = await Product.find({ id: { $in: productIds } });

    const enrichedBundle = {
      ...bundle.toObject(),
      productDetails: bundle.products.map(bp => {
        const product = products.find(p => p.id === bp.productId);
        return {
          ...bp,
          product: product || null
        };
      }).filter(p => p.product !== null)
    };

    res.json({
      success: true,
      data: enrichedBundle
    });
  } catch (error) {
    console.error('Get bundle error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bundle'
    });
  }
});

// @route   POST /api/bundles
// @desc    Create new bundle (admin only)
// @access  Admin
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      products,
      bundlePrice,
      image,
      bundleType,
      theme,
      tags,
      validFrom,
      validUntil,
      isFeatured
    } = req.body;

    if (!name || !products || products.length === 0 || !bundlePrice) {
      return res.status(400).json({
        success: false,
        error: 'Name, products, and bundlePrice are required'
      });
    }

    // Calculate original price from products
    const productIds = products.map(p => p.productId);
    const productDocs = await Product.find({ id: { $in: productIds } });

    let originalPrice = 0;
    products.forEach(bp => {
      const product = productDocs.find(p => p.id === bp.productId);
      if (product) {
        originalPrice += product.price * (bp.quantity || 1);
      }
    });

    // Generate bundle ID
    const bundleId = `bundle-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString(36)}`;

    const bundle = await Bundle.create({
      bundleId,
      name,
      description,
      products,
      originalPrice,
      bundlePrice,
      image,
      bundleType: bundleType || 'curated',
      theme,
      tags,
      validFrom,
      validUntil,
      isFeatured: isFeatured || false
    });

    res.status(201).json({
      success: true,
      data: bundle
    });
  } catch (error) {
    console.error('Create bundle error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create bundle'
    });
  }
});

// @route   PUT /api/bundles/:bundleId
// @desc    Update bundle (admin only)
// @access  Admin
router.put('/:bundleId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { bundleId } = req.params;
    const updates = req.body;

    // Recalculate original price if products changed
    if (updates.products) {
      const productIds = updates.products.map(p => p.productId);
      const productDocs = await Product.find({ id: { $in: productIds } });

      let originalPrice = 0;
      updates.products.forEach(bp => {
        const product = productDocs.find(p => p.id === bp.productId);
        if (product) {
          originalPrice += product.price * (bp.quantity || 1);
        }
      });
      updates.originalPrice = originalPrice;
    }

    const bundle = await Bundle.findOneAndUpdate(
      { bundleId },
      updates,
      { new: true }
    );

    if (!bundle) {
      return res.status(404).json({
        success: false,
        error: 'Bundle not found'
      });
    }

    res.json({
      success: true,
      data: bundle
    });
  } catch (error) {
    console.error('Update bundle error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update bundle'
    });
  }
});

// @route   DELETE /api/bundles/:bundleId
// @desc    Delete/deactivate bundle (admin only)
// @access  Admin
router.delete('/:bundleId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { bundleId } = req.params;

    // Soft delete by deactivating
    const bundle = await Bundle.findOneAndUpdate(
      { bundleId },
      { isActive: false },
      { new: true }
    );

    if (!bundle) {
      return res.status(404).json({
        success: false,
        error: 'Bundle not found'
      });
    }

    res.json({
      success: true,
      message: 'Bundle deactivated successfully'
    });
  } catch (error) {
    console.error('Delete bundle error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete bundle'
    });
  }
});

// @route   POST /api/bundles/seed
// @desc    Seed sample bundles (for testing)
// @access  Admin
router.post('/seed', requireAuth, requireAdmin, async (req, res) => {
  try {
    const sampleBundles = [
      {
        bundleId: 'bundle-diwali-special',
        name: 'Diwali Gift Hamper',
        description: 'Premium gift hamper perfect for Diwali celebrations. Contains our finest cashews and dry fruits.',
        products: [
          { productId: 'sawaikar-premium-w240', quantity: 1 },
          { productId: 'sawaikar-roasted-salted', quantity: 1 },
          { productId: 'sawaikar-honey-cashews', quantity: 1 }
        ],
        originalPrice: 294700,
        bundlePrice: 249900,
        bundleType: 'seasonal',
        theme: 'Diwali Special',
        tags: ['diwali', 'gift', 'festival'],
        isFeatured: true,
        image: ['./images/diwali-hamper.jpg']
      },
      {
        bundleId: 'bundle-health-pack',
        name: 'Healthy Snacking Bundle',
        description: 'Perfect healthy snacking combo for health-conscious customers.',
        products: [
          { productId: 'sawaikar-raw-organic', quantity: 1 },
          { productId: 'sawaikar-premium-w320', quantity: 1 }
        ],
        originalPrice: 179800,
        bundlePrice: 159900,
        bundleType: 'curated',
        theme: 'Health Pack',
        tags: ['healthy', 'organic', 'snacking'],
        isFeatured: true,
        image: ['./images/health-bundle.jpg']
      },
      {
        bundleId: 'bundle-party-pack',
        name: 'Party Pack',
        description: 'Perfect for parties and gatherings. Mix of flavored and roasted cashews.',
        products: [
          { productId: 'sawaikar-roasted-salted', quantity: 2 },
          { productId: 'sawaikar-masala-cashews', quantity: 1 },
          { productId: 'sawaikar-pepper-cashews', quantity: 1 }
        ],
        originalPrice: 387600,
        bundlePrice: 329900,
        bundleType: 'curated',
        theme: 'Party Pack',
        tags: ['party', 'snacks', 'flavored'],
        isFeatured: false,
        image: ['./images/party-pack.jpg']
      }
    ];

    // Upsert bundles
    for (const bundle of sampleBundles) {
      await Bundle.findOneAndUpdate(
        { bundleId: bundle.bundleId },
        bundle,
        { upsert: true, new: true }
      );
    }

    res.json({
      success: true,
      message: `Seeded ${sampleBundles.length} bundles`
    });
  } catch (error) {
    console.error('Seed bundles error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to seed bundles'
    });
  }
});

module.exports = router;
