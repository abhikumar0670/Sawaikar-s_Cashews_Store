import styled from "styled-components";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useCartContext } from "./context/cart_context";
import CartItem from "./components/CartItem";
import { NavLink } from "react-router-dom";
import { Button } from "./styles/Button";
import FormatPrice from "./Helpers/FormatPrice";
import { useAuth } from "./context/auth_context";
import emptyCartGif from "./assets/cartGif.gif";
import { FiX, FiCreditCard, FiTag, FiGift, FiCheck, FiTrendingDown, FiAward, FiZap, FiStar } from "react-icons/fi";
import { GiPlantRoots } from "react-icons/gi";
import API_BASE_URL from "./config/api";
// Removed CartSkeleton import - not using it to avoid white screen issues

const API_URL = API_BASE_URL;

// const Cart = () => {
//   const { cart, clearCart, total_price, shipping_fee } = useCartContext();
//   // console.log("🚀 ~ file: Cart.js ~ line 6 ~ Cart ~ cart", cart);

//   const { isAuthenticated, user } = useAuth0();

//   if (cart.length === 0) {
//     return (
//       <EmptyDiv>
//         <h3>No Cart in Item </h3>
//       </EmptyDiv>
//     );
//   }


const Cart = () => {
  const { cart, clearCart, total_price, shipping_fee } = useCartContext();
  const { isAuthenticated, user } = useAuth();
  const [showOffersModal, setShowOffersModal] = useState(false);
  const [showBankTC, setShowBankTC] = useState(false);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showKnowMoreModal, setShowKnowMoreModal] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Changed to false by default

  // Load coupon state from localStorage on mount
  useEffect(() => {
    // Scroll to top on page load
    window.scrollTo(0, 0);
    
    const savedCoupon = localStorage.getItem('appliedCoupon');
    if (savedCoupon) {
      try {
        const { code, type, rewardName } = JSON.parse(savedCoupon);
        // Auto-apply the loyalty coupon
        handleApplyCoupon(code);
      } catch (error) {
        console.error('Error applying saved coupon:', error);
      }
    }
    
    // Fetch available coupons
    axios.get(`${API_URL}/coupons`)
      .then(response => {
        const activeCoupons = response.data.filter(c => c.isActive && new Date(c.expiryDate) > new Date());
        setAvailableCoupons(activeCoupons.slice(0, 3)); // Show max 3 coupons
      })
      .catch(err => console.log('Could not fetch coupons'));
  }, []);

  // Scroll lock effect
  useEffect(() => {
    if (showOffersModal || showKnowMoreModal) {
      // Lock scroll
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = 'var(--scrollbar-width, 0px)';
    } else {
      // Unlock scroll
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    // Cleanup
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [showOffersModal, showKnowMoreModal]);

  const handleApplyCoupon = async (code = couponCode) => {
    if (!code.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }
    
    setCouponLoading(true);
    setCouponError("");
    
    try {
      // Convert subtotal from paise to rupees for API
      const orderAmountRupees = subtotal / 100;
      
      const response = await axios.post(`${API_URL}/coupons/validate`, {
        code: code.toUpperCase(),
        userEmail: user?.email,
        orderAmount: orderAmountRupees
      });
      
      if (response.data.valid) {
        // Discount is in rupees, convert to paise
        const discountInPaise = response.data.coupon.discount * 100;
        
        setCouponApplied(true);
        setCouponDiscount(discountInPaise);
        setAppliedCouponCode(response.data.coupon.code);
        setCouponCode("");
        
        // Save to localStorage
        localStorage.setItem('appliedCoupon', JSON.stringify({
          code: response.data.coupon.code,
          discount: discountInPaise
        }));
        
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
      }
    } catch (error) {
      setCouponError(error.response?.data?.message || "Invalid coupon code");
    } finally {
      setCouponLoading(false);
    }
  };
  
  const handleRemoveCoupon = () => {
    setCouponApplied(false);
    setCouponDiscount(0);
    setAppliedCouponCode("");
    localStorage.removeItem('appliedCoupon');
  };

  // Do NOT clear coupon when proceeding to pay - Payment page will use it and clear after order success
  const handleProceedToPay = () => {
    // Coupon will be cleared in Payment.js after successful order
    // This allows the discount to carry over to the payment page
  };

  // Calculate MRP (original prices) and Deal of the Day savings
  const calculateOriginalPrice = (price) => Math.ceil(price * 1.2);
  
  const subtotal = total_price;
  const totalOriginalPrice = cart.reduce((total, item) => {
    return total + (calculateOriginalPrice(item.price) * item.amount);
  }, 0);
  
  // Deal of the Day savings (difference between MRP and current price)
  const dealOfTheDaySavings = totalOriginalPrice - subtotal;
  
  // Promotional discount logic based on cart value (applied on subtotal)
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
  
  // Total savings = Deal of the Day + Promotional Discount
  const totalSavings = dealOfTheDaySavings + promotionalDiscountAmount;
  
  // Shipping fee logic
  const dynamicShippingFee = subtotal >= 200000 ? 0 : 15000; // ₹150 = 15000 paise
  
  // Final total calculation: Start with subtotal, subtract all discounts (deal savings, promotional discount, and coupon), add shipping
  const finalTotal = subtotal - dealOfTheDaySavings - promotionalDiscountAmount - couponDiscount + dynamicShippingFee;

  // Removed skeleton loader - it was causing white screen issues
  // if (isLoading) {
  //   return (
  //     <Wrapper>
  //       <div className="container">
  //         <CartSkeleton />
  //       </div>
  //     </Wrapper>
  //   );
  // }

  if (cart.length === 0) {
    return (
      <EmptyCartWrapper>
        <div className="empty-cart-container">
          <div className="empty-cart-card">
            <div className="empty-cart-illustration">
              <img src={emptyCartGif} alt="Empty Cart" />
            </div>
            <div className="empty-cart-content">
              <h2>Your Cart is Empty</h2>
              <p>Looks like you haven't added any premium cashews to your cart yet.</p>
              <NavLink to="/products">
                <button className="shop-now-btn">
                  Browse Our Collection
                </button>
              </NavLink>
            </div>
          </div>

          <div className="empty-cart-features">
            <div className="feature-item">
              <span className="feature-icon">🚚</span>
              <div className="feature-text">
                <h4>Free Delivery</h4>
                <p>On orders above Rs. 2000</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon"><GiPlantRoots /></span>
              <div className="feature-text">
                <h4>100% Natural</h4>
                <p>No preservatives added</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon"><FiStar /></span>
              <div className="feature-text">
                <h4>Premium Quality</h4>
                <p>Handpicked Goan cashews</p>
              </div>
            </div>
          </div>
        </div>
      </EmptyCartWrapper>
    );
  }

  return (
    <Wrapper>
      <div className="container">
        <div className="cart-card">
          <div className="cart-header">
            <h1 className="cart-title">Shopping Cart</h1>
            {isAuthenticated && (
              <div className="cart-user--profile">
                <img src={user.picture} alt={user.name} />
                <span className="cart-user--name">{user.name}</span>
              </div>
            )}
          </div>

          <div className="cart_heading grid grid-five-column">
            <p>Item</p>
            <p className="cart-hide">Price</p>
            <p>Quantity</p>
            <p className="cart-hide">Subtotal</p>
            <p>Remove</p>
          </div>
          
          <div className="cart-item">
            {cart.map((curElem) => {
              return <CartItem key={curElem.id} {...curElem} />;
            })}
          </div>
          
          <div className="cart-footer">
            <NavLink to="/products">
              <button className="btn-continue">CONTINUE SHOPPING</button>
            </NavLink>
            <button className="btn-clear" onClick={clearCart}>
              CLEAR CART
            </button>
          </div>
        </div>

        {/* Two Column Layout: Savings + Order Summary */}
        <div className="checkout-container">
          {/* Left Column - Your Total Savings */}
          <div className="savings-summary-card">
            <h2 className="savings-title">Your Total Savings</h2>
            
            {/* Deal of the Day Banner */}
            {dealOfTheDaySavings > 0 && (
              <div className="deal-banner">
                <div className="deal-content">
                  <div className="deal-icon"><FiTrendingDown /></div>
                  <div className="deal-text">
                    <h3>Today's Special Savings</h3>
                    <p>Limited offers on select items - You're saving <strong><FormatPrice price={dealOfTheDaySavings} /></strong> from MRP!</p>
                  </div>
                </div>
                <div className="deal-amount">
                  <FormatPrice price={dealOfTheDaySavings} />
                </div>
              </div>
            )}
            
            {/* Premium Discount Banner */}
            {promotionalDiscount.percentage > 0 && (
              <div className="premium-banner">
                <div className="premium-content">
                  <div className="premium-icon"><FiAward /></div>
                  <div className="premium-text">
                    <h3>{promotionalDiscount.label}</h3>
                    <p>{promotionalDiscount.percentage}% benefit applied to your order</p>
                  </div>
                </div>
                <div className="premium-amount">
                  -<FormatPrice price={promotionalDiscountAmount} />
                </div>
              </div>
            )}
            
            {/* Unlock More Savings */}
            <div className="unlock-savings">
              <div className="unlock-content">
                <div className="unlock-icon"><FiZap /></div>
                <span className="unlock-text">More offers available</span>
              </div>
              <button className="view-offers-btn" onClick={() => setShowOffersModal(true)}>
                VIEW OFFERS
              </button>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="order-summary-card">
            <div className="price-breakdown">
              <div className="price-row">
                <p>Item Subtotal:</p>
                <p><FormatPrice price={subtotal} /></p>
              </div>
              
              {dealOfTheDaySavings > 0 && (
                <div className="price-row savings">
                  <p>Deal of the Day Savings:</p>
                  <p className="negative">-<FormatPrice price={dealOfTheDaySavings} /></p>
                </div>
              )}
              
              {promotionalDiscount.percentage > 0 && (
                <div className="price-row discount">
                  <p>Premium Discount ({promotionalDiscount.percentage}%):</p>
                  <p className="negative">-<FormatPrice price={promotionalDiscountAmount} /></p>
                </div>
              )}
              
              {couponApplied && couponDiscount > 0 && (
                <div className="price-row coupon">
                  <p>Coupon (<strong>{appliedCouponCode}</strong>): <button onClick={handleRemoveCoupon} style={{background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.8rem', marginLeft: '0.5rem'}}>Remove</button></p>
                  <p className="negative coupon-amount">-<FormatPrice price={couponDiscount} /></p>
                </div>
              )}
              
              <div className="price-row shipping">
                <p>Shipping Fee:</p>
                <p className={dynamicShippingFee === 0 ? "free" : ""}>
                  {dynamicShippingFee === 0 ? (
                    <span className="free-shipping">FREE 🚚</span>
                  ) : (
                    <FormatPrice price={dynamicShippingFee} />
                  )}
                </p>
              </div>
              
              <hr className="total-divider" />
              
              <div className="price-row final-total">
                <p>Order Total:</p>
                <p><FormatPrice price={finalTotal} /></p>
              </div>
              
              {subtotal >= 200000 && (
                <div className="free-delivery-badge">
                  <span><FiCheck style={{marginRight: '0.5rem'}} /> FREE Delivery Applied</span>
                </div>
              )}
            </div>

            {/* Proceed to Pay Button inside Order Summary */}
            <NavLink to="/payment" className="payment-link" onClick={handleProceedToPay}>
              <button className="proceed-to-pay-btn">PROCEED TO PAY</button>
            </NavLink>
          </div>
        </div>

        {/* Offers Modal */}
        {showOffersModal && (
          <OffersModalOverlay onClick={() => setShowOffersModal(false)}>
            <OffersModal onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Available Offers</h2>
                <button className="close-btn" onClick={() => setShowOffersModal(false)}>
                  <FiX />
                </button>
              </div>

              <div className="offers-list">
                {/* Bank Offer */}
                <div className="offer-card">
                  <div className="offer-icon">
                    <FiCreditCard />
                  </div>
                  <div className="offer-content">
                    <h3>10% Instant Discount on SBI Credit Cards</h3>
                    <p>Min. purchase value ₹2,500. Max discount ₹750.</p>
                    {showBankTC && (
                      <div className="tc-content">
                        <ul>
                          <li>• Offer valid once per user.</li>
                          <li>• Not applicable on EMI transactions.</li>
                          <li>• Cannot be combined with other offers.</li>
                        </ul>
                      </div>
                    )}
                  </div>
                  <button 
                    className="offer-link" 
                    onClick={() => setShowBankTC(!showBankTC)}
                  >
                    {showBankTC ? "Close T&C" : "T&C Apply"}
                  </button>
                </div>

                <div className="offer-divider"></div>

                {/* Coupon Code Input */}
                <div className="offer-card coupon-input-card">
                  <div className="offer-icon">
                    <FiTag />
                  </div>
                  <div className="offer-content" style={{ flex: 1 }}>
                    <h3>Have a Coupon Code?</h3>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <input
                        type="text"
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                        style={{
                          padding: '0.5rem 0.75rem',
                          border: couponError ? '1px solid #dc2626' : '1px solid #e5e7eb',
                          borderRadius: '0.375rem',
                          fontSize: '0.9rem',
                          fontFamily: 'monospace',
                          flex: 1,
                          textTransform: 'uppercase'
                        }}
                        disabled={couponApplied}
                      />
                      {!couponApplied && (
                        <button 
                          className="apply-btn" 
                          onClick={() => handleApplyCoupon()}
                          disabled={couponLoading}
                          style={{ minWidth: '80px' }}
                        >
                          {couponLoading ? '...' : 'APPLY'}
                        </button>
                      )}
                    </div>
                    {couponError && <p style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.25rem' }}>{couponError}</p>}
                    {couponApplied && (
                      <p style={{ color: '#16a34a', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                        ✓ Coupon {appliedCouponCode} applied! Saving <FormatPrice price={couponDiscount} />
                      </p>
                    )}
                  </div>
                </div>

                {/* Available Coupons */}
                {availableCoupons.length > 0 && !couponApplied && (
                  <>
                    <div className="offer-divider"></div>
                    <div style={{ padding: '0 0.5rem' }}>
                      <h4 style={{ color: '#374151', marginBottom: '0.75rem', fontSize: '0.9rem' }}>Available Coupons</h4>
                      {availableCoupons.map((coupon) => (
                        <div key={coupon._id} className={`offer-card`} style={{ marginBottom: '0.5rem' }}>
                          <div className="offer-icon" style={{ background: '#dcfce7' }}>
                            <FiTag style={{ color: '#16a34a' }} />
                          </div>
                          <div className="offer-content">
                            <h3 style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}>{coupon.code}</h3>
                            <p>{coupon.description}</p>
                            {coupon.minOrderValue > 0 && (
                              <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Min order: ₹{coupon.minOrderValue}</p>
                            )}
                          </div>
                          <button 
                            className="apply-btn" 
                            onClick={() => handleApplyCoupon(coupon.code)}
                            disabled={couponLoading}
                          >
                            APPLY
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div className="offer-divider"></div>

                {/* Partner Offer */}
                <div className="offer-card">
                  <div className="offer-icon">
                    <FiGift />
                  </div>
                  <div className="offer-content">
                    <h3>Free Movie Voucher worth ₹250</h3>
                    <p>Valid on purchase of Flavored Cashews combo packs.</p>
                  </div>
                  <button 
                    className="offer-link" 
                    onClick={() => setShowKnowMoreModal(true)}
                  >
                    Know More
                  </button>
                </div>
              </div>

              {/* Success Toast */}
              {showSuccessToast && (
                <SuccessToast>
                  <FiCheck />
                  <span>Success! Coupon {appliedCouponCode} applied. You saved <FormatPrice price={couponDiscount} /></span>
                </SuccessToast>
              )}
            </OffersModal>
          </OffersModalOverlay>
        )}

        {/* Know More Secondary Modal */}
        {showKnowMoreModal && (
          <SecondaryModalOverlay onClick={() => setShowKnowMoreModal(false)}>
            <SecondaryModal onClick={(e) => e.stopPropagation()}>
              <div className="secondary-header">
                <h3>Movie Voucher Details</h3>
                <button className="close-btn" onClick={() => setShowKnowMoreModal(false)}>
                  <FiX />
                </button>
              </div>
              <div className="secondary-content">
                <p>
                  This voucher is redeemable at partner cinemas for one ticket. 
                  Valid for 3 months from the date of purchase. A unique code will 
                  be sent via email after order delivery.
                </p>
              </div>
              <button 
                className="ok-btn" 
                onClick={() => setShowKnowMoreModal(false)}
              >
                OK, GOT IT
              </button>
            </SecondaryModal>
          </SecondaryModalOverlay>
        )}
      </div>
    </Wrapper>
  );
};

// const EmptyDiv = styled.div`
//   display: grid;
//   place-items: center;
//   height: 50vh;

//   h3 {
//     font-size: 4.2rem;
//     text-transform: capitalize;
//     font-weight: 300;
//   }
// `;


const EmptyCartWrapper = styled.div`
  min-height: 100vh;
  background: #fff8e7;
  padding: 9rem 2rem 4rem;
  display: flex;
  justify-content: center;
  align-items: flex-start;

  .empty-cart-container {
    max-width: 900px;
    width: 100%;
  }

  .empty-cart-card {
    background: white;
    border-radius: 20px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
    padding: 4rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    margin-bottom: 3rem;
  }

  .empty-cart-illustration {
    margin-bottom: 2rem;

    img {
      width: 280px;
      height: auto;
      border-radius: 16px;
    }
  }

  .empty-cart-content {
    h2 {
      font-size: 2.8rem;
      font-weight: 700;
      color: #2d2d2d;
      margin: 0 0 1rem 0;
    }

    p {
      font-size: 1.6rem;
      color: #6b7280;
      margin: 0 0 2.5rem 0;
      max-width: 400px;
      line-height: 1.6;
    }
  }

  .shop-now-btn {
    background: linear-gradient(135deg, #d97706, #f59e0b);
    color: white;
    padding: 1.4rem 3.5rem;
    font-size: 1.6rem;
    font-weight: 600;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    box-shadow: 0 4px 15px rgba(217, 119, 6, 0.3);

    &:hover {
      background: linear-gradient(135deg, #b45309, #d97706);
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(217, 119, 6, 0.4);
    }

    &:active {
      transform: translateY(-1px);
    }
  }

  .empty-cart-features {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
  }

  .feature-item {
    background: white;
    border-radius: 16px;
    padding: 2rem;
    display: flex;
    align-items: center;
    gap: 1.5rem;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
    }

    .feature-icon {
      font-size: 2.8rem;
      background: #fff8e7;
      padding: 1rem;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .feature-text {
      text-align: left;

      h4 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #2d2d2d;
        margin: 0 0 0.4rem 0;
      }

      p {
        font-size: 1.3rem;
        color: #6b7280;
        margin: 0;
      }
    }
  }

  @media (max-width: 768px) {
    padding: 7rem 1rem 3rem;

    .empty-cart-card {
      padding: 3rem 2rem;
    }

    .empty-cart-illustration img {
      width: 200px;
    }

    .empty-cart-content {
      h2 {
        font-size: 2.2rem;
      }

      p {
        font-size: 1.4rem;
      }
    }

    .shop-now-btn {
      padding: 1.2rem 2.5rem;
      font-size: 1.4rem;
    }

    .empty-cart-features {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    .feature-item {
      padding: 1.5rem;

      .feature-icon {
        font-size: 2.4rem;
      }

      .feature-text {
        h4 {
          font-size: 1.4rem;
        }

        p {
          font-size: 1.2rem;
        }
      }
    }
  }
`;

const Wrapper = styled.section`
  padding: 9rem 0;
  background: linear-gradient(135deg, #FFF8E7 0%, #F5E6D3 100%);
  min-height: 100vh;

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
  }

  .cart-card {
    background: #F5F1E8;
    border-radius: 20px;
    box-shadow: 0 4px 24px rgba(139, 69, 19, 0.12);
    padding: 3.5rem;
    margin-bottom: 3rem;
    border: 1px solid rgba(139, 69, 19, 0.08);
  }

  .cart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 3rem;
    padding-bottom: 2.5rem;
    border-bottom: 2px solid rgba(139, 69, 19, 0.1);
  }

  .cart-title {
    font-size: 2.8rem;
    font-weight: 800;
    color: #5A4A3A;
    margin: 0;
    text-transform: capitalize;
    letter-spacing: -0.02em;
  }

  .cart-user--profile {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    background: white;
    padding: 1rem 1.8rem;
    border-radius: 50px;
    box-shadow: 0 2px 12px rgba(139, 69, 19, 0.08);
    transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);

    &:hover {
      box-shadow: 0 4px 16px rgba(139, 69, 19, 0.12);
      transform: translateY(-2px);
    }

    img {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #C19A6B;
    }

    .cart-user--name {
      font-size: 1.6rem;
      font-weight: 600;
      color: #5A4A3A;
      text-transform: capitalize;
    }
  }

  .grid-five-column {
    display: grid;
    grid-template-columns: 2fr 1fr 1.2fr 1fr 0.5fr;
    gap: 2rem;
    align-items: center;
    text-align: left;
  }

  .cart_heading {
    padding: 1.8rem 0;
    border-bottom: 2px solid rgba(139, 69, 19, 0.1);
    margin-bottom: 2.5rem;

    p {
      font-size: 1.3rem;
      font-weight: 700;
      color: #8B6F47;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin: 0;
    }
  }

  .cart-item {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    margin-bottom: 2.5rem;
  }

  .cart-image--name {
    display: flex;
    align-items: center;
    gap: 1.8rem;
    text-align: left;

    img {
      width: 90px;
      height: 90px;
      object-fit: cover;
      border-radius: 12px;
      border: 2px solid rgba(139, 69, 19, 0.1);
      box-shadow: 0 2px 8px rgba(139, 69, 19, 0.08);
      transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);

      &:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(139, 69, 19, 0.15);
      }
    }

    div {
      p {
        font-size: 1.6rem;
        font-weight: 600;
        color: #5A4A3A;
        margin: 0;
        line-height: 1.5;
      }
    }
  }

  .remove_icon {
    font-size: 2.2rem;
    color: #ef4444;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
    padding: 0.8rem;
    border-radius: 8px;
    background: rgba(239, 68, 68, 0.05);

    &:hover {
      color: #dc2626;
      background: rgba(239, 68, 68, 0.1);
      transform: scale(1.15) rotate(5deg);
    }

    &:active {
      transform: scale(0.95);
    }
  }

  .cart-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 2.5rem;
    border-top: 2px solid rgba(139, 69, 19, 0.1);
    gap: 2rem;

    a {
      text-decoration: none;
    }

    button {
      padding: 1.4rem 3rem;
      font-size: 1.4rem;
      font-weight: 700;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
      letter-spacing: 0.05em;
      border: none;
      text-transform: uppercase;
    }

    .btn-continue {
      background: white;
      color: #8B6F47;
      border: 2px solid #8B6F47;
      box-shadow: 0 2px 8px rgba(139, 111, 71, 0.15);

      &:hover {
        background: linear-gradient(135deg, #8B6F47, #C19A6B);
        color: white;
        transform: translateY(-3px);
        box-shadow: 0 6px 20px rgba(139, 111, 71, 0.3);
      }
    }

    .btn-clear {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
      box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);

      &:hover {
        background: linear-gradient(135deg, #dc2626, #b91c1c);
        transform: translateY(-3px);
        box-shadow: 0 6px 20px rgba(239, 68, 68, 0.35);
      }
    }
  }

  /* Two Column Layout Container */
  .checkout-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3rem;
    margin-top: 3rem;
  }

  /* Order Savings Summary Card (Left Column) */
  .savings-summary-card {
    background: #F5F1E8;
    border-radius: 20px;
    box-shadow: 0 4px 24px rgba(139, 69, 19, 0.12);
    padding: 3.5rem;
    height: fit-content;
    border: 1px solid rgba(139, 69, 19, 0.08);
  }

  .savings-title {
    font-size: 2.4rem;
    font-weight: 800;
    color: #5A4A3A;
    margin: 0 0 2.5rem 0;
    text-align: center;
    letter-spacing: -0.02em;
  }

  .deal-banner {
    background: linear-gradient(135deg, #8B6F47 0%, #C19A6B 100%);
    border-radius: 16px;
    padding: 2.5rem;
    margin-bottom: 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 4px 16px rgba(139, 111, 71, 0.2);
    transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
    border: 1px solid rgba(139, 111, 71, 0.15);
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%);
      pointer-events: none;
    }

    .deal-content {
      display: flex;
      align-items: flex-start;
      gap: 1.8rem;
      flex: 1;
      position: relative;
      z-index: 1;

      .deal-icon {
        font-size: 2.4rem;
        line-height: 1;
        color: #FFF8DC;
        opacity: 1;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
      }

      .deal-text {
        h3 {
          font-size: 1.7rem;
          font-weight: 800;
          color: #FFF8DC;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.01em;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        p {
          font-size: 1.3rem;
          color: rgba(255, 248, 220, 0.95);
          margin: 0;
          line-height: 1.6;
        }
      }
    }

    .deal-amount {
      font-size: 2rem;
      font-weight: 800;
      color: #FFF8DC;
      white-space: nowrap;
      margin-left: 1.5rem;
      position: relative;
      z-index: 1;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    &:hover {
      box-shadow: 0 6px 24px rgba(139, 111, 71, 0.3);
      transform: translateY(-3px);
    }
  }

  .premium-banner {
    background: linear-gradient(135deg, #059669 0%, #10b981 100%);
    border-radius: 16px;
    padding: 2.5rem;
    margin-bottom: 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 4px 16px rgba(5, 150, 105, 0.2);
    transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
    border: 1px solid rgba(16, 185, 129, 0.15);
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%);
      pointer-events: none;
    }

    .premium-content {
      display: flex;
      align-items: flex-start;
      gap: 1.8rem;
      flex: 1;
      position: relative;
      z-index: 1;

      .premium-icon {
        font-size: 2.4rem;
        line-height: 1;
        color: white;
        opacity: 1;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
      }

      .premium-text {
        h3 {
          font-size: 1.7rem;
          font-weight: 800;
          color: white;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.01em;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        p {
          font-size: 1.3rem;
          color: rgba(255, 255, 255, 0.95);
          margin: 0;
          line-height: 1.6;
        }
      }
    }

    .premium-amount {
      font-size: 2rem;
      font-weight: 800;
      color: white;
      white-space: nowrap;
      margin-left: 1.5rem;
      position: relative;
      z-index: 1;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    &:hover {
      box-shadow: 0 6px 24px rgba(5, 150, 105, 0.3);
      transform: translateY(-3px);
    }
  }

  .unlock-savings {
    background: white;
    border: 2px solid #C19A6B;
    border-radius: 16px;
    padding: 2rem 2.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
    box-shadow: 0 2px 12px rgba(193, 154, 107, 0.15);

    .unlock-content {
      display: flex;
      align-items: center;
      gap: 1.5rem;

      .unlock-icon {
        font-size: 2.2rem;
        line-height: 1;
        color: #8B6F47;
        opacity: 1;
      }

      .unlock-text {
        font-size: 1.6rem;
        font-weight: 700;
        color: #5A4A3A;
        letter-spacing: -0.01em;
      }
    }

    &:hover {
      background: linear-gradient(135deg, rgba(193, 154, 107, 0.05), rgba(139, 111, 71, 0.05));
      border-color: #8B6F47;
      box-shadow: 0 4px 16px rgba(139, 111, 71, 0.2);
      transform: translateY(-2px);
    }

    .view-offers-btn {
      padding: 1.1rem 2.2rem;
      font-size: 1.4rem;
      font-weight: 700;
      color: white;
      background: linear-gradient(135deg, #8B6F47, #C19A6B);
      border: none;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
      letter-spacing: 0.05em;
      text-transform: uppercase;
      box-shadow: 0 2px 8px rgba(139, 111, 71, 0.2);

      &:hover {
        background: linear-gradient(135deg, #C19A6B, #8B6F47);
        transform: translateY(-3px);
        box-shadow: 0 6px 20px rgba(139, 111, 71, 0.3);
      }

      &:active {
        transform: translateY(-1px);
      }
    }
  }

  /* Order Summary Card (Right Column) */
  .order-summary-card {
    background: #F5F1E8;
    border-radius: 20px;
    box-shadow: 0 4px 24px rgba(139, 69, 19, 0.12);
    padding: 3.5rem;
    height: fit-content;
    display: flex;
    flex-direction: column;
    border: 1px solid rgba(139, 69, 19, 0.08);
  }

  .price-breakdown {
    .price-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.2rem 0;
      font-size: 1.5rem;
      color: #5A4A3A;
      
      p {
        margin: 0;
        font-weight: 500;
        
        &:last-child {
          font-variant-numeric: tabular-nums;
          text-align: right;
          font-weight: 600;
        }
      }

      &.savings, &.discount {
        .negative {
          color: #10b981;
          font-weight: 700;
        }
      }
      
      &.coupon {
        .negative.coupon-amount {
          color: #10b981;
          font-weight: 800;
        }
      }
      
      &.shipping {
        .free-shipping {
          color: #10b981;
          font-weight: 700;
          font-size: 1.5rem;
        }
      }
      
      &.final-total {
        background: white;
        padding: 2rem 2.5rem;
        border-radius: 12px;
        margin-top: 2rem;
        font-size: 1.8rem;
        font-weight: 800;
        color: #5A4A3A;
        box-shadow: 0 2px 12px rgba(139, 69, 19, 0.1);
        border: 1px solid rgba(139, 69, 19, 0.08);
        
        p {
          font-size: 1.8rem;
          color: #5A4A3A;
          font-weight: 800;
          
          &:last-child {
            font-size: 2.2rem;
            color: #8B6F47;
          }
        }
      }
    }
    
    .total-divider {
      border: none;
      border-top: 2px dashed rgba(139, 69, 19, 0.15);
      margin: 2rem 0;
    }
    
    .free-delivery-badge {
      text-align: center;
      margin-top: 2rem;
      
      span {
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        padding: 1rem 2rem;
        border-radius: 50px;
        font-size: 1.3rem;
        font-weight: 700;
        display: inline-flex;
        align-items: center;
        gap: 0.6rem;
        box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
    }
  }

  .payment-link {
    text-decoration: none;
    margin-top: 2rem;
    display: block;
  }

  .proceed-to-pay-btn {
    width: 100%;
    background: linear-gradient(135deg, #8B6F47, #C19A6B);
    color: white;
    padding: 1.8rem 3rem;
    font-size: 1.6rem;
    font-weight: 800;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    box-shadow: 0 4px 16px rgba(139, 111, 71, 0.25);
    
    &:hover {
      background: linear-gradient(135deg, #C19A6B, #8B6F47);
      transform: translateY(-3px);
      box-shadow: 0 8px 28px rgba(139, 111, 71, 0.35);
    }
    
    &:active {
      transform: translateY(-1px);
    }
  }

  .order-total--amount {
    display: none; /* Hidden - replaced by new order summary */
  }

  .proceed-to-pay {
    display: none; /* Hidden - button now inside order summary */
  }

  @media (max-width: ${({ theme }) => theme.media.mobile}) {
    padding: 6rem 0;

    .container {
      padding: 0 1rem;
    }

    .cart-card {
      padding: 2rem 1.5rem;
    }

    .cart-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 1.5rem;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
    }

    .cart-title {
      font-size: 2rem;
    }

    .cart-user--profile {
      img {
        width: 45px;
        height: 45px;
      }

      .cart-user--name {
        font-size: 1.4rem;
      }
    }

    /* Two Column Layout becomes Single Column on Mobile */
    .checkout-container {
      grid-template-columns: 1fr;
      gap: 2rem;
      margin-top: 2rem;
    }

    .grid-five-column {
      grid-template-columns: 1.5fr 1fr 0.5fr;
      gap: 1rem;
    }

    .cart_heading {
      p {
        font-size: 1.2rem;
      }
    }

    .cart-hide {
      display: none;
    }

    .cart-image--name {
      img {
        width: 60px;
        height: 60px;
      }

      div p {
        font-size: 1.3rem;
      }
    }

    .cart-footer {
      flex-direction: column;
      gap: 1rem;

      button {
        width: 100%;
        padding: 1.2rem 2rem;
        font-size: 1.3rem;
      }
    }

    .savings-summary-card {
      padding: 2rem 1.5rem;
    }

    .order-summary-card {
      padding: 2rem 1.5rem;
    }

    .proceed-to-pay-btn {
      padding: 1.2rem 2rem;
      font-size: 1.4rem;
    }

    .savings-title {
      font-size: 1.8rem;
      margin-bottom: 2rem;
    }

    .deal-banner,
    .premium-banner {
      flex-direction: column;
      align-items: flex-start;
      gap: 1.5rem;
      padding: 1.5rem;

      .deal-content,
      .premium-content {
        gap: 1rem;

        .deal-icon,
        .premium-icon {
          font-size: 2rem;
        }

        .deal-text,
        .premium-text {
          h3 {
            font-size: 1.6rem;
          }

          p {
            font-size: 1.2rem;
          }
        }
      }

      .deal-amount,
      .premium-amount {
        font-size: 1.8rem;
        margin-left: 0;
      }
    }

    .unlock-savings {
      flex-direction: column;
      align-items: stretch;
      gap: 1.5rem;
      padding: 1.5rem;

      .unlock-content {
        justify-content: center;

        .unlock-icon {
          font-size: 2rem;
        }

        .unlock-text {
          font-size: 1.4rem;
        }
      }

      .view-offers-btn {
        width: 100%;
        padding: 1.2rem;
        font-size: 1.3rem;
      }
    }

    .order-total--amount {
      width: 100%;
      align-items: flex-start;

      .order-total--subdata {
        width: 100%;
        padding: 2rem;
      }
    }

    .proceed-to-pay {
      justify-content: center;
      padding: 0 1rem;

      a button {
        width: 100%;
        max-width: 300px;
        padding: 1.2rem 2rem;
        font-size: 1.4rem;
      }
    }
  }
`;

// Offers Modal Overlay
const OffersModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 2rem;
  overflow-y: auto;
  overscroll-behavior: contain;
`;

// Offers Modal
const OffersModal = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 650px;
  max-height: 85vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease-out;
  position: relative;

  /* Smooth scrolling for modal content */
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 2.5rem 3rem;
    border-bottom: 2px solid #f0f0f0;

    h2 {
      font-size: 2.2rem;
      font-weight: 700;
      color: #4a4a4a;
      margin: 0;
    }

    .close-btn {
      width: 40px;
      height: 40px;
      border: 2px solid #d97706;
      border-radius: 8px;
      background: white;
      color: #d97706;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      transition: all 0.2s ease;

      &:hover {
        background: #d97706;
        color: white;
      }
    }
  }

  .offers-list {
    padding: 2rem 3rem 3rem;
  }

  .offer-card {
    display: flex;
    align-items: flex-start;
    gap: 1.5rem;
    padding: 2rem 0;
    transition: all 0.3s ease;

    &.applied {
      border: 2px solid #10b981;
      border-radius: 12px;
      padding: 2rem;
      margin: 0 -1rem;
    }

    .offer-icon {
      width: 50px;
      height: 50px;
      border: 2px solid #d97706;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #d97706;
      font-size: 2.2rem;
      flex-shrink: 0;
    }

    .offer-content {
      flex: 1;

      h3 {
        font-size: 1.6rem;
        font-weight: 700;
        color: #2d2d2d;
        margin: 0 0 0.8rem 0;
        line-height: 1.4;
      }

      p {
        font-size: 1.3rem;
        color: #6b7280;
        margin: 0;
        line-height: 1.5;
      }

      .tc-content {
        background: #f3f4f6;
        border-radius: 8px;
        padding: 1.2rem 1.5rem;
        margin-top: 1rem;

        ul {
          list-style: none;
          padding: 0;
          margin: 0;

          li {
            font-size: 1.2rem;
            color: #4a4a4a;
            line-height: 1.8;
            margin-bottom: 0.5rem;

            &:last-child {
              margin-bottom: 0;
            }
          }
        }
      }
    }

    .offer-link {
      background: transparent;
      border: none;
      color: #d97706;
      font-size: 1.4rem;
      font-weight: 600;
      cursor: pointer;
      padding: 0.5rem 0;
      transition: all 0.2s ease;
      white-space: nowrap;

      &:hover {
        color: #b45309;
        text-decoration: underline;
      }
    }

    .apply-btn {
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 0.8rem 2rem;
      font-size: 1.3rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      white-space: nowrap;

      &:hover {
        background: #dc2626;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
      }
    }

    .applied-status {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      color: #10b981;
      font-size: 1.4rem;
      font-weight: 700;

      svg {
        font-size: 2rem;
      }
    }
  }

  .offer-divider {
    height: 1px;
    background: #e5e7eb;
    margin: 0;
  }

  @media (max-width: 768px) {
    max-width: 95%;
    max-height: 90vh;

    .modal-header {
      padding: 2rem 1.5rem;

      h2 {
        font-size: 1.8rem;
      }

      .close-btn {
        width: 36px;
        height: 36px;
        font-size: 1.8rem;
      }
    }

    .offers-list {
      padding: 1.5rem;
    }

    .offer-card {
      flex-direction: column;
      align-items: flex-start;
      gap: 1.2rem;
      padding: 1.5rem 0;

      .offer-icon {
        width: 45px;
        height: 45px;
        font-size: 2rem;
      }

      .offer-content {
        h3 {
          font-size: 1.5rem;
        }

        p {
          font-size: 1.2rem;
        }
      }

      .offer-link,
      .apply-btn {
        width: 100%;
        text-align: center;
        padding: 1rem 1.5rem;
      }
    }
  }
`;

// Success Toast
const SuccessToast = styled.div`
  position: fixed;
  bottom: 3rem;
  left: 50%;
  transform: translateX(-50%);
  background: #10b981;
  color: white;
  padding: 1.2rem 2.5rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 1.4rem;
  font-weight: 600;
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);
  z-index: 10001;
  animation: slideUpToast 0.3s ease-out;

  @keyframes slideUpToast {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }

  svg {
    font-size: 2rem;
  }

  @media (max-width: 768px) {
    bottom: 2rem;
    padding: 1rem 2rem;
    font-size: 1.3rem;
    max-width: 90%;
    text-align: center;
  }
`;

// Secondary Modal Overlay
const SecondaryModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 2rem;
  overscroll-behavior: contain;
`;

// Secondary Modal
const SecondaryModal = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.25);
  width: 100%;
  max-width: 500px;
  animation: scaleIn 0.3s ease-out;
  position: relative;
  overscroll-behavior: contain;

  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .secondary-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 2rem 2.5rem;
    border-bottom: 2px solid #f0f0f0;

    h3 {
      font-size: 2rem;
      font-weight: 700;
      color: #4a4a4a;
      margin: 0;
    }

    .close-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      color: #6b7280;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      transition: all 0.2s ease;
      border-radius: 6px;

      &:hover {
        background: #f3f4f6;
        color: #2d2d2d;
      }
    }
  }

  .secondary-content {
    padding: 2.5rem;

    p {
      font-size: 1.4rem;
      color: #4a4a4a;
      line-height: 1.8;
      margin: 0;
    }
  }

  .ok-btn {
    width: calc(100% - 5rem);
    margin: 0 2.5rem 2.5rem;
    padding: 1.2rem 2rem;
    background: white;
    color: #d97706;
    border: 2px solid #d97706;
    border-radius: 8px;
    font-size: 1.5rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: #d97706;
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(217, 119, 6, 0.3);
    }
  }

  @media (max-width: 768px) {
    max-width: 90%;

    .secondary-header {
      padding: 1.5rem 2rem;

      h3 {
        font-size: 1.8rem;
      }
    }

    .secondary-content {
      padding: 2rem;

      p {
        font-size: 1.3rem;
      }
    }

    .ok-btn {
      width: calc(100% - 4rem);
      margin: 0 2rem 2rem;
      padding: 1.2rem;
      font-size: 1.4rem;
    }
  }
`;

export default Cart;




// import React from "react";
// import styled from "styled-components";
// import { useCartContext } from "./context/cart_context";
// import CartItem from "./components/CartItem";
// import { NavLink } from "react-router-dom";
// import { Button } from "./styles/Button";
// import FormatPrice from "./Helpers/FormatPrice";
// import { useAuth0 } from "@auth0/auth0-react";

// // Import your GIF here
// import emptyCartGif from "./assets/cartGif.gif"; // Adjust the path to your GIF file

// const Cart = () => {
//   const { cart, clearCart, total_price, shipping_fee } = useCartContext();
//   const { isAuthenticated, user } = useAuth0();

//   if (cart.length === 0) {
//     return (
//       <EmptyCartWrapper>
//         <img src={emptyCartGif} alt="Empty Cart" />
//         <h3>Your Cart is Empty</h3>
//         <NavLink to="/products">
//           <Button>Continue Shopping</Button>
//         </NavLink>
//       </EmptyCartWrapper>
//     );
//   }

//   return (
//     <Wrapper>
//       <div className="container">
//         {isAuthenticated && (
//           <div className="cart-user--profile">
//             <img src={user.picture} alt={user.name} />
//             <h2 className="cart-user--name">{user.name}</h2>
//           </div>
//         )}

//         <div className="cart_heading grid grid-five-column">
//           <p>Item</p>
//           <p className="cart-hide">Price</p>
//           <p>Quantity</p>
//           <p className="cart-hide">Subtotal</p>
//           <p>Remove</p>
//         </div>
//         <hr />
//         <div className="cart-item">
//           {cart.map((curElem) => {
//             return <CartItem key={curElem.id} {...curElem} />;
//           })}
//         </div>
//         <hr />
//         <div className="cart-two-button">
//           <NavLink to="/products">
//             <Button>Continue Shopping</Button>
//           </NavLink>
//           <Button className="btn btn-clear" onClick={clearCart}>
//             Clear Cart
//           </Button>
//         </div>

//         <div className="order-total--amount">
//           <div className="order-total--subdata">
//             <div>
//               <p>Subtotal:</p>
//               <p>
//                 <FormatPrice price={total_price} />
//               </p>
//             </div>
//             <div>
//               <p>Shipping Fee:</p>
//               <p>
//                 <FormatPrice price={shipping_fee} />
//               </p>
//             </div>
//             <hr />
//             <div>
//               <p>Order Total:</p>
//               <p>
//                 <FormatPrice price={shipping_fee + total_price} />
//               </p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </Wrapper>
//   );
// };

// const EmptyCartWrapper = styled.div`
//   display: flex;
//   flex-direction: column;
//   justify-content: center;
//   align-items: center;
//   height: 50vh;
//   text-align: center;

//   img {
//     width: 300px;
//     margin-bottom: 1rem;
//   }

//   h3 {
//     font-size: 2rem;
//     font-weight: 400;
//     margin-bottom: 1rem;
//     text-transform: capitalize;
//   }

//   a {
//     text-decoration: none;
//   }
// `;

// const Wrapper = styled.section`
//   /* Same styles as before */
// `;

// export default Cart;
