# RAG (Retrieval-Augmented Generation) Setup Guide

## Overview
This implementation adds intelligent context retrieval to your Groq chatbot using Pinecone vector database and HuggingFace embeddings.

**What it does:**
- Retrieves relevant products, FAQs, and reviews from your database
- Augments Groq prompts with actual product data
- Provides accurate, context-aware responses instead of generic answers

---

## Prerequisites
- Node.js 16+ already installed
- MongoDB database populated with products
- Groq API key (already configured ✅)

---

## Step 1: Create Pinecone Vector Database

### 1.1 Sign Up for Pinecone
1. Go to [pinecone.io](https://www.pinecone.io) and click "Sign up"
2. Create a free account (free tier includes 1M vectors)
3. Verify email and complete signup

### 1.2 Create a Project
1. Click "Create New Project"
2. Name: `Sawaikar Cashew Store`
3. Region: `gcp-starter` (or your region)
4. Click "Create"

### 1.3 Create an Index
1. In the dashboard, click "Create Index"
2. **Index Name**: `sawaikar-chat`
3. **Dimension**: `384` (for HuggingFace all-MiniLM-L6-v2 model)
4. **Metric**: `cosine`
5. Click "Create Index"

### 1.4 Get API Key
1. In Pinecone dashboard, click on your project name
2. Look for "API Key" section
3. Copy the API key (looks like: `pb-xxx-xxx...`)

---

## Step 2: Configure Environment Variables

### 2.1 Update Backend .env
Edit `backend/.env` and add:

```env
# ============ RAG Configuration ============
RAG_ENABLED=true
PINECONE_API_KEY=your-api-key-here
PINECONE_INDEX_NAME=sawaikar-chat
PINECONE_ENVIRONMENT=gcp-starter
```

**Replace `your-api-key-here`** with the actual API key from Pinecone.

### 2.2 Verify Configuration
Run this to test connection:
```bash
node -e "
require('dotenv').config();
console.log('✅ PINECONE_API_KEY:', process.env.PINECONE_API_KEY ? 'SET ✓' : 'NOT SET ✗');
console.log('✅ RAG_ENABLED:', process.env.RAG_ENABLED);
"
```

---

## Step 3: Index Your Data

### 3.1 Index FAQs (Recommended: Run First)
```bash
cd backend
node scripts/indexFAQs.js
```

**Expected output:**
```
🚀 Starting FAQ indexing...
✅ Found 25 FAQs
🧮 Generating embeddings for FAQs...
   ⏳ Embedded 25/25 FAQs...
📤 Upserting to Pinecone...
✅ FAQ indexing completed!
📊 Statistics:
   - Total FAQs: 25
   - Vectors uploaded: 25
   - Success rate: 100.00%
```

### 3.2 Index Products
```bash
node scripts/indexProducts.js
```

**This will:**
- Fetch all products from MongoDB
- Generate embeddings for each product
- Upload to Pinecone

**Expected duration:** 2-5 minutes (depends on product count)

### 3.3 Index Reviews
```bash
node scripts/indexReviews.js
```

**This will:**
- Fetch customer reviews
- Generate embeddings
- Upload to Pinecone

### 3.4 (Optional) Run All at Once
```bash
node scripts/indexAllData.js
```

This runs all indexing scripts sequentially in the correct order.

---

## Step 4: Verify Vector Database

### 4.1 Check Pinecone Dashboard
1. Go to [app.pinecone.io](https://app.pinecone.io)
2. Click on your project
3. Click on `sawaikar-chat` index
4. Look for vector count (should show total vectors indexed)

### 4.2 Check Vector Count
After indexing completes, each script displays:
```
📈 Pinecone Index Stats:
   - Total vectors: 150
   - Index size: 1.24 MB
```

---

## Step 5: Test RAG Chatbot

### 5.1 Start Backend
```bash
cd backend
npm start
```

### 5.2 Start Frontend
```bash
cd frontend
npm start
```

### 5.3 Test Questions

Try asking your chatbot:

**✅ Product Question**
```
Q: "What's your best cashew for gifting?"

BEFORE RAG: "We have various gift options..."
AFTER RAG: "Our Premium Gift Hamper (₹2,199, 21% OFF) includes 
W180 Grade cashews with elegant packaging. Customers give it 4.8/5 stars."
```

**✅ Dry Fruits Query**
```
Q: "What dry fruits do you sell?"

BEFORE RAG: "We sell premium dry fruits..."
AFTER RAG: "We offer:
• Premium Cashews (W180, W240, W320)
• Almonds, Pistachios, Dates, Figs
• Trail Mix, Granola Bars
• Current bestseller: Trail Mix (₹450)"
```

**✅ Policy Question**
```
Q: "What's your return policy?"

BEFORE RAG: "We accept returns..."
AFTER RAG: "We accept returns within 7 days of delivery. 
The product must be unopened and in original packaging. 
Refunds are processed within 5-7 business days."
```

---

## Troubleshooting

### Problem: "Vector service not initialized"

**Cause:** PINECONE_API_KEY not set or invalid

**Solution:**
1. Check `.env` file for typos
2. Verify API key from Pinecone dashboard
3. Restart Node.js server

```bash
# Verify key is set:
echo $PINECONE_API_KEY
```

### Problem: "Pinecone API Error: Invalid API key"

**Cause:** Wrong or expired API key

**Solution:**
1. Go to Pinecone dashboard
2. Generate new API key
3. Update `.env`

### Problem: "Index not found"

**Cause:** Index name mismatch

**Solution:**
```env
# Make sure index name matches exactly:
PINECONE_INDEX_NAME=sawaikar-chat  # Must match Pinecone index name
```

### Problem: "Embedding dimension mismatch (expected 384, got xxx)"

**Cause:** Vector dimension doesn't match index

**Solution:**
1. Go to Pinecone dashboard
2. Check index dimension (should be 384)
3. If wrong, delete index and recreate with dimension: 384

### Problem: "Embedding model fails to load"

**Cause:** First-run, model needs to download (~100MB)

**Solution:**
- This is normal! First run takes 2-3 minutes
- Subsequent runs are instant

---

## Re-Indexing Data

### When to Re-Index
- After adding new products
- After updating prices/inventory
- After getting new customer reviews

### How to Re-Index

**Option 1: Re-index everything**
```bash
# Clear old vectors
node scripts/indexAllData.js

# Old vectors are replaced
```

**Option 2: Index only new products**
```bash
node scripts/indexProducts.js
```

---

## Advanced Configuration

### Disable RAG (Fallback Mode)
If you want to use only fallback responses temporarily:

```env
RAG_ENABLED=false
```

### Use Different Embedding Model
The default model is `Xenova/all-MiniLM-L6-v2` (384 dimensions).

To use different dimensions, you need to:
1. Create new Pinecone index with proper dimension
2. Update code to use different model
3. Re-index all data

---

## Architecture Summary

```
User Question
       ↓
[Chatbot Widget] (Frontend)
       ↓
[POST /api/chatbot/message] (Backend)
       ↓
[RAG Context Retrieval]
  ├─ Embed user question (HuggingFace)
  ├─ Search Pinecone for relevant data
  └─ Retrieve products, FAQs, reviews
       ↓
[Augment Groq Prompt]
  └─ Add retrieved context to system prompt
       ↓
[Call Groq with Enhanced Context]
  └─ Groq generates accurate response
       ↓
[Return Response to User]
```

---

## Performance Metrics

| Component | Latency | Note |
|-----------|---------|------|
| User message → Vector embedding | ~50ms | Local HuggingFace model |
| Pinecone vector search | ~100ms | Cloud-hosted search |
| Groq API call | ~500-1000ms | LLM response generation |
| **Total Chatbot Response** | **~1.5-2s** | Acceptable for chat UX |

---

## Costs

| Service | Free Tier | Pricing |
|---------|-----------|---------|
| **Pinecone** | 1M vectors | $0.40/1M vectors/month |
| **HuggingFace Embeddings** | Local (included) | Free |
| **Groq** | Limited | Included in existing plan |

**Estimated monthly cost:** ~$25-40 depending on vector count

---

## Next Steps

1. ✅ Set up Pinecone
2. ✅ Index your data
3. ✅ Test chatbot responses
4. Optional: Set up scheduled re-indexing (cron job)
5. Optional: Monitor vector search quality and improve prompts

---

## Support & Debugging

### Enable Verbose Logging
```bash
cd backend
NODE_ENV=development npm start
```

### Check Logs
Look for these log lines:
```
[RAG Context] 🔍 Retrieving context for: "..."
[RAG Context] ✅ Retrieved - Products: 5, FAQs: 3, Reviews: 2
[Groq API] 📤 Sending request...
[Groq API] ✅ Response received successfully
```

### Test Vector Search Directly
```bash
node -e "
const { getVectorService } = require('./services/vectorService');
const RagContextService = require('./services/ragContextService');

(async () => {
  const context = await RagContextService.retrieveContext('best cashew for gifting');
  console.log(JSON.stringify(context, null, 2));
})();
"
```

---

## Files Created/Modified

**Created:**
- `backend/services/vectorService.js` - Pinecone operations
- `backend/services/ragContextService.js` - Context retrieval
- `backend/data/faqData.js` - FAQ knowledge base
- `backend/scripts/indexProducts.js` - Product indexing
- `backend/scripts/indexFAQs.js` - FAQ indexing
- `backend/scripts/indexReviews.js` - Review indexing
- `backend/scripts/indexAllData.js` - Master indexing script

**Modified:**
- `backend/services/chatbotService.js` - Added RAG integration
- `backend/.env` - Added Pinecone config
- `backend/.env.example` - Updated template

---

**🎉 You're all set! Your chatbot is now powered by RAG.**
