import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import styled from "styled-components";
import axios from "axios";
import toast from 'react-hot-toast';
import { useCartContext } from "./context/cart_context";
import { useWishlistContext } from "./context/wishlist_context";
import { useUser, useAuth } from "@clerk/clerk-react";
import FormatPrice from "./Helpers/FormatPrice";
import { API_ENDPOINTS } from "./config/api";
import { FiLock, FiPackage, FiPhone, FiTruck, FiSave, FiX } from "react-icons/fi";

const Payment = () => {
  const { user, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, clearCart, total_price } = useCartContext();
  const { removeFromWishlist } = useWishlistContext();

  // Check if this is an in-store checkout (customer buying at physical store)
  const isInStoreCheckout = location.state?.isInStoreCheckout || false;

  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  // Saved addresses state
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);

  // Guest checkout state
  const [isGuestCheckout, setIsGuestCheckout] = useState(false);
  const [guestInfo, setGuestInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [guestFormErrors, setGuestFormErrors] = useState({});

  // Wait for cart context to initialize to prevent early render crashes.
  useEffect(() => {
    // Scroll to top on page load
    window.scrollTo(0, 0);
    
    if (cart !== undefined) {
      setIsPageLoading(false);
      return;
    }

    const fallbackTimer = setTimeout(() => {
      setIsPageLoading(false);
    }, 800);

    return () => clearTimeout(fallbackTimer);
  }, [cart]);

  const authFetch = async (url, options = {}) => {
    const token = await getToken();
    const headers = {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
    return fetch(url, { ...options, headers });
  };

  // Calculate order total with discounts (same logic as Cart.js)
  const calculateOriginalPrice = (price) => Math.ceil(price * 1.2);

  // Safe defaults for cart data
  const safeCart = Array.isArray(cart) ? cart : [];
  const safeTotal = total_price || 0;

  const subtotal = safeTotal;
  const totalOriginalPrice = safeCart.reduce((total, item) => {
    return total + (calculateOriginalPrice(item.price) * item.amount);
  }, 0);
  
  const dealOfTheDaySavings = totalOriginalPrice - subtotal;
  
  const getPromotionalDiscount = (amount) => {
    if (amount >= 350000) return { percentage: 20, label: "Premium Discount" }; // ₹3500 in paise
    else if (amount >= 250000) return { percentage: 10, label: "Special Discount" }; // ₹2500 in paise
    else if (amount >= 200000) return { percentage: 5, label: "Welcome Discount" }; // ₹2000 in paise
    return { percentage: 0, label: "" };
  };
  
  const promotionalDiscount = getPromotionalDiscount(subtotal);
  const promotionalDiscountAmount = (subtotal * promotionalDiscount.percentage) / 100;
  
  // Check for applied coupon from localStorage (dynamic coupon from Cart)
  const savedCoupon = localStorage.getItem('appliedCoupon');
  let appliedCoupon = null;
  if (savedCoupon) {
    try {
      appliedCoupon = JSON.parse(savedCoupon);
    } catch (error) {
      console.warn('Invalid coupon data found in localStorage. Clearing corrupted value.');
      localStorage.removeItem('appliedCoupon');
    }
  }
  const couponApplied = appliedCoupon !== null;
  const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0; // Already in paise
  const couponCode = appliedCoupon ? appliedCoupon.code : '';
  
  const dynamicShippingFee = subtotal >= 200000 ? 0 : 15000; // ₹2000 threshold, ₹150 shipping fee in paise
  
  // Final total in paise
  const finalTotalPaise = subtotal - dealOfTheDaySavings - promotionalDiscountAmount - couponDiscount + dynamicShippingFee;
  const finalTotalRupees = finalTotalPaise / 100; // Convert to rupees for Razorpay

  // Load Razorpay SDK script
  useEffect(() => {
    const loadRazorpayScript = () => {
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          console.log('[✓] Razorpay SDK loaded successfully');
          resolve(true);
        };
        script.onerror = () => {
          console.error('[✗] Failed to load Razorpay SDK');
          resolve(false);
        };
        document.body.appendChild(script);
      });
    };

    loadRazorpayScript().then(setRazorpayLoaded);
  }, []);

  // Fetch saved addresses for logged-in users
  useEffect(() => {
    const normalizeAddresses = (payload) => {
      if (Array.isArray(payload?.addresses)) {
        return payload.addresses.filter(Boolean);
      }
      if (Array.isArray(payload)) {
        return payload.filter(Boolean);
      }
      return [];
    };

    const fetchSavedAddresses = async () => {
      if (isSignedIn && user?.id) {
        try {
          const response = await authFetch(`${API_ENDPOINTS.USERS}/${user.id}/addresses`);
          const data = await response.json();
          const addresses = normalizeAddresses(data);

          if (data.success && addresses.length > 0) {
            setSavedAddresses(addresses);
            // Select default address or first address
            const defaultAddr = addresses.find(a => a?.isDefault) || addresses[0];
            setSelectedAddressId(defaultAddr?._id || null);
            setShowNewAddressForm(false);
          } else {
            setSavedAddresses([]);
            setShowNewAddressForm(true);
          }
        } catch (error) {
          console.error('Error fetching addresses:', error);
          setSavedAddresses([]);
          setShowNewAddressForm(true);
        }
      }
    };
    fetchSavedAddresses();
  }, [isSignedIn, user?.id]);

  // Get selected address
  const getSelectedAddress = () => {
    return savedAddresses.find(a => String(a?._id) === String(selectedAddressId));
  };

  // Get user details helper functions (support guest checkout)
  const getClerkId = () => isGuestCheckout ? `guest-${Date.now()}` : (user?.id || '');
  const getUserEmail = () => {
    if (isGuestCheckout) {
      const guestEmail = guestInfo?.email?.trim();
      return guestEmail || 'guest@example.com';
    }
    if (!user) return 'customer@example.com';
    
    // Try multiple paths to get email from Clerk user object
    const email = user.primaryEmailAddress?.emailAddress 
      || user.emailAddresses?.[0]?.emailAddress 
      || user.email
      || 'customer@example.com';
    
    // Ensure we return a non-empty string
    return (email && email.toString().trim()) || 'customer@example.com';
  };
  const getUserName = () => {
    if (isGuestCheckout) return guestInfo.name || 'Guest Customer';
    if (!user) return 'Customer';
    return user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Customer';
  };
  const getUserPhone = () => {
    if (isGuestCheckout) return guestInfo.phone || '';
    return user?.phoneNumbers?.[0]?.phoneNumber || '';
  };
  const getShippingAddress = () => {
    if (isGuestCheckout) {
      return {
        name: guestInfo.name,
        address: guestInfo.address,
        city: guestInfo.city,
        state: guestInfo.state,
        pincode: guestInfo.pincode,
        phone: guestInfo.phone
      };
    }
    // For logged-in users, use selected saved address
    const selectedAddr = getSelectedAddress();
    if (selectedAddr) {
      return {
        name: selectedAddr.name,
        address: selectedAddr.address,
        city: selectedAddr.city,
        state: selectedAddr.state,
        pincode: selectedAddr.pincode,
        phone: selectedAddr.phone
      };
    }
    // Fallback to new address form
    if (showNewAddressForm) {
      return {
        name: guestInfo.name || getUserName(),
        address: guestInfo.address,
        city: guestInfo.city,
        state: guestInfo.state,
        pincode: guestInfo.pincode,
        phone: guestInfo.phone
      };
    }
    return null;
  };

  // Validate guest form
  const validateGuestForm = () => {
    const errors = {};
    if (!guestInfo.name.trim()) errors.name = 'Name is required';
    if (!guestInfo.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestInfo.email)) errors.email = 'Invalid email format';
    if (!guestInfo.phone.trim()) errors.phone = 'Phone is required';
    else if (!/^\d{10}$/.test(guestInfo.phone.replace(/\D/g, ''))) errors.phone = 'Enter 10-digit phone number';
    if (!guestInfo.address.trim()) errors.address = 'Address is required';
    if (!guestInfo.city.trim()) errors.city = 'City is required';
    if (!guestInfo.state.trim()) errors.state = 'State is required';
    if (!guestInfo.pincode.trim()) errors.pincode = 'Pincode is required';
    else if (!/^\d{6}$/.test(guestInfo.pincode)) errors.pincode = 'Enter 6-digit pincode';
    
    setGuestFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle guest form input change
  const handleGuestInputChange = (e) => {
    const { name, value } = e.target;
    setGuestInfo(prev => ({ ...prev, [name]: value }));
    if (guestFormErrors[name]) {
      setGuestFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Save new address for logged-in users
  const handleSaveNewAddress = async () => {
    const normalizeAddresses = (payload) => {
      if (Array.isArray(payload?.addresses)) {
        return payload.addresses.filter(Boolean);
      }
      if (Array.isArray(payload)) {
        return payload.filter(Boolean);
      }
      return [];
    };

    // Validate the form first
    const errors = {};
    if (!guestInfo.name.trim()) errors.name = 'Name is required';
    if (!guestInfo.phone.trim()) errors.phone = 'Phone is required';
    else if (!/^\d{10}$/.test(guestInfo.phone.replace(/\D/g, ''))) errors.phone = 'Enter 10-digit phone number';
    if (!guestInfo.address.trim()) errors.address = 'Address is required';
    if (!guestInfo.city.trim()) errors.city = 'City is required';
    if (!guestInfo.state.trim()) errors.state = 'State is required';
    if (!guestInfo.pincode.trim()) errors.pincode = 'Pincode is required';
    else if (!/^\d{6}$/.test(guestInfo.pincode)) errors.pincode = 'Enter 6-digit pincode';
    
    setGuestFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error('Please fill in all required fields correctly.');
      return;
    }

    try {
      const newAddress = {
        name: guestInfo.name,
        phone: guestInfo.phone,
        address: guestInfo.address,
        city: guestInfo.city,
        state: guestInfo.state,
        pincode: guestInfo.pincode,
        isDefault: savedAddresses.length === 0 // Make it default if first address
      };

      const response = await authFetch(`${API_ENDPOINTS.USERS}/${user.id}/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAddress)
      });

      const data = await response.json();
      
      if (data.success) {
        const addresses = normalizeAddresses(data);
        const selectedAddr = addresses.find(addr => addr?.isDefault) || addresses[addresses.length - 1] || null;

        toast.success('Address saved successfully!');
        // Replace with server-authoritative address list to avoid shape mismatch issues.
        setSavedAddresses(addresses);
        // Select the default/newly-added address
        setSelectedAddressId(selectedAddr?._id || null);
        // Hide the form
        setShowNewAddressForm(false);
        // Clear the form
        setGuestInfo(prev => ({
          ...prev,
          name: '',
          phone: '',
          address: '',
          city: '',
          state: '',
          pincode: ''
        }));
      } else {
        toast.error(data.message || 'Failed to save address');
      }
    } catch (error) {
      console.error('Error saving address:', error);
      toast.error('Failed to save address. Please try again.');
    }
  };

  // Helper to remove checked out items from wishlist
  const removeCheckedOutFromWishlist = (cartItems) => {
    if (Array.isArray(cartItems)) {
      cartItems.forEach(item => {
        const baseId = typeof item.id === 'string' ? item.id.replace(/#.+$/, '') : item.id;
        removeFromWishlist(baseId);
      });
    }
  };

  // Handle Razorpay Payment
  const handlePayment = async () => {
    if (!razorpayLoaded) {
      toast.error('Payment system is still loading. Please wait a moment and try again.', {
        duration: 4000,
        position: 'top-center'
      });
      return;
    }

    // Check if user is signed in OR using guest checkout
    if (!isSignedIn && !isGuestCheckout) {
      toast.error('Please sign in or continue as guest to complete your purchase.', {
        duration: 3000,
        position: 'top-center'
      });
      return;
    }

    // Validate guest form if using guest checkout
    if (isGuestCheckout && !validateGuestForm()) {
      toast.error('Please fill in all required fields correctly.', {
        duration: 3000,
        position: 'top-center'
      });
      return;
    }

    // For logged-in users, check if address is selected or new address form is filled
    // Skip address validation for in-store checkout (customer picks up at store)
    if (isSignedIn && !isGuestCheckout && !isInStoreCheckout) {
      if (!selectedAddressId && showNewAddressForm && !validateGuestForm()) {
        toast.error('Please select a delivery address or fill in the new address form.', {
          duration: 3000,
          position: 'top-center'
        });
        return;
      }
      if (!selectedAddressId && !showNewAddressForm && savedAddresses.length === 0) {
        toast.error('Please add a delivery address to continue.', {
          duration: 3000,
          position: 'top-center'
        });
        return;
      }
    }

    if (safeCart.length === 0) {
      toast.error('Your cart is empty. Please add items before checkout.', {
        duration: 3000,
        position: 'top-center'
      });
      navigate('/products');
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Create Razorpay order on backend
      console.log('🔄 Creating Razorpay order for amount:', finalTotalRupees);
      
      const orderResponse = await axios.post(API_ENDPOINTS.PAYMENT_CREATE, {
        amount: finalTotalRupees
      });

      if (!orderResponse.data.success) {
        throw new Error('Failed to create payment order');
      }

      const { orderId, currency, amount, keyId } = orderResponse.data;
      console.log('[✓] Razorpay Order Created:', orderId);

      // Step 2: Initialize Razorpay Checkout
      const options = {
        key: keyId, // Your Razorpay Key ID from backend
        amount: amount, // Amount in paise
        currency: currency,
        name: "Sawaikar's Cashew Store",
        description: 'Premium Cashew Products',
        order_id: orderId,
        handler: async function (response) {
          // Step 3: Payment Success Handler
          console.log('[✓] Payment Successful!', response);
          
          // Show loading toast
          const loadingToast = toast.loading('Verifying payment and creating your order...', {
            position: 'top-center'
          });
          
          try {
            // Prepare order data
            const orderItems = safeCart.map(item => {
              let imageStr = '';
              if (typeof item.image === 'string') {
                imageStr = item.image;
              } else if (Array.isArray(item.image) && item.image.length > 0) {
                imageStr = typeof item.image[0] === 'string' ? item.image[0] : (item.image[0]?.url || '');
              } else if (item.image && typeof item.image === 'object' && item.image.url) {
                imageStr = item.image.url;
              }

              // Log item structure for debugging
              console.log('[DEBUG] Cart item:', {
                id: item.id,
                productId: item.productId,
                name: item.name,
                isBundleItem: item.productId?.startsWith('bundle-') || item.id?.startsWith('bundle-')
              });

              return {
                // Prefer canonical product ID (without color/weight suffixes)
                productId: item.productId || item.id,
                name: item.name || 'Product',
                price: item.price || 0,
                quantity: item.amount || 1,
                color: item.color || '',
                weight: item.weight || item.selectedWeight || '',
                image: imageStr
              };
            });

            // Get shipping address (from guest form or saved address)
            const shippingAddr = getShippingAddress();

            // For in-store checkout, shipping address is not required (customer picks up at store)
            if (!isInStoreCheckout && (!shippingAddr || !shippingAddr.address)) {
              throw new Error('Please select or add a delivery address');
            }

            // CRITICAL: Ensure all required fields are sent
            const orderData = {
              user: {
                clerkId: getClerkId(),
                email: getUserEmail(),
                name: getUserName()
              },
              items: orderItems,
              totalAmount: finalTotalPaise, // Store in paise for consistency
              // For in-store checkout, use store address; otherwise use customer's shipping address
              shippingAddress: isInStoreCheckout ? {
                name: getUserName(),
                street: 'In-Store Pickup',
                address: 'In-Store Pickup - Sawaikar\'s Cashew Store',
                city: 'Goa',
                state: 'Goa',
                pincode: '403001',
                zipCode: '403001',
                phone: getUserPhone() || 'N/A',
                country: 'India'
              } : {
                name: shippingAddr.name || getUserName(),
                street: shippingAddr.address || shippingAddr.street || '',
                address: shippingAddr.address || shippingAddr.street || '',
                city: shippingAddr.city || '',
                state: shippingAddr.state || '',
                pincode: shippingAddr.pincode || '',
                zipCode: shippingAddr.pincode || shippingAddr.zipCode || '',
                phone: shippingAddr.phone || getUserPhone(),
                country: 'India'
              },
              isGuestOrder: isGuestCheckout,
              userPhone: isInStoreCheckout ? (getUserPhone() || 'N/A') : (shippingAddr.phone || getUserPhone()),
              // Order type: 'instore' for in-store purchases, 'online' for delivery orders
              orderType: isInStoreCheckout ? 'instore' : 'online'
            };

            console.log('📤 Sending order data to backend:', orderData);

            // Verify payment and save order on backend (CRITICAL STEP)
            const verifyResponse = await axios.post(API_ENDPOINTS.PAYMENT_VERIFY_PAYMENT, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderData: orderData
            });

            console.log('[→] Backend response:', verifyResponse.data);

            if (verifyResponse.data.success) {
              console.log('[✓] Order saved to MongoDB:', verifyResponse.data.orderId);

              // Mark coupon as used if one was applied
              if (couponApplied && couponCode) {
                try {
                  await axios.post(`${API_ENDPOINTS.COUPONS}/apply`, {
                    code: couponCode,
                    userEmail: getUserEmail(),
                    orderAmount: finalTotalPaise / 100 // Send in rupees
                  });
                  console.log('[SUCCESS] Coupon usage recorded:', couponCode);
                } catch (couponError) {
                  console.warn('[WARNING] Failed to record coupon usage:', couponError);
                  // Don't fail the order if coupon update fails
                }
              }

              // Dismiss loading toast and show success
              toast.dismiss(loadingToast);
              toast.success('Order placed successfully!', {
                duration: 3000,
                position: 'top-center'
              });

              // Clear cart and wishlist (frontend state)
              removeCheckedOutFromWishlist(safeCart);
              clearCart();
              
              // Clear coupon from localStorage
              localStorage.removeItem('appliedCoupon');

              // Redirect to Order Success page with payment details
              navigate('/order-success', {
                state: {
                  paymentId: response.razorpay_payment_id,
                  orderId: verifyResponse.data.orderId,
                  amount: finalTotalRupees
                }
              });
            } else {
              throw new Error(verifyResponse.data.error || 'Payment verification failed on server');
            }
          } catch (error) {
            console.error('❌ Error processing payment:', error);
            console.error('Error details:', error.response?.data);
            
            // Dismiss loading toast and show error
            toast.dismiss(loadingToast);
            toast.error(
              `Payment verified, but order creation failed.\n\nPayment ID: ${response.razorpay_payment_id}\n\nPlease contact support with this Payment ID.`,
              {
                duration: 8000,
                position: 'top-center',
                style: {
                  background: '#ef4444',
                  color: 'white',
                  fontWeight: '500',
                  padding: '16px',
                  borderRadius: '8px'
                }
              }
            );
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: getUserName(),
          email: getUserEmail(),
          contact: '9999999999'
        },
        notes: {
          address: "Sawaikar's Cashew Store, Mumbai"
        },
        theme: {
          color: '#667eea'
        },
        modal: {
          ondismiss: function() {
            console.log('⚠️ Payment cancelled by user');
            setIsProcessing(false);
            toast('Payment was cancelled. Your cart is still saved.', {
              icon: '⚠️',
              duration: 3000,
              position: 'top-center'
            });
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      
      razorpay.on('payment.failed', async function (response) {
        console.error('❌ Payment Failed:', response.error);
        
        setIsProcessing(false);
        toast.error(
          `Payment Failed!\n\nReason: ${response.error.description}\n\nPlease try again.`,
          {
            duration: 6000,
            position: 'top-center',
            style: {
              background: '#ef4444',
              color: 'white',
              fontWeight: '500'
            }
          }
        );
      });

      razorpay.open();

    } catch (error) {
      console.error('❌ Error initiating payment:', error);
      setIsProcessing(false);
      const serverMessage = error?.response?.data?.error || error?.response?.data?.message;
      toast.error(serverMessage || 'Failed to initiate payment. Please check your connection and try again.', {
        duration: 4000,
        position: 'top-center'
      });
    }
  };

  // Show loading while cart context initializes
  if (isPageLoading) {
    return (
      <Wrapper>
        <div className="container">
          <LoadingState>
            <div className="spinner"></div>
            <p>Loading checkout...</p>
          </LoadingState>
        </div>
      </Wrapper>
    );
  }

  // Redirect if cart is empty
  if (safeCart.length === 0) {
    return (
      <Wrapper>
        <div className="container">
          <EmptyCartMessage>
            <h2>Your cart is empty</h2>
            <p>Add some delicious cashews to your cart to proceed with payment.</p>
            <button className="btn-shop" onClick={() => navigate('/products')}>
              Shop Now
            </button>
          </EmptyCartMessage>
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <div className="container">
        <div className="payment-card">
          <h1 className="page-title">Order Summary</h1>

          {/* Order Review Section */}
          <div className="order-review">

            <div className="summary-details">
              <div className="detail-row">
                <span className="detail-label">Total Items:</span>
                <span className="detail-value">{safeCart.length}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Item Subtotal:</span>
                <span className="detail-value"><FormatPrice price={subtotal} /></span>
              </div>
              
              {dealOfTheDaySavings > 0 && (
                <div className="detail-row savings">
                  <span className="detail-label">Deal Savings:</span>
                  <span className="detail-value negative">-<FormatPrice price={dealOfTheDaySavings} /></span>
                </div>
              )}
              
              {promotionalDiscount.percentage > 0 && (
                <div className="detail-row discount">
                  <span className="detail-label">Discount ({promotionalDiscount.percentage}%):</span>
                  <span className="detail-value negative">-<FormatPrice price={promotionalDiscountAmount} /></span>
                </div>
              )}
              
              {couponApplied && couponDiscount > 0 && (
                <div className="detail-row coupon">
                  <span className="detail-label">Coupon ({couponCode}):</span>
                  <span className="detail-value negative">-<FormatPrice price={couponDiscount} /></span>
                </div>
              )}
              
              <div className="detail-row shipping">
                <span className="detail-label">Shipping:</span>
                <span className="detail-value">
                  {dynamicShippingFee === 0 ? (
                    <span className="free-shipping"><FiTruck style={{display: 'inline', marginRight: '0.3rem'}} /> FREE</span>
                  ) : (
                    <FormatPrice price={dynamicShippingFee} />
                  )}
                </span>
              </div>
              
              <hr className="divider" />
              
              <div className="detail-row total">
                <span className="detail-label">Total Amount:</span>
                <span className="detail-value total-amount"><FormatPrice price={finalTotalPaise} /></span>
              </div>
            </div>

            {/* Delivery Address Section for Logged-in Users */}
            {isSignedIn && (
              <div className="delivery-address-section">
                <h3><FiPackage style={{display: 'inline', marginRight: '0.5rem'}} /> Delivery Address</h3>
                
                {savedAddresses.length > 0 && (
                  <div className="saved-addresses">
                    {savedAddresses.map((addr) => (
                      <div 
                        key={addr._id} 
                        className={`address-option ${selectedAddressId === addr._id ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedAddressId(addr._id);
                          setShowNewAddressForm(false);
                        }}
                      >
                        <div className="address-radio">
                          <input 
                            type="radio" 
                            name="delivery-address" 
                            checked={selectedAddressId === addr._id}
                            onChange={() => {
                              setSelectedAddressId(addr._id);
                              setShowNewAddressForm(false);
                            }}
                          />
                        </div>
                        <div className="address-details">
                          <div className="address-header">
                            <span className="address-label">{addr.label}</span>
                            {addr.isDefault && <span className="default-tag">Default</span>}
                          </div>
                          <p className="address-name">{addr.name}</p>
                          <p className="address-phone"><FiPhone style={{display: 'inline', marginRight: '0.3rem'}} /> {addr.phone}</p>
                          <p className="address-full">
                            {addr.address}, {addr.city}, {addr.state} - {addr.pincode}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    <button 
                      className="add-new-address-btn"
                      onClick={() => {
                        setShowNewAddressForm(!showNewAddressForm);
                        if (!showNewAddressForm) setSelectedAddressId(null);
                      }}
                    >
                      {showNewAddressForm ? <><FiX style={{marginRight: '0.3rem'}} /> Cancel</> : '+ Add New Address'}
                    </button>
                  </div>
                )}

                {(showNewAddressForm || savedAddresses.length === 0) && (
                  <div className="new-address-form">
                    <h4>{savedAddresses.length === 0 ? 'Add Delivery Address' : 'New Address'}</h4>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Full Name *</label>
                        <input
                          type="text"
                          name="name"
                          value={guestInfo.name}
                          onChange={handleGuestInputChange}
                          placeholder="Enter your full name"
                          className={guestFormErrors.name ? 'error' : ''}
                        />
                        {guestFormErrors.name && <span className="error-text">{guestFormErrors.name}</span>}
                      </div>
                      <div className="form-group">
                        <label>Phone Number *</label>
                        <input
                          type="tel"
                          name="phone"
                          value={guestInfo.phone}
                          onChange={handleGuestInputChange}
                          placeholder="10-digit phone number"
                          className={guestFormErrors.phone ? 'error' : ''}
                        />
                        {guestFormErrors.phone && <span className="error-text">{guestFormErrors.phone}</span>}
                      </div>
                    </div>
                    <div className="form-group full-width">
                      <label>Street Address *</label>
                      <input
                        type="text"
                        name="address"
                        value={guestInfo.address}
                        onChange={handleGuestInputChange}
                        placeholder="House/Flat No., Street, Area"
                        className={guestFormErrors.address ? 'error' : ''}
                      />
                      {guestFormErrors.address && <span className="error-text">{guestFormErrors.address}</span>}
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>City *</label>
                        <input
                          type="text"
                          name="city"
                          value={guestInfo.city}
                          onChange={handleGuestInputChange}
                          placeholder="City"
                          className={guestFormErrors.city ? 'error' : ''}
                        />
                        {guestFormErrors.city && <span className="error-text">{guestFormErrors.city}</span>}
                      </div>
                      <div className="form-group">
                        <label>State *</label>
                        <input
                          type="text"
                          name="state"
                          value={guestInfo.state}
                          onChange={handleGuestInputChange}
                          placeholder="State"
                          className={guestFormErrors.state ? 'error' : ''}
                        />
                        {guestFormErrors.state && <span className="error-text">{guestFormErrors.state}</span>}
                      </div>
                      <div className="form-group">
                        <label>Pincode *</label>
                        <input
                          type="text"
                          name="pincode"
                          value={guestInfo.pincode}
                          onChange={handleGuestInputChange}
                          placeholder="6-digit pincode"
                          className={guestFormErrors.pincode ? 'error' : ''}
                        />
                        {guestFormErrors.pincode && <span className="error-text">{guestFormErrors.pincode}</span>}
                      </div>
                    </div>
                    
                    {/* Save Address Button for logged-in users */}
                    <div className="save-address-btn-container" style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={handleSaveNewAddress}
                        className="save-address-btn"
                        style={{
                          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                          color: 'white',
                          border: 'none',
                          padding: '12px 24px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          transition: 'transform 0.2s, box-shadow 0.2s'
                        }}
                        onMouseOver={(e) => {
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        <FiSave style={{marginRight: '0.5rem'}} /> Save Address
                      </button>
                      {savedAddresses.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowNewAddressForm(false);
                            setGuestInfo(prev => ({ ...prev, name: '', phone: '', address: '', city: '', state: '', pincode: '' }));
                            setGuestFormErrors({});
                          }}
                          style={{
                            background: '#f3f4f6',
                            color: '#6b7280',
                            border: '1px solid #d1d5db',
                            padding: '12px 24px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '500',
                            fontSize: '14px'
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Guest Checkout Option */}
            {!isSignedIn && (
              <div className="guest-checkout-section">
                <div className="checkout-toggle">
                  <button 
                    className={`toggle-btn ${!isGuestCheckout ? 'active' : ''}`}
                    onClick={() => { setIsGuestCheckout(false); navigate('/login'); }}
                  >
                    🔐 Sign In to Checkout
                  </button>
                  <button 
                    className={`toggle-btn ${isGuestCheckout ? 'active' : ''}`}
                    onClick={() => setIsGuestCheckout(true)}
                  >
                    👤 Continue as Guest
                  </button>
                </div>

                {isGuestCheckout && (
                  <div className="guest-form">
                    <h3>📦 Shipping Details</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Full Name *</label>
                        <input
                          type="text"
                          name="name"
                          value={guestInfo.name}
                          onChange={handleGuestInputChange}
                          placeholder="Enter your full name"
                          className={guestFormErrors.name ? 'error' : ''}
                        />
                        {guestFormErrors.name && <span className="error-text">{guestFormErrors.name}</span>}
                      </div>
                      <div className="form-group">
                        <label>Email Address *</label>
                        <input
                          type="email"
                          name="email"
                          value={guestInfo.email}
                          onChange={handleGuestInputChange}
                          placeholder="your@email.com"
                          className={guestFormErrors.email ? 'error' : ''}
                        />
                        {guestFormErrors.email && <span className="error-text">{guestFormErrors.email}</span>}
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Phone Number *</label>
                        <input
                          type="tel"
                          name="phone"
                          value={guestInfo.phone}
                          onChange={handleGuestInputChange}
                          placeholder="10-digit phone number"
                          className={guestFormErrors.phone ? 'error' : ''}
                        />
                        {guestFormErrors.phone && <span className="error-text">{guestFormErrors.phone}</span>}
                      </div>
                    </div>
                    <div className="form-group full-width">
                      <label>Street Address *</label>
                      <input
                        type="text"
                        name="address"
                        value={guestInfo.address}
                        onChange={handleGuestInputChange}
                        placeholder="House/Flat No., Street, Area"
                        className={guestFormErrors.address ? 'error' : ''}
                      />
                      {guestFormErrors.address && <span className="error-text">{guestFormErrors.address}</span>}
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>City *</label>
                        <input
                          type="text"
                          name="city"
                          value={guestInfo.city}
                          onChange={handleGuestInputChange}
                          placeholder="City"
                          className={guestFormErrors.city ? 'error' : ''}
                        />
                        {guestFormErrors.city && <span className="error-text">{guestFormErrors.city}</span>}
                      </div>
                      <div className="form-group">
                        <label>State *</label>
                        <input
                          type="text"
                          name="state"
                          value={guestInfo.state}
                          onChange={handleGuestInputChange}
                          placeholder="State"
                          className={guestFormErrors.state ? 'error' : ''}
                        />
                        {guestFormErrors.state && <span className="error-text">{guestFormErrors.state}</span>}
                      </div>
                      <div className="form-group">
                        <label>Pincode *</label>
                        <input
                          type="text"
                          name="pincode"
                          value={guestInfo.pincode}
                          onChange={handleGuestInputChange}
                          placeholder="6-digit pincode"
                          className={guestFormErrors.pincode ? 'error' : ''}
                        />
                        {guestFormErrors.pincode && <span className="error-text">{guestFormErrors.pincode}</span>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pay Now Button */}
            <button 
              className="pay-button"
              onClick={handlePayment}
              disabled={isProcessing || !razorpayLoaded}
            >
              {isProcessing ? 'PROCESSING...' : !razorpayLoaded ? 'LOADING...' : `PAY ₹${(finalTotalPaise / 100).toFixed(2)} NOW`}
            </button>

            {/* Security Badge */}
            <div className="security-badge">
              <span><FiLock style={{marginRight: '0.5rem', display: 'inline'}} /> 100% Secure Payment via Razorpay</span>
            </div>
          </div>
        </div>
      </div>
    </Wrapper>
  );
};

const Wrapper = styled.section`
  padding: 9rem 0;
  background: linear-gradient(135deg, #FFF8E7 0%, #F5E6D3 100%);
  min-height: 100vh;

  .container {
    max-width: 600px;
    margin: 0 auto;
    padding: 0 2rem;
  }

  .payment-card {
    background: white;
    border-radius: 1.6rem;
    box-shadow: 0 4px 16px rgba(139, 69, 19, 0.1);
    padding: 3.5rem;
    border: 1px solid rgba(210, 105, 30, 0.08);
  }

  .page-title {
    font-size: 3rem;
    font-weight: 700;
    color: #4a4a4a;
    margin: 0 0 3rem 0;
    text-align: center;
    letter-spacing: -0.01em;
  }

  .order-review {
    .summary-details {
      margin-bottom: 3rem;

      .detail-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.2rem 0;
        font-size: 1.6rem;

        .detail-label {
          color: #6b7280;
          font-weight: 500;
        }

        .detail-value {
          color: #2d2d2d;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
        }

        &.savings, &.discount, &.coupon {
          .negative {
            color: #10b981;
            font-weight: 700;
          }
        }

        &.shipping {
          .free-shipping {
            color: #10b981;
            font-weight: 700;
            font-size: 1.6rem;
          }
        }

        &.total {
          margin-top: 1rem;
          padding: 2rem;
          background: linear-gradient(135deg, rgba(255, 248, 224, 0.5), rgba(240, 240, 240, 0.3));
          border-radius: 1.2rem;
          border: 1px solid rgba(210, 105, 30, 0.1);

          .detail-label {
            font-size: 1.8rem;
            color: #4a4a4a;
            font-weight: 700;
            letter-spacing: -0.01em;
          }

          .total-amount {
            font-size: 2.4rem;
            color: #D2691E;
            font-weight: 800;
          }
        }
      }

      .divider {
        border: none;
        border-top: 2px dashed #e5e7eb;
        margin: 1.5rem 0;
      }
    }

    .pay-button {
      width: 100%;
      background: linear-gradient(135deg, #CD853F, #D2691E);
      color: white;
      padding: 2rem 3rem;
      font-size: 1.9rem;
      font-weight: 800;
      border: none;
      border-radius: 0.8rem;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
      text-transform: uppercase;
      letter-spacing: -0.01em;
      box-shadow: 0 2px 8px rgba(210, 105, 30, 0.2);

      &:hover:not(:disabled) {
        background: linear-gradient(135deg, #D2691E, #8B4513);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(210, 105, 30, 0.3);
      }

      &:active:not(:disabled) {
        transform: translateY(0);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
      }
    }

    .security-badge {
      text-align: center;
      margin-top: 2rem;
      font-size: 1.3rem;
      color: #6b7280;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;

      span {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
    }
  }

  /* Delivery Address Section Styles */
  .delivery-address-section {
    margin-bottom: 2rem;
    padding: 2rem;
    background: linear-gradient(135deg, rgba(255, 248, 224, 0.3), rgba(245, 245, 245, 0.5));
    border-radius: 1.2rem;
    border: 1px solid rgba(210, 105, 30, 0.1);

    h3 {
      font-size: 1.8rem;
      color: #4a4a4a;
      margin-bottom: 1.5rem;
      font-weight: 700;
      letter-spacing: -0.01em;
    }

    .saved-addresses {
      display: flex;
      flex-direction: column;
      gap: 1rem;

      .address-option {
        display: flex;
        gap: 1rem;
        padding: 1.5rem;
        background: white;
        border: 1.5px solid #e0d5c5;
        border-radius: 1rem;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);

        &:hover {
          border-color: #D2691E;
          box-shadow: 0 2px 8px rgba(210, 105, 30, 0.1);
        }

        &.selected {
          border-color: #D2691E;
          background: linear-gradient(135deg, rgba(255, 248, 224, 0.4), rgba(210, 105, 30, 0.05));
        }

        .address-radio {
          display: flex;
          align-items: flex-start;
          padding-top: 0.3rem;

          input[type="radio"] {
            width: 1.8rem;
            height: 1.8rem;
            accent-color: #D2691E;
            cursor: pointer;
          }
        }

        .address-details {
          flex: 1;

          .address-header {
            display: flex;
            align-items: center;
            gap: 0.8rem;
            margin-bottom: 0.5rem;

            .address-label {
              font-size: 1.2rem;
              font-weight: 600;
              color: #D2691E;
              background: rgba(210, 105, 30, 0.1);
              padding: 0.3rem 0.8rem;
              border-radius: 0.4rem;
            }

            .default-tag {
              font-size: 1.1rem;
              font-weight: 500;
              color: #10b981;
              background: rgba(16, 185, 129, 0.1);
              padding: 0.3rem 0.8rem;
              border-radius: 0.4rem;
            }
          }

          .address-name {
            font-size: 1.5rem;
            font-weight: 600;
            color: #1f2937;
            margin: 0 0 0.3rem 0;
          }

          .address-phone {
            font-size: 1.3rem;
            color: #6b7280;
            margin: 0 0 0.5rem 0;
          }

          .address-full {
            font-size: 1.3rem;
            color: #374151;
            line-height: 1.4;
            margin: 0;
          }
        }
      }

      .add-new-address-btn {
        padding: 1rem;
        font-size: 1.4rem;
        font-weight: 600;
        color: #D2691E;
        background: white;
        border: 1.5px dashed #D2691E;
        border-radius: 1rem;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);

        &:hover {
          background: rgba(210, 105, 30, 0.03);
          border-color: #8B4513;
        }
      }
    }

    .new-address-form {
      margin-top: 1.5rem;
      padding: 1.5rem;
      background: white;
      border-radius: 1rem;
      border: 1px solid rgba(210, 105, 30, 0.1);

      h4 {
        font-size: 1.5rem;
        color: #4a4a4a;
        margin-bottom: 1.5rem;
        font-weight: 700;
        letter-spacing: -0.01em;
      }

      .form-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .form-group {
        margin-bottom: 0.5rem;

        &.full-width {
          grid-column: 1 / -1;
          margin-bottom: 1rem;
        }

        label {
          display: block;
          font-size: 1.3rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        input {
          width: 100%;
          padding: 1rem 1.2rem;
          font-size: 1.4rem;
          border: 1.5px solid #e0d5c5;
          border-radius: 0.8rem;
          transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);

          &:focus {
            outline: none;
            border-color: #D2691E;
            box-shadow: 0 0 0 3px rgba(210, 105, 30, 0.08);
          }

          &.error {
            border-color: #ef4444;
          }

          &::placeholder {
            color: #9ca3af;
          }
        }

        .error-text {
          display: block;
          font-size: 1.2rem;
          color: #ef4444;
          margin-top: 0.4rem;
        }
      }
    }
  }

  /* Guest Checkout Styles */
  .guest-checkout-section {
    margin-bottom: 2rem;
    padding: 2rem;
    background: linear-gradient(135deg, rgba(255, 248, 224, 0.3), rgba(245, 245, 245, 0.5));
    border-radius: 1.2rem;
    border: 1px solid rgba(210, 105, 30, 0.1);

    .checkout-toggle {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;

      .toggle-btn {
        flex: 1;
        padding: 1.2rem 1.5rem;
        font-size: 1.4rem;
        font-weight: 600;
        border: 1.5px solid #e0d5c5;
        border-radius: 1rem;
        background: white;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);

        &:hover {
          border-color: #D2691E;
        }

        &.active {
          background: linear-gradient(135deg, rgba(255, 248, 224, 0.4), rgba(210, 105, 30, 0.05));
          border-color: #D2691E;
          color: #D2691E;
        }
      }
    }

    .guest-form {
      h3 {
        font-size: 1.8rem;
        color: #4a4a4a;
        margin-bottom: 1.5rem;
        font-weight: 700;
        letter-spacing: -0.01em;
      }

      .form-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .form-group {
        margin-bottom: 0.5rem;

        &.full-width {
          grid-column: 1 / -1;
          margin-bottom: 1rem;
        }

        label {
          display: block;
          font-size: 1.3rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        input {
          width: 100%;
          padding: 1rem 1.2rem;
          font-size: 1.4rem;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          transition: all 0.3s ease;

          &:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          }

          &.error {
            border-color: #ef4444;
          }

          &::placeholder {
            color: #9ca3af;
          }
        }

        .error-text {
          display: block;
          font-size: 1.2rem;
          color: #ef4444;
          margin-top: 0.4rem;
        }
      }
    }
  }

  @media (max-width: 768px) {
    padding: 6rem 0;

    .container {
      padding: 0 1rem;
    }

    .payment-card {
      padding: 2.5rem;
      border-radius: 16px;
    }

    .page-title {
      font-size: 2.4rem;
      margin-bottom: 2.5rem;
    }

    .order-review {
      .summary-details {
        .detail-row {
          font-size: 1.4rem;
          padding: 1rem 0;

          &.total {
            padding: 1.5rem;

            .detail-label {
              font-size: 1.6rem;
            }

            .total-amount {
              font-size: 2rem;
            }
          }
        }
      }

      .pay-button {
        padding: 1.7rem 2rem;
        font-size: 1.7rem;
      }

      .security-badge {
        font-size: 1.2rem;
      }
    }
  }
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 4rem;
  background: white;
  border-radius: 1.6rem;
  box-shadow: 0 4px 16px rgba(139, 69, 19, 0.1);
  border: 1px solid rgba(210, 105, 30, 0.08);

  .spinner {
    width: 50px;
    height: 50px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #D2691E;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1.5rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  p {
    font-size: 1.6rem;
    color: #6b7280;
    font-weight: 500;
  }
`;

const EmptyCartMessage = styled.div`
  text-align: center;
  padding: 5rem 2rem;
  background: white;
  border-radius: 1.6rem;
  box-shadow: 0 4px 16px rgba(139, 69, 19, 0.1);
  border: 1px solid rgba(210, 105, 30, 0.08);

  h2 {
    font-size: 2.8rem;
    color: #4a4a4a;
    margin-bottom: 1.5rem;
    font-weight: 700;
    letter-spacing: -0.01em;
  }

  p {
    font-size: 1.7rem;
    color: #6b7280;
    margin-bottom: 3rem;
  }

  .btn-shop {
    background: linear-gradient(135deg, #CD853F, #D2691E);
    color: white;
    padding: 1.5rem 4rem;
    font-size: 1.7rem;
    font-weight: 700;
    border: none;
    border-radius: 0.8rem;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
    box-shadow: 0 2px 8px rgba(210, 105, 30, 0.2);

    &:hover {
      background: linear-gradient(135deg, #D2691E, #8B4513);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(210, 105, 30, 0.3);
    }
  }
`;

export default Payment;
