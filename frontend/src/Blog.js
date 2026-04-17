import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { Link } from 'react-router-dom';
import { API_ENDPOINTS } from './config/api';
import { FiClock, FiEye, FiArrowRight, FiBookOpen, FiTrendingUp, FiMail, FiStar } from 'react-icons/fi';
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

const Blog = () => {
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    loadBlogs();
    loadCategories();
  }, [selectedCategory, page]);

  const loadBlogs = async () => {
    setIsLoading(true);
    try {
      let url = `${API_ENDPOINTS.BLOGS}?page=${page}&limit=9`;
      if (selectedCategory) {
        url += `&category=${selectedCategory}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setBlogs(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to load blogs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.BLOG_CATEGORIES);
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
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

  const getImageUrl = (blog) => {
    if (blog.image && blog.image.startsWith('http')) {
      return blog.image;
    }
    return categoryImages[blog.category] || categoryImages.default;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getReadingTime = (blog) => {
    return blog.readingTime || Math.ceil((blog.content?.length || 1000) / 1000) || 5;
  };

  return (
    <Container>
      {/* Hero Section */}
      <HeroSection>
        <HeroOverlay />
        <HeroContent>
          <HeroBadge>
            <FiBookOpen /> Our Blog
          </HeroBadge>
          <HeroTitle>Cashew Chronicles</HeroTitle>
          <HeroSubtitle>
            Discover delicious recipes, health benefits, and stories from Goa's finest cashew farms
          </HeroSubtitle>
          <HeroStats>
            <StatItem>
              <StatNumber>{blogs.length || 10}+</StatNumber>
              <StatLabel>Articles</StatLabel>
            </StatItem>
            <StatDivider />
            <StatItem>
              <StatNumber>{categories.length || 6}</StatNumber>
              <StatLabel>Categories</StatLabel>
            </StatItem>
            <StatDivider />
            <StatItem>
              <StatNumber>5K+</StatNumber>
              <StatLabel>Readers</StatLabel>
            </StatItem>
          </HeroStats>
        </HeroContent>
      </HeroSection>

      {/* Categories Filter */}
      <CategoriesWrapper>
        <CategoriesSection>
          <CategoryButton
            $active={!selectedCategory}
            onClick={() => { setSelectedCategory(null); setPage(1); }}
          >
            <span className="icon"><FiStar size={16} /></span>
            All Posts
          </CategoryButton>
          {categories.map((cat) => (
            <CategoryButton
              key={cat.category}
              $active={selectedCategory === cat.category}
              onClick={() => { setSelectedCategory(cat.category); setPage(1); }}
            >
              <span className="icon">{getCategoryIcon(cat.category)}</span>
              {cat.category.charAt(0).toUpperCase() + cat.category.slice(1)}
              <CategoryCount $active={selectedCategory === cat.category}>{cat.count}</CategoryCount>
            </CategoryButton>
          ))}
        </CategoriesSection>
      </CategoriesWrapper>

      {/* Content Section */}
      <ContentSection>
        {isLoading ? (
          <BlogGrid>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonCard key={i}>
                <SkeletonImage />
                <SkeletonContent>
                  <SkeletonLine width="60%" />
                  <SkeletonLine width="100%" />
                  <SkeletonLine width="80%" />
                </SkeletonContent>
              </SkeletonCard>
            ))}
          </BlogGrid>
        ) : blogs.length === 0 ? (
          <EmptyState>
            <EmptyIcon><FiBookOpen size={48} /></EmptyIcon>
            <h3>No articles found</h3>
            <p>We're working on new content. Check back soon!</p>
            <EmptyButton onClick={() => setSelectedCategory(null)}>
              View All Posts
            </EmptyButton>
          </EmptyState>
        ) : (
          <>
            {/* Featured Post (First Post) */}
            {page === 1 && blogs.length > 0 && (
              <FeaturedSection>
                <FeaturedLabel>
                  <FiTrendingUp /> Featured Article
                </FeaturedLabel>
                <FeaturedCard to={`/blog/${blogs[0].slug}`}>
                  <FeaturedImage>
                    <img src={getImageUrl(blogs[0])} alt={blogs[0].title} />
                    <FeaturedOverlay />
                  </FeaturedImage>
                  <FeaturedContent>
                    <FeaturedCategory>{blogs[0].category}</FeaturedCategory>
                    <FeaturedTitle>{blogs[0].title}</FeaturedTitle>
                    <FeaturedExcerpt>{blogs[0].excerpt}</FeaturedExcerpt>
                    <FeaturedMeta>
                      <FeaturedAuthor>
                        <AuthorAvatar>{blogs[0].author?.name?.charAt(0) || 'S'}</AuthorAvatar>
                        <div>
                          <AuthorName>{blogs[0].author?.name || 'Sawaikar Team'}</AuthorName>
                          <AuthorDate>{formatDate(blogs[0].publishedAt)}</AuthorDate>
                        </div>
                      </FeaturedAuthor>
                      <FeaturedStats>
                        <MetaItem><FiClock size={14} /> {getReadingTime(blogs[0])} min</MetaItem>
                        <MetaItem><FiEye size={14} /> {blogs[0].viewCount || 0}</MetaItem>
                      </FeaturedStats>
                    </FeaturedMeta>
                    <ReadMoreBtn>
                      Read Article <FiArrowRight />
                    </ReadMoreBtn>
                  </FeaturedContent>
                </FeaturedCard>
              </FeaturedSection>
            )}

            {/* Blog Grid */}
            <BlogGrid>
              {blogs.slice(page === 1 ? 1 : 0).map((blog) => (
                <BlogCard key={blog.slug} to={`/blog/${blog.slug}`}>
                  <CardImageWrapper>
                    <CardImage src={getImageUrl(blog)} alt={blog.title} />
                    <CardCategory>{blog.category}</CardCategory>
                    <CardOverlay>
                      <OverlayText>Read Article</OverlayText>
                    </CardOverlay>
                  </CardImageWrapper>
                  <CardContent>
                    <CardMeta>
                      <MetaItem><FiClock size={12} /> {getReadingTime(blog)} min read</MetaItem>
                      <MetaDot />
                      <MetaItem><FiEye size={12} /> {blog.viewCount || 0}</MetaItem>
                    </CardMeta>
                    <CardTitle>{blog.title}</CardTitle>
                    <CardExcerpt>{blog.excerpt}</CardExcerpt>
                    <CardFooter>
                      <CardAuthor>
                        <SmallAvatar>{blog.author?.name?.charAt(0) || 'S'}</SmallAvatar>
                        <AuthorDetails>
                          <span className="name">{blog.author?.name || 'Sawaikar Team'}</span>
                          <span className="date">{formatDate(blog.publishedAt)}</span>
                        </AuthorDetails>
                      </CardAuthor>
                      <CardArrow>
                        <FiArrowRight />
                      </CardArrow>
                    </CardFooter>
                  </CardContent>
                </BlogCard>
              ))}
            </BlogGrid>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <PaginationWrapper>
                <PageButton
                  onClick={() => setPage(p => p - 1)}
                  disabled={page === 1}
                >
                  ← Previous
                </PageButton>
                <PageNumbers>
                  {[...Array(pagination.pages)].map((_, i) => (
                    <PageNumber
                      key={i + 1}
                      $active={page === i + 1}
                      onClick={() => setPage(i + 1)}
                    >
                      {i + 1}
                    </PageNumber>
                  ))}
                </PageNumbers>
                <PageButton
                  onClick={() => setPage(p => p + 1)}
                  disabled={page === pagination.pages}
                >
                  Next →
                </PageButton>
              </PaginationWrapper>
            )}
          </>
        )}
      </ContentSection>

      {/* Newsletter CTA */}
      <NewsletterSection>
        <NewsletterCard>
          <NewsletterContent>
            <NewsletterIconWrapper>
              <FiMail size={36} />
            </NewsletterIconWrapper>
            <h2>Never Miss an Update</h2>
            <p>Subscribe to our newsletter for the latest recipes, health tips, and exclusive offers.</p>
            <NewsletterForm onSubmit={(e) => e.preventDefault()}>
              <NewsletterInput type="email" placeholder="Enter your email address" />
              <NewsletterButton type="submit">Subscribe</NewsletterButton>
            </NewsletterForm>
            <NewsletterNote>Join 2,000+ cashew lovers. No spam, ever.</NewsletterNote>
          </NewsletterContent>
        </NewsletterCard>
      </NewsletterSection>
    </Container>
  );
};

// Animations
const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  background: #fafafa;
`;

const HeroSection = styled.div`
  position: relative;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  padding: 100px 24px 80px;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('https://images.unsplash.com/photo-1563865436874-9aef32095fad?w=1600&q=80') center/cover;
    opacity: 0.15;
  }
`;

const HeroOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%);
`;

const HeroContent = styled.div`
  position: relative;
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
  animation: ${fadeInUp} 0.8s ease;
`;

const HeroBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50px;
  color: #fcd34d;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 24px;
`;

const HeroTitle = styled.h1`
  font-size: 56px;
  font-weight: 800;
  color: white;
  margin-bottom: 20px;
  letter-spacing: -1px;

  @media (max-width: 768px) {
    font-size: 36px;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 18px;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.7;
  max-width: 600px;
  margin: 0 auto 40px;

  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const HeroStats = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 32px;
  padding: 20px 40px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatNumber = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: #fcd34d;
`;

const StatLabel = styled.div`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 4px;
`;

const StatDivider = styled.div`
  width: 1px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
`;

const CategoriesWrapper = styled.div`
  background: white;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
`;

const CategoriesSection = styled.div`
  display: flex;
  flex-wrap: nowrap;
  gap: 10px;
  padding: 16px 24px;
  max-width: 1400px;
  margin: 0 auto;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const CategoryButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border: 2px solid ${props => props.$active ? '#b45309' : '#e5e7eb'};
  border-radius: 50px;
  background: ${props => props.$active ? 'linear-gradient(135deg, #b45309 0%, #d97706 100%)' : 'white'};
  color: ${props => props.$active ? 'white' : '#374151'};
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  white-space: nowrap;
  transition: all 0.25s ease;

  .icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &:hover {
    border-color: #b45309;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(180, 83, 9, 0.2);
  }
`;

const CategoryCount = styled.span`
  background: ${props => props.$active ? 'rgba(255,255,255,0.25)' : '#f3f4f6'};
  color: ${props => props.$active ? 'white' : '#6b7280'};
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
`;

const ContentSection = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 48px 24px;
`;

// Loading Skeleton
const SkeletonCard = styled.div`
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
`;

const SkeletonImage = styled.div`
  height: 200px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s infinite;
`;

const SkeletonContent = styled.div`
  padding: 24px;
`;

const SkeletonLine = styled.div`
  height: 16px;
  border-radius: 8px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s infinite;
  margin-bottom: 12px;
  width: ${props => props.width || '100%'};
`;

// Empty State
const EmptyState = styled.div`
  text-align: center;
  padding: 80px 24px;
  background: white;
  border-radius: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);

  h3 {
    font-size: 24px;
    color: #1f2937;
    margin-bottom: 8px;
  }

  p {
    color: #6b7280;
    margin-bottom: 24px;
  }
`;

const EmptyIcon = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  color: #9ca3af;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
`;

const EmptyButton = styled.button`
  padding: 12px 32px;
  background: linear-gradient(135deg, #b45309 0%, #d97706 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(180, 83, 9, 0.3);
  }
`;

// Featured Section
const FeaturedSection = styled.div`
  margin-bottom: 48px;
`;

const FeaturedLabel = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  margin-bottom: 20px;
`;

const FeaturedCard = styled(Link)`
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  background: white;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  text-decoration: none;
  transition: all 0.4s ease;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const FeaturedImage = styled.div`
  position: relative;
  min-height: 400px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @media (max-width: 900px) {
    min-height: 250px;
  }
`;

const FeaturedOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0.1) 100%);
`;

const FeaturedContent = styled.div`
  padding: 48px;
  display: flex;
  flex-direction: column;
  justify-content: center;

  @media (max-width: 768px) {
    padding: 32px 24px;
  }
`;

const FeaturedCategory = styled.div`
  display: inline-block;
  padding: 6px 14px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: 6px;
  margin-bottom: 16px;
  width: fit-content;
`;

const FeaturedTitle = styled.h2`
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.3;
  margin-bottom: 16px;

  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const FeaturedExcerpt = styled.p`
  font-size: 16px;
  color: #6b7280;
  line-height: 1.7;
  margin-bottom: 24px;
`;

const FeaturedMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f3f4f6;
`;

const FeaturedAuthor = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const AuthorAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #b45309 0%, #d97706 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
`;

const AuthorName = styled.div`
  font-weight: 600;
  color: #1f2937;
  font-size: 15px;
`;

const AuthorDate = styled.div`
  color: #9ca3af;
  font-size: 13px;
`;

const FeaturedStats = styled.div`
  display: flex;
  gap: 16px;
`;

const MetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  color: #9ca3af;
  font-size: 14px;
`;

const MetaDot = styled.span`
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #d1d5db;
`;

const ReadMoreBtn = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  background: linear-gradient(135deg, #b45309 0%, #d97706 100%);
  color: white;
  font-weight: 600;
  border-radius: 12px;
  width: fit-content;
  transition: all 0.3s ease;

  ${FeaturedCard}:hover & {
    gap: 12px;
    box-shadow: 0 8px 20px rgba(180, 83, 9, 0.3);
  }
`;

// Blog Grid
const BlogGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 32px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 24px;
  }
`;

const BlogCard = styled(Link)`
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  text-decoration: none;
  transition: all 0.35s ease;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12);
  }
`;

const CardImageWrapper = styled.div`
  position: relative;
  height: 220px;
  overflow: hidden;
`;

const CardImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;

  ${BlogCard}:hover & {
    transform: scale(1.08);
  }
`;

const CardCategory = styled.div`
  position: absolute;
  top: 16px;
  left: 16px;
  padding: 6px 14px;
  background: white;
  color: #b45309;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const CardOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 20px;
  opacity: 0;
  transition: opacity 0.3s ease;

  ${BlogCard}:hover & {
    opacity: 1;
  }
`;

const OverlayText = styled.span`
  color: white;
  font-weight: 600;
  font-size: 14px;
  padding: 8px 20px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 8px;
`;

const CardContent = styled.div`
  padding: 24px;
`;

const CardMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  color: #9ca3af;
  font-size: 13px;
`;

const CardTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.4;
  margin-bottom: 10px;
  transition: color 0.3s ease;

  ${BlogCard}:hover & {
    color: #b45309;
  }
`;

const CardExcerpt = styled.p`
  font-size: 14px;
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 20px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
`;

const CardAuthor = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SmallAvatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #b45309 0%, #d97706 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
`;

const AuthorDetails = styled.div`
  .name {
    display: block;
    font-weight: 600;
    font-size: 13px;
    color: #374151;
  }

  .date {
    display: block;
    font-size: 12px;
    color: #9ca3af;
  }
`;

const CardArrow = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  transition: all 0.3s ease;

  ${BlogCard}:hover & {
    background: linear-gradient(135deg, #b45309 0%, #d97706 100%);
    color: white;
    transform: translateX(4px);
  }
`;

// Pagination
const PaginationWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 48px;
`;

const PageButton = styled.button`
  padding: 12px 24px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  background: white;
  color: #374151;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    border-color: #b45309;
    color: #b45309;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PageNumbers = styled.div`
  display: flex;
  gap: 8px;
`;

const PageNumber = styled.button`
  width: 40px;
  height: 40px;
  border: 2px solid ${props => props.$active ? '#b45309' : '#e5e7eb'};
  border-radius: 10px;
  background: ${props => props.$active ? 'linear-gradient(135deg, #b45309 0%, #d97706 100%)' : 'white'};
  color: ${props => props.$active ? 'white' : '#374151'};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: #b45309;
  }
`;

// Newsletter
const NewsletterSection = styled.div`
  padding: 0 24px 80px;
  max-width: 1400px;
  margin: 0 auto;
`;

const NewsletterCard = styled.div`
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  border-radius: 32px;
  overflow: hidden;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 50%;
    height: 100%;
    background: url('https://images.unsplash.com/photo-1563865436874-9aef32095fad?w=800&q=80') center/cover;
    opacity: 0.1;
  }
`;

const NewsletterContent = styled.div`
  position: relative;
  padding: 64px;
  text-align: center;
  max-width: 600px;
  margin: 0 auto;

  h2 {
    font-size: 36px;
    font-weight: 700;
    color: white;
    margin-bottom: 16px;
  }

  p {
    font-size: 17px;
    color: rgba(255, 255, 255, 0.95);
    margin-bottom: 32px;
    line-height: 1.7;
  }

  @media (max-width: 768px) {
    padding: 48px 24px;

    h2 {
      font-size: 28px;
    }
  }
`;

const NewsletterIconWrapper = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%);
  color: #1a1a2e;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
`;

const NewsletterForm = styled.form`
  display: flex;
  gap: 12px;
  max-width: 460px;
  margin: 0 auto 16px;

  @media (max-width: 500px) {
    flex-direction: column;
  }
`;

const NewsletterInput = styled.input`
  flex: 1;
  padding: 16px 24px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 16px;
  backdrop-filter: blur(10px);

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  &:focus {
    outline: none;
    border-color: #fcd34d;
    background: rgba(255, 255, 255, 0.15);
  }
`;

const NewsletterButton = styled.button`
  padding: 16px 36px;
  background: linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%);
  color: #1a1a2e;
  border: none;
  border-radius: 14px;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(252, 211, 77, 0.4);
  }
`;

const NewsletterNote = styled.p`
  font-size: 14px !important;
  color: rgba(255, 255, 255, 0.8) !important;
  margin-bottom: 0 !important;
  margin-top: 16px !important;
`;

export default Blog;
