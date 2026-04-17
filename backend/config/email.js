const nodemailer = require('nodemailer');
const { google } = require('googleapis');

// Send email using Gmail REST API (works on Render - uses HTTPS, not SMTP)
const sendWithGmailAPI = async (mailOptions) => {
  try {
    console.log('🔐 Gmail API: Initializing OAuth2...');
    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      'https://developers.google.com/oauthplayground'
    );
    
    oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN
    });
    
    console.log('🔐 Gmail API: Getting access token...');
    // Get access token
    const { token } = await oauth2Client.getAccessToken();
    console.log('✅ Gmail API: Access token obtained');
    
    // Create email content
    const fromMatch = mailOptions.from.match(/"?([^"<]+)"?\s*<([^>]+)>/);
    const senderName = fromMatch ? fromMatch[1].trim() : 'Sawaikar\'s Cashew Store';
    const senderEmail = fromMatch ? fromMatch[2] : process.env.EMAIL_USER;
    
    // Create MIME message
    const messageParts = [
      `From: "${senderName}" <${senderEmail}>`,
      `To: ${mailOptions.to}`,
      `Subject: ${mailOptions.subject}`,
      'MIME-Version: 1.0',
      'Content-Type: multipart/alternative; boundary="boundary"',
      '',
      '--boundary',
      'Content-Type: text/plain; charset="UTF-8"',
      '',
      mailOptions.text || '',
      '',
      '--boundary',
      'Content-Type: text/html; charset="UTF-8"',
      '',
      mailOptions.html || '',
      '',
      '--boundary--'
    ];
    
    const message = messageParts.join('\n');
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    console.log('📨 Gmail API: Sending message to Gmail API...');
    // Send via Gmail API
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });
    
    console.log('✅ Gmail API: Email sent successfully, Message ID:', result.data.id);
    return { messageId: result.data.id };
  } catch (error) {
    console.error('❌ Gmail API Error:', error.message);
    throw error;
  }
};

// Send email using Mailjet HTTP API (works immediately, any recipient)
const sendWithMailjetAPI = async (mailOptions) => {
  const fromMatch = mailOptions.from.match(/"?([^"<]+)"?\s*<([^>]+)>/);
  const senderName = fromMatch ? fromMatch[1].trim() : 'Sawaikar\'s Cashew Store';
  const senderEmail = fromMatch ? fromMatch[2] : process.env.EMAIL_USER;
  
  const auth = Buffer.from(`${process.env.MAILJET_API_KEY}:${process.env.MAILJET_SECRET_KEY}`).toString('base64');
  
  const response = await fetch('https://api.mailjet.com/v3.1/send', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      Messages: [{
        From: { Email: senderEmail, Name: senderName },
        To: [{ Email: mailOptions.to }],
        Subject: mailOptions.subject,
        HTMLPart: mailOptions.html,
        TextPart: mailOptions.text
      }]
    })
  });
  
  const data = await response.json();
  
  if (!response.ok || (data.Messages && data.Messages[0].Status === 'error')) {
    throw new Error(data.ErrorMessage || JSON.stringify(data) || 'Mailjet API error');
  }
  
  return { messageId: data.Messages?.[0]?.To?.[0]?.MessageID || 'sent' };
};

// Send email using Resend HTTP API (requires verified domain for real recipients)
const sendWithResendAPI = async (mailOptions) => {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      html: mailOptions.html,
      text: mailOptions.text
    })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Resend API error');
  }
  
  return { messageId: data.id };
};

// Send email using Brevo HTTP API (requires account activation)
const sendWithBrevoAPI = async (mailOptions) => {
  // Parse sender info
  const fromMatch = mailOptions.from.match(/"?([^"<]+)"?\s*<([^>]+)>/);
  const senderName = fromMatch ? fromMatch[1].trim() : 'Sawaikar\'s Cashew Store';
  const senderEmail = fromMatch ? fromMatch[2] : process.env.EMAIL_USER;
  
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: mailOptions.to }],
      subject: mailOptions.subject,
      htmlContent: mailOptions.html,
      textContent: mailOptions.text
    })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || JSON.stringify(data) || 'Brevo API error');
  }
  
  return { messageId: data.messageId };
};

// Create transporter for sending emails (fallback for local dev)
const createTransporter = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  
  if (!emailUser || !emailPass) {
    console.warn('⚠️ Gmail SMTP credentials not configured for fallback.');
    return null;
  }

  console.log('📧 Creating Gmail SMTP transporter for:', emailUser);
  
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: emailUser,
      pass: emailPass
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    logger: true,  // Enable logging
    debug: true    // Enable debug output
  });
};

// Helper function to format price (convert paise to rupees)
const formatPrice = (priceInPaise) => {
  const priceInRupees = (priceInPaise || 0) / 100;
  return priceInRupees.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

// Generate HTML for items table rows
const generateItemsHtml = (items) => {
  return items.map(item => {
    const itemTotal = formatPrice(item.price * item.quantity);
    const itemPrice = formatPrice(item.price);
    const productImage = item.image || item.images?.[0] || 'https://via.placeholder.com/100/C84410/ffffff?text=' + encodeURIComponent(item.name.substring(0, 3));
    
    return '<tr>' +
      '<td style="padding: 16px 14px; border-bottom: 1px solid #EDF2F7; vertical-align: middle;">' +
      '<table role="presentation" cellspacing="0" cellpadding="0" border="0">' +
      '<tr>' +
      '<td style="padding-right: 14px;">' +
      '<img src="' + productImage + '" alt="' + item.name + '" style="width: 80px; height: 80px; border-radius: 8px; object-fit: cover; border: 2px solid #FFF5E6;" />' +
      '</td>' +
      '<td style="vertical-align: middle;">' +
      '<div style="color: #1a202c; font-size: 14px; font-weight: 600; margin-bottom: 6px;">' + item.name + '</div>' +
      '<div style="color: #718096; font-size: 12px; margin-bottom: 6px;">Qty: <strong>' + item.quantity + '</strong></div>' +
      '<div style="color: #C84410; font-size: 13px; font-weight: 700;">₹' + itemPrice + ' each</div>' +
      '</td>' +
      '</tr>' +
      '</table>' +
      '</td>' +
      '<td style="padding: 16px 14px; border-bottom: 1px solid #EDF2F7; text-align: right; color: #2d3748; font-size: 14px; font-weight: 700; color: #C84410;">₹' + itemTotal + '</td>' +
      '</tr>';
  }).join('');
};

// Generate shipping address HTML
const generateAddressHtml = (shippingAddress) => {
  if (!shippingAddress) return '';
  
  const name = shippingAddress.name || '';
  const street = shippingAddress.street || shippingAddress.address || '';
  const city = shippingAddress.city || '';
  const state = shippingAddress.state || '';
  const pincode = shippingAddress.pincode || '';
  const country = shippingAddress.country || 'India';
  const phone = shippingAddress.phone ? '<br>Phone: ' + shippingAddress.phone : '';
  
  return name + '<br>' + street + '<br>' + city + ', ' + state + ' - ' + pincode + '<br>' + country + phone;
};

// Send order confirmation email
const sendOrderConfirmationEmail = async (order) => {
  console.log('📧 sendOrderConfirmationEmail called for:', order.userEmail);
  console.log('🔍 Checking email providers...');
  console.log('   Gmail API configured: ', !!(process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.GMAIL_REFRESH_TOKEN));
  console.log('   Mailjet configured: ', !!(process.env.MAILJET_API_KEY && process.env.MAILJET_SECRET_KEY));
  console.log('   Brevo configured: ', !!process.env.BREVO_API_KEY);
  console.log('   Resend configured: ', !!process.env.RESEND_API_KEY);
  console.log('   SMTP Email configured: ', !!process.env.EMAIL_USER);
  
  // Calculate values with detailed breakdown
  const userName = order.userName || 'Valued Customer';
  const orderDate = new Date(order.createdAt).toLocaleDateString('en-IN', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const currentYear = new Date().getFullYear();
  
  // Prices: item.price is in paise, order.totalAmount is also in paise
  // Calculate base amount (before tax)
  const baseAmount = order.totalAmount - (order.shippingFee || 0);
  const gstAmount = Math.round(baseAmount * 0.05); // 5% GST
  const subtotalBeforeTax = baseAmount - gstAmount;
  const shipping = (order.shippingFee || 0);
  const shippingDisplay = shipping > 0 ? '₹' + formatPrice(shipping) : 'FREE';
  const total = formatPrice(order.totalAmount);
  const subtotal = formatPrice(subtotalBeforeTax);
  const gstDisplay = formatPrice(gstAmount);
  
  const paymentStatusBadge = order.paymentStatus === 'completed' 
    ? '<span style="display: inline-block; background: linear-gradient(135deg, #16A34A 0%, #15803D 100%); color: white; padding: 8px 18px; border-radius: 6px; font-size: 11px; font-weight: 700; letter-spacing: 0.7px; box-shadow: 0 2px 6px rgba(22, 163, 74, 0.3); text-transform: uppercase;">Completed</span>'
    : '<span style="display: inline-block; background: linear-gradient(135deg, #EA580C 0%, #C84410 100%); color: white; padding: 8px 18px; border-radius: 6px; font-size: 11px; font-weight: 700; letter-spacing: 0.7px; box-shadow: 0 2px 6px rgba(200, 68, 16, 0.3); text-transform: uppercase;">Pending</span>';

  // Plain text version
  const plainTextEmail = 'Dear ' + userName + ',\n\n' +
    'Thank you for your order.\n\n' +
    'Your order has been confirmed and is being prepared for shipment.\n\n' +
    'ORDER DETAILS\n' +
    '─────────────────────────────\n' +
    'Order ID: ' + order.orderId + '\n' +
    'Order Date: ' + orderDate + '\n' +
    'Payment Status: ' + order.paymentStatus.toUpperCase() + '\n' +
    (order.transactionId ? 'Transaction ID: ' + order.transactionId + '\n' : '') +
    '\n' +
    'ITEMS ORDERED\n' +
    '─────────────────────────────\n' +
    order.items.map(item => '• ' + item.name + ' (Qty: ' + item.quantity + ') - ₹' + formatPrice(item.price * item.quantity)).join('\n') + '\n\n' +
    'Subtotal: ₹' + subtotal + '\n' +
    'Shipping: ' + shippingDisplay + '\n' +
    'Total: ₹' + total + '\n\n' +
    'We will send you a shipping notification once your order has been dispatched.\n\n' +
    'For any queries, please contact us at:\n' +
    'Email: support@sawaikarcashew.com\n' +
    'Phone: +91 98765 43210\n\n' +
    'Thank you for choosing Sawaikar\'s Cashew Store.\n\n' +
    'Best regards,\n' +
    'Sawaikar\'s Cashew Store Team';

  // HTML Email Template - Professional Version (Redesigned)
  const htmlEmail = '<!DOCTYPE html>' +
    '<html lang="en">' +
    '<head>' +
    '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<meta http-equiv="X-UA-Compatible" content="IE=edge">' +
    '<title>Order Confirmation - Sawaikar\'s Cashew Store</title>' +
    '</head>' +
    '<body style="margin: 0; padding: 0; background-color: #fafbfc; font-family: \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif; color: #2d3748;">' +
    
    '<!-- Wrapper -->' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #fafbfc;">' +
    '<tr><td align="center" style="padding: 40px 15px;">' +
    
    '<!-- Border Frame Container -->' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 630px; background-color: #ffffff; border-radius: 14px; overflow: hidden; border: 3px solid #C84410; box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);">' +
    '<tr><td style="border-radius: 12px; overflow: hidden;">' +
    
    '<!-- Main Email Container Inner -->' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff; border-radius: 0; overflow: hidden;">' +
    
    '<!-- Premium Header with Brand Colors -->' +
    '<tr>' +
    '<td style="background: linear-gradient(180deg, #C84410 0%, #A23208 100%); padding: 25px 35px; text-align: center; position: relative; overflow: hidden;">' +
    '<div style="position: absolute; top: 0; right: -35px; width: 120px; height: 120px; background: rgba(255, 255, 255, 0.04); border-radius: 50%; z-index: 0;"></div>' +
    '<div style="position: absolute; bottom: -45px; left: -45px; width: 120px; height: 120px; background: rgba(255, 255, 255, 0.02); border-radius: 50%; z-index: 0;"></div>' +
    '<div style="position: relative; z-index: 1;">' +
    '<h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: 0px; font-family: \'Segoe UI\', sans-serif;">Sawaikar\'s Cashew Store</h1>' +
    '<p style="margin: 6px 0 0 0; color: rgba(255, 255, 255, 0.93); font-size: 10px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase;">Premium Quality Cashews & Dry Fruits</p>' +
    '</div>' +
    '</td>' +
    '</tr>' +
    
    '<!-- Main Content -->' +
    '<tr>' +
    '<td style="padding: 40px 35px; background-color: #ffffff;">' +
    
    '<!-- Personalized Greeting -->' +
    '<p style="margin: 0 0 3px 0; color: #a0aec0; font-size: 12px; font-weight: 500; letter-spacing: 0.5px;">Welcome back,</p>' +
    '<p style="margin: 0 0 24px 0; color: #C84410; font-size: 15px; font-weight: 700;">' + userName + '</p>' +
    
    '<!-- Main Confirmation Heading -->' +
    '<h2 style="margin: 0 0 14px 0; color: #1a202c; font-size: 26px; font-weight: 800; line-height: 1.1; letter-spacing: -0.2px;">Your Order is Confirmed</h2>' +
    '<p style="margin: 0 0 32px 0; color: #4a5568; font-size: 13px; line-height: 1.6; font-weight: 400;">Thank you for your order! We\'re thrilled to serve you. Your premium selection is being prepared with care and will ship shortly.</p>' +
    
    '<!-- Order Status Card -->' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #FFF5E6 0%, #FFEAD0 100%); border-radius: 10px; margin-bottom: 28px; border: 1px solid #FFD89B; overflow: hidden;">' +
    '<tr><td style="padding: 24px 20px;">' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">' +
    '<tr>' +
    '<td style="width: 50%; vertical-align: top; padding-right: 14px;">' +
    '<p style="margin: 0 0 7px 0; color: #8B5A00; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;">Order Number</p>' +
    '<p style="margin: 0; color: #C84410; font-size: 20px; font-weight: 800; word-break: break-all;">' + order.orderId + '</p>' +
    '</td>' +
    '<td style="width: 50%; text-align: right; vertical-align: top; padding-left: 14px; border-left: 1px solid rgba(200, 68, 16, 0.1);">' +
    '<p style="margin: 0 0 7px 0; color: #8B5A00; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;">Payment Status</p>' +
    '<div>' + paymentStatusBadge + '</div>' +
    '</td>' +
    '</tr>' +
    (order.transactionId ? '<tr><td colspan="2" style="padding-top: 20px; border-top: 1px solid rgba(200, 68, 16, 0.15); margin-top: 20px;"><p style="margin: 0; color: #8B5A00; font-size: 12px; font-weight: 500;"><span style="font-weight: 700;">Transaction ID:</span><br>' + order.transactionId + '</p></td></tr>' : '') +
    '</table>' +
    '</td></tr>' +
    '</table>' +
    
    '<!-- Order Details Header -->' +
    '<h3 style="margin: 28px 0 14px 0; color: #1a202c; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; text-indent: 2px;">Order Items</h3>' +
    
    '<!-- Items Table -->' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #fafbfc; margin-bottom: 22px; border: 1px solid #E2E8F0; border-radius: 10px; overflow: hidden;">' +
    '<thead>' +
    '<tr style="background: linear-gradient(90deg, #C84410 0%, #A23208 100%);">' +
    '<th style="padding: 16px 12px; text-align: left; color: #ffffff; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px;">Product Details</th>' +
    '<th style="padding: 16px 12px; text-align: right; color: #ffffff; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px;">Total</th>' +
    '</tr>' +
    '</thead>' +
    '<tbody>' +
    generateItemsHtml(order.items) +
    '</tbody>' +
    '</table>' +
    
    '<!-- Price Summary -->' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0 28px 0; background-color: #ffffff;">' +
    '<tr>' +
    '<td style="text-align: right; padding: 12px 0; color: #6b7280; font-size: 13px; font-weight: 500; border-bottom: 1px solid #EDF2F7;">Subtotal:</td>' +
    '<td style="text-align: right; padding: 12px 0 12px 20px; color: #2d3748; font-size: 13px; font-weight: 600; border-bottom: 1px solid #EDF2F7;">₹' + subtotal + '</td>' +
    '</tr>' +
    '<tr>' +
    '<td style="text-align: right; padding: 12px 0; color: #6b7280; font-size: 13px; font-weight: 500; border-bottom: 1px solid #EDF2F7;">GST (5%):</td>' +
    '<td style="text-align: right; padding: 12px 0 12px 20px; color: #2d3748; font-size: 13px; font-weight: 600; border-bottom: 1px solid #EDF2F7;">₹' + gstDisplay + '</td>' +
    '</tr>' +
    '<tr>' +
    '<td style="text-align: right; padding: 12px 0; color: #6b7280; font-size: 13px; font-weight: 500; border-bottom: 1px solid #EDF2F7;">Shipping:</td>' +
    '<td style="text-align: right; padding: 12px 0 12px 20px; color: ' + (shipping > 0 ? '#2d3748' : '#22863a') + '; font-size: 13px; font-weight: 600; border-bottom: 1px solid #EDF2F7;">' + shippingDisplay + '</td>' +
    '</tr>' +
    '<tr style="background: linear-gradient(90deg, #FFF5E6 0%, #FFEAD0 100%); height: 2px;"><td colspan="2" style="height: 2px;"></td></tr>' +
    '<tr>' +
    '<td style="text-align: right; padding: 14px 0; color: #2d3748; font-size: 14px; font-weight: 700;">Total Amount:</td>' +
    '<td style="text-align: right; padding: 14px 0 14px 20px; color: #C84410; font-size: 24px; font-weight: 800;">₹' + total + '</td>' +
    '</tr>' +
    '</table>' +
    
    '<!-- Shipping Address -->' +
    (order.shippingAddress ? 
    '<h3 style="margin: 28px 0 12px 0; color: #1a202c; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px;">Delivery Address</h3>' +
    '<div style="background: linear-gradient(135deg, #FFF8F1 0%, #FFEDE0 100%); border-left: 4px solid #C84410; border-radius: 8px; padding: 16px 16px; margin-bottom: 24px; border: 1px solid #FFD89B;">' +
    '<p style="margin: 0; color: #2d3748; font-size: 12px; line-height: 1.6; font-weight: 500;">' + generateAddressHtml(order.shippingAddress) + '</p>' +
    '</div>' : '') +
    
    '<!-- What Happens Next -->' +
    '<div style="background: linear-gradient(135deg, #F8FAFC 0%, #EEF2F7 100%); border-left: 4px solid #C84410; border-radius: 10px; padding: 20px 18px; margin: 28px 0; border: 1px solid #E2E8F0;">' +
    '<h3 style="margin: 0 0 8px 0; color: #1a202c; font-size: 12px; font-weight: 700;">↻ Next Steps</h3>' +
    '<p style="margin: 0; color: #4a5568; font-size: 12px; line-height: 1.6;">We\'re carefully packing your items for shipment. You\'ll receive a tracking number within 24-48 hours. Keep an eye on your email for updates!</p>' +
    '</div>' +
    
    '<!-- CTA Button -->' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 28px 0 32px 0;">' +
    '<tr><td align="center">' +
    '<a href="' + (process.env.FRONTEND_URL || 'http://localhost:3000') + '/orders" style="display: inline-block; background: linear-gradient(135deg, #D9741F 0%, #C84410 100%); color: #ffffff; text-decoration: none; padding: 13px 44px; border-radius: 8px; font-size: 13px; font-weight: 700; box-shadow: 0 6px 18px rgba(200, 68, 16, 0.25); transition: all 0.3s ease; border: none; cursor: pointer;">View Order Status →</a>' +
    '</td></tr>' +
    '</table>' +
    
    '<!-- Support Section -->' +
    '<hr style="border: none; border-top: 1px solid #EDF2F7; margin: 28px 0;">' +
    '<h3 style="margin: 24px 0 10px 0; color: #1a202c; font-size: 12px; font-weight: 700;">Help & Support</h3>' +
    '<p style="margin: 0 0 14px 0; color: #4a5568; font-size: 12px; line-height: 1.5;">Have any questions? Our support team is ready to help!</p>' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #F8FAFC; border-radius: 10px; border: 1px solid #E2E8F0; overflow: hidden;">' +
    '<tr>' +
    '<td style="padding: 16px; border-right: 1px solid #E2E8F0; width: 50%;">' +
    '<p style="margin: 0 0 6px 0; color: #718096; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px;">✉ Email</p>' +
    '<p style="margin: 0; color: #C84410; font-size: 13px; font-weight: 600;"><a href="mailto:support@sawaikarcashew.com" style="color: #C84410; text-decoration: none;">support@sawaikarcashew.com</a></p>' +
    '</td>' +
    '<td style="padding: 16px; width: 50%;">' +
    '<p style="margin: 0 0 6px 0; color: #718096; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px;">☎ Phone</p>' +
    '<p style="margin: 0; color: #2d3748; font-size: 13px; font-weight: 600;">+91 98765 43210</p>' +
    '</td>' +
    '</tr>' +
    '</table>' +
    
    '</td>' +
    '</tr>' +
    
    '<!-- Footer -->' +
    '<tr>' +
    '<td style="background: linear-gradient(180deg, #6B3410 0%, #4A2408 100%); padding: 30px 35px; text-align: center; border-top: 2px solid rgba(200, 68, 16, 0.2);">' +
    '<p style="margin: 0 0 6px 0; color: #FFEEDE; font-size: 13px; line-height: 1.5; font-weight: 500;">Thank you for shopping with Sawaikar\'s Cashew Store</p>' +
    '<p style="margin: 6px 0 0 0; color: rgba(255, 238, 222, 0.75); font-size: 10px; line-height: 1.4; letter-spacing: 0.1px;">&copy; ' + currentYear + ' Sawaikar\'s Cashew Store | Crafted with Pride in India</p>' +
    '</td>' +
    '</tr>' +
    
    '</table>' +
    '<!-- End Email Container Inner -->' +
    
    '</td></tr>' +
    '</table>' +
    '<!-- End Border Frame Container -->' +
    
    '</td></tr>' +
    '</table>' +
    '<!-- End Wrapper -->' +
    
    '</body>' +
    '</html>';

  // Determine sender email based on provider
  // Priority: Gmail API > Mailjet > Brevo > Resend > SMTP
  const useGmailAPI = !!(process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.GMAIL_REFRESH_TOKEN);
  const useMailjetAPI = !!(process.env.MAILJET_API_KEY && process.env.MAILJET_SECRET_KEY);
  const useBrevoAPI = !!process.env.BREVO_API_KEY;
  const useResendAPI = !!process.env.RESEND_API_KEY;
  
  const fromEmail = '"Sawaikar\'s Cashew Store" <' + (process.env.EMAIL_USER || 'sawaikarcashewstore1980@gmail.com') + '>';

  const mailOptions = {
    from: fromEmail,
    to: order.userEmail,
    subject: 'Order Confirmed! ' + order.orderId + ' - Sawaikar\'s Cashew Store',
    text: plainTextEmail,
    html: htmlEmail
  };

  try {
    // Priority 1: Gmail API (works on Render, uses your Gmail account)
    if (useGmailAPI) {
      console.log('📧 Sending via Gmail API to:', order.userEmail);
      try {
        const info = await sendWithGmailAPI(mailOptions);
        console.log('✅ Order confirmation email sent via Gmail API to ' + order.userEmail);
        console.log('   Message ID: ' + info.messageId);
        return { success: true, messageId: info.messageId, provider: 'Gmail API' };
      } catch (gmailError) {
        console.warn('⚠️ Gmail API failed (' + gmailError.message + '), trying next provider...');
        // Don't return here - fall through to try next provider
      }
    }
    // Priority 2: Mailjet API (works immediately, any recipient)
    if (useMailjetAPI) {
      console.log('📧 Sending via Mailjet HTTP API to:', order.userEmail);
      const info = await sendWithMailjetAPI(mailOptions);
      console.log('✅ Order confirmation email sent via Mailjet to ' + order.userEmail);
      console.log('   Message ID: ' + info.messageId);
      return { success: true, messageId: info.messageId, provider: 'Mailjet' };
    }
    // Priority 3: Brevo API (requires account activation)
    if (useBrevoAPI) {
      console.log('📧 Sending via Brevo HTTP API to:', order.userEmail);
      const info = await sendWithBrevoAPI(mailOptions);
      console.log('✅ Order confirmation email sent via Brevo to ' + order.userEmail);
      console.log('   Message ID: ' + info.messageId);
      return { success: true, messageId: info.messageId, provider: 'Brevo' };
    }
    // Priority 4: Resend API (requires verified domain for real recipients)
    if (useResendAPI) {
      console.log('📧 Sending via Resend HTTP API...');
      mailOptions.from = '"Sawaikar\'s Cashew Store" <onboarding@resend.dev>';
      const info = await sendWithResendAPI(mailOptions);
      console.log('✅ Order confirmation email sent via Resend to ' + order.userEmail);
      console.log('   Message ID: ' + info.messageId);
      return { success: true, messageId: info.messageId, provider: 'Resend' };
    } 
    // Priority 5: SMTP for local development (now the final fallback)
    console.log('📧 Trying SMTP fallback to:', order.userEmail);
    const transporter = createTransporter();
    if (!transporter) {
      return { success: false, error: 'Email service not configured' };
    }
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Order confirmation email sent via SMTP to ' + order.userEmail);
    console.log('   Message ID: ' + info.messageId);
    return { success: true, messageId: info.messageId, provider: 'SMTP' };
  } catch (error) {
    console.error('❌ Error sending email: ' + error.message);
    return { success: false, error: error.message };
  }
};

// Generic email sending function that works with Gmail API
const sendEmail = async (mailOptions) => {
  const useGmailAPI = !!(process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.GMAIL_REFRESH_TOKEN);
  const useMailjetAPI = !!(process.env.MAILJET_API_KEY && process.env.MAILJET_SECRET_KEY);
  const useBrevoAPI = !!process.env.BREVO_API_KEY;
  const useResendAPI = !!process.env.RESEND_API_KEY;
  
  try {
    // Try Gmail API first
    if (useGmailAPI) {
      try {
        const info = await sendWithGmailAPI(mailOptions);
        return { success: true, messageId: info.messageId, provider: 'Gmail API' };
      } catch (gmailError) {
        console.warn('⚠️ Gmail API failed, trying next provider...');
        // Fall through to try other providers
      }
    }
    
    // Try Mailjet
    if (useMailjetAPI) {
      const info = await sendWithMailjetAPI(mailOptions);
      return { success: true, messageId: info.messageId, provider: 'Mailjet' };
    }
    
    // Try Brevo
    if (useBrevoAPI) {
      const info = await sendWithBrevoAPI(mailOptions);
      return { success: true, messageId: info.messageId, provider: 'Brevo' };
    }
    
    // Try Resend
    if (useResendAPI) {
      mailOptions.from = '"Sawaikar\'s Cashew Store" <onboarding@resend.dev>';
      const info = await sendWithResendAPI(mailOptions);
      return { success: true, messageId: info.messageId, provider: 'Resend' };
    }
    
    // Fall back to SMTP
    const transporter = createTransporter();
    if (!transporter) {
      return { success: false, error: 'Email service not configured' };
    }
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId, provider: 'SMTP' };
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    return { success: false, error: error.message };
  }
};

// Send order shipped email
const sendOrderShippedEmail = async (order) => {
  const userName = order.userName || 'Valued Customer';
  const currentYear = new Date().getFullYear();
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  // Calculate price breakdown
  const baseAmount = order.totalAmount - (order.shippingFee || 0);
  const gstAmount = Math.round(baseAmount * 0.05); // 5% GST
  const subtotalBeforeTax = baseAmount - gstAmount;
  const shipping = (order.shippingFee || 0);
  const shippingDisplay = shipping > 0 ? '₹' + formatPrice(shipping) : 'FREE';
  const total = formatPrice(order.totalAmount);
  const subtotal = formatPrice(subtotalBeforeTax);
  const gstDisplay = formatPrice(gstAmount);
  
  const trackingInfo = order.trackingNumber 
    ? '<p style="margin: 10px 0; color: #059669; font-size: 16px; font-weight: 700;">🔗 Tracking Number: ' + order.trackingNumber + '</p>'
    : '';
  
  const estimatedDelivery = order.estimatedDelivery 
    ? '<p style="margin: 5px 0 15px 0; color: #6B7280; font-size: 14px;">Expected by: ' + new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) + '</p>'
    : '';

  const htmlEmail = '<!DOCTYPE html>' +
    '<html lang="en">' +
    '<head>' +
    '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<meta http-equiv="X-UA-Compatible" content="IE=edge">' +
    '<title>Order Shipped - Sawaikar\'s Cashew Store</title>' +
    '</head>' +
    '<body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif; color: #333333;">' +
    
    '<!-- Wrapper -->' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8f9fa;">' +
    '<tr><td align="center" style="padding: 40px 0;">' +
    
    '<!-- Main Email Container -->' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); overflow: hidden;">' +
    
    '<!-- Header -->' +
    '<tr>' +
    '<td style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 50px 30px; text-align: center; position: relative; overflow: hidden;">' +
    '<div style="position: relative; z-index: 2;">' +
    '<h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 800; letter-spacing: -0.5px;">Sawaikar\'s Cashew Store</h1>' +
    '<p style="margin: 12px 0 0 0; color: rgba(255,255,255,0.95); font-size: 13px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase;">Premium Quality Cashews & Dry Fruits</p>' +
    '</div>' +
    '</td>' +
    '</tr>' +
    
    '<!-- Content -->' +
    '<tr>' +
    '<td style="padding: 45px 35px;">' +
    
    '<!-- Greeting -->' +
    '<p style="margin: 0 0 2px 0; color: #9ca3af; font-size: 14px;">Hello</p>' +
    '<p style="margin: 0 0 24px 0; color: #059669; font-size: 16px; font-weight: 700;">' + userName + '</p>' +
    
    '<!-- Shipped Message -->' +
    '<h2 style="margin: 0 0 16px 0; color: #1F2937; font-size: 32px; font-weight: 800; line-height: 1.2;">Your Order is On Its Way! →</h2>' +
    '<p style="margin: 0 0 35px 0; color: #6b7280; font-size: 15px; line-height: 1.7;">Great news! Your premium cashews have been shipped and are heading to you. Track your package below to stay updated on its journey.</p>' +
    
    '<!-- Tracking Info Box -->' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%); border-left: 5px solid #059669; border-radius: 8px; margin-bottom: 30px; box-shadow: 0 2px 6px rgba(5, 150, 105, 0.1);">' +
    '<tr><td style="padding: 28px 24px;">' +
    '<p style="margin: 0 0 5px 0; color: #047857; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">→ Order On The Way</p>' +
    '<p style="margin: 0 0 15px 0; color: #059669; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">' + order.orderId + '</p>' +
    trackingInfo +
    estimatedDelivery +
    '</td></tr>' +
    '</table>' +
    
    '<!-- Order Details Section -->' +
    '<h3 style="margin: 35px 0 20px 0; color: #1F2937; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">⊟ What\'s in Your Package</h3>' +
    
    '<!-- Items Table with Product Images -->' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff; margin-bottom: 25px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">' +
    '<thead>' +
    '<tr style="background: linear-gradient(135deg, #059669 0%, #047857 100%); border-bottom: 2px solid #047857;">' +
    '<th style="padding: 16px 12px; text-align: left; color: #ffffff; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Product Details</th>' +
    '<th style="padding: 16px 12px; text-align: right; color: #ffffff; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Total</th>' +
    '</tr>' +
    '</thead>' +
    '<tbody>' +
    generateItemsHtml(order.items) +
    '</tbody>' +
    '</table>' +
    
    '<!-- Order Summary -->' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0 35px 0; background-color: #ffffff;">' +
    '<tr>' +
    '<td style="text-align: right; padding: 14px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">Subtotal (Before Tax):</td>' +
    '<td style="text-align: right; padding: 14px 20px; color: #1f2937; font-size: 14px; font-weight: 600; border-bottom: 1px solid #f3f4f6;">₹' + subtotal + '</td>' +
    '</tr>' +
    '<tr>' +
    '<td style="text-align: right; padding: 14px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">GST (5%):</td>' +
    '<td style="text-align: right; padding: 14px 20px; color: #1f2937; font-size: 14px; font-weight: 600; border-bottom: 1px solid #f3f4f6;">₹' + gstDisplay + '</td>' +
    '</tr>' +
    '<tr>' +
    '<td style="text-align: right; padding: 14px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">Delivery:</td>' +
    '<td style="text-align: right; padding: 14px 20px; color: ' + (shipping > 0 ? '#1f2937' : '#10B981') + '; font-size: 14px; font-weight: 600; border-bottom: 1px solid #f3f4f6;">' + shippingDisplay + '</td>' +
    '</tr>' +
    '<tr style="background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%); border-top: 2px solid #059669; border-radius: 0 0 8px 8px;">' +
    '<td style="text-align: right; padding: 18px 0; color: #1f2937; font-size: 15px; font-weight: 700;">Total Amount:</td>' +
    '<td style="text-align: right; padding: 18px 20px; color: #059669; font-size: 26px; font-weight: 800;">₹' + total + '</td>' +
    '</tr>' +
    '</table>' +
    
    '<!-- CTA Button -->' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0 40px 0;">' +
    '<tr><td align="center">' +
    '<a href="' + frontendUrl + '/orders" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 15px; font-weight: 700; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3); transition: all 0.3s ease;">Track Shipment →</a>' +
    '</td></tr>' +
    '</table>' +
    
    '<!-- Divider -->' +
    '<hr style="border: none; border-top: 2px solid #f3f4f6; margin: 35px 0;">' +
    
    '<!-- Support Section -->' +
    '<h4 style="margin: 25px 0 12px 0; color: #1f2937; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">❓ Delivery Issues?</h4>' +
    '<p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">If your package doesn\'t arrive as expected, let us know:</p>' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 12px; background-color: #f9fafb; border-radius: 8px; padding: 20px; border-left: 4px solid #059669;">' +
    '<tr>' +
    '<td style="width: 50%; padding-right: 12px;">' +
    '<p style="margin: 0 0 8px 0; color: #999999; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">✉ Email</p>' +
    '<p style="margin: 0; color: #059669; font-size: 14px; font-weight: 600;"><a href="mailto:support@sawaikarcashew.com" style="color: #059669; text-decoration: none;">support@sawaikarcashew.com</a></p>' +
    '</td>' +
    '<td style="width: 50%; text-align: right; padding-left: 12px;">' +
    '<p style="margin: 0 0 8px 0; color: #999999; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">☎ Phone</p>' +
    '<p style="margin: 0; color: #1f2937; font-size: 14px; font-weight: 600;">+91 98765 43210</p>' +
    '</td>' +
    '</tr>' +
    '</table>' +
    
    '</td>' +
    '</tr>' +
    
    '<!-- Footer -->' +
    '<tr>' +
    '<td style="background: linear-gradient(135deg, #047857 0%, #065F46 100%); padding: 40px 30px; text-align: center; border-top: 1px solid rgba(5, 150, 105, 0.2);">' +
    '<p style="margin: 0 0 12px 0; color: #ffffff; font-size: 14px; line-height: 1.7; font-weight: 500;">Premium Cashews Coming Soon!<br>Enjoy your order</p>' +
    '<p style="margin: 16px 0 0 0; color: rgba(255,255,255,0.75); font-size: 12px; letter-spacing: 0.5px;">&copy; ' + currentYear + ' Sawaikar\'s Cashew Store | Crafted with care in India</p>' +
    '</td>' +
    '</tr>' +
    
    '</table>' +
    '<!-- End Email Container -->' +
    
    '</td></tr>' +
    '</table>' +
    '<!-- End Wrapper -->' +
    
    '</body>' +
    '</html>';

  const plainTextEmail = 'Hi ' + userName + ',\n\nGreat news! Your order ' + order.orderId + ' has been shipped!\n\n' +
    'ITEMS IN YOUR SHIPMENT\n' +
    '─────────────────────────────\n' +
    order.items.map(item => '• ' + item.name + ' (Qty: ' + item.quantity + ') - ₹' + formatPrice(item.price * item.quantity)).join('\n') + '\n\n' +
    'Subtotal: ₹' + subtotal + '\n' +
    'Delivery: ' + shippingDisplay + '\n' +
    'Total: ₹' + total + '\n' +
    (order.trackingNumber ? '\nTracking Number: ' + order.trackingNumber + '\n' : '') +
    '\nTrack your order at: ' + frontendUrl + '/orders\n\nThank you for choosing Sawaikar\'s Cashew Store!';

  const result = await sendEmail({
    from: '"Sawaikar\'s Cashew Store" <' + (process.env.EMAIL_USER || 'sawaikarcashewstore1980@gmail.com') + '>',
    to: order.userEmail,
    subject: 'Your Order is On Its Way! → ' + order.orderId + ' - Sawaikar\'s Cashew Store',
    text: plainTextEmail,
    html: htmlEmail
  });
  
  if (result.success) {
    console.log('Shipped email sent to ' + order.userEmail);
  }
  return result;
};

// Send order processing email
const sendOrderProcessingEmail = async (order) => {
  const userName = order.userName || 'Valued Customer';
  const currentYear = new Date().getFullYear();
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  // Calculate price breakdown
  const baseAmount = order.totalAmount - (order.shippingFee || 0);
  const gstAmount = Math.round(baseAmount * 0.05); // 5% GST
  const subtotalBeforeTax = baseAmount - gstAmount;
  const shipping = (order.shippingFee || 0);
  const shippingDisplay = shipping > 0 ? '₹' + formatPrice(shipping) : 'FREE';
  const total = formatPrice(order.totalAmount);
  const subtotal = formatPrice(subtotalBeforeTax);
  const gstDisplay = formatPrice(gstAmount);

  const htmlEmail = '<!DOCTYPE html>' +
    '<html lang="en">' +
    '<head>' +
    '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<meta http-equiv="X-UA-Compatible" content="IE=edge">' +
    '<title>Order Processing - Sawaikar\'s Cashew Store</title>' +
    '</head>' +
    '<body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif; color: #333333;">' +
    
    '<!-- Wrapper -->' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8f9fa;">' +
    '<tr><td align="center" style="padding: 40px 0;">' +
    
    '<!-- Main Email Container -->' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); overflow: hidden;">' +
    
    '<!-- Header -->' +
    '<tr>' +
    '<td style="background: linear-gradient(135deg, #D97706 0%, #B45309 100%); padding: 50px 30px; text-align: center; position: relative; overflow: hidden;">' +
    '<div style="position: relative; z-index: 2;">' +
    '<h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 800; letter-spacing: -0.5px;">Sawaikar\'s Cashew Store</h1>' +
    '<p style="margin: 12px 0 0 0; color: rgba(255,255,255,0.95); font-size: 13px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase;">Premium Quality Cashews & Dry Fruits</p>' +
    '</div>' +
    '</td>' +
    '</tr>' +
    
    '<!-- Content -->' +
    '<tr>' +
    '<td style="padding: 45px 35px;">' +
    
    '<!-- Greeting -->' +
    '<p style="margin: 0 0 2px 0; color: #9ca3af; font-size: 14px;">Hello</p>' +
    '<p style="margin: 0 0 24px 0; color: #D97706; font-size: 16px; font-weight: 700;">' + userName + '</p>' +
    
    '<!-- Processing Message -->' +
    '<h2 style="margin: 0 0 16px 0; color: #1F2937; font-size: 32px; font-weight: 800; line-height: 1.2;">We\'re Preparing Your Order! ↻</h2>' +
    '<p style="margin: 0 0 35px 0; color: #6b7280; font-size: 15px; line-height: 1.7;">Your premium cashews are being carefully packed and will ship within 24 hours. Thank you for your patience!</p>' +
    
    '<!-- Order Status Box -->' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border-left: 5px solid #D97706; border-radius: 8px; margin-bottom: 30px; box-shadow: 0 2px 6px rgba(217, 119, 6, 0.1);">' +
    '<tr><td style="padding: 28px 24px;">' +
    '<p style="margin: 0 0 8px 0; color: #92400E; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">↻ Order Number</p>' +
    '<p style="margin: 0; color: #D97706; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">' + order.orderId + '</p>' +
    '</td></tr>' +
    '</table>' +
    
    '<!-- Order Details Section -->' +
    '<h3 style="margin: 35px 0 20px 0; color: #1F2937; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">⊟ Order Details</h3>' +
    
    '<!-- Items Table with Product Images -->' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff; margin-bottom: 25px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">' +
    '<thead>' +
    '<tr style="background: linear-gradient(135deg, #D97706 0%, #B45309 100%); border-bottom: 2px solid #B45309;">' +
    '<th style="padding: 16px 12px; text-align: left; color: #ffffff; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Product Details</th>' +
    '<th style="padding: 16px 12px; text-align: right; color: #ffffff; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Total</th>' +
    '</tr>' +
    '</thead>' +
    '<tbody>' +
    generateItemsHtml(order.items) +
    '</tbody>' +
    '</table>' +
    
    '<!-- Order Summary -->' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0 35px 0; background-color: #ffffff;">' +
    '<tr>' +
    '<td style="text-align: right; padding: 14px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">Subtotal (Before Tax):</td>' +
    '<td style="text-align: right; padding: 14px 20px; color: #1f2937; font-size: 14px; font-weight: 600; border-bottom: 1px solid #f3f4f6;">₹' + subtotal + '</td>' +
    '</tr>' +
    '<tr>' +
    '<td style="text-align: right; padding: 14px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">GST (5%):</td>' +
    '<td style="text-align: right; padding: 14px 20px; color: #1f2937; font-size: 14px; font-weight: 600; border-bottom: 1px solid #f3f4f6;">₹' + gstDisplay + '</td>' +
    '</tr>' +
    '<tr>' +
    '<td style="text-align: right; padding: 14px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">Delivery:</td>' +
    '<td style="text-align: right; padding: 14px 20px; color: ' + (shipping > 0 ? '#1f2937' : '#10B981') + '; font-size: 14px; font-weight: 600; border-bottom: 1px solid #f3f4f6;">' + shippingDisplay + '</td>' +
    '</tr>' +
    '<tr style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border-top: 2px solid #D97706; border-radius: 0 0 8px 8px;">' +
    '<td style="text-align: right; padding: 18px 0; color: #1f2937; font-size: 15px; font-weight: 700;">Total Amount:</td>' +
    '<td style="text-align: right; padding: 18px 20px; color: #D97706; font-size: 26px; font-weight: 800;">₹' + total + '</td>' +
    '</tr>' +
    '</table>' +
    
    '<!-- CTA Button -->' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0 40px 0;">' +
    '<tr><td align="center">' +
    '<a href="' + frontendUrl + '/orders" style="display: inline-block; background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 15px; font-weight: 700; box-shadow: 0 4px 12px rgba(217, 119, 6, 0.3); transition: all 0.3s ease;">Check Order Status →</a>' +
    '</td></tr>' +
    '</table>' +
    
    '<!-- Divider -->' +
    '<hr style="border: none; border-top: 2px solid #f3f4f6; margin: 35px 0;">' +
    
    '<!-- Support Section -->' +
    '<h4 style="margin: 25px 0 12px 0; color: #1f2937; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">❓ Have Questions?</h4>' +
    '<p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">We\'re here to help! Reach out to our team:</p>' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 12px; background-color: #f9fafb; border-radius: 8px; padding: 20px; border-left: 4px solid #D97706;">' +
    '<tr>' +
    '<td style="width: 50%; padding-right: 12px;">' +
    '<p style="margin: 0 0 8px 0; color: #999999; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">✉ Email</p>' +
    '<p style="margin: 0; color: #D97706; font-size: 14px; font-weight: 600;"><a href="mailto:support@sawaikarcashew.com" style="color: #D97706; text-decoration: none;">support@sawaikarcashew.com</a></p>' +
    '</td>' +
    '<td style="width: 50%; text-align: right; padding-left: 12px;">' +
    '<p style="margin: 0 0 8px 0; color: #999999; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">☎ Phone</p>' +
    '<p style="margin: 0; color: #1f2937; font-size: 14px; font-weight: 600;">+91 98765 43210</p>' +
    '</td>' +
    '</tr>' +
    '</table>' +
    
    '</td>' +
    '</tr>' +
    
    '<!-- Footer -->' +
    '<tr>' +
    '<td style="background: linear-gradient(135deg, #92400E 0%, #78350F 100%); padding: 40px 30px; text-align: center; border-top: 1px solid rgba(217, 119, 6, 0.2);">' +
    '<p style="margin: 0 0 12px 0; color: #ffffff; font-size: 14px; line-height: 1.7; font-weight: 500;">Premium Cashews Coming Your Way!<br>Thank you for your order</p>' +
    '<p style="margin: 16px 0 0 0; color: rgba(255,255,255,0.75); font-size: 12px; letter-spacing: 0.5px;">&copy; ' + currentYear + ' Sawaikar\'s Cashew Store | Crafted with care in India</p>' +
    '</td>' +
    '</tr>' +
    
    '</table>' +
    '<!-- End Email Container -->' +
    
    '</td></tr>' +
    '</table>' +
    '<!-- End Wrapper -->' +
    
    '</body>' +
    '</html>';

  const plainTextEmail = 'Hi ' + userName + ',\n\nWe\'re preparing your order ' + order.orderId + '!\n\n' +
    'Your premium cashews are being carefully packed and will be shipped within 24 hours.\n\n' +
    'ITEMS IN YOUR ORDER\n' +
    '─────────────────────────────\n' +
    order.items.map(item => '• ' + item.name + ' (Qty: ' + item.quantity + ') - ₹' + formatPrice(item.price * item.quantity)).join('\n') + '\n\n' +
    'Subtotal: ₹' + subtotal + '\n' +
    'Delivery: ' + shippingDisplay + '\n' +
    'Total: ₹' + total + '\n\n' +
    'Track your order at: ' + frontendUrl + '/orders\n\nThank you!';

  const result = await sendEmail({
    from: '"Sawaikar\'s Cashew Store" <' + (process.env.EMAIL_USER || 'sawaikarcashewstore1980@gmail.com') + '>',
    to: order.userEmail,
    subject: 'Your Order is Being Processed! ↻ ' + order.orderId + ' - Sawaikar\'s Cashew Store',
    text: plainTextEmail,
    html: htmlEmail
  });
  
  if (result.success) {
    console.log('Processing email sent to ' + order.userEmail);
  }
  return result;
};

// Send out for delivery email
const sendOutForDeliveryEmail = async (order) => {
  const userName = order.userName || 'Valued Customer';
  const currentYear = new Date().getFullYear();
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const fromEmail = '"Sawaikar\'s Cashew Store" <' + (process.env.EMAIL_USER || 'sawaikarcashewstore1980@gmail.com') + '>';

  const htmlEmail = '<!DOCTYPE html>' +
    '<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>' +
    '<body style="margin: 0; padding: 0; background-color: #FFF7ED; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Arial, sans-serif;">' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #FFF7ED;">' +
    '<tr><td align="center" style="padding: 20px 10px;">' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); overflow: hidden;">' +
    
    '<!-- Header -->' +
    '<tr><td style="background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); padding: 35px 30px; text-align: center;">' +
    '<h1 style="margin: 15px 0 5px 0; color: #FFFFFF; font-size: 28px; font-weight: 800;">Out for Delivery!</h1>' +
    '<p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 14px;">Sawaikar\'s Premium Cashews</p>' +
    '</td></tr>' +
    
    '<!-- Content -->' +
    '<tr><td style="padding: 35px 30px;">' +
    '<p style="margin: 0 0 8px 0; color: #6B7280; font-size: 15px;">Hi <strong style="color: #2563EB;">' + userName + '</strong>,</p>' +
    '<h2 style="margin: 0 0 20px 0; color: #1F2937; font-size: 22px;">Your order is out for delivery!</h2>' +
    '<p style="margin: 0 0 25px 0; color: #6B7280; font-size: 15px; line-height: 1.6;">Get ready! Your premium cashews will arrive today. Please keep your phone handy.</p>' +
    
    '<!-- Order Info Box -->' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%); border-radius: 12px; border: 2px solid #3B82F6; margin-bottom: 25px;">' +
    '<tr><td style="padding: 20px;">' +
    '<p style="margin: 0 0 5px 0; color: #1E40AF; font-size: 12px; font-weight: 600; text-transform: uppercase;">Order ID</p>' +
    '<p style="margin: 0; color: #2563EB; font-size: 18px; font-weight: 800;">' + order.orderId + '</p>' +
    '</td></tr>' +
    '</table>' +
    
    '<!-- CTA Button -->' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">' +
    '<tr><td align="center">' +
    '<a href="' + frontendUrl + '/orders" style="display: inline-block; background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); color: #FFFFFF; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-size: 15px; font-weight: 700;">Track Delivery</a>' +
    '</td></tr>' +
    '</table>' +
    '</td></tr>' +
    
    '<!-- Footer -->' +
    '<tr><td style="background: linear-gradient(135deg, #1E40AF 0%, #1E3A8A 100%); padding: 25px; text-align: center;">' +
    '<p style="margin: 0; color: rgba(255,255,255,0.7); font-size: 12px;">' + currentYear + ' Sawaikar\'s Cashew Store</p>' +
    '</td></tr>' +
    '</table></td></tr></table></body></html>';

  const plainTextEmail = 'Hi ' + userName + ',\n\nYour order ' + order.orderId + ' is out for delivery!\n\n' +
    'Get ready - your premium cashews will arrive today!\n\nTrack at: ' + frontendUrl + '/orders\n\nThank you!';

  const result = await sendEmail({
    from: fromEmail,
    to: order.userEmail,
    subject: 'Out for Delivery! - ' + order.orderId,
    text: plainTextEmail,
    html: htmlEmail
  });
  
  if (result.success) {
    console.log('Out for delivery email sent to ' + order.userEmail);
  }
  return result;
};

// Send order delivered email
const sendOrderDeliveredEmail = async (order) => {
  const userName = order.userName || 'Valued Customer';
  const currentYear = new Date().getFullYear();
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  // Calculate price breakdown
  const baseAmount = order.totalAmount - (order.shippingFee || 0);
  const gstAmount = Math.round(baseAmount * 0.05); // 5% GST
  const subtotalBeforeTax = baseAmount - gstAmount;
  const shipping = (order.shippingFee || 0);
  const shippingDisplay = shipping > 0 ? '₹' + formatPrice(shipping) : 'FREE';
  const total = formatPrice(order.totalAmount);
  const subtotal = formatPrice(subtotalBeforeTax);
  const gstDisplay = formatPrice(gstAmount);

  const htmlEmail = '<!DOCTYPE html>' +
    '<html lang="en">' +
    '<head>' +
    '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<meta http-equiv="X-UA-Compatible" content="IE=edge">' +
    '<title>Order Delivered - Sawaikar\'s Cashew Store</title>' +
    '</head>' +
    '<body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif; color: #333333;">' +
    
    '<!-- Wrapper -->' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8f9fa;">' +
    '<tr><td align="center" style="padding: 40px 0;">' +
    
    '<!-- Main Email Container -->' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); overflow: hidden;">' +
    
    '<!-- Header -->' +
    '<tr>' +
    '<td style="background: linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%); padding: 50px 30px; text-align: center; position: relative; overflow: hidden;">' +
    '<div style="position: relative; z-index: 2;">' +
    '<h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 800; letter-spacing: -0.5px;">Sawaikar\'s Cashew Store</h1>' +
    '<p style="margin: 12px 0 0 0; color: rgba(255,255,255,0.95); font-size: 13px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase;">Premium Quality Cashews & Dry Fruits</p>' +
    '</div>' +
    '</td>' +
    '</tr>' +
    
    '<!-- Content -->' +
    '<tr>' +
    '<td style="padding: 45px 35px;">' +
    
    '<!-- Greeting -->' +
    '<p style="margin: 0 0 2px 0; color: #9ca3af; font-size: 14px;">Hello</p>' +
    '<p style="margin: 0 0 24px 0; color: #7C3AED; font-size: 16px; font-weight: 700;">' + userName + '</p>' +
    
    '<!-- Delivered Message -->' +
    '<h2 style="margin: 0 0 16px 0; color: #1F2937; font-size: 32px; font-weight: 800; line-height: 1.2;">Order Delivered! ✓</h2>' +
    '<p style="margin: 0 0 35px 0; color: #6b7280; font-size: 15px; line-height: 1.7;">We hope you\'re enjoying your premium cashews! Your satisfaction means the world to us. If there\'s anything else you\'d like, we\'re just a click away.</p>' +
    
    '<!-- Delivery Confirmation Box -->' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%); border-left: 5px solid #7C3AED; border-radius: 8px; margin-bottom: 30px; box-shadow: 0 2px 6px rgba(124, 58, 237, 0.1);">' +
    '<tr><td style="padding: 28px 24px;">' +
    '<p style="margin: 0 0 8px 0; color: #6D28D9; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">✓ Delivered Successfully</p>' +
    '<p style="margin: 0; color: #7C3AED; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">' + order.orderId + '</p>' +
    '</td></tr>' +
    '</table>' +
    
    '<!-- Order Details Section -->' +
    '<h3 style="margin: 35px 0 20px 0; color: #1F2937; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">⊟ What You Received</h3>' +
    
    '<!-- Items Table with Product Images -->' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff; margin-bottom: 25px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">' +
    '<thead>' +
    '<tr style="background: linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%); border-bottom: 2px solid #6D28D9;">' +
    '<th style="padding: 16px 12px; text-align: left; color: #ffffff; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Product Details</th>' +
    '<th style="padding: 16px 12px; text-align: right; color: #ffffff; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Total</th>' +
    '</tr>' +
    '</thead>' +
    '<tbody>' +
    generateItemsHtml(order.items) +
    '</tbody>' +
    '</table>' +
    
    '<!-- Order Summary -->' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0 35px 0; background-color: #ffffff;">' +
    '<tr>' +
    '<td style="text-align: right; padding: 14px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">Subtotal (Before Tax):</td>' +
    '<td style="text-align: right; padding: 14px 20px; color: #1f2937; font-size: 14px; font-weight: 600; border-bottom: 1px solid #f3f4f6;">₹' + subtotal + '</td>' +
    '</tr>' +
    '<tr>' +
    '<td style="text-align: right; padding: 14px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">GST (5%):</td>' +
    '<td style="text-align: right; padding: 14px 20px; color: #1f2937; font-size: 14px; font-weight: 600; border-bottom: 1px solid #f3f4f6;">₹' + gstDisplay + '</td>' +
    '</tr>' +
    '<tr>' +
    '<td style="text-align: right; padding: 14px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">Delivery:</td>' +
    '<td style="text-align: right; padding: 14px 20px; color: ' + (shipping > 0 ? '#1f2937' : '#10B981') + '; font-size: 14px; font-weight: 600; border-bottom: 1px solid #f3f4f6;">' + shippingDisplay + '</td>' +
    '</tr>' +
    '<tr style="background: linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%); border-top: 2px solid #7C3AED; border-radius: 0 0 8px 8px;">' +
    '<td style="text-align: right; padding: 18px 0; color: #1f2937; font-size: 15px; font-weight: 700;">Total Amount:</td>' +
    '<td style="text-align: right; padding: 18px 20px; color: #7C3AED; font-size: 26px; font-weight: 800;">₹' + total + '</td>' +
    '</tr>' +
    '</table>' +
    
    '<!-- Review/Feedback Section -->' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #FEF3C7; border-left: 5px solid #D97706; border-radius: 8px; padding: 28px 24px; margin: 35px 0 35px 0; box-shadow: 0 2px 6px rgba(217, 119, 6, 0.1);">' +
    '<tr><td>' +
    '<h3 style="margin: 0 0 8px 0; color: #92400E; font-size: 15px; font-weight: 700;">😊 Share Your Experience</h3>' +
    '<p style="margin: 0; color: #92400E; font-size: 14px; line-height: 1.7;">Your feedback helps us improve! Let us know how you liked the cashews and help other customers find premium products.</p>' +
    '</td></tr>' +
    '</table>' +
    
    '<!-- CTA Buttons -->' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0 40px 0;">' +
    '<tr>' +
    '<td align="center" style="padding-bottom: 12px;">' +
    '<a href="' + frontendUrl + '/feedback?orderId=' + order.orderId + '" style="display: inline-block; background: linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 15px; font-weight: 700; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3); transition: all 0.3s ease;">Leave Feedback</a>' +
    '</td>' +
    '</tr>' +
    '<tr><td align="center">' +
    '<a href="' + frontendUrl + '/products" style="display: inline-block; background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 15px; font-weight: 700; box-shadow: 0 4px 12px rgba(217, 119, 6, 0.3); transition: all 0.3s ease;">Shop Again</a>' +
    '</td></tr>' +
    '</table>' +
    
    '<!-- Divider -->' +
    '<hr style="border: none; border-top: 2px solid #f3f4f6; margin: 35px 0;">' +
    
    '<!-- Support Section -->' +
    '<h4 style="margin: 25px 0 12px 0; color: #1f2937; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">❓ Any Issues?</h4>' +
    '<p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">We\'re here to help with any concerns:</p>' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 12px; background-color: #f9fafb; border-radius: 8px; padding: 20px; border-left: 4px solid #7C3AED;">' +
    '<tr>' +
    '<td style="width: 50%; padding-right: 12px;">' +
    '<p style="margin: 0 0 8px 0; color: #999999; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">✉ Email</p>' +
    '<p style="margin: 0; color: #7C3AED; font-size: 14px; font-weight: 600;"><a href="mailto:support@sawaikarcashew.com" style="color: #7C3AED; text-decoration: none;">support@sawaikarcashew.com</a></p>' +
    '</td>' +
    '<td style="width: 50%; text-align: right; padding-left: 12px;">' +
    '<p style="margin: 0 0 8px 0; color: #999999; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">☎ Phone</p>' +
    '<p style="margin: 0; color: #1f2937; font-size: 14px; font-weight: 600;">+91 98765 43210</p>' +
    '</td>' +
    '</tr>' +
    '</table>' +
    
    '</td>' +
    '</tr>' +
    
    '<!-- Footer -->' +
    '<tr>' +
    '<td style="background: linear-gradient(135deg, #6D28D9 0%, #5B21B6 100%); padding: 40px 30px; text-align: center; border-top: 1px solid rgba(124, 58, 237, 0.2);">' +
    '<p style="margin: 0 0 12px 0; color: #ffffff; font-size: 14px; line-height: 1.7; font-weight: 500;">Thank you for being part of our family!<br>Enjoy your premium cashews</p>' +
    '<p style="margin: 16px 0 0 0; color: rgba(255,255,255,0.75); font-size: 12px; letter-spacing: 0.5px;">&copy; ' + currentYear + ' Sawaikar\'s Cashew Store | Crafted with care in India</p>' +
    '</td>' +
    '</tr>' +
    
    '</table>' +
    '<!-- End Email Container -->' +
    
    '</td></tr>' +
    '</table>' +
    '<!-- End Wrapper -->' +
    
    '</body>' +
    '</html>';

  const plainTextEmail = 'Hi ' + userName + ',\n\nYour order ' + order.orderId + ' has been delivered!\n\n' +
    'WHAT YOU RECEIVED\n' +
    '─────────────────────────────\n' +
    order.items.map(item => '• ' + item.name + ' (Qty: ' + item.quantity + ') - ₹' + formatPrice(item.price * item.quantity)).join('\n') + '\n\n' +
    'Subtotal: ₹' + subtotal + '\n' +
    'Delivery: ' + shippingDisplay + '\n' +
    'Total: ₹' + total + '\n\n' +
    'Please share your feedback to help us improve! Thank you for choosing Sawaikar\'s Cashew Store!\n\n' +
    'Shop again at: ' + frontendUrl + '/products';

  const result = await sendEmail({
    from: '"Sawaikar\'s Cashew Store" <' + (process.env.EMAIL_USER || 'sawaikarcashewstore1980@gmail.com') + '>',
    to: order.userEmail,
    subject: 'Order Delivered! ✓ ' + order.orderId + ' - Sawaikar\'s Cashew Store',
    text: plainTextEmail,
    html: htmlEmail
  });
  
  if (result.success) {
    console.log('Delivered email sent to ' + order.userEmail);
  }
  return result;
};

// Send order cancelled email
const sendOrderCancelledEmail = async (order) => {
  console.log('Sending order cancelled email to:', order.userEmail);
  
  const userName = order.userName || 'Valued Customer';
  const currentYear = new Date().getFullYear();
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  // Calculate price breakdown
  const baseAmount = order.totalAmount - (order.shippingFee || 0);
  const gstAmount = Math.round(baseAmount * 0.05); // 5% GST
  const subtotalBeforeTax = baseAmount - gstAmount;
  const shipping = (order.shippingFee || 0);
  const shippingDisplay = shipping > 0 ? '₹' + formatPrice(shipping) : 'FREE';
  const total = formatPrice(order.totalAmount);
  const subtotal = formatPrice(subtotalBeforeTax);
  const gstDisplay = formatPrice(gstAmount);
  
  const plainTextEmail = 'Hi ' + userName + ',\n\n' +
    'Oops! Your order has been cancelled.\n\n' +
    'ORDER DETAILS\n' +
    '───────────────────────────────\n' +
    'Order ID: ' + order.orderId + '\n\n' +
    'ITEMS CANCELLED\n' +
    '───────────────────────────────\n' +
    order.items.map(item => '• ' + item.name + ' (Qty: ' + item.quantity + ') - ₹' + formatPrice(item.price * item.quantity)).join('\n') + '\n\n' +
    'Subtotal: ₹' + subtotal + '\n' +
    'Delivery: ' + shippingDisplay + '\n' +
    'Total Amount: ₹' + total + '\n\n' +
    'REFUND INFORMATION\n' +
    '───────────────────────────────\n' +
    'If you paid for this order, your refund will be processed within 5-7 business days to your original payment method.\n\n' +
    'We\'d love to have you back! Use coupon COMEBACK10 for 10% off your next order.\n\n' +
    'Questions? Contact us anytime!\n\n' +
    'Best regards,\n' +
    'Sawaikar\'s Cashew Store Team';

  const htmlEmail = '<!DOCTYPE html>' +
    '<html lang="en">' +
    '<head>' +
    '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<meta http-equiv="X-UA-Compatible" content="IE=edge">' +
    '<title>Order Cancelled - Sawaikar\'s Cashew Store</title>' +
    '</head>' +
    '<body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif; color: #333333;">' +
    
    '<!-- Wrapper -->' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8f9fa;">' +
    '<tr><td align="center" style="padding: 40px 0;">' +
    
    '<!-- Main Email Container -->' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); overflow: hidden;">' +
    
    '<!-- Header -->' +
    '<tr>' +
    '<td style="background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%); padding: 50px 30px; text-align: center; position: relative; overflow: hidden;">' +
    '<div style="position: relative; z-index: 2;">' +
    '<h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 800; letter-spacing: -0.5px;">Sawaikar\'s Cashew Store</h1>' +
    '<p style="margin: 12px 0 0 0; color: rgba(255,255,255,0.95); font-size: 13px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase;">Premium Quality Cashews & Dry Fruits</p>' +
    '</div>' +
    '</td>' +
    '</tr>' +
    
    '<!-- Content -->' +
    '<tr>' +
    '<td style="padding: 45px 35px;">' +
    
    '<!-- Greeting -->' +
    '<p style="margin: 0 0 2px 0; color: #9ca3af; font-size: 14px;">Hello</p>' +
    '<p style="margin: 0 0 24px 0; color: #DC2626; font-size: 16px; font-weight: 700;">' + userName + '</p>' +
    
    '<!-- Cancelled Message -->' +
    '<h2 style="margin: 0 0 16px 0; color: #1F2937; font-size: 32px; font-weight: 800; line-height: 1.2;">Oops! Order Cancelled</h2>' +
    '<p style="margin: 0 0 35px 0; color: #6b7280; font-size: 15px; line-height: 1.7;">We received your cancellation request. Here\'s a summary of what won\'t be coming your way (yet!). We\'d love another chance to send you some delicious premium cashews!</p>' +
    
    '<!-- Cancellation Confirmation Box -->' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #FEE2E2 0%, #FED7D7 100%); border-left: 5px solid #DC2626; border-radius: 8px; margin-bottom: 30px; box-shadow: 0 2px 6px rgba(220, 38, 38, 0.1);">' +
    '<tr><td style="padding: 28px 24px;">' +
    '<p style="margin: 0 0 8px 0; color: #991B1B; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">⊠ Cancelled Order</p>' +
    '<p style="margin: 0; color: #DC2626; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">' + order.orderId + '</p>' +
    '</td></tr>' +
    '</table>' +
    
    '<!-- Order Details Section -->' +
    '<h3 style="margin: 35px 0 20px 0; color: #1F2937; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">⊟ Items Cancelled</h3>' +
    
    '<!-- Items Table with Product Images -->' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff; margin-bottom: 25px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">' +
    '<thead>' +
    '<tr style="background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%); border-bottom: 2px solid #B91C1C;">' +
    '<th style="padding: 16px 12px; text-align: left; color: #ffffff; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Product Details</th>' +
    '<th style="padding: 16px 12px; text-align: right; color: #ffffff; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Total</th>' +
    '</tr>' +
    '</thead>' +
    '<tbody>' +
    generateItemsHtml(order.items) +
    '</tbody>' +
    '</table>' +
    
    '<!-- Order Summary -->' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0 35px 0; background-color: #ffffff;">' +
    '<tr>' +
    '<td style="text-align: right; padding: 14px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">Subtotal (Before Tax):</td>' +
    '<td style="text-align: right; padding: 14px 20px; color: #1f2937; font-size: 14px; font-weight: 600; border-bottom: 1px solid #f3f4f6;">₹' + subtotal + '</td>' +
    '</tr>' +
    '<tr>' +
    '<td style="text-align: right; padding: 14px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">GST (5%):</td>' +
    '<td style="text-align: right; padding: 14px 20px; color: #1f2937; font-size: 14px; font-weight: 600; border-bottom: 1px solid #f3f4f6;">₹' + gstDisplay + '</td>' +
    '</tr>' +
    '<tr>' +
    '<td style="text-align: right; padding: 14px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">Delivery:</td>' +
    '<td style="text-align: right; padding: 14px 20px; color: ' + (shipping > 0 ? '#1f2937' : '#10B981') + '; font-size: 14px; font-weight: 600; border-bottom: 1px solid #f3f4f6;">' + shippingDisplay + '</td>' +
    '</tr>' +
    '<tr style="background: linear-gradient(135deg, #FEE2E2 0%, #FED7D7 100%); border-top: 2px solid #DC2626; border-radius: 0 0 8px 8px;">' +
    '<td style="text-align: right; padding: 18px 0; color: #1f2937; font-size: 15px; font-weight: 700;">Total Amount:</td>' +
    '<td style="text-align: right; padding: 18px 20px; color: #DC2626; font-size: 26px; font-weight: 800;">₹' + total + '</td>' +
    '</tr>' +
    '</table>' +
    
    '<!-- Refund Information -->' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #FEF3C7; border-left: 5px solid #D97706; border-radius: 8px; padding: 28px 24px; margin: 35px 0 35px 0; box-shadow: 0 2px 6px rgba(217, 119, 6, 0.1);">' +
    '<tr><td>' +
    '<h3 style="margin: 0 0 8px 0; color: #92400E; font-size: 15px; font-weight: 700;">💰 Refund Information</h3>' +
    '<p style="margin: 0; color: #92400E; font-size: 14px; line-height: 1.7;">If you paid for this order, your refund will be processed within 5-7 business days to your original payment method. No additional action needed from your side!</p>' +
    '</td></tr>' +
    '</table>' +
    
    '<!-- Win Back Section -->' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #DDD6FE 0%, #E9D5FF 100%); border-left: 5px solid #7C3AED; border-radius: 8px; padding: 28px 24px; margin: 35px 0 35px 0; box-shadow: 0 2px 6px rgba(124, 58, 237, 0.1);">' +
    '<tr><td>' +
    '<h3 style="margin: 0 0 8px 0; color: #6D28D9; font-size: 15px; font-weight: 700;">🎉 Come Back for 10% Off!</h3>' +
    '<p style="margin: 0; color: #6D28D9; font-size: 14px; line-height: 1.7;">We\'d love to have you back! Use coupon <strong>COMEBACK10</strong> at checkout for 10% off your next order. Whatever changed your mind, we hope to serve you better next time!</p>' +
    '</td></tr>' +
    '</table>' +
    
    '<!-- CTA Button -->' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0 40px 0;">' +
    '<tr><td align="center">' +
    '<a href="' + frontendUrl + '/products" style="display: inline-block; background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 15px; font-weight: 700; box-shadow: 0 4px 12px rgba(217, 119, 6, 0.3); transition: all 0.3s ease;">Browse Products & Save 10%</a>' +
    '</td></tr>' +
    '</table>' +
    
    '<!-- Divider -->' +
    '<hr style="border: none; border-top: 2px solid #f3f4f6; margin: 35px 0;">' +
    
    '<!-- Support Section -->' +
    '<h4 style="margin: 25px 0 12px 0; color: #1f2937; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">❓ Questions or Concerns?</h4>' +
    '<p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">Our team is ready to help anytime. Reach out if you need anything:</p>' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 12px; background-color: #f9fafb; border-radius: 8px; padding: 20px; border-left: 4px solid #DC2626;">' +
    '<tr>' +
    '<td style="width: 50%; padding-right: 12px;">' +
    '<p style="margin: 0 0 8px 0; color: #999999; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">✉ Email</p>' +
    '<p style="margin: 0; color: #DC2626; font-size: 14px; font-weight: 600;"><a href="mailto:support@sawaikarcashew.com" style="color: #DC2626; text-decoration: none;">support@sawaikarcashew.com</a></p>' +
    '</td>' +
    '<td style="width: 50%; text-align: right; padding-left: 12px;">' +
    '<p style="margin: 0 0 8px 0; color: #999999; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">☎ Phone</p>' +
    '<p style="margin: 0; color: #1f2937; font-size: 14px; font-weight: 600;">+91 98765 43210</p>' +
    '</td>' +
    '</tr>' +
    '</table>' +
    
    '</td>' +
    '</tr>' +
    
    '<!-- Footer -->' +
    '<tr>' +
    '<td style="background: linear-gradient(135deg, #B91C1C 0%, #991B1B 100%); padding: 40px 30px; text-align: center; border-top: 1px solid rgba(220, 38, 38, 0.2);">' +
    '<p style="margin: 0 0 12px 0; color: #ffffff; font-size: 14px; line-height: 1.7; font-weight: 500;">We miss you already!<br>Come back soon with COMEBACK10</p>' +
    '<p style="margin: 16px 0 0 0; color: rgba(255,255,255,0.75); font-size: 12px; letter-spacing: 0.5px;">&copy; ' + currentYear + ' Sawaikar\'s Cashew Store | Crafted with care in India</p>' +
    '</td>' +
    '</tr>' +
    
    '</table>' +
    '<!-- End Email Container -->' +
    
    '</td></tr>' +
    '</table>' +
    '<!-- End Wrapper -->' +
    
    '</body>' +
    '</html>';

  const result = await sendEmail({
    from: '"Sawaikar\'s Cashew Store" <' + (process.env.EMAIL_USER || 'sawaikarcashewstore1980@gmail.com') + '>',
    to: order.userEmail,
    subject: 'Oops! Order Cancelled ⊠ ' + order.orderId + ' - Sawaikar\'s Cashew Store',
    text: plainTextEmail,
    html: htmlEmail
  });
  
  if (result.success) {
    console.log('Cancelled email sent to ' + order.userEmail);
  }
  return result;
};

// Send low stock alert email (to admin)
const sendLowStockAlertEmail = async (products) => {
  const currentYear = new Date().getFullYear();
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
  const fromEmail = '"Sawaikar\'s Inventory Alert" <' + (process.env.EMAIL_USER || 'sawaikarcashewstore1980@gmail.com') + '>';
  
  const productRows = products.map(p => 
    '<tr><td style="padding: 12px; border-bottom: 1px solid #FEE2E2;">' + p.name + '</td>' +
    '<td style="padding: 12px; border-bottom: 1px solid #FEE2E2; text-align: center; color: ' + (p.stock <= 5 ? '#DC2626' : '#F59E0B') + '; font-weight: 700;">' + p.stock + '</td></tr>'
  ).join('');

  const htmlEmail = '<!DOCTYPE html>' +
    '<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>' +
    '<body style="margin: 0; padding: 0; background-color: #FEF2F2; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Arial, sans-serif;">' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #FEF2F2;">' +
    '<tr><td align="center" style="padding: 20px 10px;">' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden;">' +
    
    '<!-- Header -->' +
    '<tr><td style="background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%); padding: 30px; text-align: center;">' +
    '<h1 style="margin: 10px 0 0 0; color: #FFFFFF; font-size: 24px; font-weight: 800;">Low Stock Alert!</h1>' +
    '</td></tr>' +
    
    '<!-- Content -->' +
    '<tr><td style="padding: 30px;">' +
    '<p style="margin: 0 0 20px 0; color: #6B7280; font-size: 15px;">The following products need restocking:</p>' +
    
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border: 1px solid #FEE2E2;">' +
    '<tr style="background: #DC2626;"><th style="padding: 12px; text-align: left; color: white;">Product</th><th style="padding: 12px; text-align: center; color: white;">Stock</th></tr>' +
    productRows +
    '</table>' +
    '</td></tr>' +
    
    '<!-- Footer -->' +
    '<tr><td style="background: #FEE2E2; padding: 20px; text-align: center;">' +
    '<p style="margin: 0; color: #991B1B; font-size: 12px;">' + currentYear + ' Sawaikar\'s Cashew Store</p>' +
    '</td></tr>' +
    '</table></td></tr></table></body></html>';

  const result = await sendEmail({
    from: fromEmail,
    to: adminEmail,
    subject: 'Low Stock Alert - ' + products.length + ' Products Need Restocking',
    html: htmlEmail,
    text: 'Low stock alert: ' + products.map(p => p.name + ' (' + p.stock + ')').join(', ')
  });
  
  if (result.success) {
    console.log('Low stock alert sent to admin');
  }
  return result;
};

// In-Store Order Email - Combined Confirmation + Delivery (sent immediately after purchase)
const sendInStoreOrderEmail = async (order) => {
  const userName = order.userName || 'Valued Customer';
  const currentYear = new Date().getFullYear();
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  // Calculate price breakdown
  const baseAmount = order.totalAmount - (order.shippingFee || 0);
  const gstAmount = Math.round(baseAmount * 0.05); // 5% GST
  const subtotalBeforeTax = baseAmount - gstAmount;
  const shipping = (order.shippingFee || 0);
  const shippingDisplay = shipping > 0 ? '₹' + formatPrice(shipping) : 'FREE';
  const total = formatPrice(order.totalAmount);
  const subtotal = formatPrice(subtotalBeforeTax);
  const gstDisplay = formatPrice(gstAmount);
  
  const paymentStatusBadge = order.paymentStatus === 'completed' 
    ? '<span style="display: inline-block; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 8px 18px; border-radius: 6px; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);">✓ PAID</span>'
    : '<span style="display: inline-block; background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: white; padding: 8px 18px; border-radius: 6px; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; box-shadow: 0 2px 4px rgba(217, 119, 6, 0.3);">⏳ PENDING</span>';

  const htmlEmail = '<!DOCTYPE html>' +
    '<html lang="en">' +
    '<head>' +
    '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<meta http-equiv="X-UA-Compatible" content="IE=edge">' +
    '<title>Order Confirmed & Delivered - Sawaikar\'s Cashew Store</title>' +
    '</head>' +
    '<body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif; color: #333333;">' +
    
    '<!-- Wrapper -->' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8f9fa;">' +
    '<tr><td align="center" style="padding: 40px 0;">' +
    
    '<!-- Main Email Container -->' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); overflow: hidden;">' +
    
    '<!-- Header -->' +
    '<tr>' +
    '<td style="background: linear-gradient(135deg, #D97706 0%, #B45309 100%); padding: 50px 30px; text-align: center; position: relative; overflow: hidden;">' +
    '<div style="position: relative; z-index: 2;">' +
    '<h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 800; letter-spacing: -0.5px;">Sawaikar\'s Cashew Store</h1>' +
    '<p style="margin: 12px 0 0 0; color: rgba(255,255,255,0.95); font-size: 13px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase;">Premium Quality Cashews & Dry Fruits</p>' +
    '</div>' +
    '</td>' +
    '</tr>' +
    
    '<!-- Content -->' +
    '<tr>' +
    '<td style="padding: 45px 35px;">' +
    
    '<!-- Greeting -->' +
    '<p style="margin: 0 0 2px 0; color: #9ca3af; font-size: 14px;">Hello</p>' +
    '<p style="margin: 0 0 24px 0; color: #D97706; font-size: 16px; font-weight: 700;">' + userName + '</p>' +
    
    '<!-- Combined Status Message -->' +
    '<h2 style="margin: 0 0 8px 0; color: #1F2937; font-size: 32px; font-weight: 800; line-height: 1.2;">Order Confirmed & Delivered! ✓</h2>' +
    '<p style="margin: 0 0 35px 0; color: #6b7280; font-size: 15px; line-height: 1.7;">Your in-store order has been completed and you have received your premium cashews today! Thank you for shopping with us.</p>' +
    
    '<!-- Status Boxes - Side by Side -->' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 35px;">' +
    '<tr>' +
    '<td style="width: 48%; padding-right: 12px;">' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border-left: 5px solid #D97706; border-radius: 8px; box-shadow: 0 2px 6px rgba(217, 119, 6, 0.1);">' +
    '<tr><td style="padding: 20px;">' +
    '<p style="margin: 0 0 8px 0; color: #92400E; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">✓ Order Confirmed</p>' +
    '<p style="margin: 0; color: #D97706; font-size: 18px; font-weight: 800;">' + order.orderId + '</p>' +
    '</td></tr>' +
    '</table>' +
    '</td>' +
    '<td style="width: 48%; padding-left: 12px;">' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%); border-left: 5px solid #059669; border-radius: 8px; box-shadow: 0 2px 6px rgba(5, 150, 105, 0.1);">' +
    '<tr><td style="padding: 20px;">' +
    '<p style="margin: 0 0 8px 0; color: #047857; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">✓ Delivered Today</p>' +
    '<p style="margin: 0; color: #059669; font-size: 15px; font-weight: 700;">In-Store Pickup</p>' +
    '</td></tr>' +
    '</table>' +
    '</td>' +
    '</tr>' +
    '</table>' +
    
    '<!-- Payment Status -->' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 30px;">' +
    '<tr>' +
    '<td style="width: 50%;">' +
    '<p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase;">Payment Status</p>' +
    '<p style="margin: 0; ' + paymentStatusBadge + '</p>' +
    '</td>' +
    '<td style="width: 50%; text-align: right;">' +
    '<p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase;">Fulfillment</p>' +
    '<span style="display: inline-block; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 8px 18px; border-radius: 6px; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);">✓ COMPLETED</span>' +
    '</td>' +
    '</tr>' +
    '</table>' +
    
    '<!-- Order Details Section -->' +
    '<h3 style="margin: 35px 0 20px 0; color: #1F2937; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">⊟ Your Items</h3>' +
    
    '<!-- Items Table with Product Images -->' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff; margin-bottom: 25px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">' +
    '<thead>' +
    '<tr style="background: linear-gradient(135deg, #D97706 0%, #B45309 100%); border-bottom: 2px solid #B45309;">' +
    '<th style="padding: 16px 12px; text-align: left; color: #ffffff; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Product Details</th>' +
    '<th style="padding: 16px 12px; text-align: right; color: #ffffff; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Total</th>' +
    '</tr>' +
    '</thead>' +
    '<tbody>' +
    generateItemsHtml(order.items) +
    '</tbody>' +
    '</table>' +
    
    '<!-- Order Summary -->' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 30px 0 35px 0; background-color: #ffffff;">' +
    '<tr>' +
    '<td style="text-align: right; padding: 14px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">Subtotal (Before Tax):</td>' +
    '<td style="text-align: right; padding: 14px 20px; color: #1f2937; font-size: 14px; font-weight: 600; border-bottom: 1px solid #f3f4f6;">₹' + subtotal + '</td>' +
    '</tr>' +
    '<tr>' +
    '<td style="text-align: right; padding: 14px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">GST (5%):</td>' +
    '<td style="text-align: right; padding: 14px 20px; color: #1f2937; font-size: 14px; font-weight: 600; border-bottom: 1px solid #f3f4f6;">₹' + gstDisplay + '</td>' +
    '</tr>' +
    '<tr>' +
    '<td style="text-align: right; padding: 14px 0; color: #6b7280; font-size: 14px; border-bottom: 1px solid #f3f4f6;">Delivery:</td>' +
    '<td style="text-align: right; padding: 14px 20px; color: ' + (shipping > 0 ? '#1f2937' : '#10B981') + '; font-size: 14px; font-weight: 600; border-bottom: 1px solid #f3f4f6;">' + shippingDisplay + '</td>' +
    '</tr>' +
    '<tr style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border-top: 2px solid #D97706; border-radius: 0 0 8px 8px;">' +
    '<td style="text-align: right; padding: 18px 0; color: #1f2937; font-size: 15px; font-weight: 700;">Total Amount:</td>' +
    '<td style="text-align: right; padding: 18px 20px; color: #D97706; font-size: 26px; font-weight: 800;">₹' + total + '</td>' +
    '</tr>' +
    '</table>' +
    
    '<!-- In-Store Receipt Note -->' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: linear-gradient(135deg, #E0E7FF 0%, #DDD6FE 100%); border-left: 5px solid #7C3AED; border-radius: 8px; padding: 28px 24px; margin: 35px 0 35px 0; box-shadow: 0 2px 6px rgba(124, 58, 237, 0.1);">' +
    '<tr><td>' +
    '<h3 style="margin: 0 0 8px 0; color: #6D28D9; font-size: 15px; font-weight: 700;">📋 In-Store Transaction Complete</h3>' +
    '<p style="margin: 0; color: #6D28D9; font-size: 14px; line-height: 1.7;">Your order was completed and delivered at our store today. This email serves as your receipt. Keep it for your records.</p>' +
    '</td></tr>' +
    '</table>' +
    
    '<!-- Thank You Section -->' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #FEF3C7; border-radius: 8px; padding: 28px 24px; margin: 35px 0 35px 0; border-left: 5px solid #D97706;">' +
    '<tr><td>' +
    '<h3 style="margin: 0 0 8px 0; color: #92400E; font-size: 15px; font-weight: 700;">🙏 Thank You!</h3>' +
    '<p style="margin: 0; color: #92400E; font-size: 14px; line-height: 1.7;">We appreciate your business today. We hope you enjoy your premium cashews. Come back soon for more delicious products!</p>' +
    '</td></tr>' +
    '</table>' +
    
    '<!-- CTA Button -->' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 32px 0 40px 0;">' +
    '<tr><td align="center">' +
    '<a href="' + frontendUrl + '/products" style="display: inline-block; background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 15px; font-weight: 700; box-shadow: 0 4px 12px rgba(217, 119, 6, 0.3); transition: all 0.3s ease;">Shop More Products</a>' +
    '</td></tr>' +
    '</table>' +
    
    '<!-- Divider -->' +
    '<hr style="border: none; border-top: 2px solid #f3f4f6; margin: 35px 0;">' +
    
    '<!-- Support Section -->' +
    '<h4 style="margin: 25px 0 12px 0; color: #1f2937; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">❓ Need Help?</h4>' +
    '<p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">Visit us or contact our team:</p>' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 12px; background-color: #f9fafb; border-radius: 8px; padding: 20px; border-left: 4px solid #D97706;">' +
    '<tr>' +
    '<td style="width: 50%; padding-right: 12px;">' +
    '<p style="margin: 0 0 8px 0; color: #999999; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">✉ Email</p>' +
    '<p style="margin: 0; color: #D97706; font-size: 14px; font-weight: 600;"><a href="mailto:support@sawaikarcashew.com" style="color: #D97706; text-decoration: none;">support@sawaikarcashew.com</a></p>' +
    '</td>' +
    '<td style="width: 50%; text-align: right; padding-left: 12px;">' +
    '<p style="margin: 0 0 8px 0; color: #999999; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">☎ Phone</p>' +
    '<p style="margin: 0; color: #1f2937; font-size: 14px; font-weight: 600;">+91 98765 43210</p>' +
    '</td>' +
    '</tr>' +
    '</table>' +
    
    '</td>' +
    '</tr>' +
    
    '<!-- Footer -->' +
    '<tr>' +
    '<td style="background: linear-gradient(135deg, #92400E 0%, #78350F 100%); padding: 40px 30px; text-align: center; border-top: 1px solid rgba(217, 119, 6, 0.2);">' +
    '<p style="margin: 0 0 12px 0; color: #ffffff; font-size: 14px; line-height: 1.7; font-weight: 500;">Thank you for choosing Sawaikar\'s Cashew Store!<br>Taste the difference of premium quality</p>' +
    '<p style="margin: 16px 0 0 0; color: rgba(255,255,255,0.75); font-size: 12px; letter-spacing: 0.5px;">&copy; ' + currentYear + ' Sawaikar\'s Cashew Store | Crafted with care in India</p>' +
    '</td>' +
    '</tr>' +
    
    '</table>' +
    '<!-- End Email Container -->' +
    
    '</td></tr>' +
    '</table>' +
    '<!-- End Wrapper -->' +
    
    '</body>' +
    '</html>';

  const plainTextEmail = 'Hi ' + userName + ',\n\n' +
    'ORDER CONFIRMED & DELIVERED!\n' +
    '────────────────────────────────────\n\n' +
    'Your in-store order has been completed and delivered today.\n\n' +
    'ORDER ID: ' + order.orderId + '\n' +
    'FULFILLMENT: In-Store Pickup\n' +
    'Payment Status: ' + order.paymentStatus.toUpperCase() + '\n\n' +
    'ITEMS\n' +
    '────────────────────────────────────\n' +
    order.items.map(item => '• ' + item.name + ' (Qty: ' + item.quantity + ') - ₹' + formatPrice(item.price * item.quantity)).join('\n') + '\n\n' +
    'Subtotal: ₹' + subtotal + '\n' +
    'GST (5%): ₹' + gstDisplay + '\n' +
    'Delivery: ' + shippingDisplay + '\n' +
    '────────────────────────────────────\n' +
    'TOTAL: ₹' + total + '\n\n' +
    'Thank you for shopping at Sawaikar\'s Cashew Store!\n' +
    'This email serves as your receipt.\n\n' +
    'Support: support@sawaikarcashew.com | +91 98765 43210';

  const result = await sendEmail({
    from: '"Sawaikar\'s Cashew Store" <' + (process.env.EMAIL_USER || 'sawaikarcashewstore1980@gmail.com') + '>',
    to: order.userEmail,
    subject: 'Order Confirmed & Delivered! ✓ ' + order.orderId + ' - Sawaikar\'s Cashew Store',
    text: plainTextEmail,
    html: htmlEmail
  });
  
  if (result.success) {
    console.log('In-store combined email sent to ' + order.userEmail);
  }
  return result;
};

module.exports = { 
  sendOrderConfirmationEmail,
  sendOrderProcessingEmail,
  sendOrderShippedEmail,
  sendOutForDeliveryEmail,
  sendOrderDeliveredEmail,
  sendOrderCancelledEmail,
  sendInStoreOrderEmail,
  sendLowStockAlertEmail
};
