/**
 * Swagger Configuration for API Documentation
 * Auto-generates beautiful API docs at /api/docs
 * Visit: http://localhost:5000/api/docs
 */

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: "Sawaikar's Cashew Store API",
      version: '2.0.0',
      description: 'Premium e-commerce platform with loyalty program, AI chatbot, and advanced inventory management',
      contact: {
        name: 'Abhishek Kumar',
        email: 'abhikumar0670@gmail.com',
        url: 'https://github.com/abhikumar0670'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://api.sawaikars.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token from Clerk authentication'
        }
      },
      schemas: {
        // Product Schema
        Product: {
          type: 'object',
          required: ['name', 'price', 'category'],
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'Premium Cashews W180' },
            price: { type: 'number', example: 599.99 },
            category: { type: 'string', example: 'premium' },
            description: { type: 'string', example: 'High-quality roasted cashews' },
            stock: { type: 'integer', example: 100 },
            variants: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  weight: { type: 'string', example: '250g' },
                  price: { type: 'number', example: 299 },
                  stock: { type: 'integer', example: 50 }
                }
              }
            },
            featured: { type: 'boolean', example: true },
            images: { type: 'array', items: { type: 'string' } },
            barcode: { type: 'string', example: '1234567890123' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },

        // Order Schema
        Order: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            orderId: { type: 'string', example: 'ORD-2024-001' },
            clerkId: { type: 'string' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  productId: { type: 'string' },
                  quantity: { type: 'integer' },
                  price: { type: 'number' }
                }
              }
            },
            totalAmount: { type: 'number', example: 1499.99 },
            status: {
              type: 'string',
              enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
            },
            paymentInfo: { type: 'object' },
            shippingAddress: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },

        // Error Response
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'NOT_FOUND' },
                message: { type: 'string', example: 'Product not found' }
              }
            }
          }
        },

        // Success Response
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./routes/*.js'] // Path to route files with JSDoc comments
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs,
  options
};
