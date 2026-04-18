/**
 * FAQ Knowledge Base for Sawaikar's Cashew Store
 * Contains common questions and answers to be indexed
 */

const faqData = [
  // Shipping & Delivery
  {
    id: 'faq-shipping-cost',
    question: 'How much does shipping cost?',
    answer:
      'We offer FREE SHIPPING on all orders above ₹999. For orders below ₹999, shipping charges are ₹50. Shipping charges are calculated at checkout.',
    category: 'Shipping & Delivery',
  },
  {
    id: 'faq-delivery-time',
    question: 'How long does delivery take?',
    answer:
      'Standard delivery takes 3-5 business days for metro cities (Delhi, Mumbai, Bangalore, Hyderabad, etc.) and 5-7 business days for other locations. Express delivery available at checkout for additional fee, delivery within 1-2 business days.',
    category: 'Shipping & Delivery',
  },
  {
    id: 'faq-track-order',
    question: 'How do I track my order?',
    answer:
      'You can track your order in real-time from your account dashboard under "My Orders". You will also receive SMS and email notifications at each stage: Order Placed → Confirmed → Processing → Shipped → Out for Delivery → Delivered.',
    category: 'Shipping & Delivery',
  },
  {
    id: 'faq-cod-available',
    question: 'Is Cash on Delivery available?',
    answer:
      'Yes, Cash on Delivery (COD) is available for orders up to ₹10,000. COD orders take slightly longer to process (24-48 hours) for verification before shipment.',
    category: 'Payment',
  },

  // Returns & Refunds
  {
    id: 'faq-return-policy',
    question: 'What is your return policy?',
    answer:
      'We accept returns within 7 days of delivery. The product must be unopened, in original sealed packaging, and in unused condition. Once we receive and inspect the returned item, refunds are processed within 5-7 business days. Damaged or tampered items cannot be returned.',
    category: 'Returns & Refunds',
  },
  {
    id: 'faq-damaged-product',
    question: 'What if my product arrives damaged?',
    answer:
      'If your product arrives damaged, please contact us within 24 hours with photos of the damage and packaging. We will arrange a replacement immediately at no additional cost. Please preserve the original packaging and damaged product for our inspection.',
    category: 'Returns & Refunds',
  },
  {
    id: 'faq-refund-time',
    question: 'How long does refund processing take?',
    answer:
      'Refunds are processed within 5-7 business days after we receive and verify the returned product. The amount will be credited back to your original payment method. Bank processing may take an additional 2-3 business days.',
    category: 'Returns & Refunds',
  },
  {
    id: 'faq-exchange',
    question: 'Do you offer product exchanges?',
    answer:
      'Yes, we offer free exchanges for defective products within 7 days of delivery. For damaged or unsatisfactory products, we will ship a replacement immediately upon receiving the faulty item back.',
    category: 'Returns & Refunds',
  },

  // Payment Methods
  {
    id: 'faq-payment-methods',
    question: 'What payment methods do you accept?',
    answer:
      'We accept multiple payment methods: UPI (Google Pay, PhonePe, Paytm, etc.), Credit Cards, Debit Cards, Net Banking, and Cash on Delivery (COD). All transactions are 100% secure and encrypted.',
    category: 'Payment',
  },
  {
    id: 'faq-secure-payment',
    question: 'Is my payment information secure?',
    answer:
      'Yes, all payments are processed through Razorpay, a PCI-DSS certified payment gateway. Your payment information is encrypted and never stored on our servers. we use industry-standard security protocols.',
    category: 'Payment',
  },
  {
    id: 'faq-payment-failed',
    question: 'What if my payment fails?',
    answer:
      'If your payment fails, your order will not be placed and you will not be charged. You can retry payment immediately. If the issue persists, please contact your bank or try a different payment method.',
    category: 'Payment',
  },

  // Products & Quality
  {
    id: 'faq-cashew-grades',
    question: 'What do cashew grades like W180, W240, W320 mean?',
    answer:
      'These refer to the number of cashews per pound. W180 = 180 cashews per pound (largest, premium), W240 = 240 per pound (large, popular), W320 = 320 per pound (medium). All are 100% whole, organic cashews from Goa.',
    category: 'Products',
  },
  {
    id: 'faq-organic-certified',
    question: 'Are your products organic and certified?',
    answer:
      'Yes, all Sawaikar cashews are 100% organic, sourced directly from family-owned orchards in Goa with 38+ years of tradition. Products are certified organic and undergo rigorous quality checks before packaging.',
    category: 'Products',
  },
  {
    id: 'faq-freshnessCounter',
    question: 'How fresh are the products?',
    answer:
      'Our products are roasted and packaged fresh every week. Multiple quality checks ensure premium freshness. Most products have a shelf life of 6-12 months in original sealed packaging. We guarantee 100% freshness or money back!',
    category: 'Products',
  },
  {
    id: 'faq-nutrition-info',
    question: 'What is the nutritional information?',
    answer:
      'Our Premium Cashews are packed with nutrients: 150 calories, 12g fat, 5g protein, 9g carbs per ounce. Rich in magnesium, copper, and antioxidants. Excellent source of healthy monounsaturated fats. Visit our product pages for detailed nutrition labels.',
    category: 'Products',
  },
  {
    id: 'faq-product-variants',
    question: 'What product variants do you have?',
    answer:
      'We offer: Premium Raw Cashews (W240, W320), Roasted & Salted, Honey Roasted, Masala Roasted, Pepper Roasted, Cashew Butter, Dry Fruits (Almonds, Pistachios, Dates, Figs), Trail Mix, Snacks, Premium Gift Hampers, and Bundles.',
    category: 'Products',
  },

  // Storage & Usage
  {
    id: 'faq-storage',
    question: 'How should I store cashews?',
    answer:
      'Store in an airtight container in a cool, dry place away from direct sunlight. Refrigerator storage extends freshness up to 12 months. Freezer storage can extend to 18+ months. Once opened, consume within 2-3 weeks for best quality.',
    category: 'Usage & Storage',
  },
  {
    id: 'faq-recipe-ideas',
    question: 'What can I make with cashews?',
    answer:
      'Countless options! Snacking, Cashew Butter (blend 2 cups for creamy butter), Curries (Cashew sauce base), Desserts (brownies, energy balls), Trail Mix, Granola, and Smoothies. Check our Blog section for detailed recipes.',
    category: 'Usage & Storage',
  },
  {
    id: 'faq-alergy-info',
    question: 'Are there any allergen warnings?',
    answer:
      'All cashew products contain tree nuts. Products are processed in facilities that handle other nuts, sesame, and dried fruits. Always check individual product labels for allergen information. Not suitable for people with tree nut allergies.',
    category: 'Products',
  },

  // Loyalty Program
  {
    id: 'faq-loyalty-points',
    question: 'How does the Loyalty Program work?',
    answer:
      'Every purchase earns loyalty points: ₹1 spent = 1 point. Earn Bronze (0-50 pts), Silver (50-200 pts), Gold (200-500 pts), or Platinum (500+ pts) status. Higher status gives better discounts and exclusive offers. Redeem points for discounts on future purchases.',
    category: 'Loyalty & Rewards',
  },
  {
    id: 'faq-referral-rewards',
    question: 'Do you have a referral program?',
    answer:
      'Yes! Refer a friend and both get ₹100 credit when they make their first purchase using your referral code. Earn unlimited referral bonuses! Check your dashboard for your unique referral code.',
    category: 'Loyalty & Rewards',
  },
  {
    id: 'faq-birthday-offer',
    question: 'Is there a birthday discount?',
    answer:
      'Yes! Gold and Platinum members get special birthday discounts (15-20% OFF) valid for 1 month around your birthday. Register your birthday in your profile to activate.',
    category: 'Loyalty & Rewards',
  },

  // Contact & Support
  {
    id: 'faq-contact-support',
    question: 'How do I contact customer support?',
    answer:
      'Contact us via: Email: support@sawaikarcashews.com | Phone: +91-8967-234-567 | WhatsApp: +91-9876-543-210 | Chat: Use the AI chatbot or request connection to human support. Response time: within 24 hours.',
    category: 'Support',
  },
  {
    id: 'faq-bulk-orders',
    question: 'Can I place bulk or corporate orders?',
    answer:
      'Yes! We accept bulk orders for corporate gifts, events, restaurants, and wholesalers. Special bulk pricing available. Contact our corporate sales team: corporate@sawaikarcashews.com or +91-8967-234-567',
    category: 'Support',
  },
  {
    id: 'faq-subscription',
    question: 'Do you offer subscription or recurring orders?',
    answer:
      'Not yet, but you can set custom reminders for recurring purchases. Our Subscribe & Earn program coming soon - register your interest in your dashboard to be notified.',
    category: 'Orders',
  },

  // Bundles & Offers
  {
    id: 'faq-bundle-benefits',
    question: 'What are the benefits of buying bundles?',
    answer:
      'Bundles give you handpicked combinations with exclusive discounts (up to 21% OFF compared to buying individually). Perfect for gifting or variety. Premium Gift Hampers include elegant packaging and free personalized messages.',
    category: 'Offers',
  },
  {
    id: 'faq-seasonal-offers',
    question: 'When do you have sales and promotions?',
    answer:
      'We run promotions regularly: Diwali (Oct-Nov), Christmas (Dec), Holi (Mar), Summer (Apr-May), Monsoon (Jun-Aug). Subscribe to newsletter to get exclusive early access to sales and special offers.',
    category: 'Offers',
  },
  {
    id: 'faq-coupon-codes',
    question: 'How do I use coupon codes?',
    answer:
      'Enter the coupon code in the "Promo Code" field during checkout before payment. Discounts will be applied to your total. Some codes have minimum purchase requirements. Check the code details for terms and conditions.',
    category: 'Offers',
  },
];

module.exports = faqData;
