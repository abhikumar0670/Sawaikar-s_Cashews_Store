import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { FiAlertTriangle, FiRefreshCw, FiEye, FiDownload } from 'react-icons/fi';
import toast from 'react-hot-toast';
import API_BASE_URL from '../config/api';

const API_URL = API_BASE_URL;

const Container = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
`;

const Title = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: #333;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Controls = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const Button = styled.button`
  padding: 8px 12px;
  border: 1px solid #DDD;
  background: white;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;

  &:hover {
    background: #F5F5F5;
    border-color: #999;
  }
`;

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
`;

const StatCard = styled.div`
  background: linear-gradient(135deg, ${props => props.color || '#FFF7ED'} 0%, 
                                     ${props => props.lightColor || '#FFE8D6'} 100%);
  border-radius: 6px;
  padding: 12px;
  border-left: 3px solid ${props => props.borderColor || '#FF9800'};
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: #666;
  font-weight: 500;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  
  th {
    background: #F5F5F5;
    padding: 12px;
    text-align: left;
    font-weight: 600;
    color: #333;
    border-bottom: 2px solid #DDD;
  }
  
  td {
    padding: 12px;
    border-bottom: 1px solid #E0E0E0;
  }
  
  tr:hover {
    background: #FAFAFA;
  }
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  
  ${props => {
    if (props.status === 'out-of-stock') {
      return `background: #FFEBEE; color: #C62828;`;
    } else if (props.status === 'low-stock') {
      return `background: #FFF3E0; color: #E65100;`;
    }
    return `background: #E8F5E9; color: #2E7D32;`;
  }}
`;

const ActionButton = styled.button`
  padding: 4px 8px;
  border: none;
  background: #FF9800;
  color: white;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #F57C00;
  }
  
  &:disabled {
    background: #CCC;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #999;
  
  svg {
    margin-bottom: 12px;
    opacity: 0.5;
  }
  
  p {
    margin: 0;
    font-size: 14px;
  }
`;

const Loading = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #FF9800;
  
  svg {
    margin-bottom: 12px;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

/**
 * InventoryDashboard Component
 * Shows stock alerts and allows quick restock actions for admins
 */
export const InventoryDashboard = () => {
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, out-of-stock, low-stock

  useEffect(() => {
    fetchAlerts();
    // Refresh every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/products/stock/alerts`);
      const data = response.data;
      if (data.success) {
        setAlerts(data);
      }
    } catch (error) {
      console.error('Error fetching inventory alerts:', error);
      toast.error('Failed to load inventory alerts');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAlerts = () => {
    if (!alerts) return [];
    
    let all = [...(alerts.alerts.outOfStock || []), ...(alerts.alerts.lowStock || [])];
    
    switch (filter) {
      case 'out-of-stock':
        return all.filter(a => a.status === 'OUT_OF_STOCK');
      case 'low-stock':
        return all.filter(a => a.status === 'LOW_STOCK');
      default:
        return all;
    }
  };

  const handleRestock = async (productId, weight = null) => {
    const quantity = prompt('Enter quantity to restock:', '10');
    if (!quantity || quantity < 1) return;

    try {
      const body = {
        quantity: parseInt(quantity),
        weight: weight || undefined,
        reason: 'Quick restock from dashboard'
      };

      const response = await axios.post(`${API_URL}/products/${productId}/restock`, body);
      const data = response.data;
      if (data.success) {
        toast.success(`Restocked: ${data.newStock} units`);
        fetchAlerts(); // Refresh alerts
      } else {
        toast.error(data.message || 'Restock failed');
      }
    } catch (error) {
      console.error('Restock error:', error);
      toast.error('Failed to restock');
    }
  };

  const handleExportCSV = () => {
    if (!alerts) return;

    const all = [...(alerts.alerts.outOfStock || []), ...(alerts.alerts.lowStock || [])];
    const csv = [
      ['Product', 'Type', 'Weight', 'Current Stock', 'Reorder Level', 'Status'],
      ...all.map(a => [
        a.productName,
        a.type,
        a.weight || 'N/A',
        a.currentStock,
        a.reorderLevel,
        a.status
      ])
    ];

    const csvContent = csv.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-alerts-${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success('Inventory report exported');
  };

  if (!alerts && !loading) {
    return (
      <Container>
        <Header>
          <Title>
            <FiAlertTriangle size={18} />
            Inventory Management
          </Title>
          <Button onClick={fetchAlerts}>
            <FiRefreshCw size={14} /> Refresh
          </Button>
        </Header>
        <EmptyState>
          <FiAlertTriangle size={32} />
          <p>No inventory data loaded. Click refresh to start.</p>
        </EmptyState>
      </Container>
    );
  }

  if (loading && !alerts) {
    return (
      <Container>
        <Loading>
          <FiRefreshCw size={32} />
          <p>Loading inventory...</p>
        </Loading>
      </Container>
    );
  }

  const filteredAlerts = getFilteredAlerts();

  return (
    <Container>
      <Header>
        <Title>
          <FiAlertTriangle size={18} />
          Inventory Management
        </Title>
        <Controls>
          <Button onClick={fetchAlerts} disabled={loading}>
            <FiRefreshCw size={14} /> {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button onClick={handleExportCSV}>
            <FiDownload size={14} /> Export Report
          </Button>
        </Controls>
      </Header>

      {/* Stats Cards */}
      <Stats>
        <StatCard 
          color="#FFEBEE" 
          lightColor="#FFCDD2" 
          borderColor="#F44336"
        >
          <StatValue>{alerts.outOfStockCount}</StatValue>
          <StatLabel>Out of Stock</StatLabel>
        </StatCard>

        <StatCard 
          color="#FFF3E0" 
          lightColor="#FFE0B2" 
          borderColor="#FF9800"
        >
          <StatValue>{alerts.lowStockCount}</StatValue>
          <StatLabel>Low Stock</StatLabel>
        </StatCard>

        <StatCard 
          color="#E8F5E9" 
          lightColor="#C8E6C9" 
          borderColor="#4CAF50"
        >
          <StatValue>{alerts.totalAlerts}</StatValue>
          <StatLabel>Total Alerts</StatLabel>
        </StatCard>
      </Stats>

      {/* Filter Buttons */}
      <Controls style={{ marginBottom: '16px' }}>
        <Button 
          onClick={() => setFilter('all')}
          style={{
            background: filter === 'all' ? '#FF9800' : 'white',
            color: filter === 'all' ? 'white' : '#333',
            borderColor: filter === 'all' ? '#FF9800' : '#DDD'
          }}
        >
          All ({alerts.totalAlerts})
        </Button>
        <Button 
          onClick={() => setFilter('out-of-stock')}
          style={{
            background: filter === 'out-of-stock' ? '#F44336' : 'white',
            color: filter === 'out-of-stock' ? 'white' : '#333',
            borderColor: filter === 'out-of-stock' ? '#F44336' : '#DDD'
          }}
        >
          Out of Stock ({alerts.outOfStockCount})
        </Button>
        <Button 
          onClick={() => setFilter('low-stock')}
          style={{
            background: filter === 'low-stock' ? '#FF9800' : 'white',
            color: filter === 'low-stock' ? 'white' : '#333',
            borderColor: filter === 'low-stock' ? '#FF9800' : '#DDD'
          }}
        >
          Low Stock ({alerts.lowStockCount})
        </Button>
      </Controls>

      {/* Alerts Table */}
      {filteredAlerts.length > 0 ? (
        <Table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Type</th>
              <th>Weight</th>
              <th>Current Stock</th>
              <th>Reorder Level</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredAlerts.map((alert, idx) => (
              <tr key={idx}>
                <td style={{ fontWeight: 600 }}>{alert.productName}</td>
                <td>{alert.type}</td>
                <td>{alert.weight || 'Main'}</td>
                <td>{alert.currentStock}</td>
                <td>{alert.reorderLevel}</td>
                <td>
                  <StatusBadge status={alert.status.toLowerCase()}>
                    {alert.status === 'OUT_OF_STOCK' ? 'OUT OF STOCK' : 'LOW STOCK'}
                  </StatusBadge>
                </td>
                <td>
                  <ActionButton 
                    onClick={() => handleRestock(alert.productId, alert.weight)}
                  >
                    <FiRefreshCw size={12} style={{ marginRight: '2px' }} />
                    Restock
                  </ActionButton>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <EmptyState>
          <FiEye size={32} />
          <p>No {filter !== 'all' ? filter.replace('-', ' ') + ' alerts' : 'alerts'}. All products are well-stocked!</p>
        </EmptyState>
      )}

      {/* Last Updated */}
      <div style={{ marginTop: '16px', fontSize: '12px', color: '#999', textAlign: 'right' }}>
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </Container>
  );
};

export default InventoryDashboard;
