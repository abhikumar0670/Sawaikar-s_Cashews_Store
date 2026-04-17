import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaCheck, FaGift, FaPercent, FaStar, FaTruck, FaFire } from 'react-icons/fa';
import { GiPeanut, GiPartyPopper, GiHeartBeats } from 'react-icons/gi';
import { MdLocalOffer, MdTimer } from 'react-icons/md';
import { useCartContext } from '../context/cart_context';
import { toast } from 'react-toastify';

const SmartBundles = () => {
  const navigate = useNavigate();
  const { addToCart } = useCartContext();
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 59 });

  // Countdown timer - resets at midnight
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);

      const diff = midnight - now;

      if (diff <= 0) {
        return { hours: 23, minutes: 59, seconds: 59 };
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return { hours, minutes, seconds };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (num) => String(num).padStart(2, '0');

  const bundles = useMemo(() => [
    {
      id: 'starter',
      name: 'Try It First',
      tagline: 'Perfect for first-time buyers',
      icon: <GiPeanut />,
      badge: 'Most Popular',
      badgeColor: '#FF9800',
      items: [
        {
          id: 'bundle-starter-1',
          name: 'Premium Roasted W240',
          size: '200g',
          originalPrice: 459,
          image: ['/images/premium.jpg'],
          category: 'Cashews',
          company: "Sawaikar's"
        },
        {
          id: 'bundle-starter-2',
          name: 'Salted Cashews',
          size: '100g',
          originalPrice: 229,
          image: ['/images/premium.jpg'],
          category: 'Cashews',
          company: "Sawaikar's"
        }
      ],
      bundlePrice: 549,
      savings: 139,
      savingsPercent: 20,
      benefits: ['Free shipping', 'Freshness guaranteed'],
      cta: 'Try Mini Pack'
    },
    {
      id: 'family',
      name: 'Family Favorite',
      tagline: 'Bestselling combo for daily snacking',
      icon: <GiHeartBeats />,
      badge: 'Best Value',
      badgeColor: '#4CAF50',
      items: [
        {
          id: 'bundle-family-1',
          name: 'Premium Roasted W240',
          size: '500g',
          originalPrice: 899,
          image: ['/images/premium.jpg'],
          category: 'Cashews',
          company: "Sawaikar's"
        },
        {
          id: 'bundle-family-2',
          name: 'Masala Cashews',
          size: '400g',
          originalPrice: 849,
          image: ['/images/premium.jpg'],
          category: 'Cashews',
          company: "Sawaikar's"
        },
        {
          id: 'bundle-family-3',
          name: 'Honey Glazed',
          size: '250g',
          originalPrice: 649,
          image: ['/images/premium.jpg'],
          category: 'Cashews',
          company: "Sawaikar's"
        }
      ],
      bundlePrice: 1899,
      savings: 498,
      savingsPercent: 21,
      benefits: ['Free shipping', '2 free samples', 'Priority packing'],
      cta: 'Add Family Pack'
    },
    {
      id: 'gift',
      name: 'Premium Gift Box',
      tagline: 'Elegant packaging for special occasions',
      icon: <FaGift />,
      badge: 'Festive Special',
      badgeColor: '#9C27B0',
      items: [
        {
          id: 'bundle-gift-1',
          name: 'Signature W180 Grade',
          size: '300g',
          originalPrice: 1199,
          image: ['/images/premium.jpg'],
          category: 'Cashews',
          company: "Sawaikar's"
        },
        {
          id: 'bundle-gift-2',
          name: 'Chocolate Coated',
          size: '200g',
          originalPrice: 599,
          image: ['/images/premium.jpg'],
          category: 'Cashews',
          company: "Sawaikar's"
        },
        {
          id: 'bundle-gift-3',
          name: 'Honey Roasted',
          size: '200g',
          originalPrice: 549,
          image: ['/images/premium.jpg'],
          category: 'Cashews',
          company: "Sawaikar's"
        },
        {
          id: 'bundle-gift-4',
          name: 'Premium Gift Box',
          size: '',
          originalPrice: 199,
          image: ['/images/premium.jpg'],
          category: 'Packaging',
          company: "Sawaikar's"
        }
      ],
      bundlePrice: 2199,
      savings: 347,
      savingsPercent: 14,
      benefits: ['Premium gift wrap', 'Personalized message', 'Express delivery'],
      cta: 'Buy Gift Box',
      isGift: true
    }
  ], []);

  const handleAddBundle = (bundle) => {
    setSelectedBundle(bundle.id);

    // Calculate discounted price per item proportionally
    const totalOriginal = bundle.items.reduce((sum, item) => sum + item.originalPrice, 0);
    const discountRatio = bundle.bundlePrice / totalOriginal;

    // Add each item in the bundle to cart with discounted price
    bundle.items.forEach((item) => {
      const discountedPrice = Math.round(item.originalPrice * discountRatio);
      // Convert to paise (x100) since FormatPrice divides by 100
      const priceInPaise = discountedPrice * 100;

      const productData = {
        id: item.id,
        name: `${item.name}${item.size ? ` (${item.size})` : ''} - ${bundle.name} Bundle`,
        price: priceInPaise,
        image: item.image,
        category: item.category,
        company: item.company,
        selectedWeight: item.size,
        stock: 100,
        isBundle: true,
        bundleId: bundle.id,
        bundleName: bundle.name
      };

      addToCart(item.id, 'default', 1, productData);
    });

    toast.success(`${bundle.name} added to cart! You save ₹${bundle.savings}`, {
      position: 'top-center'
    });

    // Navigate to cart after short delay
    setTimeout(() => {
      setSelectedBundle(null);
      window.scrollTo(0, 0);
      navigate('/cart');
    }, 1500);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <Wrapper>
      <div className="section-header">
        <span className="section-tag">
          <MdLocalOffer /> Smart Bundles
        </span>
        <h2>Save More with Bundles</h2>
        <p>Handpicked combinations with exclusive discounts</p>
      </div>

      <div className="bundles-grid">
        {bundles.map((bundle) => {
          const totalOriginal = bundle.items.reduce((sum, item) => sum + item.originalPrice, 0);

          return (
            <div
              key={bundle.id}
              className={`bundle-card ${bundle.id === 'family' ? 'featured' : ''} ${selectedBundle === bundle.id ? 'selected' : ''}`}
            >
              {bundle.badge && (
                <div className="bundle-badge" style={{ background: bundle.badgeColor }}>
                  <FaStar /> {bundle.badge}
                </div>
              )}

              <div className="bundle-header">
                <div className="bundle-icon">{bundle.icon}</div>
                <h3>{bundle.name}</h3>
                <p className="tagline">{bundle.tagline}</p>
              </div>

              <div className="bundle-items">
                {bundle.items.map((item, index) => (
                  <div key={index} className="item-row">
                    <FaCheck className="check-icon" />
                    <span className="item-name">{item.name}</span>
                    {item.size && <span className="item-size">{item.size}</span>}
                  </div>
                ))}
              </div>

              <div className="price-section">
                <div className="savings-badge">
                  <FaPercent /> Save {bundle.savingsPercent}%
                </div>
                <div className="price-row">
                  <span className="original-price">{formatPrice(totalOriginal)}</span>
                  <span className="bundle-price">{formatPrice(bundle.bundlePrice)}</span>
                </div>
                <div className="savings-amount">
                  You save {formatPrice(bundle.savings)}
                </div>
              </div>

              <div className="benefits-list">
                {bundle.benefits.map((benefit, index) => (
                  <span key={index} className="benefit">
                    <FaCheck /> {benefit}
                  </span>
                ))}
              </div>

              <button
                className={`add-bundle-btn ${selectedBundle === bundle.id ? 'added' : ''}`}
                onClick={() => handleAddBundle(bundle)}
                disabled={selectedBundle === bundle.id}
              >
                {selectedBundle === bundle.id ? (
                  <>
                    <FaCheck /> Added to Cart!
                  </>
                ) : (
                  <>
                    <FaShoppingCart /> {bundle.cta}
                  </>
                )}
              </button>

              {bundle.isGift && (
                <div className="gift-note">
                  <GiPartyPopper /> Perfect for Diwali, Birthdays & Weddings
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Urgency Banner with Live Countdown */}
      <div className="urgency-banner">
        <div className="urgency-content">
          <FaFire className="fire-icon" />
          <div className="urgency-text">
            <strong>Limited Time Offer!</strong>
            <span>Bundle prices valid for orders placed today</span>
          </div>
          <div className="urgency-timer">
            <MdTimer />
            <span className="timer-digits">
              {formatTime(timeLeft.hours)}:{formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
            </span>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="trust-section">
        <div className="trust-badge">
          <FaTruck />
          <span>Free Shipping on Bundles</span>
        </div>
        <div className="trust-badge">
          <FaGift />
          <span>Gift Wrap Available</span>
        </div>
        <div className="trust-badge">
          <GiPeanut />
          <span>100% Premium Quality</span>
        </div>
      </div>
    </Wrapper>
  );
};

const Wrapper = styled.section`
  padding: 6rem 0;
  background: linear-gradient(180deg, #fff 0%, ${({ theme }) => theme.colors.bg} 100%);

  .section-header {
    text-align: center;
    margin-bottom: 4rem;

    .section-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.8rem;
      color: ${({ theme }) => theme.colors.helper};
      font-size: 1.4rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.2rem;
      margin-bottom: 1rem;
    }

    h2 {
      font-size: 3.2rem;
      font-weight: 700;
      color: ${({ theme }) => theme.colors.heading};
      margin-bottom: 1rem;
    }

    p {
      font-size: 1.6rem;
      color: ${({ theme }) => theme.colors.text};
    }
  }

  .bundles-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2.5rem;
    max-width: 120rem;
    margin: 0 auto;
    padding: 0 2rem;
  }

  .bundle-card {
    background: #fff;
    border-radius: 2rem;
    padding: 2.5rem;
    position: relative;
    transition: all 0.3s ease;
    border: 2px solid transparent;
    box-shadow: 0 5px 20px rgba(139, 69, 19, 0.08);

    &:hover {
      transform: translateY(-8px);
      box-shadow: 0 15px 40px rgba(139, 69, 19, 0.15);
    }

    &.featured {
      border-color: ${({ theme }) => theme.colors.helper};
      transform: scale(1.02);

      &:hover {
        transform: scale(1.02) translateY(-8px);
      }
    }

    &.selected {
      border-color: #4CAF50;

      .add-bundle-btn {
        background: #4CAF50 !important;
      }
    }
  }

  .bundle-badge {
    position: absolute;
    top: -1rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #fff;
    padding: 0.6rem 1.5rem;
    border-radius: 5rem;
    font-size: 1.2rem;
    font-weight: 700;
    white-space: nowrap;
  }

  .bundle-header {
    text-align: center;
    padding-top: 1rem;
    margin-bottom: 2rem;

    .bundle-icon {
      width: 6rem;
      height: 6rem;
      background: linear-gradient(135deg, ${({ theme }) => theme.colors.bg}, #f5f0e1);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;

      svg {
        font-size: 2.5rem;
        color: ${({ theme }) => theme.colors.helper};
      }
    }

    h3 {
      font-size: 2rem;
      font-weight: 700;
      color: ${({ theme }) => theme.colors.heading};
      margin-bottom: 0.5rem;
    }

    .tagline {
      font-size: 1.3rem;
      color: ${({ theme }) => theme.colors.text};
      opacity: 0.8;
    }
  }

  .bundle-items {
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: #f9f5eb;
    border-radius: 1rem;

    .item-row {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      padding: 0.8rem 0;
      border-bottom: 1px dashed rgba(139, 69, 19, 0.15);

      &:last-child {
        border-bottom: none;
      }

      .check-icon {
        color: #4CAF50;
        font-size: 1.2rem;
        flex-shrink: 0;
      }

      .item-name {
        flex: 1;
        font-size: 1.3rem;
        color: ${({ theme }) => theme.colors.heading};
      }

      .item-size {
        font-size: 1.2rem;
        color: ${({ theme }) => theme.colors.text};
        opacity: 0.7;
      }
    }
  }

  .price-section {
    text-align: center;
    margin-bottom: 2rem;

    .savings-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: linear-gradient(135deg, #4CAF50, #2E7D32);
      color: #fff;
      padding: 0.5rem 1.2rem;
      border-radius: 5rem;
      font-size: 1.2rem;
      font-weight: 700;
      margin-bottom: 1rem;
    }

    .price-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      margin-bottom: 0.5rem;

      .original-price {
        font-size: 1.6rem;
        color: ${({ theme }) => theme.colors.text};
        text-decoration: line-through;
        opacity: 0.6;
      }

      .bundle-price {
        font-size: 2.8rem;
        font-weight: 800;
        color: ${({ theme }) => theme.colors.helper};
      }
    }

    .savings-amount {
      font-size: 1.3rem;
      color: #4CAF50;
      font-weight: 600;
    }
  }

  .benefits-list {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.8rem;
    margin-bottom: 2rem;

    .benefit {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 1.1rem;
      color: ${({ theme }) => theme.colors.text};

      svg {
        color: #4CAF50;
        font-size: 1rem;
      }
    }
  }

  .add-bundle-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.8rem;
    background: linear-gradient(135deg, ${({ theme }) => theme.colors.btn}, #8B4513);
    color: #fff;
    border: none;
    padding: 1.4rem 2rem;
    border-radius: 1rem;
    font-size: 1.5rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover:not(:disabled) {
      transform: scale(1.02);
      box-shadow: 0 8px 25px rgba(139, 69, 19, 0.3);
    }

    &:disabled {
      cursor: not-allowed;
    }

    &.added {
      background: #4CAF50;
    }
  }

  .gift-note {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px dashed rgba(139, 69, 19, 0.2);
    font-size: 1.2rem;
    color: #9C27B0;
    font-weight: 600;

    svg {
      font-size: 1.4rem;
    }
  }

  .urgency-banner {
    max-width: 120rem;
    margin: 4rem auto 0;
    padding: 0 2rem;

    .urgency-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2rem;
      background: linear-gradient(135deg, #FF5722, #E64A19);
      padding: 1.5rem 3rem;
      border-radius: 1rem;
      color: #fff;

      .fire-icon {
        font-size: 2.5rem;
        animation: pulse 1s ease-in-out infinite;
      }

      .urgency-text {
        strong {
          display: block;
          font-size: 1.6rem;
          margin-bottom: 0.3rem;
        }

        span {
          font-size: 1.3rem;
          opacity: 0.9;
        }
      }

      .urgency-timer {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        background: rgba(255, 255, 255, 0.2);
        padding: 0.8rem 1.5rem;
        border-radius: 5rem;
        font-size: 1.4rem;
        font-weight: 700;

        .timer-digits {
          font-family: 'Courier New', monospace;
          font-size: 1.6rem;
          letter-spacing: 0.1rem;
        }
      }
    }
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
  }

  .trust-section {
    display: flex;
    justify-content: center;
    gap: 4rem;
    margin-top: 4rem;
    flex-wrap: wrap;

    .trust-badge {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      font-size: 1.4rem;
      color: ${({ theme }) => theme.colors.text};

      svg {
        font-size: 2rem;
        color: ${({ theme }) => theme.colors.helper};
      }
    }
  }

  @media (max-width: 1024px) {
    .bundles-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .bundle-card.featured {
      grid-column: span 2;
    }
  }

  @media (max-width: 768px) {
    padding: 4rem 0;

    .section-header h2 {
      font-size: 2.6rem;
    }

    .bundles-grid {
      grid-template-columns: 1fr;
    }

    .bundle-card {
      &.featured {
        grid-column: span 1;
        transform: none;
      }
    }

    .urgency-content {
      flex-direction: column;
      text-align: center;
      gap: 1rem !important;
    }

    .trust-section {
      flex-direction: column;
      gap: 1.5rem;
      align-items: center;
    }
  }
`;

export default SmartBundles;
