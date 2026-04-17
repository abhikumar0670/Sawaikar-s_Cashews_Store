import React, { useEffect } from 'react';
import styled from 'styled-components';

const Terms = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <Wrapper>
      <Container>
        <PageHeader>
          <h1>Terms & Conditions</h1>
          <p className="last-updated">Last Updated: March 2026</p>
        </PageHeader>

        <Content>
          <Section>
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using the Sawaikar's Cashew Store website and services, you agree to be bound by 
              these Terms & Conditions. If you do not agree to any part of these terms, you are not authorized to 
              use our services. We reserve the right to modify these terms at any time without notice.
            </p>
          </Section>

          <Section>
            <h2>2. Use of Services</h2>
            <h3>2.1 Age Requirement</h3>
            <p>You must be at least 18 years old to use our services. By using our website, you represent and warrant that you meet this requirement.</p>

            <h3>2.2 Permitted Use</h3>
            <p>You agree to use our website only for lawful purposes and in ways that do not infringe the rights of others or restrict their use and enjoyment of our website.</p>

            <h3>2.3 Prohibited Conduct</h3>
            <ul>
              <li>Harassing, threatening, or abusive language</li>
              <li>Uploading malware or harmful content</li>
              <li>Attempting to gain unauthorized access</li>
              <li>Interfering with website functionality</li>
              <li>Copying or replicating intellectual property</li>
              <li>Reselling our products without authorization</li>
            </ul>
          </Section>

          <Section>
            <h2>3. Product Information</h2>
            <h3>3.1 Accuracy</h3>
            <p>
              We strive to provide accurate product descriptions, images, and pricing. However, we do not warrant 
              that product descriptions, pricing, or other content on our website is accurate, complete, or error-free.
            </p>

            <h3>3.2 Availability</h3>
            <p>
              All products are subject to availability. We reserve the right to refuse any order or limit quantities 
              without explanation. Prices are subject to change without notice.
            </p>

            <h3>3.3 Product Quality</h3>
            <p>
              We guarantee that all our cashews are premium quality, ethically sourced, and processed under strict 
              quality standards. Our cashews are 100% natural with no artificial additives.
            </p>
          </Section>

          <Section>
            <h2>4. Ordering and Payment</h2>
            <h3>4.1 Order Placement</h3>
            <p>
              By placing an order, you offer to purchase our products at the stated price. We will confirm your order 
              via email. Your purchase is subject to our acceptance of your order.
            </p>

            <h3>4.2 Payment</h3>
            <ul>
              <li>We accept credit cards, debit cards, and digital payment methods</li>
              <li>Payment processing is handled by secure third-party providers</li>
              <li>We will not be responsible for any issues related to payment processing failures</li>
              <li>You must provide accurate billing information</li>
            </ul>

            <h3>4.3 Pricing</h3>
            <p>
              All prices are in Indian Rupees (₹) and include applicable GST. Shipping charges will be calculated 
              separately and displayed before checkout.
            </p>
          </Section>

          <Section>
            <h2>5. Shipping and Delivery</h2>
            <h3>5.1 Shipping Methods</h3>
            <ul>
              <li>Standard Shipping: 5-7 business days across India</li>
              <li>Express Shipping: 2-3 business days (additional charges apply)</li>
              <li>Free shipping on orders above ₹499</li>
            </ul>

            <h3>5.2 Delivery Risk</h3>
            <p>
              Risk of loss or damage to products passes to you when the carrier receives the package. We are not 
              responsible for damages caused by the shipping carrier or external factors.
            </p>

            <h3>5.3 Tracking</h3>
            <p>You will receive tracking information via email once your order is dispatched.</p>
          </Section>

          <Section>
            <h2>6. Returns and Refunds</h2>
            <h3>6.1 Return Policy</h3>
            <ul>
              <li>Returns accepted within 7 days of delivery</li>
              <li>Only sealed products are eligible for return</li>
              <li>Products must be in original condition and packaging</li>
              <li>Return shipping is the customer's responsibility (unless item is defective)</li>
            </ul>

            <h3>6.2 Refund Process</h3>
            <ul>
              <li>Upon receipt and inspection of returned item, refund will be approved</li>
              <li>Refunds are processed within 5-7 business days</li>
              <li>Refunds will be credited to the original payment method</li>
              <li>No refunds for items opened or partially consumed</li>
            </ul>

            <h3>6.3 Non-Returnable Items</h3>
            <p>Custom orders, bulk purchases, and items purchased during clearance sales are non-returnable.</p>
          </Section>

          <Section>
            <h2>7. Warranties and Disclaimers</h2>
            <h3>7.1 Product Warranty</h3>
            <p>
              All products come with a guarantee of quality. If you receive a defective product, we will replace it 
              or provide a full refund.
            </p>

            <h3>7.2 Disclaimer of Liability</h3>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT 
              NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.
            </p>

            <h3>7.3 Limitation of Liability</h3>
            <p>
              IN NO EVENT SHALL SAWAIKAR'S CASHEW STORE BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR 
              CONSEQUENTIAL DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF OUR WEBSITE OR PRODUCTS.
            </p>
          </Section>

          <Section>
            <h2>8. Intellectual Property</h2>
            <p>
              All content on our website, including text, images, logos, and trademarks, is the exclusive property 
              of Sawaikar's Cashew Store or our content providers. You may not reproduce, distribute, or transmit 
              any content without our prior written consent.
            </p>
          </Section>

          <Section>
            <h2>9. User Accounts</h2>
            <h3>9.1 Account Responsibility</h3>
            <ul>
              <li>You are responsible for maintaining confidentiality of your login credentials</li>
              <li>You agree to accept responsibility for all activities under your account</li>
              <li>You must notify us immediately of unauthorized account access</li>
            </ul>

            <h3>9.2 Account Termination</h3>
            <p>
              We reserve the right to terminate or suspend your account at any time, with or without cause, 
              and with or without notice.
            </p>
          </Section>

          <Section>
            <h2>10. User-Generated Content</h2>
            <p>
              Any feedback, reviews, or comments you post become our property. We may use them for marketing or 
              promotional purposes without compensation. You grant us a perpetual, royalty-free license to use, 
              modify, and distribute your content.
            </p>
          </Section>

          <Section>
            <h2>11. Third-Party Links</h2>
            <p>
              Our website may contain links to third-party websites. We are not responsible for their content, 
              accuracy, or privacy practices. Your use of third-party websites is at your own risk and subject 
              to their terms and conditions.
            </p>
          </Section>

          <Section>
            <h2>12. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless Sawaikar's Cashew Store, its officers, employees, and agents 
              from any claims, damages, or costs arising from your violation of these terms or your use of our services.
            </p>
          </Section>

          <Section>
            <h2>13. Governing Law</h2>
            <p>
              These Terms & Conditions are governed by the laws of India. Any disputes shall be resolved in the 
              courts located in Ponda, Goa, India.
            </p>
          </Section>

          <Section>
            <h2>14. Contact Information</h2>
            <p>
              For questions or concerns about these Terms & Conditions, please contact us:
            </p>
            <ContactInfo>
              <p><strong>Email:</strong> support@sawaikars.com</p>
              <p><strong>Phone:</strong> +91 8604559981</p>
              <p><strong>Address:</strong> Ponda, Goa, India 403401</p>
            </ContactInfo>
          </Section>

          <Section style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '2px solid #D2691E' }}>
            <p style={{ fontStyle: 'italic', color: '#666' }}>
              By continuing to use our website, you acknowledge that you have read, understood, and agree to be 
              bound by these Terms & Conditions in their entirety.
            </p>
          </Section>
        </Content>
      </Container>
    </Wrapper>
  );
};

const Wrapper = styled.section`
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f4e6 0%, #faf6f0 100%);
  padding: 4rem 2rem;
`;

const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
  background: white;
  border-radius: 15px;
  box-shadow: 0 10px 40px rgba(139, 69, 19, 0.1);
  overflow: hidden;
`;

const PageHeader = styled.div`
  background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
  color: white;
  padding: 4rem 3rem;
  text-align: center;

  h1 {
    font-size: 3rem;
    font-weight: 800;
    margin-bottom: 1rem;
    letter-spacing: 1px;
  }

  .last-updated {
    font-size: 1rem;
    opacity: 0.9;
    margin: 0;
  }

  @media (max-width: 768px) {
    padding: 2.5rem 1.5rem;
    h1 {
      font-size: 2rem;
    }
  }
`;

const Content = styled.div`
  padding: 4rem 3rem;

  @media (max-width: 768px) {
    padding: 2rem 1.5rem;
  }
`;

const Section = styled.div`
  margin-bottom: 3rem;

  h2 {
    font-size: 1.8rem;
    color: #8B4513;
    margin-bottom: 1.5rem;
    font-weight: 700;
    border-bottom: 3px solid #D2691E;
    padding-bottom: 0.5rem;
  }

  h3 {
    font-size: 1.3rem;
    color: #A0522D;
    margin-top: 1.5rem;
    margin-bottom: 0.8rem;
    font-weight: 600;
  }

  p {
    font-size: 1.05rem;
    line-height: 1.8;
    color: #555;
    margin-bottom: 1rem;
  }

  ul {
    margin-left: 2rem;
    margin-bottom: 1.5rem;
  }

  li {
    margin-bottom: 0.8rem;
    color: #666;
    line-height: 1.6;
    font-size: 1rem;
  }

  strong {
    color: #8B4513;
  }
`;

const ContactInfo = styled.div`
  background: #f0f0f0;
  padding: 2rem;
  border-radius: 10px;
  border-left: 5px solid #D2691E;

  p {
    margin-bottom: 0.8rem;
    font-size: 1.05rem;
  }

  strong {
    color: #8B4513;
  }
`;

export default Terms;
