import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { Link } from 'react-router-dom';
import { FiTag, FiCopy, FiCheck, FiClock, FiShoppingCart, FiPercent, FiGift, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import API_BASE_URL from './config/api';

const AvailableCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async (showToast = false) => {
    try {
      setError(null);
      if (showToast) setIsRefreshing(true);

      const response = await fetch(`${API_BASE_URL}/coupons/available/public`);
      const data = await response.json();

      if (response.ok) {
        setCoupons(data.coupons || []);
        if (showToast) {
          toast.success('Coupons refreshed!');
        }
      } else {
        throw new Error(data.message || 'Failed to fetch coupons');
      }
    } catch (error) {
      console.error('Failed to fetch coupons:', error);
      setError('Unable to load coupons. Please try again.');
      if (showToast) {
        toast.error('Failed to refresh coupons');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchCoupons(true);
  };

  const copyToClipboard = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success(`Coupon code "${code}" copied!`);
      setTimeout(() => setCopiedCode(null), 3000);
    } catch (err) {
      toast.error('Failed to copy code');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDaysRemaining = (expiryDate) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diff = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (isLoading) {
    return (
      <Container>
        <LoadingState>
          <FiTag className="spin" />
          <span>Loading available coupons...</span>
        </LoadingState>
      </Container>
    );
  }

  return (
    <Container>
      {/* Hero Section */}
      <HeroSection>
        <HeroContent>
          <FiGift className="hero-icon" />
          <h1>Available Coupons</h1>
          <p>Save more on your favorite cashews with these exclusive offers</p>
          <RefreshButton onClick={handleRefresh} disabled={isRefreshing}>
            <FiRefreshCw className={isRefreshing ? 'spinning' : ''} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Offers'}
          </RefreshButton>
        </HeroContent>
      </HeroSection>

      {/* Error State */}
      {error && (
        <ErrorBanner>
          <FiAlertCircle />
          <span>{error}</span>
          <button onClick={handleRefresh}>Try Again</button>
        </ErrorBanner>
      )}

      {/* Coupons Grid */}
      <CouponsSection>
        {coupons.length === 0 && !error ? (
          <EmptyState>
            <EmptyIcon>🎟️</EmptyIcon>
            <h3>No Coupons Available Right Now</h3>
            <p>Don't worry! New offers are added regularly. Check back soon or subscribe to our newsletter to get notified about exclusive deals.</p>
            <EmptyActions>
              <ShopButton to="/products">
                <FiShoppingCart /> Shop Now
              </ShopButton>
              <RefreshButtonAlt onClick={handleRefresh}>
                <FiRefreshCw /> Check Again
              </RefreshButtonAlt>
            </EmptyActions>
          </EmptyState>
        ) : (
          <>
            <SectionTitle>
              <span className="count">{coupons.length} offer{coupons.length > 1 ? 's' : ''} available</span>
            </SectionTitle>

            <CouponsGrid>
              {coupons.map((coupon) => {
                const daysLeft = getDaysRemaining(coupon.expiryDate);
                const isExpiringSoon = daysLeft <= 3;

                return (
                  <CouponCard key={coupon._id} $expiringSoon={isExpiringSoon}>
                    {isExpiringSoon && (
                      <ExpiringBadge>Expires Soon!</ExpiringBadge>
                    )}

                    <CouponHeader>
                      <DiscountBadge $type={coupon.discountType}>
                        {coupon.discountType === 'percentage' ? (
                          <>
                            <span className="value">{coupon.discountValue}</span>
                            <span className="symbol">%</span>
                          </>
                        ) : (
                          <>
                            <span className="symbol">₹</span>
                            <span className="value">{coupon.discountValue}</span>
                          </>
                        )}
                        <span className="label">OFF</span>
                      </DiscountBadge>
                    </CouponHeader>

                    <CouponBody>
                      <CouponCode>
                        <span className="code">{coupon.code}</span>
                        <CopyButton
                          onClick={() => copyToClipboard(coupon.code)}
                          $copied={copiedCode === coupon.code}
                        >
                          {copiedCode === coupon.code ? (
                            <><FiCheck /> Copied</>
                          ) : (
                            <><FiCopy /> Copy</>
                          )}
                        </CopyButton>
                      </CouponCode>

                      {coupon.description && (
                        <CouponDescription>{coupon.description}</CouponDescription>
                      )}

                      <CouponDetails>
                        {coupon.minOrderValue > 0 && (
                          <DetailItem>
                            <FiShoppingCart />
                            <span>Min. order: ₹{coupon.minOrderValue}</span>
                          </DetailItem>
                        )}

                        {coupon.maxDiscount && (
                          <DetailItem>
                            <FiPercent />
                            <span>Max discount: ₹{coupon.maxDiscount}</span>
                          </DetailItem>
                        )}

                        <DetailItem $warning={isExpiringSoon}>
                          <FiClock />
                          <span>
                            {daysLeft > 0
                              ? `${daysLeft} day${daysLeft > 1 ? 's' : ''} left`
                              : 'Expires today'}
                          </span>
                        </DetailItem>
                      </CouponDetails>

                      {coupon.usageLimit && (
                        <UsageInfo>
                          <UsageBar>
                            <UsageFill $percent={((coupon.usageLimit - (coupon.usedCount || 0)) / coupon.usageLimit) * 100} />
                          </UsageBar>
                          <span>{coupon.usageLimit - (coupon.usedCount || 0)} uses left</span>
                        </UsageInfo>
                      )}
                    </CouponBody>

                    <CouponFooter>
                      <ApplyLink to="/cart">
                        Apply in Cart <FiShoppingCart />
                      </ApplyLink>
                    </CouponFooter>

                    {/* Decorative elements */}
                    <CouponNotch className="left" />
                    <CouponNotch className="right" />
                  </CouponCard>
                );
              })}
            </CouponsGrid>
          </>
        )}
      </CouponsSection>

      {/* Info Section */}
      <InfoSection>
        <h3>How to use coupons</h3>
        <InfoGrid>
          <InfoCard>
            <span className="step">1</span>
            <h4>Copy Code</h4>
            <p>Click the copy button to copy the coupon code</p>
          </InfoCard>
          <InfoCard>
            <span className="step">2</span>
            <h4>Add Items</h4>
            <p>Add your favorite cashews to the cart</p>
          </InfoCard>
          <InfoCard>
            <span className="step">3</span>
            <h4>Apply & Save</h4>
            <p>Paste the code at checkout and enjoy savings!</p>
          </InfoCard>
        </InfoGrid>
      </InfoSection>
    </Container>
  );
};

// Styled Components
const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const Container = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.bg};
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 16px;
  color: ${({ theme }) => theme.colors.primary};

  .spin {
    font-size: 3rem;
    animation: ${spin} 1s linear infinite;
  }
`;

const HeroSection = styled.div`
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primaryDark} 0%, ${({ theme }) => theme.colors.primary} 50%, ${({ theme }) => theme.colors.accent} 100%);
  padding: 80px 24px;
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
    opacity: 0.5;
  }
`;

const HeroContent = styled.div`
  max-width: 600px;
  margin: 0 auto;
  position: relative;
  z-index: 1;

  .hero-icon {
    font-size: 56px;
    margin-bottom: 20px;
    animation: ${float} 3s ease-in-out infinite;
  }

  h1 {
    font-size: 42px;
    font-weight: 800;
    margin-bottom: 16px;
    text-shadow: 0 2px 4px rgba(0,0,0,0.1);

    @media (max-width: 768px) {
      font-size: 32px;
    }
  }

  p {
    font-size: 18px;
    opacity: 0.95;
    margin-bottom: 24px;
    line-height: 1.6;
  }
`;

const RefreshButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: rgba(255,255,255,0.15);
  color: white;
  border: 2px solid rgba(255,255,255,0.4);
  padding: 12px 28px;
  border-radius: 30px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(4px);

  &:hover:not(:disabled) {
    background: rgba(255,255,255,0.25);
    border-color: rgba(255,255,255,0.6);
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .spinning {
    animation: ${spin} 1s linear infinite;
  }
`;

const ErrorBanner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: #fef2f2;
  color: #dc2626;
  padding: 16px 24px;
  border-bottom: 1px solid #fecaca;

  svg {
    font-size: 20px;
  }

  button {
    background: #dc2626;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;

    &:hover {
      background: #b91c1c;
    }
  }
`;

const CouponsSection = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 60px 24px;
`;

const SectionTitle = styled.div`
  margin-bottom: 36px;
  display: flex;
  align-items: center;
  gap: 12px;

  .count {
    background: linear-gradient(135deg, rgba(139, 111, 71, 0.08) 0%, rgba(139, 111, 71, 0.12) 100%);
    color: ${({ theme }) => theme.colors.primary};
    padding: 10px 24px;
    border-radius: 25px;
    font-weight: 700;
    font-size: 14px;
    box-shadow: ${({ theme }) => theme.colors.shadow};
    border: 1px solid ${({ theme }) => theme.colors.border};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 80px 32px;
  background: ${({ theme }) => theme.colors.bgLight};
  border-radius: 24px;
  box-shadow: ${({ theme }) => theme.colors.shadowMedium};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, ${({ theme }) => theme.colors.primary}, ${({ theme }) => theme.colors.accent}, ${({ theme }) => theme.colors.primary});
    background-size: 200% 100%;
    animation: ${shimmer} 2s linear infinite;
  }

  h3 {
    color: ${({ theme }) => theme.colors.heading};
    margin-bottom: 12px;
    font-size: 26px;
    font-weight: 700;
  }

  p {
    color: ${({ theme }) => theme.colors.text};
    margin-bottom: 32px;
    max-width: 450px;
    margin-left: auto;
    margin-right: auto;
    line-height: 1.7;
    font-size: 15px;
  }
`;

const EmptyIcon = styled.div`
  font-size: 100px;
  margin-bottom: 24px;
  animation: ${float} 3s ease-in-out infinite;
  filter: drop-shadow(0 10px 20px rgba(139, 69, 19, 0.15));
`;

const EmptyActions = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 8px;
`;

const RefreshButtonAlt = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: ${({ theme }) => theme.colors.bgLight};
  color: ${({ theme }) => theme.colors.primary};
  border: 2px solid ${({ theme }) => theme.colors.primary};
  padding: 14px 32px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.bgLight};
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.colors.shadowMedium};
  }
`;

const ShopButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary} 0%, ${({ theme }) => theme.colors.primaryDark} 100%);
  color: ${({ theme }) => theme.colors.bgLight};
  padding: 14px 32px;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 600;
  font-size: 15px;
  transition: all 0.3s ease;
  box-shadow: ${({ theme }) => theme.colors.shadowMedium};

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.colors.shadowLarge};
  }
`;

const CouponsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const CouponCard = styled.div`
  background: ${({ theme }) => theme.colors.bgLight};
  border-radius: 20px;
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.colors.shadow};
  position: relative;
  transition: all 0.3s ease;
  border: ${props => props.$expiringSoon ? `2px solid ${props.theme.colors.warning}` : `1px solid ${props.theme.colors.borderLight}`};

  &:hover {
    transform: translateY(-6px);
    box-shadow: ${({ theme }) => theme.colors.shadowLarge};
  }
`;

const ExpiringBadge = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  background: #f97316;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
`;

const CouponHeader = styled.div`
  background: linear-gradient(135deg, rgba(139, 111, 71, 0.08) 0%, rgba(139, 111, 71, 0.12) 100%);
  padding: 24px;
  text-align: center;
  border-bottom: 2px dashed ${({ theme }) => theme.colors.border};
`;

const DiscountBadge = styled.div`
  display: inline-flex;
  align-items: baseline;
  gap: 2px;
  color: ${({ theme }) => theme.colors.primary};

  .value {
    font-size: 48px;
    font-weight: 800;
    line-height: 1;
  }

  .symbol {
    font-size: 24px;
    font-weight: 700;
  }

  .label {
    font-size: 16px;
    font-weight: 700;
    margin-left: 4px;
  }
`;

const CouponBody = styled.div`
  padding: 24px;
`;

const CouponCode = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${({ theme }) => theme.colors.bgDark};
  border: 2px dashed ${({ theme }) => theme.colors.border};
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 16px;

  .code {
    font-family: monospace;
    font-size: 20px;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.primary};
    letter-spacing: 2px;
  }
`;

const CopyButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: ${props => props.$copied ? props.theme.colors.success : props.theme.colors.primary};
  color: ${({ theme }) => theme.colors.bgLight};
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.$copied ? props.theme.colors.success : props.theme.colors.primaryDark};
  }
`;

const CouponDescription = styled.p`
  color: ${({ theme }) => theme.colors.text};
  font-size: 14px;
  margin-bottom: 16px;
  line-height: 1.5;
`;

const CouponDetails = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
`;

const DetailItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: ${props => props.$warning ? props.theme.colors.warning : props.theme.colors.textLight};
  font-size: 13px;
  background: ${props => props.$warning ? 'rgba(212, 165, 116, 0.1)' : props.theme.colors.bgDark};
  padding: 6px 12px;
  border-radius: 20px;

  svg {
    font-size: 14px;
  }
`;

const UsageInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #888;
`;

const UsageBar = styled.div`
  flex: 1;
  height: 6px;
  background: #e5e5e5;
  border-radius: 3px;
  overflow: hidden;
`;

const UsageFill = styled.div`
  height: 100%;
  width: ${props => props.$percent}%;
  background: linear-gradient(90deg, #22c55e, #4ade80);
  border-radius: 3px;
`;

const CouponFooter = styled.div`
  background: ${({ theme }) => theme.colors.bg};
  padding: 16px 24px;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
`;

const ApplyLink = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  font-weight: 600;
  padding: 10px;
  border-radius: 8px;
  transition: background 0.2s;

  &:hover {
    background: ${({ theme }) => theme.colors.bgDark};
  }
`;

const CouponNotch = styled.div`
  position: absolute;
  top: 50%;
  width: 20px;
  height: 20px;
  background: ${({ theme }) => theme.colors.bg};
  border-radius: 50%;
  transform: translateY(-50%);

  &.left {
    left: -10px;
  }

  &.right {
    right: -10px;
  }
`;

const InfoSection = styled.div`
  background: linear-gradient(180deg, rgba(139, 111, 71, 0.08) 0%, rgba(139, 111, 71, 0.12) 100%);
  padding: 64px 24px;
  text-align: center;

  h3 {
    color: ${({ theme }) => theme.colors.primary};
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 40px;
  }
`;

const InfoGrid = styled.div`
  display: flex;
  justify-content: center;
  gap: 40px;
  max-width: 900px;
  margin: 0 auto;
  flex-wrap: wrap;
`;

const InfoCard = styled.div`
  flex: 1;
  min-width: 220px;
  max-width: 260px;
  text-align: center;
  background: ${({ theme }) => theme.colors.bgLight};
  padding: 32px 24px;
  border-radius: 20px;
  box-shadow: ${({ theme }) => theme.colors.shadow};
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-4px);
  }

  .step {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 50px;
    height: 50px;
    background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary} 0%, ${({ theme }) => theme.colors.primaryDark} 100%);
    color: ${({ theme }) => theme.colors.bgLight};
    border-radius: 50%;
    font-weight: 700;
    font-size: 20px;
    margin-bottom: 16px;
    box-shadow: ${({ theme }) => theme.colors.shadowMedium};
  }

  h4 {
    color: ${({ theme }) => theme.colors.heading};
    margin-bottom: 10px;
    font-size: 18px;
    font-weight: 600;
  }

  p {
    color: ${({ theme }) => theme.colors.text};
    font-size: 14px;
    line-height: 1.6;
  }
`;

export default AvailableCoupons;
