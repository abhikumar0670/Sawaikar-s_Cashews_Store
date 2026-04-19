# 🥜 Sawaikar's Cashew Store - Premium E-Commerce Platform

A modern, full-stack e-commerce platform for premium Goan cashews with AI-powered chatbot, loyalty programs, intelligent recommendations, and comprehensive inventory management.

🌐 **Live Demo:** [https://sawaikar-s-cashews-store-v2.vercel.app](https://sawaikar-s-cashews-store-v2.vercel.app)

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **Styled Components** - CSS-in-JS styling
- **React Router** - Client-side routing
- **Clerk** - Authentication & user management
- **Razorpay** - Payment processing
- **React Icons** - Icon library
- **React Hot Toast** - Notifications

### Backend
- **Node.js/Express.js** - Server & API
- **MongoDB Atlas** - NoSQL database
- **Mongoose** - Database ODM
- **JWT** - Token-based authentication
- **Groq API** - AI chatbot integration
- **Pinecone** - Vector database for RAG
- **OpenAI** - Embeddings & RAG
- **Sentry** - Error tracking

### Hosting
- **Frontend:** Vercel
- **Backend:** Render
- **Database:** MongoDB Atlas

---

## ✨ Key Features

### 🛍️ E-Commerce Core
- Complete product catalog with variants
- QR code & barcode scanning
- Smart shopping cart
- Multiple payment gateways (Razorpay, UPI, Net Banking)
- Real-time order tracking
- Inventory management system

### 🎁 Loyalty Program
- Tiered rewards (Bronze/Silver/Gold/Platinum)
- Achievement badges
- Referral system with automatic points
- Points redemption for discounts

### 🤖 AI & Intelligence
- AI-powered chatbot (Groq API)
- RAG (Retrieval-Augmented Generation) system
- Product recommendation engine
- Nutrition-based suggestions
- Vector-based semantic search

### 📦 Smart Features
- Product bundles & combos
- Dynamic coupon management
- Newsletter subscription
- User reviews & feedback
- Admin analytics dashboard

---

## � Project Structure

```
Sawaikar-s_Cashew_Store/
├── frontend/                    # React application
│   ├── src/
│   │   ├── components/         # Reusable UI components (48+)
│   │   ├── pages/              # Page components (20+)
│   │   ├── context/            # State management (Cart, Auth, Filters)
│   │   ├── styles/             # Global styles
│   │   ├── config/             # API configuration
│   │   ├── hooks/              # Custom React hooks
│   │   └── App.js              # Main application component
│   └── package.json
│
├── backend/                     # Node.js/Express API
│   ├── routes/                 # API endpoints (15+ routes)
│   │   ├── products.js
│   │   ├── orders.js
│   │   ├── users.js
│   │   ├── payment.js
│   │   ├── loyalty.js
│   │   ├── chatbot.js
│   │   ├── analytics.js
│   │   └── ...
│   ├── models/                 # MongoDB schemas (17 models)
│   │   ├── Product.js
│   │   ├── User.js
│   │   ├── Order.js
│   │   ├── UserLoyalty.js
│   │   └── ...
│   ├── services/               # Business logic
│   │   ├── chatbotService.js
│   │   ├── vectorService.js
│   │   ├── ragContextService.js
│   │   ├── recommendationService.js
│   │   └── ...
│   ├── middleware/             # Custom middleware
│   ├── scripts/                # Setup & seeding scripts
│   ├── config/                 # Configuration files
│   ├── server.js               # Entry point
│   └── package.json
│
├── vercel.json                 # Vercel deployment config
├── .gitignore                  # Git ignore rules
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v16+ and npm/yarn
- MongoDB Atlas account
- Git

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
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=your_mongodb_connection_string
   CLERK_SECRET_KEY=your_clerk_key
   RAZORPAY_KEY_ID=your_razorpay_key
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   GROQ_API_KEY=your_groq_api_key
   PINECONE_API_KEY=your_pinecone_key
   PINECONE_INDEX_NAME=sawaikar-chat
   OPENAI_API_KEY=your_openai_key
   FRONTEND_URL=http://localhost:3000
   PRODUCTION_URL=your_vercel_domain
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```
   
   Create `.env` file in frontend directory:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   REACT_APP_RAZORPAY_KEY_ID=your_razorpay_key
   ```

### Running Development Servers

**Backend (Terminal 1):**
```bash
cd backend
npm start
# Runs on http://localhost:5000
```

**Frontend (Terminal 2):**
```bash
cd frontend
npm start
# Runs on http://localhost:3000
```

---

## 🔑 Key API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (admin)

### Orders
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order details

### Loyalty
- `GET /api/loyalty/points` - Get loyalty points
- `GET /api/loyalty/tier` - Get tier status
- `GET /api/loyalty/achievements` - Get badges

### Chatbot & RAG
- `POST /api/chatbot/message` - Chat with AI
- `GET /api/content/search` - Semantic search
- `POST /api/chatbot/rag-message` - RAG-enhanced chat

---

## 🧠 RAG System Setup

The platform includes a Retrieval-Augmented Generation (RAG) system for intelligent chatbot responses.

### Setup Steps

1. **Create Pinecone Index**
   - Sign up at [pinecone.io](https://pinecone.io)
   - Create index: `sawaikar-chat`
   - Add credentials to `.env`

2. **Index Data**
   ```bash
   cd backend
   node scripts/indexAllData.js
   ```

3. **Test RAG Endpoints**
   ```bash
   curl -X GET "http://localhost:5000/api/content/search?query=best%20cashews"
   ```

---

## 🚀 Deployment

### Frontend (Vercel)
```bash
cd frontend
vercel deploy
```

### Backend (Render)
1. Go to [render.com](https://render.com)
2. Connect your GitHub repository
3. Set environment variables in Render dashboard
4. Deploy

---

## 🔐 Environment Variables

### Backend Required Variables
- `MONGODB_URI` - MongoDB connection string
- `CLERK_SECRET_KEY` - Clerk authentication key
- `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET` - Payment gateway keys
- `GROQ_API_KEY` - AI chatbot API key
- `PINECONE_API_KEY` - Vector database key
- `OPENAI_API_KEY` - Embeddings API key
- `EMAIL_USER` & `EMAIL_PASS` - Email service credentials

### Frontend Required Variables
- `REACT_APP_API_URL` - Backend API URL
- `REACT_APP_CLERK_PUBLISHABLE_KEY` - Clerk public key
- `REACT_APP_RAZORPAY_KEY_ID` - Razorpay public key

**⚠️ IMPORTANT:** Never commit `.env` files. Use `.env.example` as a template.

---

## 📊 Database Schema

**Models:**
- User - Customer accounts
- Product - Product catalog
- Order - Purchase orders
- UserLoyalty - Loyalty points & tiers
- Achievement - Customer badges
- Review - Product reviews
- Coupon - Discount codes
- Bundle - Product combinations
- Analytics - User behavior tracking
- And 8+ more...

---

## 🛠️ Development Commands

**Backend:**
```bash
npm start              # Start server
npm run dev           # Start with nodemon (auto-reload)
node seedData.js      # Seed sample data
```

**Frontend:**
```bash
npm start             # Start dev server
npm run build         # Create production build
npm run test          # Run tests
```

---

## 📈 Performance Features

- ✅ Code splitting & lazy loading
- ✅ Image lazy loading
- ✅ Gzip compression
- ✅ Rate limiting on API
- ✅ Database indexing
- ✅ Error tracking with Sentry

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend won't start | Check if port 5000 is in use: `lsof -i :5000` (Mac/Linux) or `netstat -ano | findstr :5000` (Windows) |
| MongoDB connection failed | Verify connection string & IP whitelist in MongoDB Atlas |
| Clerk auth issues | Clear browser cache, verify Clerk keys in dashboard |
| API calls failing | Check `REACT_APP_API_URL` in frontend `.env` |

---

## 📝 License

MIT License - see LICENSE file for details

---

## 👤 Author

**Abhishek Kumar**
- GitHub: [@abhikumar0670](https://github.com/abhikumar0670)
- Email: abhikumar0670@gmail.com

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

Made with ❤️ for cashew lovers everywhere 🥜

**Last Updated:** April 19, 2026  
**Version:** 2.0.0  
**Status:** Active Development
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

**RAG & Vector Search**
- `POST /api/content/index` - Index content for RAG
- `GET /api/content/search` - Semantic search with RAG
- `GET /api/content/context` - Retrieve relevant context
- `POST /api/chatbot/rag-message` - Chat with RAG-enhanced responses

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

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

Made with ❤️ for cashew lovers everywhere 🥜

**Last Updated:** April 19, 2026  
**Version:** 2.0.0  
**Status:** Active Development
