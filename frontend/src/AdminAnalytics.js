import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { API_ENDPOINTS } from './config/api';
import { useAuth } from '@clerk/clerk-react';
import { FiDollarSign, FiShoppingCart, FiUsers, FiPackage, FiTrendingUp, FiTrendingDown, FiAlertCircle, FiAward } from 'react-icons/fi';

const AdminAnalytics = () => {
  const { getToken } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [salesTrends, setSalesTrends] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [inventory, setInventory] = useState(null);
  const [rfmData, setRfmData] = useState(null);
  const [loyaltyStats, setLoyaltyStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [period, setPeriod] = useState('30d');

  const authFetch = async (url) => {
    const token = await getToken();
    return fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (activeTab === 'sales') loadSalesTrends();
    if (activeTab === 'products') loadTopProducts();
    if (activeTab === 'inventory') loadInventory();
    if (activeTab === 'customers') loadRFM();
    if (activeTab === 'loyalty') loadLoyaltyStats();
  }, [activeTab, period]);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const response = await authFetch(API_ENDPOINTS.ANALYTICS_DASHBOARD);
      const data = await response.json();
      if (data.success) {
        setDashboard(data.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSalesTrends = async () => {
    try {
      const response = await authFetch(`${API_ENDPOINTS.ANALYTICS_SALES_TRENDS}?period=${period}`);
      const data = await response.json();
      if (data.success) {
        setSalesTrends(data.data);
      }
    } catch (error) {
      console.error('Failed to load sales trends:', error);
    }
  };

  const loadTopProducts = async () => {
    try {
      const response = await authFetch(`${API_ENDPOINTS.ANALYTICS_TOP_PRODUCTS}?period=${period}`);
      const data = await response.json();
      if (data.success) {
        setTopProducts(data.data);
      }
    } catch (error) {
      console.error('Failed to load top products:', error);
    }
  };

  const loadInventory = async () => {
    try {
      const response = await authFetch(API_ENDPOINTS.ANALYTICS_INVENTORY);
      const data = await response.json();
      if (data.success) {
        setInventory(data.data);
      }
    } catch (error) {
      console.error('Failed to load inventory:', error);
    }
  };

  const loadRFM = async () => {
    try {
      const response = await authFetch(API_ENDPOINTS.ANALYTICS_RFM);
      const data = await response.json();
      if (data.success) {
        setRfmData(data.data);
      }
    } catch (error) {
      console.error('Failed to load RFM:', error);
    }
  };

  const loadLoyaltyStats = async () => {
    try {
      const response = await authFetch(API_ENDPOINTS.ANALYTICS_LOYALTY);
      const data = await response.json();
      if (data.success) {
        setLoyaltyStats(data.data);
      }
    } catch (error) {
      console.error('Failed to load loyalty stats:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount / 100);
  };

  if (isLoading) {
    return <LoadingState>Loading analytics...</LoadingState>;
  }

  return (
    <Container>
      <Header>
        <h1>Analytics Dashboard</h1>
        <p>AI-powered insights for your business</p>
      </Header>

      {/* Quick Stats */}
      <StatsGrid>
        <StatCard $color="#27ae60">
          <StatIcon><FiDollarSign /></StatIcon>
          <StatInfo>
            <StatValue>{formatCurrency(dashboard?.revenue?.thisMonth || 0)}</StatValue>
            <StatLabel>This Month Revenue</StatLabel>
          </StatInfo>
          {dashboard?.forecast?.trend === 'up' && <TrendBadge $up><FiTrendingUp /> Growing</TrendBadge>}
          {dashboard?.forecast?.trend === 'down' && <TrendBadge><FiTrendingDown /> Declining</TrendBadge>}
        </StatCard>

        <StatCard $color="#3498db">
          <StatIcon><FiShoppingCart /></StatIcon>
          <StatInfo>
            <StatValue>{dashboard?.orders?.thisMonth || 0}</StatValue>
            <StatLabel>Orders This Month</StatLabel>
          </StatInfo>
          <SubStat>{dashboard?.orders?.pending || 0} pending</SubStat>
        </StatCard>

        <StatCard $color="#9b59b6">
          <StatIcon><FiUsers /></StatIcon>
          <StatInfo>
            <StatValue>{dashboard?.customers?.total || 0}</StatValue>
            <StatLabel>Total Customers</StatLabel>
          </StatInfo>
          <SubStat>+{dashboard?.customers?.newThisMonth || 0} this month</SubStat>
        </StatCard>

        <StatCard $color="#e67e22">
          <StatIcon><FiPackage /></StatIcon>
          <StatInfo>
            <StatValue>{dashboard?.products?.total || 0}</StatValue>
            <StatLabel>Products</StatLabel>
          </StatInfo>
          {dashboard?.products?.lowStock > 0 && (
            <AlertBadge><FiAlertCircle /> {dashboard.products.lowStock} low stock</AlertBadge>
          )}
        </StatCard>
      </StatsGrid>

      {/* AI Forecast Card */}
      {dashboard?.forecast && (
        <ForecastCard>
          <ForecastHeader>
            <h3>AI Demand Forecast (Next 7 Days)</h3>
            <ConfidenceBadge>
              {dashboard.forecast.confidence}% confidence
            </ConfidenceBadge>
          </ForecastHeader>
          <ForecastContent>
            <ForecastItem>
              <ForecastLabel>Predicted Revenue</ForecastLabel>
              <ForecastValue>{formatCurrency(dashboard.forecast.predictedRevenue)}</ForecastValue>
            </ForecastItem>
            <ForecastItem>
              <ForecastLabel>Predicted Orders</ForecastLabel>
              <ForecastValue>{dashboard.forecast.predictedOrders}</ForecastValue>
            </ForecastItem>
            <ForecastItem>
              <ForecastLabel>Trend</ForecastLabel>
              <TrendIndicator $trend={dashboard.forecast.trend}>
                {dashboard.forecast.trend === 'up' && <><FiTrendingUp /> Upward</>}
                {dashboard.forecast.trend === 'down' && <><FiTrendingDown /> Downward</>}
                {dashboard.forecast.trend === 'stable' && <>Stable</>}
              </TrendIndicator>
            </ForecastItem>
          </ForecastContent>
        </ForecastCard>
      )}

      {/* Tabs */}
      <TabsContainer>
        <Tab $active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
          Overview
        </Tab>
        <Tab $active={activeTab === 'sales'} onClick={() => setActiveTab('sales')}>
          Sales Trends
        </Tab>
        <Tab $active={activeTab === 'products'} onClick={() => setActiveTab('products')}>
          Top Products
        </Tab>
        <Tab $active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')}>
          Inventory
        </Tab>
        <Tab $active={activeTab === 'customers'} onClick={() => setActiveTab('customers')}>
          Customers
        </Tab>
        <Tab $active={activeTab === 'loyalty'} onClick={() => setActiveTab('loyalty')}>
          Loyalty
        </Tab>
      </TabsContainer>

      {/* Period Selector */}
      {(activeTab === 'sales' || activeTab === 'products') && (
        <PeriodSelector>
          <PeriodButton $active={period === '7d'} onClick={() => setPeriod('7d')}>7 Days</PeriodButton>
          <PeriodButton $active={period === '30d'} onClick={() => setPeriod('30d')}>30 Days</PeriodButton>
          <PeriodButton $active={period === '90d'} onClick={() => setPeriod('90d')}>90 Days</PeriodButton>
          <PeriodButton $active={period === '1y'} onClick={() => setPeriod('1y')}>1 Year</PeriodButton>
        </PeriodSelector>
      )}

      {/* Tab Content */}
      <TabContent>
        {activeTab === 'overview' && (
          <OverviewTab>
            <SectionTitle>Quick Overview</SectionTitle>
            <OverviewGrid>
              <OverviewCard>
                <h4>Today's Performance</h4>
                <OverviewStat>
                  <span>Orders</span>
                  <strong>{dashboard?.orders?.today || 0}</strong>
                </OverviewStat>
                <OverviewStat>
                  <span>Avg Order Value</span>
                  <strong>{formatCurrency(dashboard?.revenue?.averageOrderValue || 0)}</strong>
                </OverviewStat>
              </OverviewCard>
              <OverviewCard>
                <h4>This Week</h4>
                <OverviewStat>
                  <span>Orders</span>
                  <strong>{dashboard?.orders?.thisWeek || 0}</strong>
                </OverviewStat>
                <OverviewStat>
                  <span>Total Revenue</span>
                  <strong>{formatCurrency(dashboard?.revenue?.total || 0)}</strong>
                </OverviewStat>
              </OverviewCard>
            </OverviewGrid>
          </OverviewTab>
        )}

        {activeTab === 'sales' && (
          <SalesTab>
            <SectionTitle>Sales Trends</SectionTitle>
            <ChartPlaceholder>
              {salesTrends.length > 0 ? (
                <SimpleChart>
                  {salesTrends.map((item, index) => (
                    <ChartBar key={index}>
                      <BarFill
                        $height={Math.min(100, (item.revenue / Math.max(...salesTrends.map(s => s.revenue))) * 100)}
                      />
                      <BarLabel>{item.date.split('-').slice(1).join('/')}</BarLabel>
                      <BarValue>{formatCurrency(item.revenue)}</BarValue>
                    </ChartBar>
                  ))}
                </SimpleChart>
              ) : (
                <EmptyState>No sales data for selected period</EmptyState>
              )}
            </ChartPlaceholder>
          </SalesTab>
        )}

        {activeTab === 'products' && (
          <ProductsTab>
            <SectionTitle>Top Selling Products</SectionTitle>
            <ProductList>
              {topProducts.map((product, index) => (
                <ProductItem key={product.productId}>
                  <Rank>#{index + 1}</Rank>
                  <ProductImage src={product.image || '/images/default.jpg'} alt={product.name} />
                  <ProductInfo>
                    <ProductName>{product.name}</ProductName>
                    <ProductStats>
                      {product.totalQuantity} sold | {product.orderCount} orders
                    </ProductStats>
                  </ProductInfo>
                  <ProductRevenue>{formatCurrency(product.totalRevenue)}</ProductRevenue>
                </ProductItem>
              ))}
            </ProductList>
          </ProductsTab>
        )}

        {activeTab === 'inventory' && inventory && (
          <InventoryTab>
            <SectionTitle>Inventory Status</SectionTitle>
            <InventoryGrid>
              <InventoryCard $color="#27ae60">
                <InventoryValue>{inventory.levels?.inStock || 0}</InventoryValue>
                <InventoryLabel>In Stock</InventoryLabel>
              </InventoryCard>
              <InventoryCard $color="#f39c12">
                <InventoryValue>{inventory.levels?.lowStock || 0}</InventoryValue>
                <InventoryLabel>Low Stock</InventoryLabel>
              </InventoryCard>
              <InventoryCard $color="#e74c3c">
                <InventoryValue>{inventory.levels?.outOfStock || 0}</InventoryValue>
                <InventoryLabel>Out of Stock</InventoryLabel>
              </InventoryCard>
            </InventoryGrid>

            {inventory.lowStockProducts?.length > 0 && (
              <>
                <SectionTitle>Low Stock Alerts</SectionTitle>
                <LowStockList>
                  {inventory.lowStockProducts.map(product => (
                    <LowStockItem key={product.productId}>
                      <FiAlertCircle color="#e74c3c" />
                      <span>{product.name}</span>
                      <StockBadge $critical={product.stock === 0}>
                        {product.stock} left
                      </StockBadge>
                    </LowStockItem>
                  ))}
                </LowStockList>
              </>
            )}
          </InventoryTab>
        )}

        {activeTab === 'customers' && rfmData && (
          <CustomersTab>
            <SectionTitle>Customer Segments (RFM Analysis)</SectionTitle>
            <SegmentsGrid>
              <SegmentCard $color="#9b59b6">
                <SegmentIcon><FiAward /></SegmentIcon>
                <SegmentValue>{rfmData.segments?.champions || 0}</SegmentValue>
                <SegmentLabel>Champions</SegmentLabel>
                <SegmentDesc>High value, frequent buyers</SegmentDesc>
              </SegmentCard>
              <SegmentCard $color="#3498db">
                <SegmentValue>{rfmData.segments?.loyalCustomers || 0}</SegmentValue>
                <SegmentLabel>Loyal Customers</SegmentLabel>
                <SegmentDesc>Regular repeat buyers</SegmentDesc>
              </SegmentCard>
              <SegmentCard $color="#27ae60">
                <SegmentValue>{rfmData.segments?.potentialLoyalists || 0}</SegmentValue>
                <SegmentLabel>Potential Loyalists</SegmentLabel>
                <SegmentDesc>Recent buyers, nurture them</SegmentDesc>
              </SegmentCard>
              <SegmentCard $color="#f39c12">
                <SegmentValue>{rfmData.segments?.atRisk || 0}</SegmentValue>
                <SegmentLabel>At Risk</SegmentLabel>
                <SegmentDesc>Haven't bought recently</SegmentDesc>
              </SegmentCard>
              <SegmentCard $color="#e74c3c">
                <SegmentValue>{rfmData.segments?.lostCustomers || 0}</SegmentValue>
                <SegmentLabel>Lost Customers</SegmentLabel>
                <SegmentDesc>Inactive for 120+ days</SegmentDesc>
              </SegmentCard>
            </SegmentsGrid>

            <SectionTitle>Top Customers</SectionTitle>
            <TopCustomersList>
              {rfmData.topCustomers?.map((customer, index) => (
                <TopCustomerItem key={customer.userId}>
                  <Rank>#{index + 1}</Rank>
                  <CustomerInfo>
                    <CustomerName>Customer {customer.userId?.slice(-6)}</CustomerName>
                    <CustomerStats>
                      {customer.orderCount} orders | Last active {customer.recencyDays} days ago
                    </CustomerStats>
                  </CustomerInfo>
                  <CustomerSpent>{formatCurrency(customer.totalSpent)}</CustomerSpent>
                </TopCustomerItem>
              ))}
            </TopCustomersList>
          </CustomersTab>
        )}

        {activeTab === 'loyalty' && loyaltyStats && (
          <LoyaltyTab>
            <SectionTitle>Loyalty Program Stats</SectionTitle>
            <LoyaltyStats>
              <LoyaltyStat>
                <LoyaltyValue>{loyaltyStats.stats?.totalMembers || 0}</LoyaltyValue>
                <LoyaltyLabel>Total Members</LoyaltyLabel>
              </LoyaltyStat>
              <LoyaltyStat>
                <LoyaltyValue>{(loyaltyStats.stats?.totalPointsIssued || 0).toLocaleString()}</LoyaltyValue>
                <LoyaltyLabel>Points Issued</LoyaltyLabel>
              </LoyaltyStat>
              <LoyaltyStat>
                <LoyaltyValue>{Math.round(loyaltyStats.stats?.avgPointsPerMember || 0)}</LoyaltyValue>
                <LoyaltyLabel>Avg Points/Member</LoyaltyLabel>
              </LoyaltyStat>
            </LoyaltyStats>

            <SectionTitle>Tier Distribution</SectionTitle>
            <TierGrid>
              {loyaltyStats.tierDistribution?.map(tier => (
                <TierCard key={tier.tier} $tier={tier.tier}>
                  <TierName>{tier.tier}</TierName>
                  <TierCount>{tier.count} members</TierCount>
                  <TierPoints>{tier.totalPoints.toLocaleString()} pts</TierPoints>
                </TierCard>
              ))}
            </TierGrid>
          </LoyaltyTab>
        )}
      </TabContent>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 32px;

  h1 {
    color: #333;
    margin-bottom: 8px;
  }

  p {
    color: #666;
  }
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 64px;
  color: #666;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
`;

const StatCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: flex-start;
  gap: 16px;
  position: relative;
  border-left: 4px solid ${props => props.$color || '#8B4513'};
`;

const StatIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #333;
`;

const StatInfo = styled.div`
  flex: 1;
`;

const StatValue = styled.div`
  font-size: 28px;
  font-weight: bold;
  color: #333;
`;

const StatLabel = styled.div`
  color: #666;
  font-size: 14px;
`;

const SubStat = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  font-size: 12px;
  color: #888;
`;

const TrendBadge = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  background: ${props => props.$up ? '#e8f5e9' : '#ffebee'};
  color: ${props => props.$up ? '#27ae60' : '#e74c3c'};
`;

const AlertBadge = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  background: #fff3e0;
  color: #e67e22;
`;

const ForecastCard = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 24px;
  color: white;
  margin-bottom: 32px;
`;

const ForecastHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h3 {
    margin: 0;
  }
`;

const ConfidenceBadge = styled.div`
  background: rgba(255, 255, 255, 0.2);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
`;

const ForecastContent = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ForecastItem = styled.div`
  text-align: center;
`;

const ForecastLabel = styled.div`
  opacity: 0.8;
  font-size: 14px;
  margin-bottom: 8px;
`;

const ForecastValue = styled.div`
  font-size: 28px;
  font-weight: bold;
`;

const TrendIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 18px;
  color: ${props => props.$trend === 'up' ? '#a8e6cf' : props.$trend === 'down' ? '#ffb3ba' : 'white'};
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  overflow-x: auto;
  padding-bottom: 8px;
`;

const Tab = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  background: ${props => props.$active ? '#8B4513' : '#f0f0f0'};
  color: ${props => props.$active ? 'white' : '#666'};
  cursor: pointer;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.$active ? '#6b3410' : '#e0e0e0'};
  }
`;

const PeriodSelector = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
`;

const PeriodButton = styled.button`
  padding: 8px 16px;
  border: 1px solid ${props => props.$active ? '#8B4513' : '#ddd'};
  border-radius: 6px;
  background: ${props => props.$active ? '#FFF8DC' : 'white'};
  color: ${props => props.$active ? '#8B4513' : '#666'};
  cursor: pointer;
  font-size: 13px;

  &:hover {
    border-color: #8B4513;
  }
`;

const TabContent = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
`;

const SectionTitle = styled.h3`
  color: #333;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
`;

const OverviewTab = styled.div``;

const OverviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
`;

const OverviewCard = styled.div`
  padding: 20px;
  background: #f9f9f9;
  border-radius: 12px;

  h4 {
    margin-bottom: 16px;
    color: #333;
  }
`;

const OverviewStat = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;

  span {
    color: #666;
  }

  strong {
    color: #333;
  }
`;

const SalesTab = styled.div``;

const ChartPlaceholder = styled.div`
  min-height: 300px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 20px;
`;

const SimpleChart = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-end;
  height: 250px;
  width: 100%;
  overflow-x: auto;
`;

const ChartBar = styled.div`
  flex: 1;
  min-width: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const BarFill = styled.div`
  width: 100%;
  height: ${props => props.$height}%;
  background: linear-gradient(180deg, #8B4513 0%, #A0522D 100%);
  border-radius: 4px 4px 0 0;
  min-height: 4px;
`;

const BarLabel = styled.div`
  font-size: 10px;
  color: #888;
  margin-top: 8px;
  transform: rotate(-45deg);
`;

const BarValue = styled.div`
  font-size: 10px;
  color: #333;
  font-weight: 500;
  margin-top: 4px;
`;

const EmptyState = styled.div`
  color: #888;
  text-align: center;
  padding: 40px;
`;

const ProductsTab = styled.div``;

const ProductList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ProductItem = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 12px;
`;

const Rank = styled.div`
  font-weight: bold;
  color: #8B4513;
  width: 32px;
`;

const ProductImage = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
`;

const ProductInfo = styled.div`
  flex: 1;
`;

const ProductName = styled.div`
  font-weight: 500;
  color: #333;
`;

const ProductStats = styled.div`
  font-size: 13px;
  color: #888;
`;

const ProductRevenue = styled.div`
  font-weight: bold;
  color: #27ae60;
`;

const InventoryTab = styled.div``;

const InventoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 32px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const InventoryCard = styled.div`
  padding: 24px;
  background: ${props => `${props.$color}15`};
  border-radius: 12px;
  text-align: center;
  border: 1px solid ${props => `${props.$color}30`};
`;

const InventoryValue = styled.div`
  font-size: 36px;
  font-weight: bold;
  color: #333;
`;

const InventoryLabel = styled.div`
  color: #666;
`;

const LowStockList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const LowStockItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #fff5f5;
  border-radius: 8px;

  span {
    flex: 1;
  }
`;

const StockBadge = styled.div`
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 13px;
  background: ${props => props.$critical ? '#e74c3c' : '#f39c12'};
  color: white;
`;

const CustomersTab = styled.div``;

const SegmentsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
`;

const SegmentCard = styled.div`
  padding: 20px;
  background: ${props => `${props.$color}10`};
  border-radius: 12px;
  text-align: center;
  border-left: 4px solid ${props => props.$color};
`;

const SegmentIcon = styled.div`
  font-size: 24px;
  margin-bottom: 8px;
`;

const SegmentValue = styled.div`
  font-size: 32px;
  font-weight: bold;
  color: #333;
`;

const SegmentLabel = styled.div`
  font-weight: 500;
  color: #333;
`;

const SegmentDesc = styled.div`
  font-size: 12px;
  color: #888;
  margin-top: 4px;
`;

const TopCustomersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const TopCustomerItem = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 12px;
`;

const CustomerInfo = styled.div`
  flex: 1;
`;

const CustomerName = styled.div`
  font-weight: 500;
`;

const CustomerStats = styled.div`
  font-size: 13px;
  color: #888;
`;

const CustomerSpent = styled.div`
  font-weight: bold;
  color: #27ae60;
`;

const LoyaltyTab = styled.div``;

const LoyaltyStats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 32px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const LoyaltyStat = styled.div`
  text-align: center;
  padding: 24px;
  background: #f9f9f9;
  border-radius: 12px;
`;

const LoyaltyValue = styled.div`
  font-size: 32px;
  font-weight: bold;
  color: #8B4513;
`;

const LoyaltyLabel = styled.div`
  color: #666;
`;

const TierGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const TierCard = styled.div`
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  background: ${props => {
    switch (props.$tier) {
      case 'platinum': return 'linear-gradient(135deg, #e5e4e2 0%, #d3d3d3 100%)';
      case 'gold': return 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)';
      case 'silver': return 'linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)';
      default: return 'linear-gradient(135deg, #CD7F32 0%, #B87333 100%)';
    }
  }};
  color: ${props => props.$tier === 'platinum' ? '#333' : 'white'};
`;

const TierName = styled.div`
  font-weight: bold;
  text-transform: uppercase;
  margin-bottom: 8px;
`;

const TierCount = styled.div`
  font-size: 24px;
  font-weight: bold;
`;

const TierPoints = styled.div`
  font-size: 12px;
  opacity: 0.8;
`;

export default AdminAnalytics;
