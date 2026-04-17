const Conversation = require('../models/Conversation');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');

class ChatbotService {
  constructor() {
    this.groqApiKey = process.env.GROQ_API_KEY;
    this.groqModel = process.env.GROQ_MODEL || 'mixtral-8x7b-32768';
    // Groq API endpoint (OpenAI-compatible)
    this.groqEndpoint = 'https://api.groq.com/openai/v1/chat/completions';
  }

  // System prompt for the chatbot
  getSystemPrompt(context = {}) {
    return `You are a friendly and helpful customer support assistant for Sawaikar's Cashew Store, a premium cashew and dry fruits e-commerce store from Goa, India.

## About the Store:
- Sawaikar's is a family-owned business selling premium quality cashews and dry fruits
- Products include: Premium Cashews (W180, W240, W320), Roasted & Salted, Flavored varieties (Masala, Pepper, Honey), Gift Hampers, Cashew Butter
- All products are sourced directly from Goa, India
- Free shipping on orders above ₹999
- Payment options: UPI, Credit/Debit cards, Net Banking, COD (Cash on Delivery)

## Your Responsibilities:
1. Answer product questions (nutrition, pricing, availability, recommendations)
2. Help with orders (track status, cancellation, returns)
3. Provide recipe ideas and usage tips for cashews
4. Handle complaints professionally and empathetically
5. Explain shipping, return, and refund policies

## Guidelines:
- Be warm, professional, and conversational
- Use Indian English naturally (₹ for prices, Indian spellings)
- If you don't know something, say so honestly and offer to connect with human support
- For order-specific issues, ask for the order ID
- Never make up information about orders or policies
- Keep responses concise but helpful (max 2-3 paragraphs)
- If customer seems frustrated, acknowledge their feelings and offer escalation

## Current Context:
${context.userName ? `Customer Name: ${context.userName}` : 'Guest User'}
${context.recentOrders?.length ? `Recent Orders: ${context.recentOrders.map(o => `#${o.orderId} (${o.status})`).join(', ')}` : ''}
${context.lastProductViewed ? `Last Product Viewed: ${context.lastProductViewed}` : ''}

Remember: You represent Sawaikar's Cashew Store. Be helpful, honest, and make customers feel valued!`;
  }

  // Call Groq API (OpenAI-compatible format)
  async callGroq(messages, context = {}) {
    if (!this.groqApiKey) {
      console.warn('[Groq API] ❌ GROQ_API_KEY not set, using fallback responses');
      return this.getFallbackResponse(messages[messages.length - 1]?.content || '');
    }

    try {
      const systemPrompt = this.getSystemPrompt(context);

      // Format messages for Groq (OpenAI-compatible format)
      const groqMessages = [
        {
          role: 'system',
          content: systemPrompt
        }
      ];

      // Add conversation history
      messages.forEach(msg => {
        groqMessages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
        });
      });

      const requestBody = {
        model: this.groqModel,
        messages: groqMessages,
        temperature: 0.7,
        top_p: 0.95,
        max_tokens: 1024
      };

      console.log(`[Groq API] 📤 Sending request to ${this.groqEndpoint}`);
      console.log(`[Groq API] Model: ${this.groqModel}`);
      console.log(`[Groq API] User message: "${messages[messages.length - 1]?.content}"`);

      const response = await fetch(this.groqEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.groqApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log(`[Groq API] 📊 Response status: ${response.status}`);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[Groq API] ❌ Error response:', JSON.stringify(error, null, 2));
        console.warn('[Groq API] Falling back to knowledge base responses');
        return this.getFallbackResponse(messages[messages.length - 1]?.content || '');
      }

      const data = await response.json();
      console.log('[Groq API] ✅ Response received successfully');

      if (data.choices && data.choices[0]?.message?.content) {
        const aiResponse = data.choices[0].message.content;
        console.log(`[Groq API] 🤖 AI Response: "${aiResponse.substring(0, 100)}..."`);
        return aiResponse;
      }

      console.warn('[Groq API] No choices in response, falling back');
      return this.getFallbackResponse(messages[messages.length - 1]?.content || '');
    } catch (error) {
      console.error('[Groq API] ❌ Call failed:', error.message);
      console.error('[Groq API] Stack:', error.stack);
      console.warn('[Groq API] Using fallback responses');
      return this.getFallbackResponse(messages[messages.length - 1]?.content || '');
    }
  }

  // Fallback responses when AI is unavailable
  getFallbackResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();

    // Order tracking with ID extraction
    if (lowerMessage.includes('order') && (lowerMessage.includes('track') || lowerMessage.includes('status') || lowerMessage.includes('where'))) {
      // Extract order ID from message (patterns: ORD-, SC-, or similar)
      const orderIdMatch = userMessage.match(/([A-Z]{2,}(?:-[A-Z0-9]+)+)/);
      
      if (orderIdMatch) {
        const orderId = orderIdMatch[1];
        return `Thank you for providing your order ID: ${orderId}\n\nI'm retrieving your order status. Please note:\n• Orders usually take 3-5 business days for metro cities\n• 5-7 business days for other locations\n• You'll receive email updates at each stage\n\nFor detailed tracking, you can also check your 'My Orders' section in your account. If you don't see your order status or have concerns, please ask to connect with our support team.`;
      }
      
      return "I'd love to help track your order! 📦 Please provide your Order ID. It typically starts with prefixes like 'ORD-', 'SC-' or similar codes. You can find it in your order confirmation email or in your account's 'My Orders' section.";
    }

    // Shipping
    if (lowerMessage.includes('shipping') || lowerMessage.includes('delivery')) {
      return "We offer free shipping on orders above ₹999. Standard delivery takes 3-5 business days for metro cities and 5-7 days for other locations. Express delivery is available at checkout for an additional fee.";
    }

    // Returns/Refunds
    if (lowerMessage.includes('return') || lowerMessage.includes('refund') || lowerMessage.includes('exchange')) {
      return "We accept returns within 7 days of delivery. The product must be unopened and in original packaging. Refunds are processed within 5-7 business days after we receive the returned item. For damaged products, please share photos and we'll arrange a replacement.";
    }

    // Payment
    if (lowerMessage.includes('payment') || lowerMessage.includes('pay') || lowerMessage.includes('cod')) {
      return "We accept all major payment methods: UPI (Google Pay, PhonePe, Paytm), Credit/Debit cards, Net Banking, and Cash on Delivery (COD). COD is available for orders under ₹10,000.";
    }

    // Product recommendations
    if (lowerMessage.includes('recommend') || lowerMessage.includes('best') || lowerMessage.includes('popular')) {
      return "Our bestsellers are:\n• Premium W240 Cashews - Large, whole cashews perfect for snacking\n• Roasted & Salted Cashews - Crispy and flavorful\n• Honey Glazed Cashews - Sweet treat for all ages\n• Premium Gift Hampers - Perfect for festivals and celebrations\n\nWould you like more details about any of these?";
    }

    // Greeting
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return "Hello! Welcome to Sawaikar's Cashew Store! 🥜 I'm here to help you with product information, orders, or any questions. How can I assist you today?";
    }

    // Thank you
    if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
      return "You're welcome! Is there anything else I can help you with? Feel free to reach out anytime. Enjoy your cashews! 🥜";
    }

    // Order cancellation
    if (lowerMessage.includes('cancel') && lowerMessage.includes('order')) {
      const orderIdMatch = lowerMessage.match(/([a-z]{2,}(?:-[a-z0-9]+)+)/i);
      if (orderIdMatch) {
        return `To cancel order ${orderIdMatch[1].toUpperCase()}, I'll help you! Please note:\n\nOrders can be cancelled ONLY before delivery:\n✓ Placed, Confirmed, Processing, Shipped, Out for Delivery\n✗ Cannot cancel after Delivered\n\nIf your order is already delivered, you can request a replacement instead. Would you like me to help with that?`;
      }
      return "To cancel an order, please provide your Order ID (e.g., SC-MNFQALEV-IJTM). Orders can only be cancelled before delivery.";
    }

    // Replacement request
    if (lowerMessage.includes('replace') || lowerMessage.includes('replacement')) {
      const orderIdMatch = lowerMessage.match(/([a-z]{2,}(?:-[a-z0-9]+)+)/i);
      if (orderIdMatch) {
        return `I can help with a replacement for order ${orderIdMatch[1].toUpperCase()}!\n\nReplacements are available for delivered orders. Please tell us:\n• What's the issue? (damaged, defective, quality concern)\n• Photos help us process faster\n\nOur support team will review and arrange a replacement within 24 hours.\n\nEmail us: support@sawaikarcashews.com\nPhone: +91-8967234567`;
      }
      return "For a replacement, please provide your Order ID and let us know what's wrong with the product. Our team will help process your replacement request immediately.";
    }

    // Default
    return "Thank you for reaching out! I'm here to help with product questions, orders, shipping, and more. Could you please tell me more about what you need assistance with? If you need to speak with a human, just say 'connect to support'.";
  }

  // Process a chat message
  async processMessage(sessionId, userId, message, metadata = {}) {
    // Get or create conversation
    const conversation = await Conversation.getOrCreateBySession(sessionId, userId);

    // Load user context if available
    let context = {};
    if (userId) {
      const user = await User.findOne({ clerkId: userId });
      if (user) {
        context.userName = user.name;
        context.userEmail = user.email;

        // Get recent orders
        const recentOrders = await Order.find({ userClerkId: userId })
          .sort({ createdAt: -1 })
          .limit(3)
          .select('orderId status totalAmount');

        context.recentOrders = recentOrders.map(o => ({
          orderId: o.orderId,
          status: o.status,
          totalAmount: o.totalAmount
        }));
      }
    }

    // Add metadata context
    if (metadata.lastProductViewed) {
      context.lastProductViewed = metadata.lastProductViewed;
    }

    // Add user message to conversation
    conversation.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    // Check for escalation triggers
    const shouldEscalate = this.checkEscalationTriggers(message, conversation.messages);
    if (shouldEscalate) {
      await conversation.escalate(shouldEscalate.reason);
      const escalationResponse = "I understand you'd like to speak with a human representative. I'm connecting you now. Our support team will respond within 24 hours.\n\nIn the meantime, you can also reach us at:\n📧 Email: support@sawaikarcashews.com\n📞 Phone: +91-8967234567\n\nWe'll get back to you as soon as possible!";

      conversation.messages.push({
        role: 'assistant',
        content: escalationResponse,
        timestamp: new Date()
      });

      await conversation.save();

      return {
        response: escalationResponse,
        escalated: true,
        conversationId: conversation._id
      };
    }

    // Check for order tracking - extract order ID from message (matches SC-MNFQALEV-IJTM format)
    const orderIdMatch = message.match(/([A-Z]{2,}(?:-[A-Z0-9]+)+)/);
    let aiResponse = null;

    // If order ID is found, attempt to look it up (regardless of other keywords)
    if (orderIdMatch) {
      const orderId = orderIdMatch[1];
      console.log(`[Chatbot] 🔍 Order ID detected in message: ${orderId}`);
      
      try {
        const orderInfo = await this.getOrderInfo(orderId);
        if (orderInfo) {
          console.log(`[Chatbot] ✅ Order found:`, orderInfo);
          
          // Build response based on order status and user intent
          const userIntent = message.toLowerCase();
          let actionSuggestion = '';
          
          if (orderInfo.canCancel && (userIntent.includes('cancel') || userIntent.includes('cancellation'))) {
            actionSuggestion = `\n\n✓ This order CAN be cancelled as it's still ${orderInfo.status}.\nWould you like to proceed with the cancellation? Reply "yes" or contact support.`;
          } else if (orderInfo.canReplace && (userIntent.includes('replace') || userIntent.includes('replacement') || userIntent.includes('damaged') || userIntent.includes('defective'))) {
            actionSuggestion = `\n\n✓ This order is delivered. We can arrange a replacement.\nPlease describe the issue and we'll process it within 24 hours.\nEmail: support@sawaikarcashews.com | Phone: +91-8967234567`;
          } else if (orderInfo.canCancel) {
            actionSuggestion = `\n\n💡 You can still cancel this order. Reply "cancel" if you'd like to proceed.`;
          } else if (orderInfo.canReplace) {
            actionSuggestion = `\n\n💡 This order has been delivered. If there's any issue, we can arrange a replacement. Just let us know!`;
          }
          
          // Return detailed order tracking response
          aiResponse = `Great! I found your order 📦:\n\nOrder ID: ${orderInfo.orderId}\nOrder Type: ${orderInfo.orderType}\nStatus: ${orderInfo.status}\nTotal Amount: ${orderInfo.totalAmount}\nItems Ordered: ${orderInfo.items} item(s)\nOrder Date: ${new Date(orderInfo.createdAt).toLocaleDateString('en-IN')}\n${orderInfo.estimatedDelivery ? `Estimated Delivery: ${new Date(orderInfo.estimatedDelivery).toLocaleDateString('en-IN')}` : ''}\n\nYour order is being processed and you'll receive email updates at each stage. Standard delivery takes 3-5 business days for metro cities and 5-7 days for other locations.${actionSuggestion}\n\nIs there anything else I can help you with?`;
        } else {
          console.log(`[Chatbot] ⚠️ Order not found in database: ${orderId}`);
          // Order ID exists but not in system
          aiResponse = `I couldn't find order ${orderId} in our system. Here's what you can do:\n\n1. Verify the Order ID - Check your order confirmation email for the exact ID\n2. Check your account - Log into your account and visit 'My Orders' section\n3. Contact our support team for immediate assistance:\n   📧 Email: support@sawaikarcashews.com\n   📞 Phone: +91-8967234567\n\nOur team will help you right away!`;
        }
      } catch (error) {
        console.error('[Chatbot] Error looking up order:', error.message);
        // Fall back to generic response
        aiResponse = `I tried to look up order ${orderId} but encountered an issue. Please contact our support team:\n\n📧 Email: support@sawaikarcashews.com\n📞 Phone: +91-8967234567`;
      }
    }

    // If no order found or order ID not provided, use Groq AI
    if (!aiResponse) {
      aiResponse = await this.callGroq(conversation.messages, context);
    }

    // Add assistant response to conversation
    conversation.messages.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date()
    });

    // Update sentiment based on message
    conversation.sentiment = this.analyzeSentiment(message);

    // Save conversation
    await conversation.save();

    return {
      response: aiResponse,
      escalated: false,
      conversationId: conversation._id,
      sentiment: conversation.sentiment
    };
  }

  // Check if we should escalate to human
  checkEscalationTriggers(message, history) {
    const lowerMessage = message.toLowerCase();

    // Explicit request for human
    if (lowerMessage.includes('human') || lowerMessage.includes('speak to someone') ||
        lowerMessage.includes('real person') || lowerMessage.includes('connect to support') ||
        lowerMessage.includes('talk to agent') || lowerMessage.includes('manager')) {
      return { reason: 'user_requested' };
    }

    // Frustration indicators
    const frustrationWords = ['angry', 'frustrated', 'terrible', 'horrible', 'worst', 'lawsuit', 'complaint', 'unacceptable'];
    if (frustrationWords.some(word => lowerMessage.includes(word))) {
      return { reason: 'customer_frustrated' };
    }

    // Multiple back-and-forth without resolution (more than 6 messages)
    if (history.length > 6) {
      const recentUserMessages = history.slice(-6).filter(m => m.role === 'user');
      // If they keep asking similar questions
      if (recentUserMessages.length >= 3) {
        return { reason: 'unresolved_issue' };
      }
    }

    return null;
  }

  // Simple sentiment analysis
  analyzeSentiment(message) {
    const lowerMessage = message.toLowerCase();

    const positiveWords = ['thank', 'great', 'excellent', 'amazing', 'love', 'happy', 'wonderful', 'perfect'];
    const negativeWords = ['bad', 'poor', 'terrible', 'awful', 'hate', 'angry', 'disappointed', 'worst', 'horrible'];

    const positiveCount = positiveWords.filter(w => lowerMessage.includes(w)).length;
    const negativeCount = negativeWords.filter(w => lowerMessage.includes(w)).length;

    if (negativeCount > positiveCount) {
      return negativeCount > 1 ? 'frustrated' : 'negative';
    }
    if (positiveCount > negativeCount) {
      return 'positive';
    }
    return 'neutral';
  }

  // Get product info for chatbot context
  async getProductInfo(productId) {
    const product = await Product.findOne({ id: productId });
    if (!product) return null;

    return {
      name: product.name,
      price: `₹${(product.price / 100).toFixed(2)}`,
      category: product.category,
      description: product.description,
      inStock: product.stock > 0,
      rating: product.rating
    };
  }

  // Get order info for chatbot context
  async getOrderInfo(orderId) {
    const order = await Order.findOne({ orderId }).select('orderId orderStatus orderType totalAmount items createdAt estimatedDeliveryDate');
    if (!order) return null;

    // Determine if order can be cancelled or replaced
    const cancellableStatuses = ['placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery'];
    const replaceableStatuses = ['delivered'];
    
    const canCancel = cancellableStatuses.includes(order.orderStatus);
    const canReplace = replaceableStatuses.includes(order.orderStatus);

    // Determine status display based on order type
    let displayStatus = order.orderStatus;
    
    if (order.orderType === 'instore') {
      // In-store orders are always "Delivered" (pickup at store)
      displayStatus = 'Delivered';
    } else {
      // Online orders: format orderStatus nicely (placed -> Placed, confirmed -> Confirmed, etc.)
      displayStatus = displayStatus
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    return {
      orderId: order.orderId,
      status: displayStatus,
      orderStatus: order.orderStatus,
      orderType: order.orderType === 'instore' ? 'In-Store Pickup' : 'Online Delivery',
      totalAmount: `₹${(order.totalAmount / 100).toFixed(2)}`,
      items: order.items.length,
      createdAt: order.createdAt,
      estimatedDelivery: order.estimatedDeliveryDate,
      canCancel,
      canReplace
    };
  }
}

module.exports = new ChatbotService();
