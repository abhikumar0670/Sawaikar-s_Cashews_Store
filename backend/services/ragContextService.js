const { getVectorService } = require('./vectorService');
const Product = require('../models/Product');
const Review = require('../models/Review');
const Order = require('../models/Order');

/**
 * RAG Context Service - Retrieves relevant context from vector database
 * Combines product data, FAQs, reviews, and user order history
 */
class RagContextService {
  /**
   * Retrieve context for a user query
   * @param {string} userMessage - User's question
   * @param {string} userId - Optional user ID for personalized context
   * @returns {object} - Structured context with products, FAQs, reviews, orders
   */
  static async retrieveContext(userMessage, userId = null) {
    try {
      console.log(`[RAG Context] 🔍 Retrieving context for: "${userMessage}"`);

      const vectorService = await getVectorService();

      if (!vectorService.initialized) {
        console.warn('[RAG Context] ⚠️ Vector service not initialized, returning empty context');
        return this.getEmptyContext();
      }

      // Parallel searches for different types of content
      const [productResults, faqResults, reviewResults] = await Promise.all([
        vectorService.searchVectors(userMessage, 5, { type: 'product' }),
        vectorService.searchVectors(userMessage, 3, { type: 'faq' }),
        vectorService.searchVectors(userMessage, 3, { type: 'review' }),
      ]);

      console.log(`[RAG Context] ✅ Retrieved - Products: ${productResults.length}, FAQs: ${faqResults.length}, Reviews: ${reviewResults.length}`);

      // Format and enrich context
      const context = {
        relevantProducts: await this.formatProductResults(productResults),
        relevantFAQs: this.formatFAQResults(faqResults),
        relevantReviews: await this.formatReviewResults(reviewResults),
        userOrders: userId ? await this.getUserRecentOrders(userId) : [],
        sources: {
          products: productResults.length,
          faqs: faqResults.length,
          reviews: reviewResults.length,
        },
      };

      return context;
    } catch (error) {
      console.error('[RAG Context] ❌ Error retrieving context:', error.message);
      return this.getEmptyContext();
    }
  }

  /**
   * Format product search results with full product data
   */
  static async formatProductResults(results) {
    try {
      const products = await Promise.all(
        results.map(async (result) => {
          try {
            // Try to fetch full product data from MongoDB
            if (result.metadata?.productId) {
              const fullProduct = await Product.findById(result.metadata.productId).lean();
              if (fullProduct) {
                return {
                  id: fullProduct._id,
                  name: fullProduct.name,
                  category: fullProduct.category,
                  price: fullProduct.price,
                  originalPrice: fullProduct.originalPrice,
                  discount: fullProduct.discount,
                  description: fullProduct.description,
                  image: fullProduct.image,
                  rating: fullProduct.rating || 4.5,
                  stock: fullProduct.stock,
                  nutrition: fullProduct.nutrition || {},
                  searchScore: result.score,
                };
              }
            }

            // Fallback to metadata if product not found in DB
            return {
              id: result.metadata?.productId || result.id,
              name: result.metadata?.name || 'Product',
              category: result.metadata?.category || 'General',
              price: result.metadata?.price || 0,
              description: result.text,
              searchScore: result.score,
            };
          } catch (err) {
            console.warn('[RAG Context] ⚠️ Error formatting product:', err.message);
            return null;
          }
        })
      );

      return products.filter((p) => p !== null);
    } catch (error) {
      console.error('[RAG Context] ❌ Error formatting products:', error.message);
      return [];
    }
  }

  /**
   * Format FAQ results
   */
  static formatFAQResults(results) {
    return results.map((result) => ({
      id: result.id,
      category: result.metadata?.category || 'General',
      question: result.metadata?.question || 'FAQ',
      answer: result.metadata?.answer || result.text,
      source: 'FAQ',
      searchScore: result.score,
    }));
  }

  /**
   * Format review search results
   */
  static async formatReviewResults(results) {
    try {
      const reviews = await Promise.all(
        results.map(async (result) => {
          try {
            if (result.metadata?.reviewId) {
              const fullReview = await Review.findById(result.metadata.reviewId).lean();
              if (fullReview) {
                return {
                  id: fullReview._id,
                  productName: result.metadata?.productName || fullReview.productName,
                  productId: fullReview.productId,
                  rating: fullReview.rating,
                  comment: fullReview.comment,
                  userName: fullReview.userName || 'Customer',
                  searchScore: result.score,
                };
              }
            }

            return {
              id: result.id,
              productName: result.metadata?.productName || 'Product',
              rating: result.metadata?.rating || 5,
              comment: result.text,
              userName: result.metadata?.userName || 'Customer',
              searchScore: result.score,
            };
          } catch (err) {
            console.warn('[RAG Context] ⚠️ Error formatting review:', err.message);
            return null;
          }
        })
      );

      return reviews.filter((r) => r !== null);
    } catch (error) {
      console.error('[RAG Context] ❌ Error formatting reviews:', error.message);
      return [];
    }
  }

  /**
   * Get user's recent orders for personalized context
   */
  static async getUserRecentOrders(userId) {
    try {
      const recentOrders = await Order.find({ userId }).sort({ createdAt: -1 }).limit(3).lean();

      return recentOrders.map((order) => ({
        id: order._id,
        orderId: order.orderId,
        status: order.status,
        totalAmount: order.totalAmount,
        items: order.items?.map((item) => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
        })) || [],
        createdAt: order.createdAt,
      }));
    } catch (error) {
      console.warn('[RAG Context] ⚠️ Error fetching user orders:', error.message);
      return [];
    }
  }

  /**
   * Format context for prompt injection
   * Returns a string to be added to the chatbot system prompt
   */
  static formatContextForPrompt(context) {
    let contextString = '';

    if (context.relevantProducts && context.relevantProducts.length > 0) {
      contextString += '\n## Relevant Products Found:\n';
      context.relevantProducts.forEach((product) => {
        contextString += `- **${product.name}** (${product.category}): ₹${product.price}${
          product.originalPrice ? ` (was ₹${product.originalPrice})` : ''
        }${product.discount ? ` - ${product.discount}% OFF` : ''}`;

        if (product.stock > 0) {
          contextString += ` - In Stock`;
        } else {
          contextString += ` - Out of Stock`;
        }

        if (product.rating) {
          contextString += ` - Rating: ${product.rating}/5`;
        }

        contextString += `\n  ${product.description || ''}\n`;
      });
    }

    if (context.relevantFAQs && context.relevantFAQs.length > 0) {
      contextString += '\n## Relevant FAQs:\n';
      context.relevantFAQs.forEach((faq) => {
        contextString += `- **${faq.question}** (${faq.category})\n  Answer: ${faq.answer}\n`;
      });
    }

    if (context.relevantReviews && context.relevantReviews.length > 0) {
      contextString += '\n## Customer Reviews & Feedback:\n';
      context.relevantReviews.forEach((review) => {
        contextString += `- **${review.productName}**: ${review.rating}/5 stars - "${review.comment}" - ${review.userName}\n`;
      });
    }

    if (context.userOrders && context.userOrders.length > 0) {
      contextString += '\n## Customer Order History (for personalization):\n';
      context.userOrders.forEach((order) => {
        contextString += `- Order #${order.orderId} (${order.status}): Ordered ${order.items.map((i) => i.name).join(', ')}\n`;
      });
    }

    return contextString;
  }

  /**
   * Get empty context object
   */
  static getEmptyContext() {
    return {
      relevantProducts: [],
      relevantFAQs: [],
      relevantReviews: [],
      userOrders: [],
      sources: {
        products: 0,
        faqs: 0,
        reviews: 0,
      },
    };
  }
}

module.exports = RagContextService;
