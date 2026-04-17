const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    maxlength: 300
  },
  author: {
    name: {
      type: String,
      default: 'Sawaikar Team'
    },
    avatar: String,
    bio: String
  },
  category: {
    type: String,
    enum: ['health', 'recipes', 'sustainability', 'tips', 'news', 'guides'],
    default: 'tips'
  },
  tags: [{
    type: String
  }],
  image: {
    type: String,
    default: './images/blog-default.jpg'
  },
  relatedProducts: [{
    type: String  // Product IDs
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  publishedAt: {
    type: Date
  },
  // SEO
  metaTitle: {
    type: String
  },
  metaDescription: {
    type: String
  },
  // Stats
  viewCount: {
    type: Number,
    default: 0
  },
  likeCount: {
    type: Number,
    default: 0
  },
  // Reading time (calculated)
  readingTime: {
    type: Number,  // in minutes
    default: 5
  }
}, {
  timestamps: true
});

// Index for queries
blogSchema.index({ status: 1, publishedAt: -1 });
blogSchema.index({ category: 1, status: 1 });
blogSchema.index({ tags: 1 });

// Generate slug from title
blogSchema.statics.generateSlug = function(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') +
    '-' + Date.now().toString(36);
};

// Calculate reading time (average 200 words per minute)
blogSchema.pre('save', function(next) {
  if (this.content) {
    const wordCount = this.content.split(/\s+/).length;
    this.readingTime = Math.ceil(wordCount / 200);
  }

  // Generate excerpt if not provided
  if (!this.excerpt && this.content) {
    this.excerpt = this.content.substring(0, 250) + '...';
  }

  // Set publishedAt when status changes to published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  next();
});

// Get published posts
blogSchema.statics.getPublished = async function(limit = 10, category = null) {
  const query = { status: 'published' };
  if (category) {
    query.category = category;
  }

  return this.find(query)
    .sort({ publishedAt: -1 })
    .limit(limit);
};

// Get post by slug
blogSchema.statics.getBySlug = async function(slug) {
  const post = await this.findOne({ slug, status: 'published' });

  if (post) {
    post.viewCount += 1;
    await post.save();
  }

  return post;
};

// Get related posts
blogSchema.statics.getRelated = async function(postId, limit = 3) {
  const post = await this.findById(postId);
  if (!post) return [];

  return this.find({
    _id: { $ne: postId },
    status: 'published',
    $or: [
      { category: post.category },
      { tags: { $in: post.tags } }
    ]
  })
  .sort({ publishedAt: -1 })
  .limit(limit);
};

module.exports = mongoose.model('Blog', blogSchema);
