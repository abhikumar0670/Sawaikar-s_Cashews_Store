# 🥜 Sawaikar's Cashew Store - Premium E-Commerce Platform

A full-stack e-commerce platform specializing in premium cashews with advanced features like loyalty programs, AI chatbot, product recommendations, QR-based checkout, and comprehensive inventory management.

[![GitHub](https://img.shields.io/badge/GitHub-abhikumar0670-blue?style=flat&logo=github)](https://github.com/abhikumar0670)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Active-brightgreen?style=flat)]()

## 🎯 Overview

Sawaikar's Cashew Store is a modern, feature-rich e-commerce platform built with:
- **Frontend**: React 18 + Styled Components
- **Backend**: Node.js/Express.js
- **Database**: MongoDB Atlas
- **Authentication**: Clerk
- **Payments**: Razorpay
- **Hosting**: Vercel (Frontend), Cloud Platform (Backend)

### Key Features

✨ **E-Commerce Core**
- Complete product catalog with variants and QR codes
- Advanced shopping cart with smart recommendations
- Multi-payment gateway (Razorpay, UPI, Net Banking)
- Order tracking with real-time updates
- Inventory management system

🎁 **Customer Loyalty**
- Tiered loyalty program (Bronze/Silver/Gold/Platinum)
- Achievement badges and rewards
- Referral system with automatic point distribution
- Points redemption for discounts

🤖 **AI & Intelligence**
- AI-powered chatbot (Groq API integration)
- Product recommendation engine
- Nutrition-based product suggestions
- Personalized user experiences

📦 **Smart Features**
- QR/Barcode scanning for in-store checkout
- Product bundles and smart combos
- Dynamic coupon management
- Newsletter subscription
- Feedback and review system
- Analytics dashboard for admins

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v16+ and npm/yarn
- **MongoDB** Atlas account
- **Git** for version control

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/abhikumar0670/Sawaikar-s_Cashew_Store.git
cd Sawaikar-s_Cashew_Store
```

2. **Backend Setup**
```bash
cd backend
npm install
```

Create `.env` file in backend directory:
```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=your_mongodb_connection_string

# Authentication
CLERK_SECRET_KEY=your_clerk_secret_key

# Payments
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Email
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
GMAIL_REFRESH_TOKEN=your_refresh_token

# APIs
GROQ_API_KEY=your_groq_api_key

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

3. **Frontend Setup**
```bash
cd frontend
npm install
```

Create `.env.local` file in frontend directory:
```env
REACT_APP_API_BASE_URL=http://localhost:5000
REACT_APP_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

4. **Run Development Servers**

Backend:
```bash
cd backend
npm start
```

Frontend (in another terminal):
```bash
cd frontend
npm start
```

The app will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

---

## 📁 Project Structure

```
Sawaikar-s_Cashew_Store/
├── frontend/                 # React frontend
│   ├── public/              # Static files
│   ├── src/
│   │   ├── pages/           # Page components (20+)
│   │   ├── components/      # Reusable UI components (48)
│   │   ├── context/         # State management (Cart, Auth, Filter)
│   │   ├── config/          # API configuration
│   │   ├── styles/          # Global styles
│   │   ├── App.js           # Main app component
│   │   └── index.js         # Entry point
│   └── package.json
│
├── backend/                  # Node.js/Express backend
│   ├── routes/              # API endpoints
│   │   ├── products.js
│   │   ├── orders.js
│   │   ├── users.js
│   │   ├── payment.js
│   │   ├── loyalty.js
│   │   ├── chatbot.js
│   │   ├── analytics.js
│   │   └── ... (15+ routes)
│   ├── models/              # MongoDB schemas (17 models)
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   ├── UserLoyalty.js
│   │   └── ...
│   ├── middleware/          # Custom middleware
│   │   ├── auth.js          # Authentication
│   │   ├── clerkAuth.js     # Clerk verification
│   │   └── errorHandler.js
│   ├── config/              # Configuration files
│   ├── server.js            # Entry point
│   └── package.json
│
├── .env                      # ⚠️ NOT COMMITTED (use .env.example)
├── .gitignore              # Git ignore rules
├── README.md               # This file
└── package.json            # Root package
```

---

## 🔑 API Documentation

### Base URL
```
Development: http://localhost:5000
Production: https://api.sawaikars.com
```

### Authentication
All protected routes require Clerk JWT token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Main Endpoints

**Products**
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (admin only)
- `PUT /api/products/:id` - Update product (admin only)

**Orders**
- `GET /api/orders` - Get user's orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/reorder` - Reorder previous order

**Loyalty**
- `GET /api/loyalty/points` - Get user loyalty points
- `GET /api/loyalty/tier` - Get user tier
- `GET /api/loyalty/achievements` - Get achievements

**Chatbot**
- `POST /api/chatbot/message` - Send message to AI chatbot

**Analytics** (Admin)
- `GET /api/analytics/sales` - Get sales data
- `GET /api/analytics/products` - Get product analytics

For complete API documentation, see [COMPREHENSIVE_ANALYSIS_REPORT.md](COMPREHENSIVE_ANALYSIS_REPORT.md)

---

## 🔐 Security & Environment Setup

### ⚠️ IMPORTANT: Do NOT Commit Sensitive Files

The `.gitignore` file protects these sensitive files:
- `.env` - API keys, database credentials, tokens
- `.env.local` - Local environment overrides
- `node_modules/` - Dependencies (reinstall via npm)
- `.vscode/` - IDE settings

### Setting Up Environment Variables

1. **Backend `.env`** - Required for running backend
2. **Frontend `.env.local`** - Required for Clerk and API connection

**Get your credentials from:**
- **Clerk**: https://dashboard.clerk.com
- **Razorpay**: https://razorpay.com/dashboard
- **MongoDB**: https://www.mongodb.com/cloud/atlas
- **Gmail**: Google Cloud Console → Create API credentials
- **Groq**: https://console.groq.com

### Rotating Secrets (Production)

When deploying to production:
1. Generate new API keys for each service
2. Use platform-specific secret management:
   - **Vercel**: Settings → Environment Variables
   - **AWS**: AWS Secrets Manager
   - **Azure**: Azure Key Vault

Never reuse development credentials in production!

---

## 🛠️ Development Guide

### Running with Hot Reload

**Frontend:**
```bash
cd frontend
npm start  # Starts on http://localhost:3000
```

**Backend:**
```bash
cd backend
npm start  # Starts on http://localhost:5000
# For auto-reload on file changes:
npm install -g nodemon
nodemon server.js
```

### Building for Production

**Frontend:**
```bash
cd frontend
npm run build  # Creates optimized build in `/build`
```

**Backend:** (No build needed for Node.js)

### Database Seeding

```bash
cd backend
node seedData.js  # Populates sample data
```

---

## 📊 Application Features

### Admin Dashboard
- Product management (CRUD operations)
- Order tracking and fulfillment
- Customer analytics
- Loyalty program management
- Coupon creation and tracking
- Feedback review
- Referral program oversight

### User Features
- Browse products with filters
- Add to cart and wishlist
- Secure checkout with multiple payment options
- Track orders in real-time
- View loyalty points and tier
- Access referral program
- Chat with AI assistant
- View personalized recommendations
- Subscribe to newsletter
- Provide feedback and reviews

### Loyalty Program
- Earn points on purchases
- Tier-based benefits (Bronze → Platinum)
- Achievement badges
- Referral rewards
- Point redemption for discounts

---

## 🧪 Testing

Currently, the project has **0% test coverage**. To add tests:

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom jest
```

Create test files in `frontend/__tests__/` and `backend/__tests__/`

---

## 🚀 Deployment

### Frontend (Vercel)
```bash
cd frontend
npm install -g vercel
vercel  # Follow prompts
```

### Backend (Recommended Options)
- **Render**: https://render.com (free tier available)
- **Railway**: https://railway.app
- **Heroku**: https://heroku.com
- **AWS EC2**: https://aws.amazon.com/ec2

---

## 📈 Performance & Optimization

**Current Status**: Production-ready with optimization opportunities

### Implemented Optimizations ✅
- Code splitting with React.lazy()
- Image lazy loading
- Gzip compression on backend
- Rate limiting on API endpoints
- Database indexing on critical fields

### Recommended Improvements 📋
- [ ] Add Redis caching layer
- [ ] Image CDN integration (Cloudinary)
- [ ] Implement Progressive Web App (PWA)
- [ ] Setup monitoring (Sentry, New Relic)
- [ ] Add automated testing (Jest, Cypress)
- [ ] Optimize bundle size (analyze with webpack-bundle-analyzer)

See [COMPREHENSIVE_ANALYSIS_REPORT.md](COMPREHENSIVE_ANALYSIS_REPORT.md) for detailed recommendations.

---

## 🐛 Troubleshooting

### Common Issues

**Backend won't start**
```bash
# Check if port 5000 is in use
lsof -i :5000  # (Mac/Linux)
netstat -ano | findstr :5000  # (Windows)

# Kill process if needed and retry
```

**MongoDB connection failed**
- Verify connection string in `.env`
- Check IP whitelist in MongoDB Atlas
- Ensure VPN is not blocking (if required)

**Clerk authentication issues**
- Verify Clerk keys are correct
- Check Frontend URL in Clerk dashboard
- Clear browser cache and cookies

**Razorpay test mode**
- Use test keys during development
- Switch to live keys for production

---

## 📝 License

This project is licensed under the MIT License - see LICENSE file for details.

---

## 👤 Author

**Abhishek Kumar**
- GitHub: [@abhikumar0670](https://github.com/abhikumar0670)
- Project: [Sawaikar's Cashew Store](https://github.com/abhikumar0670/Sawaikar-s_Cashew_Store)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Guidelines:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Email: abhikumar0670@gmail.com

---

## 🗺️ Roadmap

- [ ] Mobile app (React Native/Flutter)
- [ ] Advanced analytics dashboard
- [ ] Machine learning-based recommendations
- [ ] Voice shopping assistant
- [ ] Subscription box service
- [ ] B2B wholesale platform
- [ ] Social commerce integration

---

## 📚 Documentation

- [Comprehensive Analysis Report](COMPREHENSIVE_ANALYSIS_REPORT.md)
- [API Documentation](API_DOCS.md) - Coming soon
- [Database Schema](DB_SCHEMA.md) - Coming soon
- [Architecture Guide](ARCHITECTURE.md) - Coming soon

---

**Last Updated**: April 5, 2026  
**Version**: 1.0.0  
**Status**: Active Development ✨

---

*Made with ❤️ for cashew lovers everywhere* 🥜
