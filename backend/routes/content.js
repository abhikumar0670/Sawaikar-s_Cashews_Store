const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const Product = require('../models/Product');
const { requireAuth, requireAdmin } = require('../middleware/clerkAuth');

// @route   GET /api/content/blogs
// @desc    Get all published blogs (or all blogs with status=all for admin)
// @access  Public
router.get('/blogs', async (req, res) => {
  try {
    const { category, limit, page, status } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Build query - if status=all, don't filter by status (for admin)
    const query = {};
    if (status !== 'all') {
      query.status = 'published';
    } else {
      // Exclude archived for admin, but show drafts and published
      query.status = { $ne: 'archived' };
    }
    if (category) {
      query.category = category;
    }

    const [blogs, total] = await Promise.all([
      Blog.find(query)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .select('-content'),  // Exclude full content for listing
      Blog.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: blogs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get blogs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blogs'
    });
  }
});

// @route   GET /api/content/blogs/:slug
// @desc    Get single blog by slug
// @access  Public
router.get('/blogs/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const blog = await Blog.getBySlug(slug);

    if (!blog) {
      return res.status(404).json({
        success: false,
        error: 'Blog post not found'
      });
    }

    // Get related products
    let relatedProducts = [];
    if (blog.relatedProducts?.length > 0) {
      relatedProducts = await Product.find({
        id: { $in: blog.relatedProducts },
        isArchived: { $ne: true }
      }).select('id name price image');
    }

    // Get related posts
    const relatedPosts = await Blog.getRelated(blog._id, 3);

    res.json({
      success: true,
      data: {
        ...blog.toObject(),
        relatedProducts,
        relatedPosts: relatedPosts.map(p => ({
          slug: p.slug,
          title: p.title,
          excerpt: p.excerpt,
          image: p.image,
          publishedAt: p.publishedAt
        }))
      }
    });
  } catch (error) {
    console.error('Get blog error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blog'
    });
  }
});

// @route   GET /api/content/categories
// @desc    Get blog categories with counts
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await Blog.aggregate([
      { $match: { status: 'published' } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: categories.map(c => ({
        category: c._id,
        count: c.count
      }))
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
});

// @route   POST /api/content/blogs
// @desc    Create new blog post (admin only)
// @access  Admin
router.post('/blogs', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      content,
      excerpt,
      author,
      category,
      tags,
      image,
      relatedProducts,
      status,
      metaTitle,
      metaDescription
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Title and content are required'
      });
    }

    const slug = Blog.generateSlug(title);

    const blog = await Blog.create({
      slug,
      title,
      content,
      excerpt,
      author,
      category: category || 'tips',
      tags: tags || [],
      image,
      relatedProducts: relatedProducts || [],
      status: status || 'draft',
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || excerpt
    });

    res.status(201).json({
      success: true,
      data: blog
    });
  } catch (error) {
    console.error('Create blog error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create blog'
    });
  }
});

// @route   PUT /api/content/blogs/:slug
// @desc    Update blog post (admin only)
// @access  Admin
router.put('/blogs/:slug', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { slug } = req.params;
    const updates = req.body;

    const blog = await Blog.findOneAndUpdate(
      { slug },
      updates,
      { new: true }
    );

    if (!blog) {
      return res.status(404).json({
        success: false,
        error: 'Blog post not found'
      });
    }

    res.json({
      success: true,
      data: blog
    });
  } catch (error) {
    console.error('Update blog error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update blog'
    });
  }
});

// @route   DELETE /api/content/blogs/:slug
// @desc    Delete/archive blog post (admin only)
// @access  Admin
router.delete('/blogs/:slug', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { slug } = req.params;

    const blog = await Blog.findOneAndUpdate(
      { slug },
      { status: 'archived' },
      { new: true }
    );

    if (!blog) {
      return res.status(404).json({
        success: false,
        error: 'Blog post not found'
      });
    }

    res.json({
      success: true,
      message: 'Blog post archived'
    });
  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete blog'
    });
  }
});

// @route   POST /api/content/blogs/seed
// @desc    Seed sample blog posts
// @access  Admin
router.post('/blogs/seed', requireAuth, requireAdmin, async (req, res) => {
  try {
    const sampleBlogs = [
      {
        slug: '5-health-benefits-of-cashews',
        title: '5 Amazing Health Benefits of Cashews You Should Know',
        image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80',
        content: `# 5 Amazing Health Benefits of Cashews

Cashews are not just delicious; they're packed with nutrients that can boost your health in numerous ways. Here are five compelling reasons to include cashews in your diet:

## 1. Heart Health
Cashews are rich in monounsaturated and polyunsaturated fats, which are known to reduce LDL (bad) cholesterol levels. Studies show that people who eat nuts regularly have a lower risk of heart disease.

## 2. Weight Management
Despite being calorie-dense, cashews can actually help with weight management. The protein and fiber content helps you feel full longer, reducing overall calorie intake.

## 3. Strong Bones
Cashews are an excellent source of magnesium and copper, both essential for bone health. Just one ounce provides about 20% of your daily magnesium needs.

## 4. Better Brain Function
The copper in cashews plays a vital role in brain development and function. It helps produce neurotransmitters and maintains the nervous system.

## 5. Improved Eye Health
Cashews contain lutein and zeaxanthin, antioxidants that protect your eyes from damage and may reduce the risk of age-related eye diseases.

**Pro Tip:** For maximum benefits, choose raw or dry-roasted cashews without added salt or sugar.`,
        excerpt: 'Discover why cashews are considered a superfood. From heart health to brain function, learn how these delicious nuts can improve your wellbeing.',
        category: 'health',
        tags: ['health', 'nutrition', 'benefits', 'superfood'],
        status: 'published',
        publishedAt: new Date(),
        relatedProducts: ['sawaikar-premium-w240', 'sawaikar-raw-organic'],
        author: { name: 'Dr. Priya Sawaikar', bio: 'Nutrition Expert' }
      },
      {
        slug: 'homemade-cashew-butter-recipe',
        title: 'How to Make Creamy Homemade Cashew Butter',
        image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
        content: `# Homemade Cashew Butter Recipe

Making cashew butter at home is surprisingly easy and results in a fresher, more flavorful spread than store-bought versions.

## Ingredients
- 2 cups raw or roasted cashews
- 1/4 teaspoon salt (optional)
- 1 tablespoon honey (optional, for sweet version)

## Instructions

### Step 1: Roast (if using raw cashews)
Spread cashews on a baking sheet and roast at 350°F (175°C) for 10-12 minutes until lightly golden.

### Step 2: Blend
Add cooled cashews to a high-powered blender or food processor. Blend for 8-12 minutes, scraping down sides every few minutes.

### Step 3: Be Patient
The cashews will go through stages: crumbly → ball → creamy. Don't give up!

### Step 4: Season
Add salt and honey if desired. Blend for another minute.

### Step 5: Store
Transfer to a glass jar. Keeps for 2-3 weeks at room temperature or 2 months in the refrigerator.

## Tips for Success
- Use room temperature cashews for easier blending
- A high-powered blender works best
- Add a tablespoon of coconut oil if mixture is too thick

Enjoy your homemade cashew butter on toast, with fruits, or in smoothies!`,
        excerpt: 'Learn to make delicious, creamy cashew butter at home with just 3 ingredients. Perfect for spreads, smoothies, and healthy snacking.',
        category: 'recipes',
        tags: ['recipe', 'cashew butter', 'homemade', 'healthy'],
        status: 'published',
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        relatedProducts: ['sawaikar-cashew-butter', 'sawaikar-raw-organic'],
        author: { name: 'Chef Raghav', bio: 'Culinary Expert' }
      },
      {
        slug: 'sustainable-cashew-farming-goa',
        title: 'Sustainable Cashew Farming: Our Commitment to Goa\'s Environment',
        image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80',
        content: `# Sustainable Cashew Farming in Goa

At Sawaikar's, sustainability isn't just a buzzword – it's a way of life. Here's how we're committed to protecting Goa's beautiful environment while producing the finest cashews.

## Our Sustainable Practices

### 1. Organic Farming
We partner with local farmers who practice organic farming, avoiding harmful pesticides and chemicals that can damage the soil and water.

### 2. Water Conservation
Our farms use drip irrigation systems that reduce water consumption by up to 50% compared to traditional methods.

### 3. Biodiversity
We maintain cashew plantations that support local wildlife, including birds, butterflies, and beneficial insects.

### 4. Fair Trade
We ensure our farmers receive fair prices for their harvest, supporting local communities and encouraging sustainable practices.

## The Journey of a Sawaikar Cashew

1. **Growing**: Cashew trees are grown using organic methods
2. **Harvesting**: Hand-picked at peak ripeness
3. **Processing**: Sun-dried naturally
4. **Shelling**: Done locally, creating jobs
5. **Quality Check**: Every batch is tested
6. **Packaging**: Using recyclable materials

## Our Promise

When you buy Sawaikar cashews, you're not just getting premium quality – you're supporting sustainable agriculture and local communities in Goa.

*Together, we can make a difference – one cashew at a time.*`,
        excerpt: 'Learn about our commitment to sustainable farming practices and how we protect Goa\'s environment while producing premium cashews.',
        category: 'sustainability',
        tags: ['sustainability', 'organic', 'farming', 'environment', 'goa'],
        status: 'published',
        publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        relatedProducts: ['sawaikar-raw-organic'],
        author: { name: 'Sawaikar Team', bio: 'Committed to Quality' }
      },
      {
        slug: 'how-to-store-cashews-properly',
        title: 'The Ultimate Guide to Storing Cashews for Maximum Freshness',
        image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&q=80',
        content: `# How to Store Cashews Properly

Nothing ruins the joy of premium cashews faster than discovering they've gone stale. Follow our expert tips to keep your cashews fresh and delicious for months.

## Storage Basics

### Room Temperature Storage
- Store in an airtight container
- Keep in a cool, dark place
- Away from heat sources and sunlight
- Lasts: 2-4 weeks

### Refrigerator Storage
- Use a sealed container or zip-lock bag
- Best for opened packages
- Lasts: 4-6 months

### Freezer Storage
- Ideal for bulk purchases
- Use freezer-safe bags
- Remove air before sealing
- Lasts: Up to 1 year

## Signs Your Cashews Have Gone Bad
- Rancid or paint-like smell
- Bitter taste
- Soft or rubbery texture
- Visible mold

## Pro Tips

1. **Buy in small quantities** if you won't use them quickly
2. **Keep original packaging** if it's resealable
3. **Label with date** when you open the package
4. **Thaw frozen cashews** at room temperature before eating

## Quick Reference Table

| Storage Method | Opened | Unopened |
|---------------|--------|----------|
| Pantry | 2 weeks | 1 month |
| Refrigerator | 6 months | 9 months |
| Freezer | 1 year | 1+ year |

Follow these tips and enjoy fresh, crunchy cashews every time!`,
        excerpt: 'Expert tips on storing cashews to maintain freshness. Learn the best storage methods for pantry, refrigerator, and freezer.',
        category: 'tips',
        tags: ['storage', 'tips', 'freshness', 'guide'],
        status: 'published',
        publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        relatedProducts: ['sawaikar-premium-w240', 'sawaikar-premium-w320'],
        author: { name: 'Sawaikar Team', bio: 'Quality Experts' }
      }
    ];

    // Upsert blogs
    for (const blog of sampleBlogs) {
      await Blog.findOneAndUpdate(
        { slug: blog.slug },
        blog,
        { upsert: true, new: true }
      );
    }

    res.json({
      success: true,
      message: `Seeded ${sampleBlogs.length} blog posts`
    });
  } catch (error) {
    console.error('Seed blogs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to seed blogs'
    });
  }
});

// @route   POST /api/content/blogs/:slug/like
// @desc    Like a blog post
// @access  Public
router.post('/blogs/:slug/like', async (req, res) => {
  try {
    const { slug } = req.params;

    const blog = await Blog.findOneAndUpdate(
      { slug, status: 'published' },
      { $inc: { likeCount: 1 } },
      { new: true }
    );

    if (!blog) {
      return res.status(404).json({
        success: false,
        error: 'Blog post not found'
      });
    }

    res.json({
      success: true,
      likeCount: blog.likeCount
    });
  } catch (error) {
    console.error('Like blog error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to like blog'
    });
  }
});

module.exports = router;
