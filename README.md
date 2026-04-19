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

### 📦 Admin Features
- Product management (CRUD operations)
- Order tracking and fulfillment
- Customer analytics dashboard
- Loyalty program management
- Coupon creation and tracking
- Feedback review system

---

## 📁 Project Structure

```
Sawaikar-s_Cashew_Store/
├── frontend/                    # React application
│   ├── src/
│   │   ├── components/         # UI components (48+)
│   │   ├── pages/              # Pages (20+)
│   │   ├── context/            # State management
│   │   ├── styles/             # Global styles
│   │   └── config/             # API configuration
│   └── package.json
│
├── backend/                     # Node.js/Express API
│   ├── routes/                 # API endpoints (15+)
│   ├── models/                 # MongoDB schemas (17)
│   ├── services/               # Business logic
│   ├── middleware/             # Authentication & errors
│   ├── scripts/                # Setup & seeding
│   ├── config/                 # Configuration
│   └── server.js               # Entry point
│
├── vercel.json                 # Vercel config
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v16+ and npm
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
   
   Create `.env` file:
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
   
   Create `.env` file:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_CLERK_PUBLISHABLE_KEY=your_clerk_key
   REACT_APP_RAZORPAY_KEY_ID=your_razorpay_key
   ```

### Running Development Servers

**Backend (Terminal 1):**
```bash
cd backend
npm start              # Runs on http://localhost:5000
npm run dev           # With auto-reload (nodemon)
```

**Frontend (Terminal 2):**
```bash
cd frontend
npm start             # Runs on http://localhost:3000
```

---

## 🔑 API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (admin)

### Orders
- `GET /api/orders` - Get user's orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/reorder` - Reorder previous order

### Loyalty
- `GET /api/loyalty/points` - Get loyalty points
- `GET /api/loyalty/tier` - Get user tier
- `GET /api/loyalty/achievements` - Get badges

### Chatbot & RAG
- `POST /api/chatbot/message` - Chat with AI
- `GET /api/content/search` - Semantic search
- `POST /api/chatbot/rag-message` - RAG-enhanced responses
- `POST /api/content/index` - Index content for RAG

### Analytics (Admin)
- `GET /api/analytics/sales` - Get sales data
- `GET /api/analytics/products` - Get product analytics

---

## 🧠 RAG System Setup

The platform includes RAG (Retrieval-Augmented Generation) for intelligent chatbot responses.

1. **Create Pinecone Index**
   - Sign up at [pinecone.io](https://pinecone.io)
   - Create index: `sawaikar-chat`
   - Add to `.env`

2. **Index Your Data**
   ```bash
   cd backend
   node scripts/indexAllData.js
   ```

3. **Test RAG**
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
2. Connect GitHub repository
3. Set environment variables
4. Deploy

---

## 🔐 Environment Variables

### Backend
- `MONGODB_URI` - MongoDB connection string
- `CLERK_SECRET_KEY` - Clerk authentication
- `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET` - Payment keys
- `GROQ_API_KEY` - AI chatbot API
- `PINECONE_API_KEY` - Vector database
- `OPENAI_API_KEY` - Embeddings
- `EMAIL_USER` & `EMAIL_PASS` - Email service

### Frontend
- `REACT_APP_API_URL` - Backend API URL
- `REACT_APP_CLERK_PUBLISHABLE_KEY` - Clerk public key
- `REACT_APP_RAZORPAY_KEY_ID` - Razorpay key

**⚠️ IMPORTANT:** Never commit `.env` files to git!

---

## 📊 Database Models

- **User** - Customer accounts
- **Product** - Product catalog
- **Order** - Purchase orders
- **UserLoyalty** - Loyalty points & tiers
- **Achievement** - Customer badges
- **Review** - Product reviews
- **Coupon** - Discount codes
- **Bundle** - Product combinations
- **Analytics** - User behavior
- And 8+ more...

---

## 🛠️ Development Commands

```bash
# Backend
cd backend
npm start              # Start server
npm run dev           # Start with auto-reload
node seedData.js      # Seed sample data

# Frontend
cd frontend
npm start             # Start dev server
npm run build         # Build for production
npm run test          # Run tests
```

---

## 📈 Performance

- ✅ Code splitting & lazy loading
- ✅ Image lazy loading
- ✅ Gzip compression
- ✅ Rate limiting on API
- ✅ Database indexing
- ✅ Error tracking (Sentry)

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 5000 in use | `lsof -i :5000` (Mac/Linux) or `netstat -ano \| findstr :5000` (Windows) |
| MongoDB connection failed | Verify connection string & IP whitelist in MongoDB Atlas |
| Clerk auth issues | Clear cache, verify Clerk keys in dashboard |
| API calls failing | Check `REACT_APP_API_URL` in `.env` |

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
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

Made with ❤️ for cashew lovers everywhere 🥜

**Last Updated:** April 19, 2026  
**Version:** 2.0.0  
**Status:** Active Development ✨
