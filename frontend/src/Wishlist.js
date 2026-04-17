import React from "react";
import { useNavigate, Link } from 'react-router-dom';
import styled, { keyframes } from "styled-components";
import { FiShoppingCart, FiTrash2, FiStar, FiHeart, FiArrowRight, FiShoppingBag, FiPercent, FiBell, FiShare2 } from "react-icons/fi";
import { useWishlistContext } from "./context/wishlist_context";
import { useCartContext } from "./context/cart_context";
import { notifyAddToCart, notifyRemoveFromWishlist } from "./utils/customToast";
import FormatPrice from "./Helpers/FormatPrice";

const Wishlist = () => {
  const { wishlist, removeFromWishlist } = useWishlistContext();
  const { addToCart, cart } = useCartContext();
  const navigate = useNavigate();

  // Scroll to top on page load
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Helper function to check if item is in stock
  const isItemInStock = (item) => {
    if (item.hasOwnProperty('inStock')) {
      return item.inStock;
    }
    return item.stock > 0;
  };

  const handleAddToCart = (item) => {
    const cartItem = {
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      colors: ["#000000"],
      stock: isItemInStock(item) ? (item.stock || 10) : 0,
      stars: item.rating || item.stars || 4.5,
      reviews: item.reviews || 100,
      company: item.company || "Premium Store"
    };
    addToCart(item.id, "#000000", 1, cartItem);
    notifyAddToCart();
  };

  const handleRemoveFromWishlist = (id) => {
    removeFromWishlist(id);
    notifyRemoveFromWishlist();
  };

  const handleAddAllToCart = () => {
    let addedCount = 0;
    wishlist.forEach((item) => {
      if (isItemInStock(item) && !cart.some(ci => ci.id === item.id + "#000000")) {
        handleAddToCart(item);
        addedCount++;
      }
    });
    if (addedCount > 0) {
      window.scrollTo(0, 0);
      navigate('/cart');
    }
  };

  return (
    <Wrapper>
      {/* Hero Section */}
      <HeroSection>
        <HeroContent>
          <HeroIcon>
            <FiHeart />
          </HeroIcon>
          <h1>My Wishlist</h1>
          <p>Your curated collection of favorite cashews and dry fruits</p>
          {wishlist.length > 0 && (
            <WishlistStats>
              <StatItem>
                <span className="number">{wishlist.length}</span>
                <span className="label">Item{wishlist.length > 1 ? 's' : ''} Saved</span>
              </StatItem>
              <StatDivider />
              <StatItem>
                <span className="number">
                  <FormatPrice price={wishlist.reduce((sum, item) => sum + item.price, 0)} />
                </span>
                <span className="label">Total Value</span>
              </StatItem>
            </WishlistStats>
          )}
        </HeroContent>
      </HeroSection>

      <ContentSection>
        {wishlist.length === 0 ? (
          <EmptyState>
            <EmptyAnimation>
              <EmptyHeart>
                <FiHeart />
              </EmptyHeart>
              <PulseRing $delay="0s" />
              <PulseRing $delay="0.5s" />
              <PulseRing $delay="1s" />
            </EmptyAnimation>

            <EmptyContent>
              <h2>Your Wishlist is Empty</h2>
              <p>Start saving your favorite products and never miss a deal!</p>

              <FeatureCards>
                <FeatureCard>
                  <FeatureIcon className="save">
                    <FiHeart />
                  </FeatureIcon>
                  <h4>Save Favorites</h4>
                  <span>Keep track of products you love</span>
                </FeatureCard>
                <FeatureCard>
                  <FeatureIcon className="deal">
                    <FiPercent />
                  </FeatureIcon>
                  <h4>Track Prices</h4>
                  <span>Get notified about price drops</span>
                </FeatureCard>
                <FeatureCard>
                  <FeatureIcon className="notify">
                    <FiBell />
                  </FeatureIcon>
                  <h4>Never Miss Out</h4>
                  <span>Be first to know when items are back</span>
                </FeatureCard>
                <FeatureCard>
                  <FeatureIcon className="share">
                    <FiShare2 />
                  </FeatureIcon>
                  <h4>Share Lists</h4>
                  <span>Share your favorites with friends</span>
                </FeatureCard>
              </FeatureCards>

              <EmptyActions>
                <ShopButton to="/products">
                  <FiShoppingBag />
                  Browse Products
                  <FiArrowRight className="arrow" />
                </ShopButton>
              </EmptyActions>
            </EmptyContent>
          </EmptyState>
        ) : (
          <>
            {/* Action Bar */}
            <ActionBar>
              <ActionInfo>
                <FiHeart className="icon" />
                <span>{wishlist.length} item{wishlist.length > 1 ? 's' : ''} in your wishlist</span>
              </ActionInfo>
              <ActionButtons>
                <AddAllButton onClick={handleAddAllToCart}>
                  <FiShoppingCart />
                  Add All to Cart
                </AddAllButton>
              </ActionButtons>
            </ActionBar>

            {/* Wishlist Grid */}
            <WishlistGrid>
              {wishlist.map((item) => {
                const isInCart = cart.some(ci => ci.id === item.id + "#000000");
                const inStock = isItemInStock(item);

                return (
                  <WishlistCard key={item.id} $outOfStock={!inStock}>
                    {!inStock && <OutOfStockBadge>Out of Stock</OutOfStockBadge>}
                    {item.discount > 0 && inStock && (
                      <DiscountBadge>{item.discount}% OFF</DiscountBadge>
                    )}

                    <RemoveButton
                      onClick={() => handleRemoveFromWishlist(item.id)}
                      title="Remove from wishlist"
                    >
                      <FiTrash2 />
                    </RemoveButton>

                    <CardImage onClick={() => navigate(`/singleproduct/${item.id}`)}>
                      <img src={item.image} alt={item.name} />
                    </CardImage>

                    <CardContent>
                      <CardTitle onClick={() => navigate(`/singleproduct/${item.id}`)}>
                        {item.name}
                      </CardTitle>

                      <CardRating>
                        <Stars>
                          {[...Array(5)].map((_, i) => (
                            <FiStar
                              key={i}
                              className={i < Math.floor(item.rating || item.stars || 4.5) ? 'filled' : ''}
                            />
                          ))}
                        </Stars>
                        <RatingText>({item.rating || item.stars || 4.5})</RatingText>
                      </CardRating>

                      <CardPricing>
                        <CurrentPrice><FormatPrice price={item.price} /></CurrentPrice>
                        {item.originalPrice && (
                          <OriginalPrice><FormatPrice price={item.originalPrice} /></OriginalPrice>
                        )}
                      </CardPricing>

                      <StockStatus $inStock={inStock}>
                        {inStock ? '✓ In Stock' : '✗ Out of Stock'}
                      </StockStatus>

                      <CardActions>
                        {inStock ? (
                          isInCart ? (
                            <ViewCartButton onClick={() => { window.scrollTo(0, 0); navigate('/cart'); }}>
                              <FiShoppingCart />
                              View in Cart
                            </ViewCartButton>
                          ) : (
                            <AddToCartButton onClick={() => handleAddToCart(item)}>
                              <FiShoppingCart />
                              Add to Cart
                            </AddToCartButton>
                          )
                        ) : (
                          <NotifyButton>
                            <FiBell />
                            Notify When Available
                          </NotifyButton>
                        )}
                      </CardActions>
                    </CardContent>
                  </WishlistCard>
                );
              })}
            </WishlistGrid>

            {/* Continue Shopping CTA */}
            <ContinueShopping>
              <p>Looking for more premium cashews?</p>
              <Link to="/products">
                Continue Shopping <FiArrowRight />
              </Link>
            </ContinueShopping>
          </>
        )}
      </ContentSection>
    </Wrapper>
  );
};

// Animations
const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

const pulse = keyframes`
  0% { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(2.5); opacity: 0; }
`;

const heartBeat = keyframes`
  0%, 100% { transform: scale(1); }
  25% { transform: scale(1.1); }
  50% { transform: scale(1); }
  75% { transform: scale(1.1); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

// Styled Components
const Wrapper = styled.section`
  min-height: 100vh;
  background: #faf9f6;
`;

const HeroSection = styled.div`
  background: linear-gradient(135deg, #8B4513 0%, #A0522D 50%, #D2691E 100%);
  padding: 60px 24px;
  text-align: center;
  color: white;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  }
`;

const HeroContent = styled.div`
  max-width: 600px;
  margin: 0 auto;
  position: relative;
  z-index: 1;

  h1 {
    font-size: 42px;
    font-weight: 700;
    margin-bottom: 12px;
    letter-spacing: -0.5px;

    @media (max-width: 768px) {
      font-size: 32px;
    }
  }

  p {
    font-size: 18px;
    opacity: 0.9;
    margin-bottom: 24px;
  }
`;

const HeroIcon = styled.div`
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  animation: ${heartBeat} 2s ease-in-out infinite;

  svg {
    font-size: 36px;
    fill: white;
    stroke: white;
  }
`;

const WishlistStats = styled.div`
  display: inline-flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 50px;
  padding: 12px 30px;
  gap: 24px;
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;

  .number {
    font-size: 24px;
    font-weight: 700;
  }

  .label {
    font-size: 12px;
    opacity: 0.9;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
`;

const StatDivider = styled.div`
  width: 1px;
  height: 40px;
  background: rgba(255, 255, 255, 0.3);
`;

const ContentSection = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 48px 24px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px 60px;
`;

const EmptyAnimation = styled.div`
  position: relative;
  width: 150px;
  height: 150px;
  margin: 0 auto 40px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const EmptyHeart = styled.div`
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, #8B4513, #D2691E);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${float} 3s ease-in-out infinite;
  position: relative;
  z-index: 2;
  box-shadow: 0 10px 40px rgba(139, 69, 19, 0.3);

  svg {
    font-size: 48px;
    color: white;
    stroke-width: 1.5;
  }
`;

const PulseRing = styled.div`
  position: absolute;
  width: 100px;
  height: 100px;
  border: 3px solid #D2691E;
  border-radius: 50%;
  animation: ${pulse} 2s ease-out infinite;
  animation-delay: ${props => props.$delay};
`;

const EmptyContent = styled.div`
  h2 {
    font-size: 32px;
    color: #333;
    margin-bottom: 12px;
    font-weight: 700;
  }

  > p {
    font-size: 18px;
    color: #666;
    margin-bottom: 40px;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
  }
`;

const FeatureCards = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 40px;
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
`;

const FeatureCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  }

  h4 {
    font-size: 16px;
    color: #333;
    margin: 12px 0 6px;
    font-weight: 600;
  }

  span {
    font-size: 13px;
    color: #888;
    line-height: 1.4;
  }
`;

const FeatureIcon = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;

  svg {
    font-size: 24px;
  }

  &.save {
    background: #FEE2E2;
    color: #DC2626;
  }

  &.deal {
    background: #D1FAE5;
    color: #059669;
  }

  &.notify {
    background: #DBEAFE;
    color: #2563EB;
  }

  &.share {
    background: #F3E8FF;
    color: #9333EA;
  }
`;

const EmptyActions = styled.div`
  display: flex;
  justify-content: center;
`;

const ShopButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
  color: white;
  padding: 16px 32px;
  border-radius: 50px;
  text-decoration: none;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(139, 69, 19, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 25px rgba(139, 69, 19, 0.4);

    .arrow {
      transform: translateX(4px);
    }
  }

  .arrow {
    transition: transform 0.3s ease;
  }
`;

const ActionBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
`;

const ActionInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: #666;
  font-size: 15px;

  .icon {
    color: #DC2626;
    font-size: 20px;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
`;

const AddAllButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #8B4513, #A0522D);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(139, 69, 19, 0.3);
  }
`;

const WishlistGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
`;

const WishlistCard = styled.div`
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  position: relative;
  transition: all 0.3s ease;
  opacity: ${props => props.$outOfStock ? 0.7 : 1};

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  }
`;

const OutOfStockBadge = styled.div`
  position: absolute;
  top: 12px;
  left: 12px;
  background: #EF4444;
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  z-index: 2;
`;

const DiscountBadge = styled.div`
  position: absolute;
  top: 12px;
  left: 12px;
  background: #059669;
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  z-index: 2;
`;

const RemoveButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  svg {
    font-size: 16px;
    color: #DC2626;
  }

  &:hover {
    background: #DC2626;
    transform: scale(1.1);

    svg {
      color: white;
    }
  }
`;

const CardImage = styled.div`
  width: 100%;
  height: 200px;
  overflow: hidden;
  cursor: pointer;
  background: #f8f6f3;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
  }

  &:hover img {
    transform: scale(1.08);
  }
`;

const CardContent = styled.div`
  padding: 20px;
`;

const CardTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
  cursor: pointer;
  transition: color 0.2s;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;

  &:hover {
    color: #8B4513;
  }
`;

const CardRating = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
`;

const Stars = styled.div`
  display: flex;
  gap: 2px;

  svg {
    font-size: 14px;
    color: #ddd;

    &.filled {
      color: #FFC107;
      fill: #FFC107;
    }
  }
`;

const RatingText = styled.span`
  font-size: 13px;
  color: #888;
`;

const CardPricing = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
`;

const CurrentPrice = styled.span`
  font-size: 22px;
  font-weight: 700;
  color: #8B4513;
`;

const OriginalPrice = styled.span`
  font-size: 15px;
  color: #999;
  text-decoration: line-through;
`;

const StockStatus = styled.div`
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 16px;
  color: ${props => props.$inStock ? '#059669' : '#DC2626'};
`;

const CardActions = styled.div`
  display: flex;
  gap: 10px;
`;

const AddToCartButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(135deg, #8B4513, #A0522D);
  color: white;
  border: none;
  padding: 14px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(139, 69, 19, 0.3);
  }
`;

const ViewCartButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #f0f0f0;
  color: #555;
  border: 2px solid #e0e0e0;
  padding: 14px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #e5e5e5;
  }
`;

const NotifyButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #FEF3C7;
  color: #92400E;
  border: 2px solid #FDE68A;
  padding: 14px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #FDE68A;
  }
`;

const ContinueShopping = styled.div`
  text-align: center;
  margin-top: 48px;
  padding: 32px;
  background: linear-gradient(135deg, #FFF8DC 0%, #f5edd6 100%);
  border-radius: 16px;

  p {
    font-size: 16px;
    color: #666;
    margin-bottom: 12px;
  }

  a {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: #8B4513;
    font-weight: 600;
    font-size: 16px;
    text-decoration: none;
    transition: all 0.3s ease;

    &:hover {
      gap: 12px;
    }
  }
`;

export default Wishlist;
