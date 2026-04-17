// API configuration for production and development.
// In production, default to same-origin '/api' unless REACT_APP_API_URL is explicitly set.
const isProduction = process.env.NODE_ENV === 'production';

// Auto-detect backend URL based on current hostname
// If accessing from network IP, use the same IP for backend
const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  if (isProduction) {
    return '/api';
  }

  // In development, use the same hostname as the frontend
  // This allows mobile devices to connect via network IP
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }

  // For network access (e.g., 192.168.x.x or 10.x.x.x)
  return `http://${hostname}:5000/api`;
};

const API_BASE_URL = getApiBaseUrl();

// For production, set REACT_APP_API_URL in Vercel environment variables
// Example: https://your-backend.onrender.com/api

export const API_ENDPOINTS = {
  // Products
  PRODUCTS: `${API_BASE_URL}/products`,
  PRODUCT_BY_ID: (id) => `${API_BASE_URL}/products/${id}`,
  ADD_PRODUCT: `${API_BASE_URL}/products/add`,

  // Orders
  ORDERS: `${API_BASE_URL}/orders`,
  ORDER_BY_ID: (id) => `${API_BASE_URL}/orders/${id}`,
  ORDER_STATUS: (id) => `${API_BASE_URL}/orders/${id}/status`,

  // Users
  USERS: `${API_BASE_URL}/users`,
  USER_SYNC: `${API_BASE_URL}/users/sync`,

  // Coupons
  COUPONS: `${API_BASE_URL}/coupons`,
  COUPON_VALIDATE: `${API_BASE_URL}/coupons/validate`,
  COUPON_BY_ID: (id) => `${API_BASE_URL}/coupons/${id}`,
  COUPON_TOGGLE: (id) => `${API_BASE_URL}/coupons/${id}/toggle`,

  // Payment
  PAYMENT_CREATE: `${API_BASE_URL}/payment/create-order`,
  PAYMENT_VERIFY: `${API_BASE_URL}/payment/verify`,
  PAYMENT_VERIFY_PAYMENT: `${API_BASE_URL}/payment/verify-payment`,

  // Newsletter
  NEWSLETTER: `${API_BASE_URL}/newsletter`,

  // AI Recommendations
  RECOMMENDATIONS_USER: (userId) => `${API_BASE_URL}/recommendations/user/${userId}`,
  RECOMMENDATIONS_SIMILAR: (productId) => `${API_BASE_URL}/recommendations/similar/${productId}`,
  RECOMMENDATIONS_BOUGHT_TOGETHER: (productId) => `${API_BASE_URL}/recommendations/bought-together/${productId}`,
  RECOMMENDATIONS_TRENDING: `${API_BASE_URL}/recommendations/trending`,
  RECOMMENDATIONS_TRACK: `${API_BASE_URL}/recommendations/track`,

  // AI Chatbot
  CHATBOT_MESSAGE: `${API_BASE_URL}/chatbot/message`,
  CHATBOT_HISTORY: (sessionId) => `${API_BASE_URL}/chatbot/history/${sessionId}`,
  CHATBOT_SUGGESTIONS: `${API_BASE_URL}/chatbot/suggested-replies`,

  // Loyalty System
  LOYALTY_USER: (userId) => `${API_BASE_URL}/loyalty/user/${userId}`,
  LOYALTY_HISTORY: (userId) => `${API_BASE_URL}/loyalty/history/${userId}`,
  LOYALTY_SPIN: (userId) => `${API_BASE_URL}/loyalty/spin/${userId}`,
  LOYALTY_REDEEM: `${API_BASE_URL}/loyalty/redeem`,
  LOYALTY_ACHIEVEMENTS: `${API_BASE_URL}/loyalty/achievements`,
  LOYALTY_USER_ACHIEVEMENTS: (userId) => `${API_BASE_URL}/loyalty/achievements/${userId}`,
  LOYALTY_CLAIM_ACHIEVEMENT: (achievementId) => `${API_BASE_URL}/loyalty/achievements/${achievementId}/claim`,
  LOYALTY_REFERRAL_GENERATE: `${API_BASE_URL}/loyalty/referral/generate`,
  LOYALTY_REFERRAL_APPLY: `${API_BASE_URL}/loyalty/referral/apply`,
  LOYALTY_LEADERBOARD: `${API_BASE_URL}/loyalty/leaderboard`,
  LOYALTY_REWARDS: `${API_BASE_URL}/loyalty/rewards`,

  // Bundles
  BUNDLES: `${API_BASE_URL}/bundles`,
  BUNDLE_BY_ID: (bundleId) => `${API_BASE_URL}/bundles/${bundleId}`,

  // Content/Blog
  BLOGS: `${API_BASE_URL}/content/blogs`,
  BLOG_BY_SLUG: (slug) => `${API_BASE_URL}/content/blogs/${slug}`,
  BLOG_CATEGORIES: `${API_BASE_URL}/content/categories`,

  // Analytics (Admin)
  ANALYTICS_DASHBOARD: `${API_BASE_URL}/analytics/dashboard`,
  ANALYTICS_SALES_TRENDS: `${API_BASE_URL}/analytics/sales/trends`,
  ANALYTICS_TOP_PRODUCTS: `${API_BASE_URL}/analytics/products/top`,
  ANALYTICS_RFM: `${API_BASE_URL}/analytics/customers/rfm`,
  ANALYTICS_FORECAST: `${API_BASE_URL}/analytics/demand/forecast`,
  ANALYTICS_INVENTORY: `${API_BASE_URL}/analytics/inventory`,
  ANALYTICS_LOYALTY: `${API_BASE_URL}/analytics/loyalty`,
  ANALYTICS_ENGAGEMENT: `${API_BASE_URL}/analytics/engagement`,

  // Nutrition-Based Recommendations
  NUTRITION_PROFILE: `${API_BASE_URL}/nutrition/profile`,
  NUTRITION_ONBOARDING: `${API_BASE_URL}/nutrition/profile/onboarding`,
  NUTRITION_RECOMMENDATIONS: `${API_BASE_URL}/nutrition/recommendations`,
  NUTRITION_BY_GOAL: (goal) => `${API_BASE_URL}/nutrition/by-goal/${goal}`,
  NUTRITION_BY_NUTRIENT: (nutrient) => `${API_BASE_URL}/nutrition/by-nutrient/${nutrient}`,
  NUTRITION_SIMILAR: (productId) => `${API_BASE_URL}/nutrition/similar/${productId}`,
  NUTRITION_PRODUCT: (productId) => `${API_BASE_URL}/nutrition/product/${productId}`,
  NUTRITION_LEARN_PREFERENCES: `${API_BASE_URL}/nutrition/learn-preferences`,
  NUTRITION_COLLABORATIVE: `${API_BASE_URL}/nutrition/collaborative`,
  NUTRITION_HEALTH_GOALS: `${API_BASE_URL}/nutrition/health-goals`,

  // Barcode / In-Store Checkout
  BARCODE_LOOKUP: (code) => `${API_BASE_URL}/barcode/lookup/${code}`,
  BARCODE_VALIDATE: (code) => `${API_BASE_URL}/barcode/validate/${code}`,
  BARCODE_GENERATE: (productId) => `${API_BASE_URL}/barcode/generate/${productId}`,
};

export default API_BASE_URL;
