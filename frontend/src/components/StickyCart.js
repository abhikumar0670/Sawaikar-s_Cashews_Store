import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { NavLink } from 'react-router-dom';
import { FaShoppingCart, FaArrowRight, FaTruck, FaFire, FaLock, FaTimes, FaGift } from 'react-icons/fa';
import { MdTimer, MdLocalOffer } from 'react-icons/md';
import { GiPeanut } from 'react-icons/gi';
import { useCartContext } from '../context/cart_context';

const StickyCart = () => {
  const { cart, total_price, total_item } = useCartContext();
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showUrgency, setShowUrgency] = useState(true);
  const [freeShippingProgress, setFreeShippingProgress] = useState(0);
  const [couponDiscount, setCouponDiscount] = useState(0);

  // Threshold in paise (₹2000 = 200000 paise) - FREE SHIPPING at ₹2000
  const FREE_SHIPPING_THRESHOLD = 200000;
  
  // Use EXACT same calculation as Cart.js
  const calculateOriginalPrice = (price) => Math.ceil(price * 1.2);
  
  const subtotal = total_price;
  const totalOriginalPrice = cart.reduce((total, item) => {
    return total + (calculateOriginalPrice(item.price) * item.amount);
  }, 0);
  
  // Deal of the Day savings (difference between MRP and current price)
  const dealOfTheDaySavings = totalOriginalPrice - subtotal;
  
  // Promotional discount logic based on cart value (EXACT same as Cart.js)
  const getPromotionalDiscount = (amount) => {
    if (amount >= 350000) { // ₹3500 in paise
      return { percentage: 20, label: "Premium Discount" };
    } else if (amount >= 250000) { // ₹2500 in paise
      return { percentage: 10, label: "Special Discount" };
    } else if (amount >= 200000) { // ₹2000 in paise
      return { percentage: 5, label: "Welcome Discount" };
    }
    return { percentage: 0, label: "" };
  };
  
  const promotionalDiscount = getPromotionalDiscount(subtotal);
  const promotionalDiscountAmount = (subtotal * promotionalDiscount.percentage) / 100;
  
  // Shipping fee logic - EXACT same as Cart.js
  const dynamicShippingFee = subtotal >= 200000 ? 0 : 15000; // ₹150 = 15000 paise
  
  // Load coupon from localStorage
  useEffect(() => {
    const loadCoupon = () => {
      const savedCoupon = localStorage.getItem('appliedCoupon');
      if (savedCoupon) {
        try {
          const { discount } = JSON.parse(savedCoupon);
          setCouponDiscount(discount || 0);
        } catch (error) {
          console.error('Error loading coupon:', error);
        }
      } else {
        setCouponDiscount(0);
      }
    };

    loadCoupon(); // Load on mount

    // Listen for storage changes (coupon applied/removed)
    window.addEventListener('storage', loadCoupon);
    return () => window.removeEventListener('storage', loadCoupon);
  }, []);
  
  // Final total = subtotal - deal savings - promo discount - coupon + shipping (EXACT same as Cart.js)
  const finalTotal = subtotal - dealOfTheDaySavings - promotionalDiscountAmount - couponDiscount + dynamicShippingFee;
  
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300 && total_item > 0) {
        setIsVisible(true);
      } else if (window.scrollY < 100) {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [total_item]);

  useEffect(() => {
    setFreeShippingProgress(Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100));
  }, [subtotal]);

  const formatPrice = (price) => {
    // Convert from paise to rupees (divide by 100)
    const priceInRupees = price / 100;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(priceInRupees);
  };

  if (!isVisible || total_item === 0) return null;

  return (
    <>
      {/* Mobile Sticky Bar */}
      <MobileStickyBar>
        <div className="cart-summary" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="cart-icon-wrapper">
            <FaShoppingCart />
            <span className="item-count">{total_item}</span>
          </div>
          <div className="cart-info">
            <span className="total-label">{total_item} item{total_item > 1 ? 's' : ''}</span>
            <span className="total-amount">{formatPrice(finalTotal)}</span>
          </div>
        </div>
        <NavLink to="/cart" className="checkout-btn">
          View Cart <FaArrowRight />
        </NavLink>
      </MobileStickyBar>

      {/* Desktop Sticky Widget */}
      <DesktopStickyWidget className={isExpanded ? 'expanded' : ''}>
        <div className="widget-header" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="cart-indicator">
            <div className="icon-wrapper">
              <FaShoppingCart />
              <span className="badge">{total_item}</span>
            </div>
            {!isExpanded && (
              <div className="mini-info">
                <span>{formatPrice(finalTotal)}</span>
              </div>
            )}
          </div>
          <span className="toggle-arrow">{isExpanded ? '▼' : '▲'}</span>
        </div>

        {isExpanded && (
          <div className="widget-content">
            {/* Free Shipping Progress */}
            {amountToFreeShipping > 0 ? (
              <div className="shipping-progress">
                <div className="progress-header">
                  <FaTruck className="truck-icon" />
                  <span>Add {formatPrice(amountToFreeShipping)} for FREE shipping!</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${freeShippingProgress}%` }} />
                </div>
              </div>
            ) : (
              <div className="free-shipping-unlocked">
                <FaTruck />
                <span>FREE shipping unlocked!</span>
              </div>
            )}

            {/* Cart Items Preview */}
            <div className="items-preview">
              {cart.map((item, index) => (
                <div key={index} className="preview-item">
                  <div className="item-image">
                    {item.image ? (
                      <img src={item.image} alt={item.name} />
                    ) : (
                      <GiPeanut />
                    )}
                  </div>
                  <div className="item-details">
                    <span className="item-name">{item.name}</span>
                    <span className="item-qty">Qty: {item.amount}</span>
                  </div>
                  <span className="item-price">{formatPrice(item.price * item.amount)}</span>
                </div>
              ))}
              {cart.length === 0 && (
                <div className="more-items">
                  Cart is empty
                </div>
              )}
            </div>

            {/* Cart Total with Breakdown */}
            <div className="cart-total-section">
              <div className="subtotal-row">
                <span>Item Subtotal:</span>
                <span className="subtotal-value">{formatPrice(subtotal)}</span>
              </div>
              
              {dealOfTheDaySavings > 0 && (
                <div className="savings-row deal-savings">
                  <span>Deal Savings:</span>
                  <span className="savings-amount">-{formatPrice(dealOfTheDaySavings)}</span>
                </div>
              )}
              
              {promotionalDiscountAmount > 0 && (
                <div className="savings-row promo-savings">
                  <span>{promotionalDiscount.label}:</span>
                  <span className="savings-amount">-{formatPrice(promotionalDiscountAmount)}</span>
                </div>
              )}
              
              {couponDiscount > 0 && (
                <div className="savings-row coupon-savings">
                  <span>Coupon Discount:</span>
                  <span className="savings-amount">-{formatPrice(couponDiscount)}</span>
                </div>
              )}
              
              {dynamicShippingFee === 0 ? (
                <div className="savings-row free-shipping">
                  <span>Shipping:</span>
                  <span className="savings-amount">FREE</span>
                </div>
              ) : (
                <div className="savings-row shipping-fee">
                  <span>Shipping:</span>
                  <span className="fee-amount">+{formatPrice(dynamicShippingFee)}</span>
                </div>
              )}
              
              <div className="divider"></div>
              
              <div className="final-total-row">
                <span className="final-label">Order Total:</span>
                <span className="final-value">{formatPrice(finalTotal)}</span>
              </div>
            </div>

            {/* Urgency Message */}
            {showUrgency && (
              <div className="urgency-message">
                <FaFire className="fire" />
                <span>Items in cart reserved for 15 mins</span>
                <button onClick={() => setShowUrgency(false)}>
                  <FaTimes />
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="action-buttons">
              <NavLink to="/cart" className="view-cart-btn">
                View Cart
              </NavLink>
              <NavLink to="/payment" className="checkout-btn">
                <FaLock /> Secure Checkout
              </NavLink>
            </div>

            {/* Trust Badges */}
            <div className="trust-badges">
              <span><FaLock /> Secure</span>
              <span><FaTruck /> Fast Delivery</span>
              <span><FaGift /> Gift Wrap</span>
            </div>
          </div>
        )}
      </DesktopStickyWidget>

      {/* Urgency Toast (appears periodically) */}
      <UrgencyToast className={total_item > 0 ? 'show' : ''}>
        <MdLocalOffer />
        <span>Limited stock! {total_item > 2 ? 'Great choices' : 'Complete your order'} before it's gone</span>
      </UrgencyToast>
    </>
  );
};

const MobileStickyBar = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.12);
  z-index: 999;

  @media (min-width: 769px) {
    display: none;
  }

  .cart-summary {
    display: flex;
    align-items: center;
    gap: 1rem;
    cursor: pointer;

    .cart-icon-wrapper {
      position: relative;
      width: 4rem;
      height: 4rem;
      background: ${({ theme }) => theme.colors.bg};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;

      svg {
        font-size: 1.8rem;
        color: ${({ theme }) => theme.colors.helper};
      }

      .item-count {
        position: absolute;
        top: -5px;
        right: -5px;
        background: #FF5722;
        color: #fff;
        font-size: 1rem;
        font-weight: 700;
        width: 2rem;
        height: 2rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    .cart-info {
      display: flex;
      flex-direction: column;

      .total-label {
        font-size: 1.2rem;
        color: ${({ theme }) => theme.colors.text};
      }

      .total-amount {
        font-size: 1.6rem;
        font-weight: 700;
        color: ${({ theme }) => theme.colors.heading};
      }
    }
  }

  .checkout-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: linear-gradient(135deg, ${({ theme }) => theme.colors.btn}, #8B4513);
    color: #fff;
    padding: 1.2rem 2rem;
    border-radius: 5rem;
    font-size: 1.4rem;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.02);
    }
  }
`;

const DesktopStickyWidget = styled.div`
  position: fixed;
  bottom: 9rem;
  right: 2rem;
  background: #fff;
  border-radius: 1.5rem;
  box-shadow: 0 10px 40px rgba(139, 69, 19, 0.2);
  z-index: 997;
  min-width: 8rem;
  transition: all 0.3s ease;
  overflow: hidden;

  @media (max-width: 768px) {
    display: none;
  }

  &.expanded {
    min-width: 32rem;
  }

  .widget-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.2rem;
    background: linear-gradient(135deg, ${({ theme }) => theme.colors.btn}, #8B4513);
    color: #fff;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: linear-gradient(135deg, #8B4513, #5D3A1A);
    }
  }

  .cart-indicator {
    display: flex;
    align-items: center;
    gap: 0.8rem;

    .icon-wrapper {
      position: relative;

      svg {
        font-size: 1.6rem;
      }

      .badge {
        position: absolute;
        top: -8px;
        right: -8px;
        background: #FF5722;
        font-size: 0.9rem;
        font-weight: 700;
        width: 1.8rem;
        height: 1.8rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    .mini-info {
      font-size: 1.2rem;
      font-weight: 600;
    }
  }

  .toggle-arrow {
    font-size: 0.9rem;
    opacity: 0.8;
  }

  .widget-content {
    padding: 1.2rem 1.2rem;
  }

  .shipping-progress {
    background: #f5f0e1;
    padding: 0.9rem;
    border-radius: 0.8rem;
    margin-bottom: 1rem;

    .progress-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.1rem;
      color: ${({ theme }) => theme.colors.heading};
      margin-bottom: 0.6rem;

      .truck-icon {
        color: ${({ theme }) => theme.colors.helper};
        font-size: 1.2rem;
      }
    }

    .progress-bar {
      height: 5px;
      background: #e0d5c5;
      border-radius: 10px;
      overflow: hidden;

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #4CAF50, #8BC34A);
        border-radius: 10px;
        transition: width 0.5s ease;
      }
    }
  }

  .free-shipping-unlocked {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    background: linear-gradient(135deg, #4CAF50, #2E7D32);
    color: #fff;
    padding: 0.9rem;
    border-radius: 0.8rem;
    margin-bottom: 1rem;
    font-size: 1.2rem;
    font-weight: 600;
  }

  .items-preview {
    margin-bottom: 1.2rem;
    max-height: 12rem;
    overflow-y: auto;
    padding-right: 0.5rem;
    border-bottom: 1px solid #f0f0f0;
    padding-bottom: 1rem;
    
    /* Custom scrollbar styling */
    &::-webkit-scrollbar {
      width: 5px;
    }
    
    &::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 10px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: #CD853F;
      border-radius: 10px;
      
      &:hover {
        background: #8B4513;
      }
    }

    .preview-item {
      display: flex;
      align-items: center;
      gap: 0.7rem;
      padding: 0.5rem 0;
      border-bottom: 1px solid #f5f5f5;

      &:last-child {
        border-bottom: none;
      }

      .item-image {
        width: 3.5rem;
        height: 3.5rem;
        background: ${({ theme }) => theme.colors.bg};
        border-radius: 0.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        flex-shrink: 0;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        svg {
          font-size: 1.4rem;
          color: ${({ theme }) => theme.colors.helper};
        }
      }

      .item-details {
        flex: 1;
        min-width: 0;

        .item-name {
          display: block;
          font-size: 1rem;
          font-weight: 600;
          color: ${({ theme }) => theme.colors.heading};
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.2;
        }

        .item-qty {
          font-size: 0.9rem;
          color: ${({ theme }) => theme.colors.text};
          opacity: 0.7;
        }
      }

      .item-price {
        font-size: 1.1rem;
        font-weight: 700;
        color: ${({ theme }) => theme.colors.helper};
        flex-shrink: 0;
        white-space: nowrap;
      }
    }

    .more-items {
      text-align: center;
      font-size: 1rem;
      color: ${({ theme }) => theme.colors.helper};
      padding: 0.5rem 0;
      font-weight: 600;
      background: #f5f0e1;
      border-radius: 0.4rem;
      margin-top: 0.3rem;
    }
  }

  .cart-total-section {
    background: #faf9f6;
    padding: 1rem;
    border-radius: 0.8rem;
    margin-bottom: 0.8rem;
    font-size: 1.1rem;

    .subtotal-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      color: ${({ theme }) => theme.colors.text};
      font-weight: 500;
      font-size: 1.05rem;

      .subtotal-value {
        font-weight: 700;
        color: ${({ theme }) => theme.colors.heading};
      }
    }

    .savings-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.4rem 0;
      font-size: 1rem;

      .savings-amount {
        font-weight: 700;
        color: #16a34a;
      }

      .fee-amount {
        font-weight: 700;
        color: #ff9800;
      }

      &.deal-savings,
      &.promo-savings,
      &.coupon-savings {
        color: #4b5563;

        .savings-amount {
          color: #16a34a;
        }
      }

      &.free-shipping {
        color: #4b5563;

        .savings-amount {
          color: #16a34a;
          font-weight: 700;
        }
      }

      &.shipping-fee {
        color: #4b5563;
      }
    }

    .divider {
      height: 1px;
      background: #e5e7eb;
      margin: 0.6rem 0;
    }

    .final-total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.8rem 0;
      font-size: 1.3rem;
      font-weight: 700;
      color: ${({ theme }) => theme.colors.heading};

      .final-label {
        color: ${({ theme }) => theme.colors.text};
        font-weight: 600;
        font-size: 1.1rem;
      }

      .final-value {
        color: #CD853F;
        font-size: 1.4rem;
      }
    }
  }

  .urgency-message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #FFF3E0;
    padding: 0.7rem 0.9rem;
    border-radius: 0.8rem;
    margin-bottom: 1rem;

    .fire {
      color: #FF5722;
      font-size: 1.1rem;
    }

    span {
      flex: 1;
      font-size: 1rem;
      color: #E65100;
    }

    button {
      background: none;
      border: none;
      color: #999;
      cursor: pointer;
      padding: 0.2rem;
    }
  }

  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
    margin-bottom: 1rem;

    a {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 1rem 1.2rem;
      border-radius: 0.8rem;
      font-size: 1.2rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.3s ease;
    }

    .view-cart-btn {
      background: ${({ theme }) => theme.colors.bg};
      color: ${({ theme }) => theme.colors.heading};

      &:hover {
        background: #e0d5c5;
      }
    }

    .checkout-btn {
      background: linear-gradient(135deg, ${({ theme }) => theme.colors.btn}, #8B4513);
      color: #fff;

      &:hover {
        transform: scale(1.02);
        box-shadow: 0 5px 15px rgba(139, 69, 19, 0.3);
      }
    }
  }

  .trust-badges {
    display: flex;
    justify-content: center;
    gap: 1rem;

    span {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.95rem;
      color: ${({ theme }) => theme.colors.text};
      opacity: 0.7;

      svg {
        font-size: 1rem;
        color: #4CAF50;
      }
    }
  }
`;

const UrgencyToast = styled.div`
  position: fixed;
  top: 10rem;
  left: 50%;
  transform: translateX(-50%) translateY(-100px);
  background: linear-gradient(135deg, #FF9800, #F57C00);
  color: #fff;
  padding: 1rem 2rem;
  border-radius: 5rem;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-size: 1.3rem;
  font-weight: 600;
  box-shadow: 0 10px 30px rgba(255, 152, 0, 0.4);
  z-index: 997;
  opacity: 0;
  transition: all 0.5s ease;
  white-space: nowrap;

  @media (max-width: 768px) {
    top: 8rem;
    font-size: 1.1rem;
    padding: 0.8rem 1.5rem;
  }

  &.show {
    animation: slideDown 0.5s ease forwards, fadeOut 0.5s ease 4s forwards;
  }

  @keyframes slideDown {
    to {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
  }

  @keyframes fadeOut {
    to {
      opacity: 0;
      transform: translateX(-50%) translateY(-100px);
    }
  }

  svg {
    font-size: 1.5rem;
  }
`;

export default StickyCart;
