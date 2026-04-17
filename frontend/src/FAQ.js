import React, { useState } from "react";
import styled, { keyframes } from "styled-components";
import { FiSearch, FiChevronDown, FiChevronUp, FiPackage, FiCreditCard, FiShield, FiTruck, FiRotateCcw, FiHelpCircle, FiMessageCircle, FiMail, FiPhone, FiClock, FiCheckCircle, FiBookOpen } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

const FAQ = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedItems, setExpandedItems] = useState({});
  const [activeCategory, setActiveCategory] = useState("all");

  // Comprehensive FAQ data inspired by Amazon/Flipkart
  const faqCategories = [
    { id: "all", name: "All Topics", icon: FiHelpCircle, count: 28 },
    { id: "products", name: "Products & Quality", icon: FiPackage, count: 6 },
    { id: "orders", name: "Orders & Shipping", icon: FiTruck, count: 5 },
    { id: "payments", name: "Payments & Pricing", icon: FiCreditCard, count: 5 },
    { id: "returns", name: "Returns & Refunds", icon: FiRotateCcw, count: 5 },
    { id: "account", name: "Account & Security", icon: FiShield, count: 4 },
    { id: "delivery", name: "Delivery", icon: FiTruck, count: 3 }
  ];

  const faqs = [
    // Products & Quality FAQs
    {
      category: "products",
      question: "Are your cashews 100% natural and organic?",
      answer: `Yes! At Sawaikar's Cashew Store, we take pride in offering premium quality cashews that are:

• 100% Natural — No artificial preservatives, colors, or flavors
• Farm Fresh — Sourced directly from the finest cashew farms in Goa
• Hand-Selected — Each cashew is carefully inspected for quality
• FSSAI Certified — Meets all food safety standards

Our cashews are processed in our state-of-the-art facility maintaining the highest hygiene standards. We believe in delivering nature's goodness in its purest form.`
    },
    {
      category: "products",
      question: "What grades of cashews do you offer?",
      answer: `We offer a wide range of cashew grades to suit every preference and budget:

Premium Grades (Whole Cashews):
• W180 — King Size, largest whole cashews (180 kernels per pound)
• W210 — Jumbo, extra-large cashews (210 kernels per pound)
• W240 — Large, standard premium grade (240 kernels per pound)
• W320 — Medium, most popular grade (320 kernels per pound)
• W450 — Small, economical choice (450 kernels per pound)

Split & Broken Grades:
• Splits (S) — Half cashews, perfect for cooking
• Butts (B) — Cross-cut pieces, great for sweets
• Pieces (P) — Smaller pieces, ideal for garnishing

Each grade is priced according to size and quality. W180 is the most premium, while pieces offer excellent value for cooking purposes.`
    },
    {
      category: "products",
      question: "How should I store cashews to keep them fresh?",
      answer: `To maintain maximum freshness and crunch, follow these storage tips:

Short-term Storage (1-2 months):
• Store in an airtight container at room temperature
• Keep away from direct sunlight and heat
• Avoid humid areas like near the stove or sink

Long-term Storage (3-6 months):
• Refrigerate in a sealed container or zip-lock bag
• Keeps cashews fresh for up to 6 months
• Let them come to room temperature before eating

Extended Storage (6-12 months):
• Freeze in airtight freezer bags
• Can last up to 1 year when frozen properly
• Thaw at room temperature before consuming

Pro Tips:
✓ Never store near strong-smelling foods (cashews absorb odors)
✓ Check for any moisture before storing
✓ Buy vacuum-sealed packs for longer shelf life`
    },
    {
      category: "products",
      question: "What is the shelf life of your cashews?",
      answer: `Our cashews come with excellent shelf life when stored properly:

Unopened Packages:
• Room Temperature: 4-6 months from packaging date
• Refrigerated: 8-10 months
• Frozen: Up to 12 months

After Opening:
• Room Temperature: 2-4 weeks (in airtight container)
• Refrigerated: 2-3 months
• Frozen: 6 months

Signs of Spoilage to Watch For:
✗ Rancid or bitter smell
✗ Soft or rubbery texture
✗ Discoloration or dark spots
✗ Unusual taste

Each package includes a "Best Before" date printed on the label. For the freshest taste, we recommend consuming within 2 months of purchase.`
    },
    {
      category: "products",
      question: "Do you offer flavored or roasted cashews?",
      answer: `Yes! We have an exciting range of flavored cashews:

Classic Varieties:
• Plain Roasted — Lightly roasted for natural flavor
• Salted — Classic salted roasted cashews
• Pepper Cashews — Mild black pepper coating

Masala Range:
• Peri Peri — Spicy and tangy
• Cheese & Herbs — Cheesy goodness
• Tandoori — Indian spice blend
• Pudina (Mint) — Refreshing mint flavor

Sweet Varieties:
• Caramel Coated — Sweet caramelized coating
• Honey Glazed — Natural honey coating
• Chocolate Covered — Premium dark/milk chocolate

All flavored variants are made with natural spices and contain no MSG or artificial additives. Perfect for gifting or party snacks!`
    },
    {
      category: "products",
      question: "Are your products suitable for people with allergies?",
      answer: `Important Allergy Information:

Tree Nut Allergy Warning:
[!] Cashews are tree nuts. If you have a tree nut allergy, please DO NOT consume our products.

Our Facility:
• Processes ONLY cashews (no peanuts or other nuts)
• Dedicated equipment for cashew processing
• No cross-contamination with peanuts

Other Allergens:
• Gluten-Free — All our plain cashews are naturally gluten-free
• Dairy-Free — Plain and roasted variants contain no dairy
• Vegan-Friendly — Most products are 100% vegan

Note for Flavored Variants:
• Cheese flavor contains milk derivatives
• Chocolate-coated contains dairy
• Always check individual product labels

If you have severe allergies, please contact us before ordering. We're happy to provide detailed ingredient information for any product.`
    },

    // Orders & Shipping FAQs
    {
      category: "orders",
      question: "How do I place an order on Sawaikar's Cashew Store?",
      answer: `Placing an order is simple and takes just a few steps:

Step 1: Browse & Select
• Explore our product catalog
• Click on any product to view details
• Select quantity and variant (if applicable)

Step 2: Add to Cart
• Click "Add to Cart" button
• View your cart to review items
• Adjust quantities if needed

Step 3: Checkout
• Click "Proceed to Checkout"
• Enter shipping address
• Select delivery preference

Step 4: Payment
• Choose your payment method (UPI, Card, Net Banking, COD)
• Complete the payment
• Receive order confirmation via email & SMS

Need Help?
• Use our Live Chat for instant assistance
• Call us at 1800-123-4567 (Toll-Free)
• WhatsApp: +91 9876543210`
    },
    {
      category: "orders",
      question: "How can I track my order status?",
      answer: `Track your order easily using any of these methods:

Method 1: My Orders Page
• Log into your account
• Go to "My Orders" section
• Click on the order to see real-time tracking
• View detailed timeline with status updates

Method 2: Email/SMS Tracking
• Use the tracking link sent to your email
• Click directly to see current status
• Get notifications at each milestone

Method 3: Order ID Search
• Visit our homepage
• Enter your Order ID in the tracking box
• View instant status update

Order Status Stages:
• Order Placed - Your order is confirmed
• Confirmed - Payment verified
• Processing - Being packed at our facility
• Shipped - Handed to courier partner
• Out for Delivery - Arriving today
• Delivered - Successfully delivered

You'll receive SMS/Email updates at each stage automatically!`
    },
    {
      category: "orders",
      question: "Can I modify or cancel my order after placing it?",
      answer: `Here's everything about order modifications and cancellations:

Order Cancellation:

Within 1 Hour of Placing:
✓ Cancel directly from "My Orders"
✓ Full refund processed automatically
✓ No cancellation charges

After 1 Hour (Before Shipping):
• Contact customer support immediately
• Cancellation subject to processing status
• Full refund if cancelled successfully

After Shipping:
✗ Cancellation not possible
✓ You can refuse delivery
✓ Return after receiving (standard return policy applies)

Order Modification:

What Can Be Modified:
• Delivery address (before shipping)
• Contact number
• Delivery instructions

What Cannot Be Modified:
• Products in the order
• Quantity of items
• Payment method

To Modify: Contact us within 30 minutes of placing the order with your Order ID.`
    },
    {
      category: "orders",
      question: "What should I do if my order is delayed?",
      answer: `If your order hasn't arrived by the estimated delivery date, here's what to do:

Step 1: Check Tracking Status
• Go to "My Orders" and view tracking
• Check if there are any transit updates
• Note the last known location

Step 2: Common Delay Reasons
• Weather conditions affecting delivery
• Remote location requiring extra time
• Address verification pending
• Public holidays or festivals

Step 3: Contact Us If:
• No tracking update for 48+ hours
• Delivery delayed by 3+ days
• Tracking shows "Exception" status

How We'll Help:
• Priority resolution within 24 hours
• Re-ship if package is lost
• Full refund if undeliverable
• Compensation coupon for inconvenience

Contact Options:
• Live Chat (fastest response)
• Email: support@sawaikarcashews.com
• Phone: 1800-123-4567`
    },
    {
      category: "orders",
      question: "Do you offer bulk orders for businesses or events?",
      answer: `Yes! We offer special bulk ordering for:

Business Orders:
• Corporate gifting packages
• Office snack supplies
• Wholesale for retailers
• Hotel and restaurant supplies

Event Orders:
• Weddings and receptions
• Festival celebrations (Diwali, Christmas)
• Corporate events and conferences
• Party favors and return gifts

Bulk Order Benefits:
✓ Special discounted pricing (10-25% off)
✓ Customized packaging with your branding
✓ Dedicated account manager
✓ Flexible payment terms
✓ Priority delivery scheduling

Minimum Order: 10 kg or ₹5,000+

How to Place Bulk Order:
1. Email: bulk@sawaikarcashews.com
2. Call: +91 9876543210
3. Fill the "Bulk Order" form on our website

We typically respond within 24 hours with a customized quote. Gift packaging and personalized messages available!`
    },

    // Payments & Pricing FAQs
    {
      category: "payments",
      question: "What payment methods do you accept?",
      answer: `We offer multiple secure payment options for your convenience:

UPI Payments (Instant):
• Google Pay
• PhonePe
• Paytm
• BHIM UPI
• Any UPI app

Cards:
• Credit Cards (Visa, MasterCard, American Express, RuPay)
• Debit Cards (All major banks)
• EMI options available on orders above ₹3,000

Net Banking:
• All major Indian banks supported
• Direct bank transfer option

Digital Wallets:
• Paytm Wallet
• PhonePe Wallet
• Amazon Pay
• Mobikwik

Cash on Delivery (COD):
• Available on orders up to ₹10,000
• Pay in cash when you receive your order
• COD charges: ₹40 per order

All online payments are processed through Razorpay — India's most trusted payment gateway with bank-grade security.`
    },
    {
      category: "payments",
      question: "Is it safe to make payments on your website?",
      answer: `Absolutely! Your payment security is our top priority:

Security Measures We Use:

[SSL] SSL Encryption
• 256-bit SSL certificate
• All data transmitted is encrypted
• Look for the padlock icon in your browser

[PCI] PCI DSS Compliance
• We follow Payment Card Industry standards
• Card details are never stored on our servers
• Processed by certified payment gateway

[Secure] Razorpay Secure
• India's leading payment gateway
• Bank-grade security infrastructure
• Fraud detection and prevention

[2FA] Two-Factor Authentication
• OTP verification for all transactions
• Additional bank authentication
• Secure checkout process

What We NEVER Do:
✗ Store your complete card number
✗ Ask for CVV via email/phone
✗ Request OTP outside checkout

Safety Tips:
• Always check for "https://" in the URL
• Never share OTP with anyone
• Use trusted networks for transactions

If you notice any suspicious activity, contact us immediately!`
    },
    {
      category: "payments",
      question: "Why was my payment declined?",
      answer: `Payment can be declined for several reasons. Here's how to resolve:

Common Reasons & Solutions:

1. Insufficient Balance
   → Check your account balance and try again

2. Card Limit Exceeded
   → Contact your bank to increase limit or use another card

3. Incorrect Card Details
   → Double-check card number, expiry, and CVV

4. Bank Server Issues
   → Wait a few minutes and retry
   → Try a different payment method

5. International Card Restrictions
   → Enable international transactions with your bank

6. Expired Card
   → Use a valid, non-expired card

7. 3D Secure/OTP Issues
   → Ensure your phone number is updated with your bank
   → Check for OTP in your messages

What To Do:

If Payment Deducted But Order Failed:
• Don't worry! Amount will be auto-refunded
• Refund timeline: 5-7 business days
• Contact us with transaction ID if delayed

Still Having Issues?
📞 Call: 1800-123-4567
💬 Live Chat: Available 24/7
📧 Email: payments@sawaikarcashews.com`
    },
    {
      category: "payments",
      question: "Do you offer any discounts or coupon codes?",
      answer: `Yes! We love offering great deals to our customers:

Current Offers:

★ First Order Discount
• Use code: WELCOME10
• Get 10% off on your first order
• Maximum discount: ₹200

• Free Shipping
• Free delivery on orders above ₹499
• No coupon needed, automatically applied

💰 Bulk Discounts
• 5% off on orders above ₹2,000
• 10% off on orders above ₹5,000
• 15% off on orders above ₹10,000

Where to Find Coupons:
• Check our homepage banner
• Subscribe to newsletter for exclusive codes
• Follow us on Instagram & Facebook
• Check your email for personalized offers

Loyalty Rewards:
• Earn points on every purchase
• 1 point = ₹1 spent
• Redeem points for discounts
• Birthday month special bonus

How to Apply Coupon:
1. Add items to cart
2. Go to checkout
3. Enter code in "Apply Coupon" box
4. Click "Apply" to see discount

Note: Only one coupon can be used per order. Coupons cannot be combined with other offers unless specified.`
    },
    {
      category: "payments",
      question: "Do you charge GST? Will I get a GST invoice?",
      answer: `Yes, all our prices include GST, and we provide proper tax invoices:

GST Details:

Tax Breakdown:
• CGST: 9%
• SGST: 9%
• Total GST: 18% (included in displayed price)

Invoice Information:
Every order includes a detailed GST invoice showing:
✓ Our GSTIN number
✓ Product-wise tax breakup
✓ CGST & SGST amounts
✓ HSN codes for products
✓ Your billing details

Downloading Invoice:
1. Go to "My Orders"
2. Click on the specific order
3. Click "Download Invoice" button
4. PDF invoice will be downloaded

For Business Purchases:
• Add your GSTIN during checkout
• Invoice will include your business details
• Eligible for GST input credit

Our GSTIN: 22ABCDE1234F1Z5

Need a modified invoice or additional copies? Contact our support team with your Order ID, and we'll help you right away!`
    },

    // Returns & Refunds FAQs
    {
      category: "returns",
      question: "What is your return and refund policy?",
      answer: `We want you to be 100% satisfied with your purchase. Here's our return policy:

Return Window:
• 7 days from delivery date for quality issues
• Unopened sealed packages can be returned within 7 days

Eligible for Return:
✓ Damaged during transit
✓ Wrong product delivered
✓ Quality not as expected
✓ Expired products
✓ Missing items from order

Not Eligible for Return:
✗ Opened packages (unless quality issue)
✗ Products without original packaging
✗ Items purchased on sale/clearance
✗ Returns requested after 7 days

Refund Timeline:
• Inspection: 2-3 business days after pickup
• Refund Processing: 3-5 business days
• Bank Credit: 5-7 business days

Refund Method:
• Original payment method (Card/UPI/Net Banking)
• Bank account for COD orders
• Store credit (instant, optional)

Important: Please take photos/videos when opening packages. This helps us process claims faster if there are any issues.`
    },
    {
      category: "returns",
      question: "How do I initiate a return or exchange?",
      answer: `Initiating a return is quick and easy:

Step-by-Step Process:

Step 1: Request Return
• Go to "My Orders"
• Select the order you want to return
• Click "Return/Exchange" button
• Choose reason for return

Step 2: Upload Proof (if applicable)
• Take clear photos of the issue
• Upload images showing damage/defect
• Add description of the problem

Step 3: Schedule Pickup
• Choose convenient pickup date
• Select time slot (9 AM - 6 PM)
• Our partner will collect from your address

Step 4: Pack the Item
• Use original packaging if possible
• Secure the item to prevent damage
• Keep the pickup receipt

Step 5: Receive Refund
• Refund processed after inspection
• Amount credited within 5-7 days
• Email confirmation sent

For Exchange:
• Select "Exchange" instead of "Return"
• Choose replacement product
• Difference amount (if any) will be charged/refunded

Need Immediate Help?
• WhatsApp: +91 9876543210
📞 Call: 1800-123-4567`
    },
    {
      category: "returns",
      question: "How long does it take to receive my refund?",
      answer: `Refund timelines depend on your original payment method:

Refund Processing Timeline:

After Pickup:
• Item Inspection: 2-3 business days
• Refund Initiated: 1-2 business days after approval

Credit Timeline by Payment Method:

UPI Payments:
• Timeline: 24-48 hours
• Credited directly to linked bank account

Credit/Debit Cards:
• Timeline: 5-7 business days
• Depends on your bank's processing time

Net Banking:
• Timeline: 5-7 business days
• Direct credit to bank account

Wallets (Paytm/PhonePe):
• Timeline: 24-48 hours
• Credited to same wallet

Cash on Delivery:
• Timeline: 7-10 business days
• Requires bank account details
• NEFT/IMPS transfer

Store Credit (Fastest Option):
• Timeline: Instant
• Can be used immediately
• Valid for 1 year

Track Your Refund:
• Check "My Orders" for refund status
• Email notification when processed
• Transaction ID provided for reference`
    },
    {
      category: "returns",
      question: "What if I receive a damaged or wrong product?",
      answer: `We sincerely apologize if this happens! Here's how we'll make it right:

Immediate Steps:

1. Document the Issue
   • Take photos/video while opening the package
   • Capture the damage or wrong item clearly
   • Keep all packaging materials

2. Report Within 48 Hours
   • Go to "My Orders" → Select order
   • Click "Report Issue"
   • Upload photos and describe the problem

3. Our Response
   • We'll review within 24 hours
   • You'll receive confirmation email
   • Resolution provided within 48 hours

Resolution Options:

For Damaged Products:
🔄 Free replacement (same product)
💰 Full refund
• Store credit + 10% extra as apology

For Wrong Products:
🔄 Correct item shipped immediately
• Keep the wrong item (if low value)
💰 Full refund if preferred

No Return Pickup Required if:
• Product value is under ₹500
• Damage is clearly visible in photos
• We may ask to donate to reduce waste

Our Promise:
✓ No questions asked for genuine issues
✓ Free return shipping
✓ Compensation for inconvenience
✓ Priority customer support`
    },
    {
      category: "returns",
      question: "Can I return an opened package of cashews?",
      answer: `It depends on the reason for return:

Yes, We Accept Returns for Opened Packages If:

✓ Quality Issue
• Cashews are stale or rancid
• Different from product description
• Contamination or foreign particles
• Significantly smaller size than expected

✓ Health Concerns
• Allergic reaction (with medical proof)
• Moldy or spoiled product
• Off-putting smell or taste

How to Return Opened Package:
1. Keep at least 50% of the product
2. Take clear photos of the issue
3. Submit return request with images
4. Schedule pickup or drop-off

We Cannot Accept Returns If:

✗ You simply changed your mind
✗ Didn't like the taste (subjective)
✗ Package opened more than 7 days ago
✗ Less than 30% product remaining

Quality Guarantee:
We stand behind our products. If you genuinely feel the quality doesn't match our standards, contact us. We'll work out a fair solution — refund, replacement, or store credit.

Tip: When trying a new variant, consider ordering the smaller pack first to ensure it suits your preference!`
    },

    // Account & Security FAQs
    {
      category: "account",
      question: "How do I create an account on Sawaikar's Cashew Store?",
      answer: `Creating an account is quick and gives you access to exclusive features:

Option 1: Email Sign Up
1. Click "Sign Up" in the top menu
2. Enter your email address
3. Create a strong password
4. Fill in your name and phone number
5. Click "Create Account"
6. Verify your email via the link sent

Option 2: Social Login (Faster)
• Click "Continue with Google"
• Select your Google account
• Account created instantly!

Option 3: Phone Number
1. Enter your mobile number
2. Receive OTP via SMS
3. Enter OTP to verify
4. Add email and password
5. Done!

Account Benefits:
✓ Track all your orders
✓ Save multiple addresses
✓ Faster checkout
✓ Access to exclusive offers
✓ Wishlist to save favorites
✓ Order history and re-order easily
✓ Earn and redeem loyalty points
✓ Early access to new products

Guest Checkout Available:
Don't want to create an account? You can still checkout as a guest and track your order via email.`
    },
    {
      category: "account",
      question: "How do I reset my password if I forgot it?",
      answer: `Forgot your password? No worries! Here's how to reset it:

Step-by-Step Password Reset:

1. Go to Login Page
   • Click "Sign In" on the homepage
   • Click "Forgot Password?" link

2. Enter Your Email
   • Type your registered email address
   • Click "Send Reset Link"

3. Check Your Email
   • Look for email from Sawaikar's Cashew Store
   • Check spam/junk folder if not in inbox
   • Link valid for 30 minutes

4. Create New Password
   • Click the reset link in email
   • Enter your new password
   • Confirm the new password
   • Click "Reset Password"

5. Login
   • Return to login page
   • Use your new password
   • You're all set!

Password Requirements:
• Minimum 8 characters
• At least one uppercase letter
• At least one number
• At least one special character (!@#$%^&*)

Didn't Receive Email?
• Check spam/junk folder
• Verify the email address is correct
• Wait 5 minutes and try again
• Contact support if issue persists

Security Tip: Don't use the same password across multiple websites. Consider using a password manager!`
    },
    {
      category: "account",
      question: "How do I update my profile and address information?",
      answer: `Keep your information up-to-date for smooth deliveries:

Updating Profile Information:

1. Login to Your Account
2. Click on your name/profile icon
3. Select "My Profile" or "Account Settings"

You Can Update:
✓ Full Name
✓ Email Address (requires verification)
✓ Phone Number (requires OTP)
✓ Profile Picture
✓ Date of Birth
✓ Communication Preferences

Managing Addresses:

Add New Address:
1. Go to "My Addresses"
2. Click "Add New Address"
3. Fill in complete details:
   • Full name
   • Phone number
   • House/Flat number
   • Street/Area/Locality
   • City
   • State
   • PIN Code
   • Landmark (optional)
4. Choose address type (Home/Office/Other)
5. Save address

Edit Existing Address:
• Click "Edit" next to the address
• Make necessary changes
• Click "Update"

Set Default Address:
• Click "Make Default" on your preferred address
• This address will be pre-selected at checkout

Delete Address:
• Click "Delete" icon
• Confirm deletion

Note: During checkout, you can also add a new address or edit the selected one.`
    },
    {
      category: "account",
      question: "How is my personal information protected?",
      answer: `Your privacy and security are paramount to us:

Data Protection Measures:

[Encryption]
• All data encrypted with 256-bit SSL
• Secure HTTPS connection always
• Payment data never stored on our servers

[Secure Storage]
• Data stored on secure cloud servers
• Regular security audits
• Access limited to authorized personnel only

[Account Security]
• Two-factor authentication available
• Login alerts for new devices
• Session timeout for inactive accounts

What Information We Collect:
• Name and contact details
• Delivery addresses
• Order history
• Payment method (not full card details)
• Browsing preferences

How We Use Your Data:
✓ Process and deliver orders
✓ Send order updates
✓ Improve shopping experience
✓ Send offers (only if opted in)

What We Never Do:
✗ Sell your data to third parties
✗ Share details without consent
✗ Send spam emails
✗ Store complete card numbers

Your Rights:
• Request your data anytime
• Update or delete your information
• Opt-out of marketing emails
• Download your data

Read our full Privacy Policy for detailed information. Questions? Contact our Privacy Officer at privacy@sawaikarcashews.com`
    },

    // Delivery FAQs
    {
      category: "delivery",
      question: "What are your delivery charges and delivery time?",
      answer: `Here's everything about our delivery service:

Delivery Charges:

FREE Delivery:
• Orders above ₹499 — Free standard delivery
• Within city limits

Standard Delivery:
• Orders below ₹499 — ₹40 flat fee
• Delivered in 3-5 business days

Express Delivery:
• Same Day: ₹99 (order before 12 PM)
• Next Day: ₹79
• Available in select cities

Delivery Timeline by Location:

Metro Cities (Delhi, Mumbai, Bangalore, etc.):
• Standard: 2-3 business days
• Express: Same day / Next day

Tier 2 Cities:
• Standard: 3-5 business days
• Express: 2-3 business days

Other Areas:
• Standard: 5-7 business days
• Express: 4-5 business days

Remote/Rural Areas:
• Standard: 7-10 business days
• Additional charges may apply

Check Delivery Time:
Enter your PIN code on the product page to see exact delivery estimate for your location.

Note: Delivery times may vary during festivals, sales, or unforeseen circumstances.`
    },
    {
      category: "delivery",
      question: "Do you deliver to all locations in India?",
      answer: `We deliver to most locations across India!

Pan-India Delivery Coverage:

Covered Areas:
• All metro and major cities
• Tier 2 and Tier 3 cities
• Most district headquarters
• Semi-urban areas

Limited Coverage:
• Remote hill stations
• Certain northeastern regions
• Islands (Andaman, Lakshadweep)
• Areas with restricted access

How to Check Deliverability:

Method 1: PIN Code Check
• Enter your PIN code on any product page
• Instantly see if delivery is available
• View estimated delivery date

Method 2: At Checkout
• Enter address during checkout
• System will confirm serviceability
• Alternative options shown if not serviceable

For Unserviceable Areas:
• Self-pickup from nearest serviceable location
• Request delivery to friend/relative's address
• We're constantly expanding coverage

International Shipping:
• Currently NOT available
• Coming soon to UAE, USA, UK
• Subscribe to newsletter for updates

Problems with delivery to your area? Contact us — we might have a solution!`
    },
    {
      category: "delivery",
      question: "What if I'm not available to receive my order?",
      answer: `Don't worry! We have multiple solutions:

If You're Not Home:

Delivery Attempt:
• Delivery partner will call before arriving
• Can give alternate instructions by phone
• Leave with neighbor (if you authorize)

Rescheduling Options:
• Request delivery on different date
• Change time slot if available
• Redirect to different address

Safe Drop Feature:
• Pre-authorize safe delivery location
• Doorstep, security desk, etc.
• Photo proof of delivery provided

What Happens After Failed Attempt:

First Attempt Failed:
• SMS/Email notification sent
• Rescheduled for next day automatically

Second Attempt Failed:
• We'll call to confirm new time
• Option to pick up from courier hub

Third Attempt Failed:
• Order returned to warehouse
• Full refund processed
• No return shipping charged

Tips for Smooth Delivery:

✓ Provide accurate phone number
✓ Include landmark in address
✓ Share delivery instructions at checkout
✓ Keep phone ringer on during delivery window
✓ Inform security/watchman about expected delivery

Need Flexible Delivery?
Select preferred time slot during checkout (available in select areas).`
    }
  ];

  const toggleExpanded = (index) => {
    setExpandedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Wrapper>
      {/* Hero Section */}
      <HeroSection>
        <HeroContent>
          <HeroIconWrapper>
            <HeroIcon>
              <FiHelpCircle />
            </HeroIcon>
          </HeroIconWrapper>
          <h1>Help Center</h1>
          <p>Find answers to your questions and get help with your orders</p>

          {/* Stats Row */}
          <StatsRow>
            <StatCard>
              <StatIcon><FiBookOpen /></StatIcon>
              <StatInfo>
                <StatNumber>15+</StatNumber>
                <StatLabel>FAQs</StatLabel>
              </StatInfo>
            </StatCard>
            <StatDivider />
            <StatCard>
              <StatIcon><FiClock /></StatIcon>
              <StatInfo>
                <StatNumber>24/7</StatNumber>
                <StatLabel>Support</StatLabel>
              </StatInfo>
            </StatCard>
            <StatDivider />
            <StatCard>
              <StatIcon><FiCheckCircle /></StatIcon>
              <StatInfo>
                <StatNumber>95%</StatNumber>
                <StatLabel>Resolved</StatLabel>
              </StatInfo>
            </StatCard>
          </StatsRow>
        </HeroContent>
      </HeroSection>

      <ContentSection>
        {/* Search Bar */}
        <SearchSection>
          <SearchBar>
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search for help topics, orders, returns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchBar>
        </SearchSection>

        {/* Category Grid */}
        <CategorySection>
          <SectionTitle>
            <FiHelpCircle />
            <span>Browse by Category</span>
          </SectionTitle>
          <CategoryGrid>
            {faqCategories.map(category => {
              const IconComponent = category.icon;
              return (
                <CategoryCard
                  key={category.id}
                  $active={activeCategory === category.id}
                  onClick={() => setActiveCategory(category.id)}
                >
                  <CategoryIconWrapper $active={activeCategory === category.id}>
                    <IconComponent />
                  </CategoryIconWrapper>
                  <CategoryInfo>
                    <CategoryName>{category.name}</CategoryName>
                    <CategoryCount>{category.count} articles</CategoryCount>
                  </CategoryInfo>
                  {activeCategory === category.id && <ActiveIndicator />}
                </CategoryCard>
              );
            })}
          </CategoryGrid>
        </CategorySection>

        {/* FAQ Section */}
        <FAQSection>
          <FAQHeader>
            <SectionTitle>
              <FiMessageCircle />
              <span>
                {activeCategory === "all" ? "Frequently Asked Questions" :
                 faqCategories.find(cat => cat.id === activeCategory)?.name}
              </span>
            </SectionTitle>
            <ResultsCount>
              {filteredFaqs.length} {filteredFaqs.length === 1 ? 'result' : 'results'}
            </ResultsCount>
          </FAQHeader>

          <FAQList>
            {filteredFaqs.length === 0 ? (
              <NoResults>
                <NoResultsIcon>
                  <FiHelpCircle />
                </NoResultsIcon>
                <h4>No results found</h4>
                <p>Try adjusting your search terms or browse different categories</p>
              </NoResults>
            ) : (
              filteredFaqs.map((faq, index) => (
                <FAQItem key={index} $expanded={expandedItems[index]}>
                  <FAQQuestion onClick={() => toggleExpanded(index)}>
                    <QuestionText>{faq.question}</QuestionText>
                    <ChevronWrapper $expanded={expandedItems[index]}>
                      <FiChevronDown />
                    </ChevronWrapper>
                  </FAQQuestion>
                  <FAQAnswer $expanded={expandedItems[index]}>
                    <AnswerContent>
                      {faq.answer}
                    </AnswerContent>
                  </FAQAnswer>
                </FAQItem>
              ))
            )}
          </FAQList>
        </FAQSection>

        {/* Quick Help Section */}
        <QuickHelpSection>
          <QuickHelpTitle>
            <FiMessageCircle />
            <span>Quick Help Options</span>
          </QuickHelpTitle>
          <QuickHelpGrid>
            <QuickHelpCard $accent="green">
              <QuickHelpIcon $color="#25D366">
                <FaWhatsapp />
              </QuickHelpIcon>
              <QuickHelpInfo>
                <h4>WhatsApp Support</h4>
                <p>Chat with us instantly</p>
              </QuickHelpInfo>
              <QuickHelpButton
                $color="#25D366"
                onClick={() => window.open('https://wa.me/919876543210', '_blank')}
              >
                Chat Now
              </QuickHelpButton>
            </QuickHelpCard>

            <QuickHelpCard $accent="blue">
              <QuickHelpIcon $color="#3b82f6">
                <FiMessageCircle />
              </QuickHelpIcon>
              <QuickHelpInfo>
                <h4>Live Chat</h4>
                <p>Real-time assistance</p>
              </QuickHelpInfo>
              <QuickHelpButton
                $color="#3b82f6"
                onClick={() => {
                  if (window.Tawk_API) {
                    window.Tawk_API.toggle();
                  } else {
                    window.open('https://tawk.to/chat/68903f04a34d1b1925281fe8/1j1pncatu', '_blank');
                  }
                }}
              >
                Start Chat
              </QuickHelpButton>
            </QuickHelpCard>

            <QuickHelpCard $accent="orange">
              <QuickHelpIcon $color="#f97316">
                <FiMail />
              </QuickHelpIcon>
              <QuickHelpInfo>
                <h4>Email Support</h4>
                <p>Get detailed responses</p>
              </QuickHelpInfo>
              <QuickHelpButton
                $color="#f97316"
                onClick={() => window.location.href = 'mailto:sawaikarcashewstore1980@gmail.com'}
              >
                Send Email
              </QuickHelpButton>
            </QuickHelpCard>

            <QuickHelpCard $accent="purple">
              <QuickHelpIcon $color="#8b5cf6">
                <FiPhone />
              </QuickHelpIcon>
              <QuickHelpInfo>
                <h4>Call Us</h4>
                <p>Mon-Sat, 9AM-6PM</p>
              </QuickHelpInfo>
              <QuickHelpButton
                $color="#8b5cf6"
                onClick={() => window.location.href = 'tel:+919876543210'}
              >
                1800-123-4567
              </QuickHelpButton>
            </QuickHelpCard>
          </QuickHelpGrid>
        </QuickHelpSection>

        {/* Contact Card */}
        <ContactCard>
          <ContactContent>
            <ContactIcon>
              <FiHelpCircle />
            </ContactIcon>
            <ContactText>
              <h3>Still need help?</h3>
              <p>Can't find what you're looking for? Our customer support team is here to help you 24/7.</p>
            </ContactText>
          </ContactContent>
          <ContactActions>
            <PrimaryButton
              onClick={() => {
                if (window.Tawk_API) {
                  window.Tawk_API.toggle();
                } else {
                  window.open('https://tawk.to/chat/68903f04a34d1b1925281fe8/1j1pncatu', '_blank');
                }
              }}
            >
              <FiMessageCircle />
              Chat with us
            </PrimaryButton>
            <SecondaryButton onClick={() => window.location.href = 'mailto:sawaikarcashewstore1980@gmail.com'}>
              <FiMail />
              Email Support
            </SecondaryButton>
          </ContactActions>
        </ContactCard>
      </ContentSection>
    </Wrapper>
  );
};

// Animations
const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.9; }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
`;

const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
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
    font-size: 48px;
    font-weight: 700;
    margin-bottom: 12px;

    @media (max-width: 768px) {
      font-size: 36px;
    }
  }

  p {
    font-size: 18px;
    opacity: 0.9;
    margin-bottom: 32px;
  }
`;

const HeroIconWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
`;

const HeroIcon = styled.div`
  width: 90px;
  height: 90px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${pulse} 2s ease-in-out infinite;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);

  svg {
    font-size: 42px;
    color: white;
  }
`;

const StatsRow = styled.div`
  display: inline-flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 60px;
  padding: 20px 40px;
  gap: 32px;

  @media (max-width: 600px) {
    flex-direction: column;
    gap: 20px;
    padding: 24px 32px;
    border-radius: 20px;
  }
`;

const StatCard = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const StatIcon = styled.div`
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    font-size: 22px;
  }
`;

const StatInfo = styled.div`
  text-align: left;
`;

const StatNumber = styled.div`
  font-size: 24px;
  font-weight: 700;
`;

const StatLabel = styled.div`
  font-size: 13px;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StatDivider = styled.div`
  width: 1px;
  height: 40px;
  background: rgba(255, 255, 255, 0.3);

  @media (max-width: 600px) {
    width: 60px;
    height: 1px;
  }
`;

const ContentSection = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 40px 24px 80px;
`;

const SearchSection = styled.div`
  margin-bottom: 40px;
  margin-top: -60px;
  position: relative;
  z-index: 10;
`;

const SearchBar = styled.div`
  position: relative;
  max-width: 700px;
  margin: 0 auto;

  .search-icon {
    position: absolute;
    left: 24px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 22px;
    color: #8B4513;
  }

  input {
    width: 100%;
    padding: 20px 24px 20px 60px;
    border: none;
    border-radius: 60px;
    font-size: 16px;
    background: white;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;

    &:focus {
      outline: none;
      box-shadow: 0 10px 50px rgba(139, 69, 19, 0.2);
    }

    &::placeholder {
      color: #999;
    }
  }
`;

const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 22px;
  font-weight: 700;
  color: #2C2416;
  margin-bottom: 24px;

  svg {
    color: #8B4513;
    font-size: 24px;
  }
`;

const CategorySection = styled.div`
  margin-bottom: 48px;
`;

const CategoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
`;

const CategoryInfo = styled.div`
  flex: 1;
`;

const CategoryName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #2C2416;
  margin-bottom: 2px;
`;

const CategoryCount = styled.div`
  font-size: 13px;
  color: #5A4A3A;
  opacity: 0.85;
`;

const CategoryCard = styled.button`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: ${props => props.$active ? 'linear-gradient(135deg, #8B4513, #A0522D)' : 'white'};
  border: 2px solid ${props => props.$active ? 'transparent' : '#f0e6d3'};
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  text-align: left;
  box-shadow: ${props => props.$active ? '0 8px 25px rgba(139, 69, 19, 0.3)' : '0 2px 10px rgba(0, 0, 0, 0.04)'};
  color: ${props => props.$active ? 'white' : 'inherit'};

  &:hover {
    transform: translateY(-3px);
    box-shadow: ${props => props.$active ? '0 12px 30px rgba(139, 69, 19, 0.35)' : '0 8px 25px rgba(0, 0, 0, 0.08)'};
    border-color: ${props => props.$active ? 'transparent' : '#8B4513'};
  }

  ${CategoryName} {
    color: ${props => props.$active ? 'white' : '#2C2416'};
  }

  ${CategoryCount} {
    color: ${props => props.$active ? 'rgba(255, 255, 255, 0.9)' : '#5A4A3A'};
  }
`;

const ActiveIndicator = styled.div`
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

const CategoryIconWrapper = styled.div`
  width: 48px;
  height: 48px;
  background: ${props => props.$active ? 'rgba(255,255,255,0.2)' : '#fef7f0'};
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    font-size: 22px;
    color: ${props => props.$active ? 'white' : '#8B4513'};
  }
`;

const FAQSection = styled.div`
  margin-bottom: 48px;
`;

const FAQHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
`;

const ResultsCount = styled.span`
  background: linear-gradient(135deg, #fef7f0, #fdf0e6);
  color: #8B4513;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
`;

const FAQList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const FAQItem = styled.div`
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  border: 2px solid ${props => props.$expanded ? '#8B4513' : '#f0e6d3'};
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  }
`;

const FAQQuestion = styled.button`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: background 0.3s ease;

  &:hover {
    background: #faf9f6;
  }
`;

const QuestionText = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: #2C2416;
  flex: 1;
  padding-right: 16px;
`;

const ChevronWrapper = styled.div`
  width: 36px;
  height: 36px;
  background: ${props => props.$expanded ? 'linear-gradient(135deg, #8B4513, #A0522D)' : '#f5f5f5'};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  flex-shrink: 0;

  svg {
    font-size: 20px;
    color: ${props => props.$expanded ? 'white' : '#666'};
    transform: ${props => props.$expanded ? 'rotate(180deg)' : 'rotate(0)'};
    transition: transform 0.3s ease;
  }
`;

const FAQAnswer = styled.div`
  max-height: ${props => props.$expanded ? '500px' : '0'};
  overflow: hidden;
  transition: max-height 0.4s ease;
`;

const AnswerContent = styled.div`
  padding: 0 24px 24px;
  color: #2C2416;
  font-size: 15px;
  line-height: 1.8;
  border-top: 1px solid #f0e6d3;
  padding-top: 20px;
  white-space: pre-line;

  /* Highlight key information */
  strong, b {
    color: #1a1410;
    font-weight: 600;
  }

  /* Better list styling */
  ul, ol {
    color: #2C2416;
  }

  li {
    color: #2C2416;
    margin-bottom: 0.5rem;
  }
`;

const NoResults = styled.div`
  text-align: center;
  padding: 60px 24px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);

  h4 {
    font-size: 24px;
    color: #2C2416;
    margin-bottom: 12px;
  }

  p {
    font-size: 16px;
    color: #5A4A3A;
  }
`;

const NoResultsIcon = styled.div`
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #f5f5f5, #eee);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;

  svg {
    font-size: 36px;
    color: #ccc;
  }
`;

const QuickHelpSection = styled.div`
  margin-bottom: 48px;
`;

const QuickHelpTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 22px;
  font-weight: 700;
  color: #2C2416;
  margin-bottom: 24px;

  svg {
    color: #8B4513;
    font-size: 24px;
  }
`;

const QuickHelpGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
`;

const QuickHelpCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  border: 2px solid #f0e6d3;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  }
`;

const QuickHelpIcon = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 16px;
  background: ${props => props.$color}15;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${float} 3s ease-in-out infinite;

  svg {
    font-size: 28px;
    color: ${props => props.$color};
  }
`;

const QuickHelpInfo = styled.div`
  h4 {
    font-size: 18px;
    font-weight: 600;
    color: #2C2416;
    margin-bottom: 4px;
  }

  p {
    font-size: 14px;
    color: #5A4A3A;
  }
`;

const QuickHelpButton = styled.button`
  width: 100%;
  padding: 12px 24px;
  background: ${props => props.$color};
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.02);
    box-shadow: 0 4px 15px ${props => props.$color}40;
  }
`;

const ContactCard = styled.div`
  background: linear-gradient(135deg, #8B4513 0%, #A0522D 50%, #D2691E 100%);
  border-radius: 24px;
  padding: 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 32px;
  flex-wrap: wrap;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  }
`;

const ContactContent = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  position: relative;
  z-index: 1;

  @media (max-width: 600px) {
    flex-direction: column;
    text-align: center;
  }
`;

const ContactIcon = styled.div`
  width: 70px;
  height: 70px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    font-size: 32px;
    color: white;
  }
`;

const ContactText = styled.div`
  color: white;

  h3 {
    font-size: 26px;
    font-weight: 700;
    margin-bottom: 8px;
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  p {
    font-size: 16px;
    opacity: 0.95;
    max-width: 400px;
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
`;

const ContactActions = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;

  @media (max-width: 600px) {
    width: 100%;
    flex-direction: column;
  }
`;

const PrimaryButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  color: #8B4513;
  border: none;
  padding: 14px 28px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  }

  svg {
    font-size: 18px;
  }
`;

const SecondaryButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.5);
  padding: 14px 28px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: white;
  }

  svg {
    font-size: 18px;
  }
`;

export default FAQ;
