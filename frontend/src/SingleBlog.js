import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { API_ENDPOINTS } from './config/api';
import { FiClock, FiEye, FiHeart, FiShare2, FiChevronLeft, FiCalendar, FiUser, FiTag, FiCopy, FiCheck, FiBookOpen, FiMail } from 'react-icons/fi';
import { FaFacebook, FaTwitter, FaWhatsapp, FaLinkedin } from 'react-icons/fa';
import { MdHealthAndSafety, MdRestaurant, MdEco, MdLightbulb, MdNewspaper, MdMenuBook } from 'react-icons/md';

// Default blog images based on category
const categoryImages = {
  health: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80',
  recipes: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
  sustainability: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80',
  tips: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&q=80',
  news: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80',
  guides: 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=800&q=80',
  default: 'https://images.unsplash.com/photo-1563865436874-9aef32095fad?w=800&q=80'
};

// Get image URL with fallback
const getImageUrl = (blog) => {
  if (blog?.image && blog.image.startsWith('http')) {
    return blog.image;
  }
  return categoryImages[blog?.category] || categoryImages.default;
};

// Simple markdown to HTML converter
const parseMarkdown = (markdown) => {
  if (!markdown) return '';

  let html = markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // Unordered lists
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
    // Line breaks & paragraphs
    .replace(/\n\n/gim, '</p><p>')
    .replace(/\n/gim, '<br/>');

  // Wrap in paragraphs if not already
  if (!html.startsWith('<h') && !html.startsWith('<p>')) {
    html = '<p>' + html + '</p>';
  }

  // Wrap list items in ul/ol
  html = html.replace(/(<li>.*?<\/li>)/gis, (match) => {
    if (!match.includes('<ul>') && !match.includes('<ol>')) {
      return '<ul>' + match + '</ul>';
    }
    return match;
  });

  return html;
};

const SingleBlog = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (slug) {
      loadBlog();
    }
  }, [slug]);

  const loadBlog = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(API_ENDPOINTS.BLOG_BY_SLUG(slug));
      const data = await response.json();

      if (data.success) {
        setBlog(data.data);
        setLikeCount(data.data.likeCount || 0);
        setRelatedPosts(data.data.relatedPosts || []);
        setRelatedProducts(data.data.relatedProducts || []);

        // Check if user has liked this post (stored in localStorage)
        const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]');
        setLiked(likedPosts.includes(slug));
      } else {
        setError(data.error || 'Blog post not found');
      }
    } catch (err) {
      console.error('Failed to load blog:', err);
      setError('Failed to load blog post');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async () => {
    if (liked) return;

    try {
      const response = await fetch(`${API_ENDPOINTS.BLOG_BY_SLUG(slug)}/like`, {
        method: 'POST'
      });
      const data = await response.json();

      if (data.success) {
        setLiked(true);
        setLikeCount(data.likeCount);

        // Save to localStorage
        const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]');
        likedPosts.push(slug);
        localStorage.setItem('likedPosts', JSON.stringify(likedPosts));
      }
    } catch (err) {
      console.error('Failed to like post:', err);
    }
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const title = blog?.title || 'Check out this article';
    const text = blog?.excerpt || '';

    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} - ${url}`)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
    setShowShareMenu(false);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryIcon = (category) => {
    const icons = {
      health: <MdHealthAndSafety size={18} />,
      recipes: <MdRestaurant size={18} />,
      sustainability: <MdEco size={18} />,
      tips: <MdLightbulb size={18} />,
      news: <MdNewspaper size={18} />,
      guides: <MdMenuBook size={18} />
    };
    return icons[category] || <FiBookOpen size={18} />;
  };

  if (isLoading) {
    return (
      <LoadingContainer>
        <LoadingSpinner />
        <span>Loading article...</span>
      </LoadingContainer>
    );
  }

  if (error || !blog) {
    return (
      <ErrorContainer>
        <h2>Article Not Found</h2>
        <p>{error || 'The article you are looking for does not exist.'}</p>
        <BackButton onClick={() => navigate('/blog')}>
          <FiChevronLeft /> Back to Blog
        </BackButton>
      </ErrorContainer>
    );
  }

  return (
    <Container>
      {/* Hero Section */}
      <HeroSection $image={getImageUrl(blog)}>
        <HeroOverlay />
        <HeroContent>
          <BackLink to="/blog">
            <FiChevronLeft /> All Articles
          </BackLink>
          <CategoryTag>
            {getCategoryIcon(blog.category)} {blog.category}
          </CategoryTag>
          <Title>{blog.title}</Title>
          {blog.excerpt && (
            <Excerpt>{blog.excerpt}</Excerpt>
          )}
          <MetaInfo>
            <MetaItem>
              <FiUser />
              {blog.author?.name || 'Sawaikar Team'}
            </MetaItem>
            <MetaItem>
              <FiCalendar />
              {formatDate(blog.publishedAt)}
            </MetaItem>
            <MetaItem>
              <FiClock />
              {blog.readingTime || 5} min read
            </MetaItem>
            <MetaItem>
              <FiEye />
              {blog.viewCount || 0} views
            </MetaItem>
          </MetaInfo>
        </HeroContent>
      </HeroSection>

      {/* Main Content */}
      <ContentWrapper>
        <MainContent>
          {/* Article Content */}
          <ArticleContent
            dangerouslySetInnerHTML={{ __html: parseMarkdown(blog.content) }}
          />

          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
            <TagsSection>
              <FiTag />
              <TagsList>
                {blog.tags.map((tag, index) => (
                  <Tag key={index}>{tag}</Tag>
                ))}
              </TagsList>
            </TagsSection>
          )}

          {/* Engagement Actions */}
          <EngagementSection>
            <LikeButton $liked={liked} onClick={handleLike} disabled={liked}>
              <FiHeart />
              <span>{liked ? 'Liked' : 'Like'}</span>
              <LikeCount>{likeCount}</LikeCount>
            </LikeButton>

            <ShareWrapper>
              <ShareButton onClick={() => setShowShareMenu(!showShareMenu)}>
                <FiShare2 />
                <span>Share</span>
              </ShareButton>
              {showShareMenu && (
                <ShareMenu>
                  <ShareOption onClick={() => handleShare('facebook')}>
                    <FaFacebook /> Facebook
                  </ShareOption>
                  <ShareOption onClick={() => handleShare('twitter')}>
                    <FaTwitter /> Twitter
                  </ShareOption>
                  <ShareOption onClick={() => handleShare('whatsapp')}>
                    <FaWhatsapp /> WhatsApp
                  </ShareOption>
                  <ShareOption onClick={() => handleShare('linkedin')}>
                    <FaLinkedin /> LinkedIn
                  </ShareOption>
                  <ShareOption onClick={copyToClipboard}>
                    {copied ? <FiCheck /> : <FiCopy />} {copied ? 'Copied!' : 'Copy Link'}
                  </ShareOption>
                </ShareMenu>
              )}
            </ShareWrapper>
          </EngagementSection>

          {/* Author Bio */}
          {blog.author && (
            <AuthorSection>
              <AuthorAvatar>
                {blog.author.name?.charAt(0) || 'S'}
              </AuthorAvatar>
              <AuthorInfo>
                <AuthorName>{blog.author.name || 'Sawaikar Team'}</AuthorName>
                <AuthorBio>{blog.author.bio || 'Bringing you the finest cashews from Goa since 1986.'}</AuthorBio>
              </AuthorInfo>
            </AuthorSection>
          )}
        </MainContent>

        {/* Sidebar */}
        <Sidebar>
          {/* Related Products */}
          {relatedProducts && relatedProducts.length > 0 && (
            <SidebarSection>
              <SidebarTitle>Featured Products</SidebarTitle>
              <ProductsList>
                {relatedProducts.map((product, index) => (
                  <ProductCard key={index} to={`/singleproduct/${product.id}`}>
                    <ProductImage>
                      <img src={product.image || '/images/product-default.jpg'} alt={product.name} />
                    </ProductImage>
                    <ProductInfo>
                      <ProductName>{product.name}</ProductName>
                      <ProductPrice>₹{product.price}</ProductPrice>
                    </ProductInfo>
                  </ProductCard>
                ))}
              </ProductsList>
            </SidebarSection>
          )}

          {/* Related Posts */}
          {relatedPosts && relatedPosts.length > 0 && (
            <SidebarSection>
              <SidebarTitle>Related Articles</SidebarTitle>
              <RelatedPostsList>
                {relatedPosts.map((post, index) => (
                  <RelatedPostCard key={index} to={`/blog/${post.slug}`}>
                    <RelatedPostImage>
                      <img src={getImageUrl(post)} alt={post.title} />
                    </RelatedPostImage>
                    <RelatedPostInfo>
                      <RelatedPostTitle>{post.title}</RelatedPostTitle>
                      <RelatedPostDate>{formatDate(post.publishedAt)}</RelatedPostDate>
                    </RelatedPostInfo>
                  </RelatedPostCard>
                ))}
              </RelatedPostsList>
            </SidebarSection>
          )}

          {/* Newsletter CTA */}
          <NewsletterCard>
            <NewsletterIcon>
              <FiMail size={32} />
            </NewsletterIcon>
            <NewsletterTitle>Stay Updated</NewsletterTitle>
            <NewsletterText>Get the latest recipes, health tips, and exclusive offers delivered to your inbox.</NewsletterText>
            <NewsletterButton to="/blog">
              View All Articles
            </NewsletterButton>
          </NewsletterCard>
        </Sidebar>
      </ContentWrapper>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(180deg, #faf9f6 0%, #f5f3f0 100%);
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 24px;
  color: #666;
`;

const LoadingSpinner = styled.div`
  width: 48px;
  height: 48px;
  border: 4px solid #e0e0e0;
  border-top-color: #b45309;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  padding: 32px;

  h2 {
    color: #1a1a2e;
    margin-bottom: 16px;
    font-size: 24px;
    font-weight: 700;
  }

  p {
    color: #666;
    margin-bottom: 32px;
    font-size: 16px;
    line-height: 1.6;
  }
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 28px;
  background: #b45309;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
  font-size: 16px;
  transition: all 0.3s ease;
  letter-spacing: 0.3px;

  &:hover {
    background: #d97706;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(180, 83, 9, 0.25);
  }

  &:active {
    transform: translateY(0);
  }
`;

const HeroSection = styled.div`
  position: relative;
  height: 520px;
  background: ${props => props.$image ? `url(${props.$image})` : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'};
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: flex-end;

  @media (max-width: 1024px) {
    height: 450px;
  }

  @media (max-width: 768px) {
    height: 380px;
  }

  @media (max-width: 480px) {
    height: 300px;
  }
`;

const HeroOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(transparent 10%, rgba(0,0,0,0.85) 100%);
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 1;
  max-width: 1000px;
  width: 100%;
  padding: 80px 60px;
  color: white;

  @media (max-width: 1024px) {
    padding: 60px 48px;
  }

  @media (max-width: 768px) {
    padding: 48px 32px;
  }

  @media (max-width: 480px) {
    padding: 32px 20px;
  }
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.95);
  text-decoration: none;
  font-size: 14px;
  margin-bottom: 24px;
  font-weight: 600;
  padding: 10px 18px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 25px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.2);

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateX(-4px);
  }
`;

const CategoryTag = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(10px);
  padding: 11px 22px;
  border-radius: 25px;
  font-size: 13px;
  font-weight: 700;
  text-transform: capitalize;
  margin-bottom: 24px;
  color: white;
  letter-spacing: 0.8px;
  border: 1px solid rgba(255, 255, 255, 0.25);
`;

const Title = styled.h1`
  font-size: 52px;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 24px;
  letter-spacing: -1.2px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  color: white;

  @media (max-width: 1024px) {
    font-size: 44px;
  }

  @media (max-width: 768px) {
    font-size: 36px;
    line-height: 1.25;
  }

  @media (max-width: 480px) {
    font-size: 28px;
  }
`;

const Excerpt = styled.p`
  font-size: 18px;
  line-height: 1.75;
  color: rgba(255, 255, 255, 0.92);
  margin-bottom: 28px;
  max-width: 800px;
  font-weight: 500;

  @media (max-width: 768px) {
    font-size: 16px;
    line-height: 1.65;
  }
`;

const MetaInfo = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 32px;
`;

const MetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
  letter-spacing: 0.3px;

  svg {
    font-size: 16px;
  }
`;

const ContentWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 56px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 60px 48px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 40px;
    padding: 48px 32px;
  }

  @media (max-width: 768px) {
    padding: 36px 20px;
    gap: 32px;
  }

  @media (max-width: 480px) {
    padding: 24px 16px;
  }
`;

const MainContent = styled.main`
  flex: 1;
`;

const ArticleContent = styled.article`
  background: white;
  padding: 60px 72px;
  border-radius: 16px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
  margin-bottom: 40px;

  @media (max-width: 1024px) {
    padding: 48px 56px;
  }

  @media (max-width: 768px) {
    padding: 36px 28px;
    border-radius: 12px;
  }

  @media (max-width: 480px) {
    padding: 28px 20px;
  }

  /* Remove top margin from first element for proper spacing */
  > *:first-child {
    margin-top: 0;
  }

  /* Main section headings - H2 - Enhanced styling */
  h2 {
    font-size: 24px;
    color: #b45309;
    margin: 40px 0 20px;
    font-weight: 700;
    padding-bottom: 14px;
    border-bottom: 3px solid #fef3c7;
    line-height: 1.35;
    letter-spacing: -0.4px;
    text-transform: capitalize;
  }

  /* Subsection headings - H3 */
  h3 {
    font-size: 19px;
    color: #1f2937;
    margin: 32px 0 16px;
    font-weight: 700;
    line-height: 1.4;
    letter-spacing: -0.2px;
  }

  /* Opening description paragraphs */
  p:first-of-type {
    color: #4b5563;
    font-size: 16px;
    line-height: 1.85;
    margin-bottom: 24px;
    letter-spacing: 0.4px;
    font-weight: 500;
  }

  /* Regular paragraphs - optimized for readability */
  p {
    color: #374151;
    font-size: 16px;
    line-height: 1.8;
    margin-bottom: 18px;
    letter-spacing: 0.3px;
  }

  /* Lists - improved spacing and alignment */
  ul, ol {
    margin: 24px 0;
    padding-left: 32px;
  }

  li {
    color: #374151;
    font-size: 16px;
    line-height: 1.85;
    margin-bottom: 14px;
    padding-left: 10px;
  }

  /* List markers - styled for visual hierarchy */
  ul li::marker {
    color: #b45309;
    font-size: 20px;
    font-weight: 700;
  }

  ol li::marker {
    color: #b45309;
    font-weight: 700;
    font-size: 16px;
  }

  /* Nested lists */
  ul ul, ol ol, ul ol, ol ul {
    margin: 12px 0;
  }

  /* Block quotes - emphasis styling */
  blockquote {
    border-left: 5px solid #b45309;
    margin: 32px 0;
    padding: 24px 32px;
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
    border-radius: 0 12px 12px 0;
    font-style: italic;
    color: #78350f;
    font-size: 16px;
    line-height: 1.8;
    font-weight: 500;
  }

  /* Inline code - subtle styling */
  code {
    background: #fef3c7;
    padding: 5px 12px;
    border-radius: 4px;
    font-family: 'Fira Code', 'Monaco', monospace;
    font-size: 14px;
    color: #92400e;
    font-weight: 600;
  }

  /* Code blocks */
  pre {
    display: block;
    background: #1a1a2e;
    color: #f8f8f2;
    padding: 28px 32px;
    border-radius: 12px;
    overflow-x: auto;
    font-family: 'Fira Code', 'Monaco', monospace;
    font-size: 13px;
    margin: 32px 0;
    line-height: 1.8;
    border: 1px solid #2d2d44;
  }

  /* Tables - professional styling */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 32px 0;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);

    th, td {
      border: 1px solid #f3f4f6;
      padding: 18px 22px;
      text-align: left;
      font-size: 15px;
    }

    th {
      background: linear-gradient(135deg, #b45309 0%, #d97706 100%);
      color: white;
      font-weight: 700;
      font-size: 14px;
      letter-spacing: 0.5px;
    }

    td {
      color: #374151;
      line-height: 1.65;
      font-weight: 400;
    }

    tr:nth-child(even) {
      background: #fafafa;
    }

    tr:hover {
      background: #fef3c7;
      transition: background-color 0.2s ease;
    }
  }

  /* Images - responsive with proper spacing */
  img {
    max-width: 100%;
    height: auto;
    border-radius: 12px;
    margin: 36px 0;
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
    display: block;
  }

  /* Links - consistent styling */
  a {
    color: #b45309;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.2s ease;
    border-bottom: 2px solid transparent;

    &:hover {
      color: #d97706;
      border-bottom-color: #d97706;
    }

    &:active {
      color: #92400e;
    }
  }

  /* Bold text - emphasis */
  strong {
    font-weight: 700;
    color: #1f2937;
  }

  /* Italic text - styles */
  em {
    font-style: italic;
    color: #4b5563;
    font-weight: 500;
  }

  /* Horizontal rules */
  hr {
    border: none;
    border-top: 2px solid #f3f4f6;
    margin: 40px 0;
  }
`;

const TagsSection = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 32px 0;
  margin-top: 24px;
  border-top: 2px solid #f3f4f6;

  svg {
    color: #9ca3af;
    flex-shrink: 0;
    font-size: 18px;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
`;

const TagsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;

const Tag = styled.span`
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
  padding: 12px 22px;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 700;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid #fcd34d;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 16px rgba(180, 83, 9, 0.25);
  }
`;

const EngagementSection = styled.div`
  display: flex;
  gap: 24px;
  padding: 36px 0;
  margin-top: 12px;
  border-top: 2px solid #f3f4f6;
  border-bottom: 2px solid #f3f4f6;

  @media (max-width: 768px) {
    flex-wrap: wrap;
    gap: 16px;
  }
`;

const LikeButton = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 28px;
  background: ${props => props.$liked ? 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)' : 'white'};
  color: ${props => props.$liked ? '#db2777' : '#6b7280'};
  border: 2px solid ${props => props.$liked ? '#db2777' : '#e5e7eb'};
  border-radius: 50px;
  cursor: ${props => props.$liked ? 'default' : 'pointer'};
  font-weight: 700;
  font-size: 15px;
  transition: all 0.3s ease;
  letter-spacing: 0.3px;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%);
    color: #db2777;
    border-color: #db2777;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(219, 39, 119, 0.2);
  }

  svg {
    fill: ${props => props.$liked ? '#db2777' : 'none'};
    font-size: 18px;
  }
`;

const LikeCount = styled.span`
  background: rgba(0,0,0,0.08);
  padding: 4px 12px;
  border-radius: 14px;
  font-size: 13px;
  font-weight: 700;
`;

const ShareWrapper = styled.div`
  position: relative;
`;

const ShareButton = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 28px;
  background: white;
  color: #6b7280;
  border: 2px solid #e5e7eb;
  border-radius: 50px;
  cursor: pointer;
  font-weight: 700;
  font-size: 15px;
  transition: all 0.3s ease;
  letter-spacing: 0.3px;

  &:hover {
    background: #f9fafb;
    border-color: #b45309;
    color: #b45309;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(180, 83, 9, 0.15);
  }

  svg {
    font-size: 18px;
  }
`;

const ShareMenu = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 12px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 6px 24px rgba(0,0,0,0.15);
  padding: 10px 0;
  min-width: 200px;
  z-index: 100;
  border: 1px solid #f3f4f6;
`;

const ShareOption = styled.button`
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 14px 22px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 15px;
  color: #333;
  transition: all 0.2s;
  font-weight: 500;

  &:hover {
    background: #fef3c7;
    color: #b45309;
  }

  svg {
    font-size: 18px;
  }
`;

const AuthorSection = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 32px;
  padding: 48px;
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  border: 2px solid #fde68a;
  margin-top: 32px;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 24px;
    padding: 32px;
  }
`;

const AuthorAvatar = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #b45309 0%, #d97706 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  font-weight: 700;
  flex-shrink: 0;
  box-shadow: 0 8px 24px rgba(180, 83, 9, 0.3);
  border: 4px solid white;
`;

const AuthorInfo = styled.div`
  flex: 1;
`;

const AuthorName = styled.h4`
  font-size: 22px;
  color: #1a1a2e;
  margin-bottom: 12px;
  font-weight: 700;
  letter-spacing: -0.3px;
`;

const AuthorBio = styled.p`
  color: #78350f;
  font-size: 15px;
  line-height: 1.8;
  margin: 0;
`;

const Sidebar = styled.aside`
  @media (max-width: 1024px) {
    order: -1;
  }
`;

const SidebarSection = styled.div`
  background: white;
  padding: 36px;
  border-radius: 16px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
  margin-bottom: 36px;

  @media (max-width: 768px) {
    padding: 28px;
  }
`;

const SidebarTitle = styled.h3`
  font-size: 19px;
  color: #1a1a2e;
  margin-bottom: 28px;
  padding-bottom: 16px;
  border-bottom: 3px solid #fef3c7;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 12px;
  letter-spacing: -0.2px;
`;

const ProductsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const ProductCard = styled(Link)`
  display: flex;
  gap: 16px;
  text-decoration: none;
  padding: 16px;
  border-radius: 12px;
  transition: all 0.3s ease;
  border: 1px solid #f3f4f6;
  background: #fafafa;

  &:hover {
    background: #fef3c7;
    border-color: #fde68a;
    transform: translateX(4px);
    box-shadow: 0 4px 12px rgba(180, 83, 9, 0.1);
  }
`;

const ProductImage = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  ${ProductCard}:hover & img {
    transform: scale(1.08);
  }
`;

const ProductInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
`;

const ProductName = styled.div`
  font-weight: 700;
  color: #1a1a2e;
  font-size: 15px;
  line-height: 1.4;
  transition: color 0.2s;

  ${ProductCard}:hover & {
    color: #b45309;
  }
`;

const ProductPrice = styled.div`
  color: #b45309;
  font-weight: 700;
  font-size: 17px;
  letter-spacing: -0.2px;
`;

const RelatedPostsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const RelatedPostCard = styled(Link)`
  display: flex;
  gap: 16px;
  text-decoration: none;
  padding: 14px;
  border-radius: 12px;
  transition: all 0.3s ease;
  border: 1px solid transparent;
  background: #fafafa;

  &:hover {
    background: #fef3c7;
    border-color: #fde68a;
    transform: translateX(4px);
    box-shadow: 0 4px 12px rgba(180, 83, 9, 0.1);
  }
`;

const RelatedPostImage = styled.div`
  width: 95px;
  height: 75px;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  ${RelatedPostCard}:hover & img {
    transform: scale(1.08);
  }
`;

const RelatedPostInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
`;

const RelatedPostTitle = styled.div`
  font-weight: 700;
  color: #1a1a2e;
  font-size: 15px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.2s;

  ${RelatedPostCard}:hover & {
    color: #b45309;
  }
`;

const RelatedPostDate = styled.div`
  color: #9ca3af;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.2px;
`;

const NewsletterCard = styled.div`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  padding: 48px 36px;
  border-radius: 16px;
  text-align: center;
  color: white;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);

  @media (max-width: 768px) {
    padding: 36px 28px;
  }
`;

const NewsletterIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%);
  color: #1a1a2e;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 28px;
  box-shadow: 0 8px 20px rgba(252, 211, 77, 0.3);
`;

const NewsletterTitle = styled.h4`
  font-size: 22px;
  margin-bottom: 16px;
  font-weight: 700;
  color: white;
  letter-spacing: -0.3px;
`;

const NewsletterText = styled.p`
  font-size: 15px;
  color: rgba(255, 255, 255, 0.88);
  margin-bottom: 32px;
  line-height: 1.75;
  letter-spacing: 0.2px;
`;

const NewsletterButton = styled(Link)`
  display: inline-block;
  background: linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%);
  color: #1a1a2e;
  padding: 14px 36px;
  border-radius: 30px;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.3s ease;
  font-size: 15px;
  letter-spacing: 0.3px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 28px rgba(252, 211, 77, 0.35);
  }
`;

export default SingleBlog;
