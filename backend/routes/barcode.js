const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// @route   GET /api/barcode/lookup/:code
// @desc    Look up product by barcode for in-store checkout
// @access  Public
router.get('/lookup/:code', async (req, res) => {
  let product = null;
  let allProducts = [];

  try {
    const { code } = req.params;

    if (!code || code.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Barcode is required'
      });
    }

    const barcodeCode = code.trim().toUpperCase();
    console.log(`[BARCODE LOOKUP] Scanning barcode: ${barcodeCode}`);

    // Method 1: Try with exact match first (most efficient)
    try {
      product = await Product.findOne({
        'variants.barcode': barcodeCode,
        isArchived: { $ne: true }
      }).lean();
      
      if (product) {
        console.log(`[BARCODE LOOKUP] Found via exact match: ${product.name}`);
      }
    } catch (err) {
      console.log(`[BARCODE LOOKUP] Method 1 (exact match) failed:`, err.message);
    }

    // Method 2: Try with MongoDB regex query (case-insensitive)
    if (!product) {
      try {
        product = await Product.findOne({
          'variants.barcode': { $regex: `^${barcodeCode}$`, $options: 'i' },
          isArchived: { $ne: true }
        }).lean();

        if (product) {
          console.log(`[BARCODE LOOKUP] Found via regex match: ${product.name}`);
        } else {
          console.log(`[BARCODE LOOKUP] Query method 2 failed, trying method 3...`);
        }
      } catch (err) {
        console.log(`[BARCODE LOOKUP] Method 2 (regex) failed:`, err.message);
      }
    }
    
    // Method 3: Manual search through all products
    if (!product) {
      try {
        console.log(`[BARCODE LOOKUP] Trying method 3 (manual search)...`);
        allProducts = await Product.find({ isArchived: { $ne: true } })
          .select('_id id name variants image price description')
          .lean();
        
        console.log(`[DEBUG] Total products to search: ${allProducts.length}`);
        
        for (const prod of allProducts) {
          if (!prod.variants || prod.variants.length === 0) continue;
          
          const matchedVariant = prod.variants.find(v => 
            v.barcode && v.barcode.toUpperCase().trim() === barcodeCode.toUpperCase().trim()
          );
          
          if (matchedVariant) {
            product = prod;
            console.log(`[BARCODE LOOKUP] Found via manual search: ${prod.name}`);
            break;
          }
        }
        
        if (!product) {
          console.log(`[BARCODE LOOKUP] Product not found after searching ${allProducts.length} products`);
          
          // Debug: Show sample barcodes from first 5 products
          console.log(`[DEBUG] Sample barcodes from database:`);
          for (let i = 0; i < Math.min(5, allProducts.length); i++) {
            const prods = allProducts[i];
            if (prods.variants?.length > 0) {
              console.log(`  Product: ${prods.name}, Variants: ${prods.variants.length}`);
              prods.variants.forEach(v => {
                console.log(`    - Weight: ${v.weight}, Barcode: "${v.barcode || 'EMPTY/NULL'}"`);
              });
            } else {
              console.log(`  Product: ${prods.name}, NO VARIANTS`);
            }
          }
          console.log(`[DEBUG] Scanned barcode was: "${barcodeCode}"`);
        }
      } catch (err) {
        console.error(`[BARCODE LOOKUP] Method 3 (manual search) error:`, err.message);
        console.error('Stack trace:', err.stack);
      }
    }
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found for this barcode'
      });
    }

    // Find the matching variant (case-insensitive and trim)
    const variant = product.variants.find(v => 
      v.barcode && v.barcode.toUpperCase().trim() === barcodeCode.toUpperCase().trim()
    );

    if (!variant) {
      console.log(`[BARCODE LOOKUP] Variant not found for barcode: ${barcodeCode} in product: ${product.name}`);
      console.log(`[DEBUG] Available variants:`, product.variants.map(v => v.barcode));
      
      return res.status(404).json({
        success: false,
        message: 'Product not found for this barcode'
      });
    }

    // Validate variant has required fields
    if (!variant.weight || variant.price === undefined) {
      console.log(`[BARCODE LOOKUP] Variant missing required fields`);
      return res.status(400).json({
        success: false,
        message: 'Product not found for this barcode'
      });
    }

    // Check stock
    if (variant.stock <= 0) {
      console.log(`[BARCODE LOOKUP] Out of stock: ${product.name} (${variant.weight})`);
      return res.status(400).json({
        success: false,
        message: `${product.name} (${variant.weight}) is out of stock`
      });
    }

    console.log(`[BARCODE LOOKUP] SUCCESS: ${product.name} (${variant.weight}) - Stock: ${variant.stock}, Price: ₹${variant.price}`);

    res.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        price: variant.price,
        image: product.image || product.images?.[0] || './images/premium.jpg',
        selectedWeight: variant.weight,
        stock: variant.stock,
        colors: product.colors,
        description: product.description,
        barcode: barcodeCode,
        sku: variant.sku
      }
    });
  } catch (error) {
    console.error('[BARCODE LOOKUP] Fatal error:', error.message);
    console.error('[ERROR STACK]', error.stack);
    res.status(500).json({
      success: false,
      message: 'Product not found for this barcode'
    });
  }
});

// @route   GET /api/barcode/validate/:code
// @desc    Validate barcode format
// @access  Public
router.get('/validate/:code', async (req, res) => {
  const { code } = req.params;

  // Check if it matches Sawaikar's barcode format: SAW-{productId}-{weight}
  const isValidFormat = /^SAW-[a-zA-Z0-9-]+-\d+(g|kg)$/i.test(code);

  res.json({
    valid: isValidFormat,
    format: 'SAW-{productId}-{weight}',
    example: 'SAW-sawaikar-premium-250g'
  });
});

// @route   POST /api/barcode/generate
// @desc    Generate barcodes for a product's variants (admin use)
// @access  Admin
router.post('/generate/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findOne({ id: productId });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Generate barcodes for variants that don't have one
    let updated = false;
    product.variants.forEach(variant => {
      if (!variant.barcode) {
        variant.barcode = `SAW-${product.id}-${variant.weight}`;
        updated = true;
      }
    });

    if (updated) {
      await product.save();
    }

    res.json({
      success: true,
      message: 'Barcodes generated successfully',
      product: {
        id: product.id,
        name: product.name,
        variants: product.variants.map(v => ({
          weight: v.weight,
          barcode: v.barcode
        }))
      }
    });
  } catch (error) {
    console.error('Barcode generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during barcode generation'
    });
  }
});

module.exports = router;
