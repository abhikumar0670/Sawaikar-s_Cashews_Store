import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { toast } from 'react-toastify';
import { useUser } from '@clerk/clerk-react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FaCreditCard, FaUniversity, FaWallet, FaMobileAlt, FaStore } from 'react-icons/fa';
import { FiTruck, FiRefreshCw, FiFileText, FiX, FiShoppingBag, FiPackage, FiClock, FiCheckCircle, FiAlertCircle, FiFilter, FiArrowRight, FiMapPin } from 'react-icons/fi';
import placeholderImg from './assets/placeholderImg';
import OrderTracking from './components/OrderTracking';
import { useCartContext } from './context/cart_context';
import { useAuth } from '@clerk/clerk-react';
import API_BASE_URL from './config/api';

const API_URL = API_BASE_URL;

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState(null);
  const [reordering, setReordering] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [showReorderConfirm, setShowReorderConfirm] = useState(false);
  const [selectedOrderForReorder, setSelectedOrderForReorder] = useState(null);
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const { addToCart, clearCart } = useCartContext();
  const navigate = useNavigate();

  const getAuthConfig = async () => {
    const token = await getToken();
    return {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    };
  };

  useEffect(() => {
    // Scroll to top on page load
    window.scrollTo(0, 0);
    
    const fetchOrders = async () => {
      if (!isLoaded) return;

      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const authConfig = await getAuthConfig();
        const response = await axios.get(`${API_URL}/orders`, authConfig);
        const fetchedOrders = response.data || [];
        fetchedOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(fetchedOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast.error('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    // Keep orders/stats fresh when user places/cancels orders in other tabs/pages.
    const refreshInterval = setInterval(fetchOrders, 30000);
    const handleFocusRefresh = () => fetchOrders();
    window.addEventListener('focus', handleFocusRefresh);

    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener('focus', handleFocusRefresh);
    };
  }, [user, isLoaded]);

  const handleCancel = async (orderId) => {
    try {
      const authConfig = await getAuthConfig();
      await axios.delete(`${API_URL}/orders/${orderId}`, authConfig);
      setOrders(orders.map(order =>
        order.orderId === orderId ? { ...order, orderStatus: 'cancelled' } : order
      ));
      toast.success('Order cancelled successfully');
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    }
  };

  const handleReturn = async (orderId) => {
    try {
      const authConfig = await getAuthConfig();
      await axios.put(`${API_URL}/orders/${orderId}`, {
        orderStatus: 'return_initiated'
      }, authConfig);
      setOrders(orders.map(order =>
        order.orderId === orderId ? { ...order, orderStatus: 'return_initiated' } : order
      ));
      toast.success('Return initiated successfully');
    } catch (error) {
      console.error('Error initiating return:', error);
      toast.error(error.response?.data?.message || 'Failed to initiate return');
    }
  };

  // Show reorder confirmation dialog
  const handleShowReorderConfirm = (orderId, orderDetails) => {
    setSelectedOrderForReorder({ orderId, ...orderDetails });
    setShowReorderConfirm(true);
  };

  // Confirm reorder and proceed
  const handleConfirmReorder = async () => {
    if (!selectedOrderForReorder) return;
    
    setShowReorderConfirm(false);
    await handleReorder(selectedOrderForReorder.orderId);
    setSelectedOrderForReorder(null);
  };

  // Cancel reorder confirmation
  const handleCancelReorder = () => {
    setShowReorderConfirm(false);
    setSelectedOrderForReorder(null);
  };

  const handleTrack = (order) => {
    setSelectedOrderForTracking(order.orderId);
  };

  const handleReorder = async (orderId) => {
    try {
      setReordering(orderId);
      const authConfig = await getAuthConfig();
      const response = await axios.post(`${API_URL}/orders/${orderId}/reorder`, {}, authConfig);
      const { reorderData } = response.data;

      if (reorderData.unavailableItems && reorderData.unavailableItems.length > 0) {
        toast.warn(`Some items are unavailable: ${reorderData.unavailableItems.map(i => i.name).join(', ')}`);
      }

      clearCart();

      for (const item of reorderData.items) {
        addToCart(item.productId, item.color || '#f5deb3', item.quantity, {
          id: item.productId,
          name: item.name,
          price: item.price,
          image: Array.isArray(item.image) ? item.image : [item.image],
          color: item.color || '#f5deb3',
          stock: 100,
          selectedWeight: item.weight
        });
      }

      toast.success('Items added to cart! Proceed to checkout.');
      window.scrollTo(0, 0);
      navigate('/cart');
    } catch (error) {
      console.error('Error reordering:', error);
      const errorMsg = error.response?.data?.message;
      
      // Only show stock message for specific "no longer available" error
      if (errorMsg?.includes('All items from this order are no longer available')) {
        toast.error('All items from this order are no longer available');
      } else {
        toast.error(errorMsg || 'Failed to reorder');
      }
    } finally {
      setReordering(null);
    }
  };

  const getProductImage = (item) => {
    if (item.image) return item.image;

    const name = (item.name || '').toLowerCase();
    try {
      if (name.includes('honey roasted') || name.includes('flavored')) return require('./assets/Honey-Roasted-Cashews.jpg');
      if (name.includes('roasted') && name.includes('salted')) return require('./assets/Honey-Roasted-Cashews.jpg');
      if (name.includes('cashew')) return require('./assets/Honey-Roasted-Cashews.jpg');
      if (name.includes('almond')) return require('./assets/almond.jpg');
      if (name.includes('pista')) return require('./assets/pista.jpg');
      if (name.includes('date')) return require('./assets/date.jpg');
      if (name.includes('fig')) return require('./assets/driedfigs.jpg');
      if (name.includes('hamper')) return require('./assets/dry-fruits-hamper.jpg');
      if (name.includes('resin')) return require('./assets/resins.jpg');
      if (name.includes('walnut')) return require('./assets/walnaut.jpg');
      if (name.includes('chickpea')) return require('./assets/RoastedChickpeas.jpg');
      if (name.includes('trail')) return require('./assets/trailmixrecipe.jpg');
      if (name.includes('granola')) return require('./assets/Granola-Bars.jpg');
      return placeholderImg;
    } catch (e) {
      return placeholderImg;
    }
  };

  const getStatusIcon = (status) => {
    switch(status?.toLowerCase()) {
      case 'delivered': return <FiCheckCircle />;
      case 'shipped':
      case 'out_for_delivery': return <FiTruck />;
      case 'processing':
      case 'confirmed': return <FiClock />;
      case 'return_initiated':
      case 'returned':
      case 'cancelled': return <FiAlertCircle />;
      default: return <FiPackage />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'active') return ['placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery'].includes(order.orderStatus);
    if (activeFilter === 'delivered') return ['delivered', 'return_initiated', 'returned'].includes(order.orderStatus);
    if (activeFilter === 'cancelled') return order.orderStatus === 'cancelled';
    return true;
  });

  // Calculate stats
  const stats = {
    total: orders.length,
    active: orders.filter(o => ['placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery'].includes(o.orderStatus)).length,
    delivered: orders.filter(o => ['delivered', 'return_initiated', 'returned'].includes(o.orderStatus)).length,
    totalSpent: orders.filter(o => o.paymentStatus === 'completed').reduce((sum, o) => sum + (o.totalAmount || o.totalPrice || 0), 0) / 100
  };

  if (loading) {
    return (
      <Wrapper>
        <HeroSection>
          <HeroContent>
            <HeroIcon><FiPackage /></HeroIcon>
            <h1>My Orders</h1>
            <p>Track and manage your orders</p>
          </HeroContent>
        </HeroSection>
        <ContentSection>
          <LoadingState>
            <Spinner />
            <span>Loading your orders...</span>
          </LoadingState>
        </ContentSection>
      </Wrapper>
    );
  }

  if (!user) {
    return (
      <Wrapper>
        <HeroSection>
          <HeroContent>
            <HeroIcon><FiPackage /></HeroIcon>
            <h1>My Orders</h1>
            <p>Track and manage your orders</p>
          </HeroContent>
        </HeroSection>
        <ContentSection>
          <EmptyState>
            <EmptyIcon>🔐</EmptyIcon>
            <h2>Please Sign In</h2>
            <p>Sign in to view your order history and track your deliveries.</p>
          </EmptyState>
        </ContentSection>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      {/* Hero Section */}
      <HeroSection>
        <HeroContent>
          <HeroIcon><FiPackage /></HeroIcon>
          <h1>My Orders</h1>
          <p>Track and manage all your orders in one place</p>

          {orders.length > 0 && (
            <StatsRow>
              <StatCard>
                <StatNumber>{stats.total}</StatNumber>
                <StatLabel>Total Orders</StatLabel>
              </StatCard>
              <StatDivider />
              <StatCard>
                <StatNumber>{stats.active}</StatNumber>
                <StatLabel>In Progress</StatLabel>
              </StatCard>
              <StatDivider />
              <StatCard>
                <StatNumber>{stats.delivered}</StatNumber>
                <StatLabel>Delivered</StatLabel>
              </StatCard>
              <StatDivider />
              <StatCard>
                <StatNumber>₹{stats.totalSpent.toLocaleString()}</StatNumber>
                <StatLabel>Total Spent</StatLabel>
              </StatCard>
            </StatsRow>
          )}
        </HeroContent>
      </HeroSection>

      <ContentSection>
        {orders.length === 0 ? (
          <EmptyState>
            <EmptyAnimation>
              <EmptyBox>
                <FiPackage />
              </EmptyBox>
            </EmptyAnimation>
            <h2>No Orders Yet</h2>
            <p>You haven't placed any orders yet. Start shopping to see your orders here!</p>
            <ShopButton to="/products">
              <FiShoppingBag />
              Start Shopping
              <FiArrowRight className="arrow" />
            </ShopButton>
          </EmptyState>
        ) : (
          <>
            {/* Filter Bar */}
            <FilterBar>
              <FilterInfo>
                <FiFilter />
                <span>Filter Orders</span>
              </FilterInfo>
              <FilterTabs>
                <FilterTab $active={activeFilter === 'all'} onClick={() => setActiveFilter('all')}>
                  All ({stats.total})
                </FilterTab>
                <FilterTab $active={activeFilter === 'active'} onClick={() => setActiveFilter('active')}>
                  In Progress ({stats.active})
                </FilterTab>
                <FilterTab $active={activeFilter === 'delivered'} onClick={() => setActiveFilter('delivered')}>
                  Delivered ({stats.delivered})
                </FilterTab>
                <FilterTab $active={activeFilter === 'cancelled'} onClick={() => setActiveFilter('cancelled')}>
                  Cancelled
                </FilterTab>
              </FilterTabs>
            </FilterBar>

            {/* Orders List */}
            <OrdersList>
              {filteredOrders.map(order => (
                <OrderCard key={order._id || order.orderId}>
                  {/* Order Header */}
                  <OrderHeader>
                    <OrderIdSection>
                      <OrderId>#{order.orderId || order._id?.slice(-8).toUpperCase()}</OrderId>
                      <OrderTypeBadge $type={order.orderType || 'online'}>
                        {order.orderType === 'instore' ? <><FaStore /> In-Store</> : <><FiTruck /> Online</>}
                      </OrderTypeBadge>
                    </OrderIdSection>
                    <OrderDate>{formatDate(order.createdAt)}</OrderDate>
                  </OrderHeader>

                  {/* Order Status */}
                  <OrderStatusSection>
                    <StatusBadge $status={order.orderStatus || 'placed'}>
                      {getStatusIcon(order.orderStatus)}
                      {(order.orderStatus || 'placed').replace('_', ' ')}
                    </StatusBadge>
                    <PaymentInfo>
                      <PaymentStatus $status={order.paymentStatus}>
                        {order.paymentStatus === 'completed' ? '✓ Paid' : '⏳ Payment ' + (order.paymentStatus || 'pending')}
                      </PaymentStatus>
                      <PaymentMethod>
                        {(() => {
                          const paymentInfo = order.paymentInfo || {};
                          const method = (paymentInfo.type || order.paymentMethod || '').toLowerCase();

                          if (method === 'upi') return <><FaMobileAlt /> UPI</>;
                          if (method === 'card') return <><FaCreditCard /> Card</>;
                          if (method === 'netbanking') return <><FaUniversity /> Netbanking</>;
                          if (method === 'wallet') return <><FaWallet /> Wallet</>;
                          return method.toUpperCase() || 'N/A';
                        })()}
                      </PaymentMethod>
                    </PaymentInfo>
                  </OrderStatusSection>

                  {/* Order Items */}
                  <OrderItemsGrid>
                    {order.items && order.items.slice(0, 4).map((item, idx) => (
                      <OrderItem key={idx}>
                        <ItemImage
                          src={getProductImage(item)}
                          alt={item.name}
                          onError={e => {e.target.onerror=null; e.target.src=placeholderImg}}
                        />
                        <ItemDetails>
                          <ItemName>{item.name}</ItemName>
                          <ItemMeta>
                            <span>Qty: {item.quantity || item.amount}</span>
                            <span>₹{((item.price || 0) / 100).toFixed(2)}</span>
                          </ItemMeta>
                        </ItemDetails>
                      </OrderItem>
                    ))}
                    {order.items && order.items.length > 4 && (
                      <MoreItems>+{order.items.length - 4} more items</MoreItems>
                    )}
                  </OrderItemsGrid>

                  {/* Order Footer */}
                  <OrderFooter>
                    <TotalAmount>
                      <span>Total</span>
                      <strong>₹{((order.totalAmount || order.totalPrice || 0) / 100).toLocaleString()}</strong>
                    </TotalAmount>
                    <ActionButtons>
                      {order.orderType !== 'instore' && (
                        <ActionBtn $variant="primary" onClick={() => handleTrack(order)}>
                          <FiMapPin />
                          Track Order
                        </ActionBtn>
                      )}
                      <ActionBtn onClick={() => handleShowReorderConfirm(order.orderId, { totalAmount: order.totalAmount, totalPrice: order.totalPrice, itemCount: order.items?.length || 0, orderId: order.orderId })} disabled={reordering === order.orderId}>
                        <FiRefreshCw className={reordering === order.orderId ? 'spin' : ''} />
                        {reordering === order.orderId ? 'Adding...' : 'Reorder'}
                      </ActionBtn>
                      {order.paymentStatus === 'completed' && (
                        <ActionBtn onClick={() => navigate('/payment-history')} title="View Invoice">
                          <FiFileText />
                          Invoice
                        </ActionBtn>
                      )}
                      {order.orderStatus === 'delivered' && (
                        <ActionBtn $variant="return" onClick={() => handleReturn(order.orderId)}>
                          Return
                        </ActionBtn>
                      )}
                      {['placed', 'confirmed'].includes(order.orderStatus) && (
                        <ActionBtn $variant="cancel" onClick={() => handleCancel(order.orderId)}>
                          Cancel
                        </ActionBtn>
                      )}
                    </ActionButtons>
                  </OrderFooter>
                </OrderCard>
              ))}
            </OrdersList>

            {filteredOrders.length === 0 && (
              <NoResults>
                <FiPackage />
                <p>No orders found for this filter.</p>
              </NoResults>
            )}
          </>
        )}
      </ContentSection>

      {/* Tracking Modal */}
      {selectedOrderForTracking && (
        <TrackingModal onClick={() => setSelectedOrderForTracking(null)}>
          <TrackingModalContent onClick={e => e.stopPropagation()}>
            <CloseModalBtn onClick={() => setSelectedOrderForTracking(null)}>
              <FiX />
            </CloseModalBtn>
            <OrderTracking
              orderId={selectedOrderForTracking}
              onReorder={(id) => {
                setSelectedOrderForTracking(null);
                handleReorder(id);
              }}
            />
          </TrackingModalContent>
        </TrackingModal>
      )}

      {/* Reorder Confirmation Modal */}
      {showReorderConfirm && selectedOrderForReorder && (
        <ReorderConfirmOverlay onClick={handleCancelReorder}>
          <ReorderConfirmModal onClick={e => e.stopPropagation()}>
            <ConfirmContent>
              <ConfirmHeader>
                <FiAlertCircle />
                <ConfirmTitle>Confirm Reorder</ConfirmTitle>
              </ConfirmHeader>
              
              <ConfirmBody>
                <Message>
                  Are you sure you want to reorder this order?
                </Message>
                
                <OrderSummary>
                  <SummaryRow>
                    <span>Order ID:</span>
                    <strong>#{selectedOrderForReorder.orderId?.slice(-8) || 'N/A'}</strong>
                  </SummaryRow>
                  <SummaryRow>
                    <span>Items:</span>
                    <strong>{selectedOrderForReorder.itemCount} item(s)</strong>
                  </SummaryRow>
                  <SummaryRow $highlight>
                    <span>Amount:</span>
                    <strong>₹{((selectedOrderForReorder.totalAmount || selectedOrderForReorder.totalPrice || 0) / 100).toLocaleString()}</strong>
                  </SummaryRow>
                </OrderSummary>

                <InfoText>
                  All items will be added to your cart. You can review and proceed to checkout.
                </InfoText>
              </ConfirmBody>

              <ConfirmActions>
                <CancelBtn onClick={handleCancelReorder}>
                  <FiX /> Cancel
                </CancelBtn>
                <ConfirmBtn onClick={handleConfirmReorder} disabled={reordering === selectedOrderForReorder.orderId}>
                  <FiRefreshCw className={reordering === selectedOrderForReorder.orderId ? 'spin' : ''} />
                  {reordering === selectedOrderForReorder.orderId ? 'Processing...' : 'Confirm Reorder'}
                </ConfirmBtn>
              </ConfirmActions>
            </ConfirmContent>
          </ReorderConfirmModal>
        </ReorderConfirmOverlay>
      )}
    </Wrapper>
  );
};

// Animations
const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
`;

// Styled Components
const Wrapper = styled.div`
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
    inset: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  }
`;

const HeroContent = styled.div`
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 1;

  h1 {
    font-size: 42px;
    font-weight: 700;
    margin-bottom: 12px;

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
  animation: ${pulse} 2s ease-in-out infinite;

  svg {
    font-size: 36px;
  }
`;

const StatsRow = styled.div`
  display: inline-flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 50px;
  padding: 16px 32px;
  gap: 24px;
  flex-wrap: wrap;
  justify-content: center;

  @media (max-width: 600px) {
    padding: 12px 20px;
    gap: 16px;
  }
`;

const StatCard = styled.div`
  text-align: center;
`;

const StatNumber = styled.div`
  font-size: 24px;
  font-weight: 700;

  @media (max-width: 600px) {
    font-size: 20px;
  }
`;

const StatLabel = styled.div`
  font-size: 12px;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const StatDivider = styled.div`
  width: 1px;
  height: 40px;
  background: rgba(255, 255, 255, 0.3);

  @media (max-width: 600px) {
    display: none;
  }
`;

const ContentSection = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 40px 24px;
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 16px;
  color: #8B4513;
`;

const Spinner = styled.div`
  width: 48px;
  height: 48px;
  border: 4px solid #f0e6d3;
  border-top-color: #8B4513;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 24px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);

  h2 {
    font-size: 28px;
    color: #333;
    margin-bottom: 12px;
  }

  p {
    font-size: 16px;
    color: #666;
    margin-bottom: 30px;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
  }
`;

const EmptyAnimation = styled.div`
  margin-bottom: 30px;
`;

const EmptyBox = styled.div`
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, #8B4513, #D2691E);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  animation: ${float} 3s ease-in-out infinite;
  box-shadow: 0 10px 40px rgba(139, 69, 19, 0.3);

  svg {
    font-size: 48px;
    color: white;
  }
`;

const EmptyIcon = styled.div`
  font-size: 80px;
  margin-bottom: 20px;
`;

const ShopButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, #8B4513, #A0522D);
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

const FilterBar = styled.div`
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

const FilterInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-weight: 500;

  svg {
    font-size: 18px;
  }
`;

const FilterTabs = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const FilterTab = styled.button`
  padding: 8px 16px;
  border-radius: 20px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.$active ? 'linear-gradient(135deg, #8B4513, #A0522D)' : '#f5f5f5'};
  color: ${props => props.$active ? 'white' : '#666'};

  &:hover {
    background: ${props => props.$active ? 'linear-gradient(135deg, #8B4513, #A0522D)' : '#e5e5e5'};
  }
`;

const OrdersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const OrderCard = styled.div`
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  }
`;

const OrderHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, #faf9f6, #f5f0e8);
  border-bottom: 1px solid #f0e6d3;
  flex-wrap: wrap;
  gap: 12px;
`;

const OrderIdSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const OrderId = styled.span`
  font-size: 18px;
  font-weight: 700;
  color: #8B4513;
`;

const OrderTypeBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background: ${props => props.$type === 'instore' ? '#D1FAE5' : '#DBEAFE'};
  color: ${props => props.$type === 'instore' ? '#065F46' : '#1E40AF'};

  svg {
    font-size: 12px;
  }
`;

const OrderDate = styled.span`
  font-size: 14px;
  color: #888;
`;

const OrderStatusSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  flex-wrap: wrap;
  gap: 12px;
`;

const StatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 600;
  text-transform: capitalize;

  ${props => {
    switch(props.$status?.toLowerCase()) {
      case 'delivered':
        return `background: #D1FAE5; color: #065F46;`;
      case 'shipped':
      case 'out_for_delivery':
        return `background: #DBEAFE; color: #1E40AF;`;
      case 'processing':
      case 'confirmed':
        return `background: #FEF3C7; color: #92400E;`;
      case 'return_initiated':
        return `background: #FFF7ED; color: #C2410C;`;
      case 'returned':
        return `background: #FDE68A; color: #92400E;`;
      case 'cancelled':
        return `background: #FEE2E2; color: #991B1B;`;
      default:
        return `background: #F3E8FF; color: #6B21A8;`;
    }
  }}

  svg {
    font-size: 16px;
  }
`;

const PaymentInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const PaymentStatus = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: ${props => props.$status === 'completed' ? '#059669' : '#D97706'};
`;

const PaymentMethod = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #666;
  background: #f5f5f5;
  padding: 4px 12px;
  border-radius: 12px;

  svg {
    font-size: 14px;
  }
`;

const OrderItemsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  padding: 20px 24px;
  background: #fafafa;
`;

const OrderItem = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  background: white;
  padding: 12px;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const ItemImage = styled.img`
  width: 56px;
  height: 56px;
  border-radius: 8px;
  object-fit: cover;
  background: #f5f5f5;
`;

const ItemDetails = styled.div`
  flex: 1;
  min-width: 0;
`;

const ItemName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ItemMeta = styled.div`
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #888;
  margin-top: 4px;
`;

const MoreItems = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #8B4513;
  font-weight: 500;
  background: white;
  padding: 12px;
  border-radius: 10px;
  border: 2px dashed #e0d5c5;
`;

const OrderFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-top: 1px solid #f0f0f0;
  flex-wrap: wrap;
  gap: 16px;
`;

const TotalAmount = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;

  span {
    font-size: 12px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  strong {
    font-size: 24px;
    font-weight: 700;
    color: #8B4513;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const ActionBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;

  ${props => {
    if (props.$variant === 'primary') {
      return `
        background: linear-gradient(135deg, #8B4513, #A0522D);
        color: white;
        &:hover { box-shadow: 0 4px 12px rgba(139, 69, 19, 0.3); }
      `;
    }
    if (props.$variant === 'return') {
      return `
        background: #FEF3C7;
        color: #92400E;
        &:hover { background: #FDE68A; }
      `;
    }
    if (props.$variant === 'cancel') {
      return `
        background: #FEE2E2;
        color: #991B1B;
        &:hover { background: #FECACA; }
      `;
    }
    return `
      background: #f5f5f5;
      color: #555;
      &:hover { background: #e5e5e5; }
    `;
  }}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spin {
    animation: ${spin} 1s linear infinite;
  }
`;

const NoResults = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #888;

  svg {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  p {
    font-size: 16px;
  }
`;

const TrackingModal = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 20px;
`;

const TrackingModalContent = styled.div`
  background: white;
  border-radius: 24px;
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  padding: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const CloseModalBtn = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: #f3f4f6;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: all 0.2s ease;

  &:hover {
    background: #e5e7eb;
    transform: scale(1.1);
  }

  svg {
    width: 20px;
    height: 20px;
    color: #374151;
  }
`;

// Reorder Confirmation Modal Styles
const ReorderConfirmOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const ReorderConfirmModal = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  max-width: 420px;
  width: 90%;
  animation: slideUp 0.3s ease;

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const ConfirmContent = styled.div`
  padding: 32px;
`;

const ConfirmHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;

  svg {
    width: 28px;
    height: 28px;
    color: #FF9800;
  }
`;

const ConfirmTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const ConfirmBody = styled.div`
  margin-bottom: 28px;
`;

const Message = styled.p`
  font-size: 1rem;
  color: #4b5563;
  margin: 0 0 20px;
  line-height: 1.5;
`;

const OrderSummary = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 0.95rem;
  color: #4b5563;

  ${props => props.$highlight && `
    border-top: 1px solid #e5e7eb;
    padding-top: 12px;
    margin-top: 8px;
    font-size: 1.05rem;
    color: #1f2937;

    strong {
      color: #FF9800;
      font-weight: 700;
    }
  `}

  strong {
    font-weight: 600;
    color: #1f2937;
  }
`;

const InfoText = styled.p`
  font-size: 0.85rem;
  color: #6b7280;
  background: #f3f4f6;
  border-left: 3px solid #FF9800;
  padding: 10px 12px;
  border-radius: 4px;
  margin: 0;
  line-height: 1.4;
`;

const ConfirmActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const CancelBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: #f3f4f6;
  color: #4b5563;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    background: #e5e7eb;
    color: #1f2937;
  }

  &:active {
    transform: scale(0.98);
  }
`;

const ConfirmBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 24px;
  background: #FF9800;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  svg {
    width: 16px;
    height: 16px;

    &.spin {
      animation: spin 1s linear infinite;
    }
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  &:hover:not(:disabled) {
    background: #e89000;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export default Orders;
