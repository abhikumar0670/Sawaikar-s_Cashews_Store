import React, { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import styled, { keyframes } from 'styled-components';
import { FaCreditCard, FaUniversity, FaWallet, FaMobileAlt, FaStore } from 'react-icons/fa';
import { SiPhonepe, SiPaytm, SiGooglepay } from 'react-icons/si';
import { FiCreditCard, FiDownload, FiFilter, FiShoppingBag, FiArrowRight, FiCheckCircle, FiClock, FiXCircle, FiTruck } from 'react-icons/fi';
import API_BASE_URL from '../config/api';

const API_URL = API_BASE_URL;

// Helper to get payment method icon and display text
function getPaymentMethodDisplay(txn) {
  const paymentInfo = txn.paymentInfo || {};
  const method = (paymentInfo.type || txn.method || '').toLowerCase();
  
  // UPI Payment
  if (method === 'upi') {
    const upiId = paymentInfo.vpa || paymentInfo.upiId || txn.upiId;
    return {
      icon: <FaMobileAlt style={{fontSize: '1.2rem', color: '#5f4dee', marginRight: '6px'}} />,
      text: 'UPI',
      details: upiId || 'UPI Payment'
    };
  }
  
  // Card Payment
  if (method === 'card') {
    const cardLast4 = paymentInfo.cardLast4;
    const network = paymentInfo.network || 'Card';
    return {
      icon: <FaCreditCard style={{fontSize: '1.2rem', color: '#ff6b6b', marginRight: '6px'}} />,
      text: network || 'Card',
      details: cardLast4 ? `**** ${cardLast4}` : 'Card Payment'
    };
  }
  
  // Netbanking Payment
  if (method === 'netbanking') {
    const bank = paymentInfo.bank || txn.bank;
    return {
      icon: <FaUniversity style={{fontSize: '1.2rem', color: '#4ecdc4', marginRight: '6px'}} />,
      text: 'Netbanking',
      details: bank || 'Netbanking'
    };
  }
  
  // Wallet Payment
  if (method === 'wallet') {
    const wallet = paymentInfo.wallet;
    let walletIcon = <FaWallet style={{fontSize: '1.2rem', color: '#f39c12', marginRight: '6px'}} />;
    
    // Use specific wallet icons if available
    if (wallet && wallet.toLowerCase().includes('paytm')) {
      walletIcon = <SiPaytm style={{fontSize: '1.2rem', color: '#00baf2', marginRight: '6px'}} />;
    } else if (wallet && wallet.toLowerCase().includes('phonepe')) {
      walletIcon = <SiPhonepe style={{fontSize: '1.2rem', color: '#5f259f', marginRight: '6px'}} />;
    } else if (wallet && wallet.toLowerCase().includes('gpay')) {
      walletIcon = <SiGooglepay style={{fontSize: '1.2rem', color: '#4285f4', marginRight: '6px'}} />;
    }
    
    return {
      icon: walletIcon,
      text: 'Wallet',
      details: wallet || 'Wallet Payment'
    };
  }
  
  // Default/Other
  return {
    icon: <FaCreditCard style={{fontSize: '1.2rem', color: '#95a5a6', marginRight: '6px'}} />,
    text: method || 'N/A',
    details: txn.txnId || '-'
  };
}

const PaymentHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: clerkUser, isLoaded } = useUser();
  const { getToken } = useAuth();

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!isLoaded) return;
      
      if (!clerkUser) {
        // Fallback to localStorage if not logged in
        const allTxns = JSON.parse(localStorage.getItem('allTransactions') || '[]');
        allTxns.sort((a, b) => new Date(b.date) - new Date(a.date));
        setTransactions(allTxns);
        setLoading(false);
        return;
      }

      try {
        const token = await getToken();
        const response = await axios.get(`${API_URL}/orders`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        const orders = response.data || [];

        // Transform orders to transaction format
        const transformedTxns = orders.map(order => ({
          orderId: order.orderId || order._id,
          txnId: order.razorpayPaymentId || order.transactionId,
          date: order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A',
          amount: order.totalAmount || order.totalPrice || 0,
          status: order.paymentStatus === 'completed' ? 'Confirmed' : order.orderStatus || 'Pending',
          method: (order.paymentInfo?.type || order.paymentMethod || 'N/A').toUpperCase(),
          type: order.paymentInfo?.type || order.paymentMethod,
          items: order.items || [],
          products: order.items || [],
          paymentInfo: order.paymentInfo || {},
          upiId: order.paymentInfo?.vpa || order.paymentInfo?.upiId,
          bank: order.paymentInfo?.bank,
          // Include shipping address from order
          shippingAddress: order.shippingAddress || null,
          userPhone: order.userPhone || order.shippingAddress?.phone || '',
          // Order type for in-store vs online
          orderType: order.orderType || 'online'
        }));
        
        // Sort by most recent first
        transformedTxns.sort((a, b) => new Date(b.date) - new Date(a.date));
        setTransactions(transformedTxns);
      } catch (error) {
        console.error('Error fetching payment history:', error);
        // Fallback to localStorage on error
        const allTxns = JSON.parse(localStorage.getItem('allTransactions') || '[]');
        allTxns.sort((a, b) => new Date(b.date) - new Date(a.date));
        setTransactions(allTxns);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [clerkUser, isLoaded]);

  // Store information (Bill To - seller details)
  const storeInfo = {
    name: "Sawaikar's Cashew Store",
    owner: 'Shreyas Sawaikar',
    address: '123 Cashew Lane',
    city: 'Goa',
    state: 'Goa',
    pin: '403001',
    country: 'India',
    phone: '9876543210',
    email: 'sawaikarcashewstore1980@gmail.com',
    gstin: '22ABCDE1234F1Z5'
  };

  // Get customer info from Clerk user (Ship To - buyer details)
  const getCustomerInfo = () => {
    if (!isLoaded || !clerkUser) {
      // Fallback to localStorage if Clerk user not available
      const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}');
      return {
        name: loggedInUser.name || 'Customer',
        address: loggedInUser.address || '',
        city: loggedInUser.city || '',
        state: loggedInUser.state || '',
        pin: loggedInUser.pin || '',
        email: loggedInUser.email || 'Not Provided',
        phone: loggedInUser.phone || '',
      };
    }
    
    // Get user metadata from Clerk
    const metadata = clerkUser.publicMetadata || {};
    const unsafeMetadata = clerkUser.unsafeMetadata || {};
    
    return {
      name: clerkUser.fullName || clerkUser.firstName || 'Customer',
      address: metadata.address || unsafeMetadata.address || '',
      city: metadata.city || unsafeMetadata.city || '',
      state: metadata.state || unsafeMetadata.state || '',
      pin: metadata.pin || unsafeMetadata.pin || '',
      email: clerkUser.primaryEmailAddress?.emailAddress || 'Not Provided',
      phone: clerkUser.primaryPhoneNumber?.phoneNumber || metadata.phone || unsafeMetadata.phone || '',
    };
  };

  const customer = getCustomerInfo();

  // Download professional invoice
  function downloadInvoice(txn) {
    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;
    const orderId = txn.orderId || txn.txnId || invoiceNumber;
    const invoiceDate = txn.date || new Date().toLocaleString();
    const txnId = txn.txnId || txn.paymentInfo?.id || 'N/A';

    // Get items array
    const items = txn.items || txn.products || [];

    // FIX: Amount is stored in paise, convert to rupees for display
    const amountInPaise = txn.amount || 0;
    const amountInRupees = amountInPaise > 10000 ? amountInPaise / 100 : amountInPaise;

    // Calculate tax breakdown (assuming 18% GST inclusive)
    const taxRate = 0.18;
    const subtotalBeforeTax = amountInRupees / (1 + taxRate);
    const totalTax = amountInRupees - subtotalBeforeTax;
    const cgst = totalTax / 2;
    const sgst = totalTax / 2;

    // Get customer info - prefer shipping address from order, then fallback to Clerk
    const shippingAddr = txn.shippingAddress;
    let customerInfo;
    let customerAddress;

    if (shippingAddr && (shippingAddr.address || shippingAddr.street || shippingAddr.city)) {
      customerInfo = {
        name: shippingAddr.name || getCustomerInfo().name,
        address: shippingAddr.address || shippingAddr.street || '',
        city: shippingAddr.city || '',
        state: shippingAddr.state || '',
        pin: shippingAddr.pincode || shippingAddr.zipCode || shippingAddr.pin || '',
        email: getCustomerInfo().email,
        phone: shippingAddr.phone || txn.userPhone || ''
      };
      customerAddress = [customerInfo.address, customerInfo.city, customerInfo.state, customerInfo.pin].filter(Boolean).join(', ');
      if (!customerAddress) customerAddress = 'Address not provided';
    } else {
      customerInfo = getCustomerInfo();
      customerAddress = [customerInfo.address, customerInfo.city, customerInfo.state, customerInfo.pin].filter(Boolean).join(', ') || 'Address not provided';
    }

    // Generate items rows HTML
    const generateItemsRows = () => {
      if (items.length === 0) {
        return `
          <tr>
            <td style="text-align: center; padding: 14px 10px;">1</td>
            <td style="padding: 14px 10px;">Order Items</td>
            <td style="text-align: center; padding: 14px 10px;">-</td>
            <td style="text-align: center; padding: 14px 10px;">-</td>
            <td style="text-align: right; padding: 14px 10px;">₹${subtotalBeforeTax.toFixed(2)}</td>
            <td style="text-align: right; padding: 14px 10px;">₹${subtotalBeforeTax.toFixed(2)}</td>
          </tr>
        `;
      }

      return items.map((item, index) => {
        const itemPrice = item.price > 10000 ? item.price / 100 : item.price;
        const qty = item.quantity || item.amount || 1;
        const itemTotal = itemPrice * qty;
        const weight = item.weight || '';
        return `
          <tr>
            <td style="text-align: center; padding: 14px 10px;">${index + 1}</td>
            <td style="padding: 14px 10px;">
              <div style="font-weight: 500;">${item.name || item.productName || 'Product'}</div>
              ${weight ? `<div style="font-size: 12px; color: #666;">Weight: ${weight}</div>` : ''}
            </td>
            <td style="text-align: center; padding: 14px 10px;">${qty}</td>
            <td style="text-align: center; padding: 14px 10px;">18%</td>
            <td style="text-align: right; padding: 14px 10px;">₹${itemPrice.toFixed(2)}</td>
            <td style="text-align: right; padding: 14px 10px;">₹${itemTotal.toFixed(2)}</td>
          </tr>
        `;
      }).join('');
    };

    // Generate barcode SVG
    const barcodeValue = orderId.replace(/[^A-Z0-9]/gi, '').slice(0, 12).padEnd(12, '0');
    let barcodeSVG = '';
    for (let i = 0; i < barcodeValue.length; i++) {
      const charCode = barcodeValue.charCodeAt(i);
      const width = (charCode % 3) + 2;
      barcodeSVG += `<rect x="${i * 6}" y="0" width="${width}" height="50" fill="#1a1a1a" />`;
    }

    const invoiceHtml = `
      <!DOCTYPE html>
      <html><head>
        <title>Invoice - ${orderId}</title>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f5f5;
            padding: 20px;
          }
          .invoice-container {
            max-width: 850px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 2px 20px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
          }

          /* Header */
          .invoice-header {
            background: linear-gradient(135deg, #8B4513 0%, #A0522D 50%, #D2691E 100%);
            color: white;
            padding: 30px 40px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .brand {
            display: flex;
            align-items: center;
            gap: 15px;
          }
          .brand-logo {
            width: 60px;
            height: 60px;
            background: rgba(255,255,255,0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
          }
          .brand-name {
            font-size: 24px;
            font-weight: 700;
            letter-spacing: 0.5px;
          }
          .brand-tagline {
            font-size: 12px;
            opacity: 0.9;
            margin-top: 2px;
          }
          .invoice-title {
            text-align: right;
          }
          .invoice-title h1 {
            font-size: 32px;
            font-weight: 300;
            letter-spacing: 3px;
            margin-bottom: 5px;
          }
          .invoice-number {
            font-size: 13px;
            opacity: 0.9;
          }

          /* Body */
          .invoice-body {
            padding: 40px;
          }

          /* Info Grid */
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 35px;
          }
          .info-section {
            background: #fafafa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #8B4513;
          }
          .info-section.details {
            border-left-color: #D2691E;
          }
          .info-label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #8B4513;
            font-weight: 600;
            margin-bottom: 12px;
          }
          .info-name {
            font-size: 16px;
            font-weight: 600;
            color: #333;
            margin-bottom: 8px;
          }
          .info-line {
            font-size: 13px;
            color: #666;
            margin: 4px 0;
            line-height: 1.5;
          }
          .info-line strong {
            color: #444;
            min-width: 90px;
            display: inline-block;
          }

          /* Order Type Badge */
          .order-type-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            margin-top: 8px;
          }
          .order-type-badge.online {
            background: #DBEAFE;
            color: #1E40AF;
          }
          .order-type-badge.instore {
            background: #D1FAE5;
            color: #065F46;
          }

          /* Items Table */
          .items-section {
            margin-bottom: 30px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
          }
          .items-table thead tr {
            background: linear-gradient(135deg, #8B4513, #A0522D);
            color: white;
          }
          .items-table th {
            padding: 14px 12px;
            text-align: left;
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .items-table th:nth-child(1) { width: 60px; text-align: center; }
          .items-table th:nth-child(3) { width: 70px; text-align: center; }
          .items-table th:nth-child(4) { width: 70px; text-align: center; }
          .items-table th:nth-child(5) { width: 100px; text-align: right; }
          .items-table th:nth-child(6) { width: 110px; text-align: right; }
          .items-table tbody tr {
            border-bottom: 1px solid #eee;
          }
          .items-table tbody tr:hover {
            background: #fafafa;
          }
          .items-table td {
            padding: 14px 10px;
            vertical-align: middle;
          }

          /* Summary Section */
          .summary-section {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 30px;
          }
          .summary-box {
            width: 320px;
            background: #fafafa;
            border-radius: 8px;
            overflow: hidden;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 20px;
            font-size: 14px;
            border-bottom: 1px solid #eee;
          }
          .summary-row.subtotal {
            background: #f5f5f5;
          }
          .summary-row.tax {
            color: #666;
            font-size: 13px;
          }
          .summary-row.total {
            background: linear-gradient(135deg, #8B4513, #A0522D);
            color: white;
            font-size: 18px;
            font-weight: 700;
            border: none;
          }
          .summary-label { font-weight: 500; }

          /* Payment Status */
          .status-section {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          .payment-info {
            display: flex;
            align-items: center;
            gap: 20px;
          }
          .payment-method {
            font-size: 14px;
            color: #666;
          }
          .payment-method strong {
            color: #333;
          }
          .status-badge {
            padding: 8px 20px;
            border-radius: 25px;
            font-weight: 600;
            font-size: 14px;
          }
          .status-badge.paid {
            background: #D1FAE5;
            color: #065F46;
          }
          .status-badge.pending {
            background: #FEF3C7;
            color: #92400E;
          }

          /* Barcode Section */
          .barcode-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            padding: 25px;
            background: linear-gradient(to right, #fafafa, #f0f0f0);
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .barcode-left {
            flex: 1;
          }
          .barcode-label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #888;
            margin-bottom: 8px;
          }
          .barcode-svg {
            margin-bottom: 5px;
          }
          .barcode-number {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            color: #666;
            letter-spacing: 2px;
          }
          .scan-text {
            font-size: 11px;
            color: #888;
            margin-top: 8px;
          }

          /* Footer */
          .invoice-footer {
            padding: 25px 40px;
            background: #fafafa;
            border-top: 1px solid #eee;
          }
          .footer-content {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .terms {
            flex: 1;
            max-width: 400px;
          }
          .terms-title {
            font-size: 12px;
            font-weight: 600;
            color: #8B4513;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .terms-text {
            font-size: 11px;
            color: #888;
            line-height: 1.6;
          }
          .footer-brand {
            text-align: right;
          }
          .footer-brand-name {
            font-size: 16px;
            font-weight: 600;
            color: #8B4513;
            margin-bottom: 5px;
          }
          .footer-contact {
            font-size: 11px;
            color: #888;
          }
          .computer-generated {
            text-align: center;
            padding: 15px;
            font-size: 11px;
            color: #aaa;
            border-top: 1px dashed #ddd;
            margin-top: 15px;
          }

          /* Print styles */
          @media print {
            body { background: white; padding: 0; }
            .invoice-container { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <!-- Header -->
          <div class="invoice-header">
            <div class="brand">
              <div class="brand-logo">S</div>
              <div>
                <div class="brand-name">Sawaikar's Cashew Store</div>
                <div class="brand-tagline">Premium Quality Cashews Since 1980</div>
              </div>
            </div>
            <div class="invoice-title">
              <h1>INVOICE</h1>
              <div class="invoice-number">${invoiceNumber}</div>
            </div>
          </div>

          <!-- Body -->
          <div class="invoice-body">
            <!-- Info Grid -->
            <div class="info-grid">
              <!-- Seller Info -->
              <div class="info-section">
                <div class="info-label">From (Seller)</div>
                <div class="info-name">${storeInfo.name}</div>
                <div class="info-line">Proprietor: ${storeInfo.owner}</div>
                <div class="info-line">${storeInfo.address}, ${storeInfo.city}</div>
                <div class="info-line">${storeInfo.state} - ${storeInfo.pin}, ${storeInfo.country}</div>
                <div class="info-line">Phone: ${storeInfo.phone}</div>
                <div class="info-line">GSTIN: ${storeInfo.gstin}</div>
              </div>

              <!-- Invoice Details -->
              <div class="info-section details">
                <div class="info-label">Invoice Details</div>
                <div class="info-line"><strong>Invoice No:</strong> ${invoiceNumber}</div>
                <div class="info-line"><strong>Order ID:</strong> ${orderId}</div>
                <div class="info-line"><strong>Date:</strong> ${invoiceDate}</div>
                <div class="info-line"><strong>Transaction:</strong> ${txnId}</div>
                <div class="order-type-badge ${txn.orderType === 'instore' ? 'instore' : 'online'}">
                  ${txn.orderType === 'instore' ? '🏪 In-Store Pickup' : '🚚 Online Delivery'}
                </div>
              </div>

              <!-- Customer Info -->
              <div class="info-section">
                <div class="info-label">Bill To (Customer)</div>
                <div class="info-name">${customerInfo.name}</div>
                <div class="info-line">${customerAddress}</div>
                ${customerInfo.phone ? `<div class="info-line">Phone: ${customerInfo.phone}</div>` : ''}
                <div class="info-line">Email: ${customerInfo.email}</div>
              </div>

              <!-- Ship To / Pickup -->
              <div class="info-section details">
                <div class="info-label">${txn.orderType === 'instore' ? 'Pickup Location' : 'Ship To'}</div>
                ${txn.orderType === 'instore' ? `
                  <div class="info-name">${storeInfo.name}</div>
                  <div class="info-line">${storeInfo.address}, ${storeInfo.city}</div>
                  <div class="info-line">${storeInfo.state} - ${storeInfo.pin}</div>
                  <div class="info-line" style="color: #059669; font-weight: 600; margin-top: 8px;">✓ Picked up at Store</div>
                ` : `
                  <div class="info-name">${customerInfo.name}</div>
                  <div class="info-line">${customerAddress}</div>
                  ${customerInfo.phone ? `<div class="info-line">Phone: ${customerInfo.phone}</div>` : ''}
                `}
              </div>
            </div>

            <!-- Items Table -->
            <div class="items-section">
              <table class="items-table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>GST</th>
                    <th>Rate</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${generateItemsRows()}
                </tbody>
              </table>
            </div>

            <!-- Summary -->
            <div class="summary-section">
              <div class="summary-box">
                <div class="summary-row subtotal">
                  <span class="summary-label">Subtotal</span>
                  <span>₹${subtotalBeforeTax.toFixed(2)}</span>
                </div>
                <div class="summary-row tax">
                  <span class="summary-label">CGST (9%)</span>
                  <span>₹${cgst.toFixed(2)}</span>
                </div>
                <div class="summary-row tax">
                  <span class="summary-label">SGST (9%)</span>
                  <span>₹${sgst.toFixed(2)}</span>
                </div>
                <div class="summary-row total">
                  <span class="summary-label">Grand Total</span>
                  <span>₹${amountInRupees.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <!-- Payment Status -->
            <div class="status-section">
              <div class="payment-info">
                <div class="payment-method">
                  <strong>Payment Method:</strong> ${txn.method?.toUpperCase() || 'N/A'}
                </div>
                <div class="payment-method">
                  <strong>Amount Paid:</strong> ₹${amountInRupees.toFixed(2)}
                </div>
              </div>
              <div class="status-badge ${['success', 'completed', 'confirmed', 'paid'].includes(txn.status?.toLowerCase()) ? 'paid' : 'pending'}">
                ${['success', 'completed', 'confirmed', 'paid'].includes(txn.status?.toLowerCase()) ? '✓ PAID' : '⏳ ' + (txn.status || 'PENDING')}
              </div>
            </div>

            <!-- Barcode Section -->
            <div class="barcode-section">
              <div class="barcode-left">
                <div class="barcode-label">Invoice Barcode</div>
                <div class="barcode-svg">
                  <svg width="${barcodeValue.length * 6}" height="50">${barcodeSVG}</svg>
                </div>
                <div class="barcode-number">${barcodeValue}</div>
                <div class="scan-text">Scan for verification</div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="invoice-footer">
            <div class="footer-content">
              <div class="terms">
                <div class="terms-title">Terms & Conditions</div>
                <div class="terms-text">
                  1. All prices are inclusive of GST.<br>
                  2. Returns accepted within 7 days of delivery for sealed products only.<br>
                  3. For any queries, please contact us at ${storeInfo.email}
                </div>
              </div>
              <div class="footer-brand">
                <div class="footer-brand-name">Sawaikar's Cashew Store</div>
                <div class="footer-contact">
                  ${storeInfo.email}<br>
                  ${storeInfo.phone}
                </div>
              </div>
            </div>
            <div class="computer-generated">
              This is a computer-generated invoice and does not require a signature.<br>
              Thank you for shopping with Sawaikar's Cashew Store!
            </div>
          </div>
        </div>
      </body></html>
    `;

    const blob = new Blob([invoiceHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice_${orderId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Calculate stats
  const stats = {
    total: transactions.length,
    completed: transactions.filter(t => ['success', 'completed', 'confirmed', 'paid'].includes(t.status?.toLowerCase())).length,
    pending: transactions.filter(t => t.status?.toLowerCase() === 'pending').length,
    totalSpent: transactions
      .filter(t => ['success', 'completed', 'confirmed', 'paid'].includes(t.status?.toLowerCase()))
      .reduce((sum, t) => sum + (t.amount > 10000 ? t.amount / 100 : t.amount), 0)
  };

  // Filter state
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredTransactions = transactions.filter(txn => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'completed') return ['success', 'completed', 'confirmed', 'paid'].includes(txn.status?.toLowerCase());
    if (activeFilter === 'pending') return txn.status?.toLowerCase() === 'pending';
    if (activeFilter === 'failed') return txn.status?.toLowerCase() === 'failed';
    return true;
  });

  const getStatusIcon = (status) => {
    const s = status?.toLowerCase();
    if (['success', 'completed', 'confirmed', 'paid'].includes(s)) return <FiCheckCircle />;
    if (s === 'pending') return <FiClock />;
    return <FiXCircle />;
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

  if (loading) {
    return (
      <Wrapper>
        <HeroSection>
          <HeroContent>
            <HeroIcon><FiCreditCard /></HeroIcon>
            <h1>Payment History</h1>
            <p>View all your transactions and download invoices</p>
          </HeroContent>
        </HeroSection>
        <ContentSection>
          <LoadingState>
            <Spinner />
            <span>Loading your transactions...</span>
          </LoadingState>
        </ContentSection>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      {/* Hero Section */}
      <HeroSection>
        <HeroContent>
          <HeroIcon><FiCreditCard /></HeroIcon>
          <h1>Payment History</h1>
          <p>View all your transactions and download invoices</p>

          {transactions.length > 0 && (
            <StatsRow>
              <StatCard>
                <StatNumber>{stats.total}</StatNumber>
                <StatLabel>Transactions</StatLabel>
              </StatCard>
              <StatDivider />
              <StatCard>
                <StatNumber>{stats.completed}</StatNumber>
                <StatLabel>Successful</StatLabel>
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
        {transactions.length === 0 ? (
          <EmptyState>
            <EmptyAnimation>
              <EmptyCard>
                <FiCreditCard />
              </EmptyCard>
            </EmptyAnimation>
            <h2>No Transactions Yet</h2>
            <p>Your payment history will appear here once you make a purchase.</p>
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
                <span>Filter Transactions</span>
              </FilterInfo>
              <FilterTabs>
                <FilterTab $active={activeFilter === 'all'} onClick={() => setActiveFilter('all')}>
                  All ({stats.total})
                </FilterTab>
                <FilterTab $active={activeFilter === 'completed'} onClick={() => setActiveFilter('completed')}>
                  Successful ({stats.completed})
                </FilterTab>
                <FilterTab $active={activeFilter === 'pending'} onClick={() => setActiveFilter('pending')}>
                  Pending ({stats.pending})
                </FilterTab>
              </FilterTabs>
            </FilterBar>

            {/* Transactions List */}
            <TransactionsList>
              {filteredTransactions.map((txn, idx) => {
                let itemName = '-';
                if (Array.isArray(txn.items) && txn.items.length > 0) {
                  itemName = txn.items.map(p => p.name || p.productName).filter(Boolean).join(', ');
                } else if (Array.isArray(txn.products) && txn.products.length > 0) {
                  itemName = txn.products.map(p => p.name || p.productName).filter(Boolean).join(', ');
                } else {
                  itemName = txn.productName || txn.name || txn.itemName || txn.description || '-';
                }

                const paymentDisplay = getPaymentMethodDisplay(txn);
                const displayAmount = txn.amount > 10000 ? (txn.amount / 100) : txn.amount;
                const isCompleted = ['success', 'completed', 'confirmed', 'paid'].includes(txn.status?.toLowerCase());

                return (
                  <TransactionCard key={idx}>
                    {/* Card Header */}
                    <CardHeader>
                      <OrderInfo>
                        <OrderId>#{txn.orderId || `TXN-${idx + 1}`}</OrderId>
                        <OrderTypeBadge $type={txn.orderType}>
                          {txn.orderType === 'instore' ? <><FaStore /> In-Store</> : <><FiTruck /> Online</>}
                        </OrderTypeBadge>
                      </OrderInfo>
                      <TransactionDate>{formatDate(txn.date)}</TransactionDate>
                    </CardHeader>

                    {/* Card Body */}
                    <CardBody>
                      <ItemsSection>
                        <ItemsLabel>Items</ItemsLabel>
                        <ItemsName>{itemName}</ItemsName>
                      </ItemsSection>

                      <PaymentSection>
                        <PaymentMethod>
                          <PaymentIcon>{paymentDisplay.icon}</PaymentIcon>
                          <PaymentDetails>
                            <PaymentType>{paymentDisplay.text}</PaymentType>
                            <PaymentInfo>{paymentDisplay.details}</PaymentInfo>
                          </PaymentDetails>
                        </PaymentMethod>
                      </PaymentSection>
                    </CardBody>

                    {/* Card Footer */}
                    <CardFooter>
                      <AmountSection>
                        <AmountLabel>Amount Paid</AmountLabel>
                        <AmountValue>₹{Number(displayAmount).toLocaleString()}</AmountValue>
                      </AmountSection>

                      <StatusSection>
                        <StatusBadge $status={txn.status}>
                          {getStatusIcon(txn.status)}
                          {txn.status || 'Pending'}
                        </StatusBadge>
                      </StatusSection>

                      <ActionSection>
                        {isCompleted ? (
                          <DownloadButton onClick={() => downloadInvoice(txn)}>
                            <FiDownload />
                            Download Invoice
                          </DownloadButton>
                        ) : (
                          <NoInvoice>Invoice not available</NoInvoice>
                        )}
                      </ActionSection>
                    </CardFooter>
                  </TransactionCard>
                );
              })}
            </TransactionsList>

            {filteredTransactions.length === 0 && (
              <NoResults>
                <FiCreditCard />
                <p>No transactions found for this filter.</p>
              </NoResults>
            )}
          </>
        )}
      </ContentSection>
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
  max-width: 700px;
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

  @media (max-width: 500px) {
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

  @media (max-width: 500px) {
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

  @media (max-width: 500px) {
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

const EmptyCard = styled.div`
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

const TransactionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const TransactionCard = styled.div`
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: linear-gradient(135deg, #faf9f6, #f5f0e8);
  border-bottom: 1px solid #f0e6d3;
  flex-wrap: wrap;
  gap: 12px;
`;

const OrderInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const OrderId = styled.span`
  font-size: 16px;
  font-weight: 700;
  color: #8B4513;
`;

const OrderTypeBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background: ${props => props.$type === 'instore' ? '#D1FAE5' : '#DBEAFE'};
  color: ${props => props.$type === 'instore' ? '#065F46' : '#1E40AF'};

  svg {
    font-size: 12px;
  }
`;

const TransactionDate = styled.span`
  font-size: 13px;
  color: #888;
`;

const CardBody = styled.div`
  padding: 20px 24px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 24px;
  align-items: center;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

const ItemsSection = styled.div``;

const ItemsLabel = styled.div`
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #888;
  margin-bottom: 4px;
`;

const ItemsName = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: #333;
  line-height: 1.4;
`;

const PaymentSection = styled.div``;

const PaymentMethod = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f8f6f3;
  padding: 12px 16px;
  border-radius: 10px;
`;

const PaymentIcon = styled.div`
  width: 40px;
  height: 40px;
  background: white;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  svg {
    font-size: 20px;
  }
`;

const PaymentDetails = styled.div``;

const PaymentType = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #333;
`;

const PaymentInfo = styled.div`
  font-size: 12px;
  color: #888;
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #fafafa;
  border-top: 1px solid #f0f0f0;
  flex-wrap: wrap;
  gap: 16px;
`;

const AmountSection = styled.div``;

const AmountLabel = styled.div`
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #888;
  margin-bottom: 2px;
`;

const AmountValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #8B4513;
`;

const StatusSection = styled.div``;

const StatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 25px;
  font-size: 13px;
  font-weight: 600;
  text-transform: capitalize;

  ${props => {
    const s = props.$status?.toLowerCase();
    if (['success', 'completed', 'confirmed', 'paid'].includes(s)) {
      return `background: #D1FAE5; color: #065F46;`;
    }
    if (s === 'pending') {
      return `background: #FEF3C7; color: #92400E;`;
    }
    return `background: #FEE2E2; color: #991B1B;`;
  }}

  svg {
    font-size: 16px;
  }
`;

const ActionSection = styled.div``;

const DownloadButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #8B4513, #A0522D);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(139, 69, 19, 0.3);
  }

  svg {
    font-size: 18px;
  }
`;

const NoInvoice = styled.span`
  font-size: 13px;
  color: #888;
  font-style: italic;
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

export default PaymentHistory;
