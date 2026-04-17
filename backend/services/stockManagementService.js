/**
 * Stock Management Service
 * Handles all inventory operations: deductions, restocks, and alerts
 */

const Product = require('../models/Product');
const Order = require('../models/Order');

class StockManagementService {
  /**
   * Deduct stock for order items
   * @param {Array} items - Order items with productId, weight/variant, quantity
   * @param {String} orderId - Order ID for tracking
   * @returns {Object} - { success: boolean, message: string, lowStockProducts: Array }
   */
  static async deductStockForOrder(items, orderId) {
    const lowStockProducts = [];
    const deductedProducts = [];
    
    try {
      for (const item of items) {
        const itemId = item.productId || item.id;
        
        // Skip stock deduction for bundle items (they are conceptual combinations)
        // Bundle items are identified by their product IDs starting with 'bundle-'
        if (itemId && itemId.startsWith('bundle-')) {
          console.log(`⏭️  Skipping stock deduction for bundle item: ${itemId}`);
          continue;
        }
        
        const product = await Product.findOne({ id: itemId });
        
        if (!product) {
          console.warn(`⚠️ Product not found for stock deduction: ${itemId}`);
          continue;
        }

        const quantity = item.quantity || 1;
        const weight = item.weight || item.selectedWeight;
        
        // If product has variants, deduct from specific variant
        if (product.variants && product.variants.length > 0 && weight) {
          const variantIndex = product.variants.findIndex(v => v.weight === weight);
          
          if (variantIndex !== -1) {
            const variant = product.variants[variantIndex];
            const previousStock = variant.stock;
            
            // Check stock availability
            if (variant.stock < quantity) {
              return {
                success: false,
                message: `Insufficient stock for ${product.name} (${weight}). Available: ${variant.stock}, Requested: ${quantity}`,
                product: product.name,
                weight: weight
              };
            }
            
            // Deduct stock
            variant.stock -= quantity;
            
            // Add to stock history
            if (!variant.stockHistory) {
              variant.stockHistory = [];
            }
            variant.stockHistory.push({
              action: 'purchase',
              quantity: quantity,
              orderId: orderId,
              previousStock: previousStock,
              newStock: variant.stock,
              timestamp: new Date()
            });
            
            // Check if low stock
            const reorderLevel = variant.reorderLevel || 3;
            if (variant.stock <= reorderLevel && previousStock > reorderLevel) {
              lowStockProducts.push({
                productId: product.id,
                productName: product.name,
                weight: weight,
                currentStock: variant.stock,
                reorderLevel: reorderLevel,
                type: 'variant'
              });
            }
            
            deductedProducts.push({ productId: product.id, weight, quantity });
          }
        } else {
          // No variant specified, deduct from main stock
          const previousStock = product.stock;
          
          // Check stock availability
          if (product.stock < quantity) {
            return {
              success: false,
              message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${quantity}`,
              product: product.name
            };
          }
          
          // Deduct stock
          product.stock -= quantity;
          
          // Add to stock history
          if (!product.stockHistory) {
            product.stockHistory = [];
          }
          product.stockHistory.push({
            action: 'purchase',
            quantity: quantity,
            orderId: orderId,
            previousStock: previousStock,
            newStock: product.stock,
            timestamp: new Date()
          });
          
          // Check if low stock
          const reorderLevel = product.reorderLevel || 5;
          if (product.stock <= reorderLevel && previousStock > reorderLevel) {
            lowStockProducts.push({
              productId: product.id,
              productName: product.name,
              currentStock: product.stock,
              reorderLevel: reorderLevel,
              type: 'main'
            });
          }
          
          deductedProducts.push({ productId: product.id, quantity });
        }
        
        // Save product with new stock
        await product.save();
      }
      
      return {
        success: true,
        message: `Successfully deducted stock for order ${orderId}`,
        deductedProducts: deductedProducts,
        lowStockProducts: lowStockProducts
      };
    } catch (error) {
      console.error('❌ Stock deduction error:', error.message);
      return {
        success: false,
        message: `Failed to deduct stock: ${error.message}`,
        error: error
      };
    }
  }

  /**
   * Restock a product variant or main stock
   * @param {String} productId - Product ID
   * @param {Number} quantity - Quantity to add
   * @param {String} weight - Variant weight (optional)
   * @param {String} reason - Restock reason
   * @param {String} changedByAdmin - Admin email/ID
   * @returns {Object} - Stock update result
   */
  static async restockProduct(productId, quantity, weight = null, reason = 'admin restock', changedByAdmin = 'admin') {
    try {
      const product = await Product.findOne({ id: productId });
      
      if (!product) {
        return {
          success: false,
          message: `Product not found: ${productId}`
        };
      }

      if (quantity < 1 || !Number.isFinite(quantity)) {
        return {
          success: false,
          message: 'Quantity must be a positive number'
        };
      }

      let restockMessage = '';
      
      // Restock variant or main product
      if (weight && product.variants && product.variants.length > 0) {
        const variantIndex = product.variants.findIndex(v => v.weight === weight);
        
        if (variantIndex === -1) {
          return {
            success: false,
            message: `Weight ${weight} not found for product ${product.name}`
          };
        }
        
        const variant = product.variants[variantIndex];
        const previousStock = variant.stock;
        variant.stock += quantity;
        
        // Add history
        if (!variant.stockHistory) {
          variant.stockHistory = [];
        }
        variant.stockHistory.push({
          action: 'restock',
          quantity: quantity,
          reason: reason,
          changedBy: changedByAdmin,
          previousStock: previousStock,
          newStock: variant.stock,
          timestamp: new Date()
        });
        
        restockMessage = `Restocked ${product.name} (${weight}): ${previousStock} → ${variant.stock} units (+${quantity})`;
      } else {
        const previousStock = product.stock;
        product.stock += quantity;
        
        // Add history
        if (!product.stockHistory) {
          product.stockHistory = [];
        }
        product.stockHistory.push({
          action: 'restock',
          quantity: quantity,
          reason: reason,
          changedBy: changedByAdmin,
          previousStock: previousStock,
          newStock: product.stock,
          timestamp: new Date()
        });
        
        restockMessage = `Restocked ${product.name}: ${previousStock} → ${product.stock} units (+${quantity})`;
      }
      
      // Update last restocked date
      product.lastRestockedDate = new Date();
      await product.save();
      
      console.log(`✅ ${restockMessage}`);
      
      return {
        success: true,
        message: restockMessage,
        product: product.name,
        newStock: weight 
          ? product.variants.find(v => v.weight === weight).stock 
          : product.stock
      };
    } catch (error) {
      console.error('❌ Restock error:', error.message);
      return {
        success: false,
        message: `Restock failed: ${error.message}`,
        error: error
      };
    }
  }

  /**
   * Get low stock alerts
   * @returns {Array} - Products with low stock
   */
  static async getLowStockAlerts() {
    try {
      const alerts = [];
      const products = await Product.find({ isArchived: { $ne: true } }).select('id name stock reorderLevel variants');
      
      for (const product of products) {
        const reorderLevel = product.reorderLevel || 5;
        
        // Check main stock
        if (product.stock <= reorderLevel && product.stock > 0) {
          alerts.push({
            productId: product.id,
            productName: product.name,
            currentStock: product.stock,
            reorderLevel: reorderLevel,
            status: product.stock === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
            type: 'main'
          });
        } else if (product.stock === 0) {
          alerts.push({
            productId: product.id,
            productName: product.name,
            currentStock: 0,
            reorderLevel: reorderLevel,
            status: 'OUT_OF_STOCK',
            type: 'main'
          });
        }
        
        // Check variant stocks
        if (product.variants && product.variants.length > 0) {
          for (const variant of product.variants) {
            const variantReorderLevel = variant.reorderLevel || 3;
            
            if (variant.stock <= variantReorderLevel) {
              alerts.push({
                productId: product.id,
                productName: product.name,
                weight: variant.weight,
                currentStock: variant.stock,
                reorderLevel: variantReorderLevel,
                status: variant.stock === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
                type: 'variant'
              });
            }
          }
        }
      }
      
      // Sort by severity (out of stock first, then by reorder level)
      alerts.sort((a, b) => {
        if (a.status !== b.status) {
          return a.status === 'OUT_OF_STOCK' ? -1 : 1;
        }
        return a.reorderLevel - b.reorderLevel;
      });
      
      return alerts;
    } catch (error) {
      console.error('❌ Error fetching low stock alerts:', error.message);
      return [];
    }
  }

  /**
   * Get stock history for a product
   * @param {String} productId - Product ID
   * @param {String} weight - Variant weight (optional)
   * @returns {Array} - Stock history
   */
  static async getStockHistory(productId, weight = null) {
    try {
      const product = await Product.findOne({ id: productId });
      
      if (!product) {
        return [];
      }
      
      if (weight && product.variants && product.variants.length > 0) {
        const variant = product.variants.find(v => v.weight === weight);
        return variant && variant.stockHistory ? variant.stockHistory : [];
      }
      
      return product.stockHistory || [];
    } catch (error) {
      console.error('❌ Error fetching stock history:', error.message);
      return [];
    }
  }

  /**
   * Check if sufficient stock available for order
   * @param {Array} items - Order items
   * @returns {Object} - Validation result
   */
  static async validateStockAvailability(items) {
    try {
      for (const item of items) {
        const itemId = item.productId || item.id;
        
        console.log(`[STOCK VALIDATION] Item: ${item.name}, ID: ${itemId}, Type: ${itemId?.startsWith('bundle-') ? 'BUNDLE' : 'PRODUCT'}`);
        
        // Skip stock validation for bundle items (they are conceptual combinations)
        // Bundle items are identified by their product IDs starting with 'bundle-' or have isBundle flag
        if (itemId && itemId.startsWith('bundle-')) {
          console.log(`⏭️  Skipping stock validation for bundle item: ${itemId}`);
          continue;
        }
        
        // Ensure we have a valid product ID
        if (!itemId) {
          return {
            isValid: false,
            message: `Product ID missing for item: ${item.name}`
          };
        }
        
        const product = await Product.findOne({ id: itemId });
        
        if (!product) {
          return {
            isValid: false,
            message: `Product not found: ${itemId}`
          };
        }
        
        const quantity = item.quantity || 1;
        const weight = item.weight || item.selectedWeight;
        
        if (product.variants && product.variants.length > 0 && weight) {
          const variant = product.variants.find(v => v.weight === weight);
          
          if (!variant) {
            return {
              isValid: false,
              message: `Weight ${weight} not available for ${product.name}`
            };
          }
          
          if (variant.stock < quantity) {
            return {
              isValid: false,
              message: `Insufficient stock for ${product.name} (${weight}). Available: ${variant.stock}, Requested: ${quantity}`
            };
          }
        } else {
          if (product.stock < quantity) {
            return {
              isValid: false,
              message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${quantity}`
            };
          }
        }
      }
      
      return {
        isValid: true,
        message: 'All items have sufficient stock'
      };
    } catch (error) {
      console.error('❌ Stock validation error:', error.message);
      return {
        isValid: false,
        message: `Stock validation failed: ${error.message}`
      };
    }
  }
}

module.exports = StockManagementService;
