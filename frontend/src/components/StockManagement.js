import React, { useState } from 'react';
import styled from 'styled-components';
import { FiAlertCircle, FiCheck, FiChevronDown, FiChevronUp, FiPackage, FiTrendingDown, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';

const StockContainer = styled.div`
  background: linear-gradient(135deg, #FFF7ED 0%, #FFE8D6 100%);
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
  border-left: 4px solid #FF9800;
`;

const StockHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-weight: 600;
  font-size: 14px;
  color: #333;
`;

const StockBars = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const StockBar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const StockLabel = styled.div`
  font-size: 13px;
  color: #666;
  font-weight: 500;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: #E0E0E0;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: ${props => {
    if (props.status === 'out-of-stock') return '#D32F2F';
    if (props.status === 'low-stock') return '#F57C00';
    return '#4CAF50';
  }};
  width: ${props => props.percentage}%;
  transition: width 0.3s ease;
`;

const StockValue = styled.div`
  font-size: 13px;
  color: #333;
  font-weight: 600;
  display: flex;
  justify-content: space-between;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  
  ${props => {
    switch (props.status) {
      case 'in-stock':
        return `background: #E8F5E9; color: #2E7D32;`;
      case 'low-stock':
        return `background: #FFF3E0; color: #E65100;`;
      case 'out-of-stock':
        return `background: #FFEBEE; color: #C62828;`;
      default:
        return '';
    }
  }}
`;

const CompactToggle = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: #f3f4f6;
  color: #374151;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #e5e7eb;
  }
`;

const SectionLabel = styled.div`
  font-size: 12px;
  color: #6b7280;
  font-weight: 600;
  margin: 2px 0;
`;

/**
 * StockDisplay Component
 * Shows product stock status with visual indicators
 */
export const StockDisplay = ({ product, selectedWeight }) => {
  const [showOtherPacks, setShowOtherPacks] = useState(false);
  
  if (!product) return null;

  const toSafeNumber = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 0;
    return Math.max(0, parsed);
  };

  const getStockStatus = (stock, reorderLevel = 5) => {
    const safeStock = toSafeNumber(stock);
    const safeReorderLevel = Math.max(0, toSafeNumber(reorderLevel));

    if (safeStock === 0) return 'out-of-stock';
    if (safeStock <= safeReorderLevel) return 'low-stock';
    return 'in-stock';
  };

  const getStockPercentage = (stock, reorderLevel = 5, baseScale = 12) => {
    const safeStock = toSafeNumber(stock);
    const safeReorderLevel = Math.max(1, toSafeNumber(reorderLevel));
    const scale = Math.max(safeStock, safeReorderLevel * 2, baseScale);
    return Math.min(100, Math.round((safeStock / scale) * 100));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'in-stock':
        return <FiCheck size={14} />;
      case 'low-stock':
        return <FiAlertCircle size={14} />;
      case 'out-of-stock':
        return <FiTrendingDown size={14} />;
      default:
        return null;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'in-stock':
        return 'In Stock';
      case 'low-stock':
        return 'Low Stock';
      case 'out-of-stock':
        return 'Out of Stock';
      default:
        return 'Unknown';
    }
  };

  const mainStock = toSafeNumber(product.stock);
  const mainReorderLevel = toSafeNumber(product.reorderLevel || 5);
  const mainStatus = getStockStatus(mainStock, mainReorderLevel);
  const mainStockPercentage = getStockPercentage(mainStock, mainReorderLevel, 20);

  const variants = Array.isArray(product.variants) ? product.variants : [];
  const hasVariants = variants.length > 0;
  const resolvedSelectedWeight = selectedWeight || product?.selectedWeight || product?.defaultWeight || '';
  const selectedPack = hasVariants
    ? variants.find((v) => v.weight === resolvedSelectedWeight) || variants[0]
    : null;
  const otherPacks = hasVariants
    ? variants.filter((v) => v.weight !== selectedPack?.weight)
    : [];

  return (
    <StockContainer>
      <StockHeader>
        <FiPackage size={16} />
        Stock Information
      </StockHeader>

      <StockBars>
        {hasVariants && selectedPack ? (
          <>
            <SectionLabel>Selected Pack</SectionLabel>
            <StockBar>
              {(() => {
                const selectedPackStock = toSafeNumber(selectedPack.stock);
                const selectedPackReorder = toSafeNumber(selectedPack.reorderLevel || 3);
                const selectedPackStatus = getStockStatus(selectedPackStock, selectedPackReorder);
                const selectedPackPercentage = getStockPercentage(selectedPackStock, selectedPackReorder, 10);

                return (
                  <>
                    <StockLabel>
                      {selectedPack.weight}{' '}
                      <StatusBadge status={selectedPackStatus}>
                        {getStatusIcon(selectedPackStatus)}
                        {getStatusText(selectedPackStatus)}
                      </StatusBadge>
                    </StockLabel>
                    <ProgressBar>
                      <ProgressFill status={selectedPackStatus} percentage={selectedPackPercentage} />
                    </ProgressBar>
                    <StockValue>
                      <span>{selectedPackStock} units available</span>
                      <span style={{ fontSize: '12px', color: '#888' }}>Reorder at: {selectedPackReorder}</span>
                    </StockValue>
                  </>
                );
              })()}
            </StockBar>

            {otherPacks.length > 0 && (
              <>
                <CompactToggle type="button" onClick={() => setShowOtherPacks((prev) => !prev)}>
                  {showOtherPacks ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                  {showOtherPacks
                    ? 'Hide Other Pack Stocks'
                    : `Show Other Pack Stocks (${otherPacks.length})`}
                </CompactToggle>

                {showOtherPacks && (
                  <>
                    {otherPacks.map((variant, idx) => {
                      const variantStock = toSafeNumber(variant.stock);
                      const variantReorderLevel = toSafeNumber(variant.reorderLevel || 3);
                      const status = getStockStatus(variantStock, variantReorderLevel);
                      const variantStockPercentage = getStockPercentage(variantStock, variantReorderLevel, 10);

                      return (
                        <StockBar key={`${variant.weight}-${idx}`}>
                          <StockLabel>
                            {variant.weight}{' '}
                            <StatusBadge status={status}>
                              {getStatusIcon(status)}
                              {getStatusText(status)}
                            </StatusBadge>
                          </StockLabel>
                          <ProgressBar>
                            <ProgressFill status={status} percentage={variantStockPercentage} />
                          </ProgressBar>
                          <StockValue>
                            <span>{variantStock} units available</span>
                            <span style={{ fontSize: '12px', color: '#888' }}>Reorder at: {variantReorderLevel}</span>
                          </StockValue>
                        </StockBar>
                      );
                    })}
                  </>
                )}
              </>
            )}

            <SectionLabel>Overall Product Stock</SectionLabel>
            <StockBar>
              <StockLabel>
                Main Stock{' '}
                <StatusBadge status={mainStatus}>
                  {getStatusIcon(mainStatus)}
                  {getStatusText(mainStatus)}
                </StatusBadge>
              </StockLabel>
              <ProgressBar>
                <ProgressFill status={mainStatus} percentage={mainStockPercentage} />
              </ProgressBar>
              <StockValue>
                <span>{mainStock} units available</span>
                <span style={{ fontSize: '12px', color: '#888' }}>Reorder at: {mainReorderLevel}</span>
              </StockValue>
            </StockBar>
          </>
        ) : (
          <StockBar>
            <StockLabel>
              Main Stock{' '}
              <StatusBadge status={mainStatus}>
                {getStatusIcon(mainStatus)}
                {getStatusText(mainStatus)}
              </StatusBadge>
            </StockLabel>
            <ProgressBar>
              <ProgressFill status={mainStatus} percentage={mainStockPercentage} />
            </ProgressBar>
            <StockValue>
              <span>{mainStock} units available</span>
              <span style={{ fontSize: '12px', color: '#888' }}>Reorder at: {mainReorderLevel}</span>
            </StockValue>
          </StockBar>
        )}
      </StockBars>
    </StockContainer>
  );
};

// ============================================================================
// Admin Restock Component
// ============================================================================

const RestockForm = styled.div`
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-top: 12px;
  border: 1px solid #E0E0E0;
`;

const FormGroup = styled.div`
  margin-bottom: 12px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const Label = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 6px;
  color: #333;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #DDD;
  border-radius: 4px;
  font-size: 13px;
  
  &:focus {
    outline: none;
    border-color: #FF9800;
    box-shadow: 0 0 0 2px rgba(255, 152, 0, 0.1);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #DDD;
  border-radius: 4px;
  font-size: 13px;
  
  &:focus {
    outline: none;
    border-color: #FF9800;
    box-shadow: 0 0 0 2px rgba(255, 152, 0, 0.1);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
`;

const Button = styled.button`
  flex: 1;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  ${props => props.primary ? `
    background: #FF9800;
    color: white;
    
    &:hover {
      background: #F57C00;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
    }
  ` : `
    background: #F5F5F5;
    color: #333;
    
    &:hover {
      background: #E0E0E0;
    }
  `}
`;

/**
 * AdminRestockForm Component
 * Allows admins to restock products
 */
export const AdminRestockForm = ({ productId, productName, variants = [], onRestockSuccess }) => {
  const [quantity, setQuantity] = useState('');
  const [selectedVariant, setSelectedVariant] = useState('');
  const [reason, setReason] = useState('Admin restock from dashboard');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleRestock = async () => {
    if (!quantity || quantity < 1) {
      toast.error('Please enter a valid quantity');
      return;
    }

    setLoading(true);
    try {
      const body = {
        quantity: parseInt(quantity),
        reason: reason,
        weight: selectedVariant || undefined
      };

      const response = await fetch(`/api/products/${productId}/restock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || 'Product restocked successfully');
        setQuantity('');
        setSelectedVariant('');
        setReason('Admin restock from dashboard');
        setShowForm(false);
        
        if (onRestockSuccess) {
          onRestockSuccess();
        }
      } else {
        toast.error(data.message || 'Restock failed');
      }
    } catch (error) {
      console.error('Restock error:', error);
      toast.error('Failed to restock product');
    } finally {
      setLoading(false);
    }
  };

  if (!showForm) {
    return (
      <Button 
        primary 
        onClick={() => setShowForm(true)}
        style={{ marginTop: '12px', width: '100%' }}
      >
        <FiRefreshCw size={14} style={{ marginRight: '4px' }} />
        Restock Product
      </Button>
    );
  }

  return (
    <RestockForm>
      <FormGroup>
        <Label>Quantity to Add</Label>
        <Input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Enter quantity"
          min="1"
          disabled={loading}
        />
      </FormGroup>

      {variants.length > 0 && (
        <FormGroup>
          <Label>Variant (Optional)</Label>
          <Select
            value={selectedVariant}
            onChange={(e) => setSelectedVariant(e.target.value)}
            disabled={loading}
          >
            <option value="">Main Stock</option>
            {variants.map((v, idx) => (
              <option key={idx} value={v.weight}>
                {v.weight}
              </option>
            ))}
          </Select>
        </FormGroup>
      )}

      <FormGroup>
        <Label>Reason</Label>
        <Input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for restock"
          disabled={loading}
        />
      </FormGroup>

      <ButtonGroup>
        <Button 
          primary
          onClick={handleRestock}
          disabled={loading}
        >
          {loading ? 'Restocking...' : 'Confirm Restock'}
        </Button>
        <Button 
          onClick={() => setShowForm(false)}
          disabled={loading}
        >
          Cancel
        </Button>
      </ButtonGroup>
    </RestockForm>
  );
};

export default StockDisplay;
