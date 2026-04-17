import React, { useEffect } from 'react';
import styled from 'styled-components';

const Privacy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <Wrapper>
      <Container>
        <PageHeader>
          <h1>Privacy Policy</h1>
          <p className="last-updated">Last Updated: March 2026</p>
        </PageHeader>

        <Content>
          <Section>
            <h2>1. Introduction</h2>
            <p>
              Sawaikar's Cashew Store ("we," "us," "our," or "Company") is committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, disclose, and otherwise handle your information 
              when you visit our website, use our services, or interact with us.
            </p>
          </Section>

          <Section>
            <h2>2. Information We Collect</h2>
            <h3>2.1 Personal Information You Provide</h3>
            <ul>
              <li>Account registration details (name, email, phone number)</li>
              <li>Shipping and billing addresses</li>
              <li>Payment information (processed securely through third-party providers)</li>
              <li>Communication preferences and feedback</li>
              <li>Customer service interactions</li>
            </ul>

            <h3>2.2 Information Collected Automatically</h3>
            <ul>
              <li>IP address and browser information</li>
              <li>Device type and operating system</li>
              <li>Browsing behavior and pages visited</li>
              <li>Cookies and similar tracking technologies</li>
              <li>Purchase history and preferences</li>
            </ul>
          </Section>

          <Section>
            <h2>3. How We Use Your Information</h2>
            <p>We use the information we collect for the following purposes:</p>
            <ul>
              <li>Processing orders and delivering products</li>
              <li>Sending order updates and customer service communications</li>
              <li>Personalizing your shopping experience</li>
              <li>Analyzing website usage to improve our services</li>
              <li>Marketing and promotional purposes (with your consent)</li>
              <li>Preventing fraud and maintaining security</li>
              <li>Complying with legal obligations</li>
            </ul>
          </Section>

          <Section>
            <h2>4. Information Sharing</h2>
            <p>We do not sell your personal information. However, we may share your information with:</p>
            <ul>
              <li>Payment processors and financial institutions</li>
              <li>Shipping and logistics partners</li>
              <li>Marketing and analytics service providers</li>
              <li>Legal authorities when required by law</li>
            </ul>
            <p>These third parties are contractually obligated to maintain confidentiality and security of your data.</p>
          </Section>

          <Section>
            <h2>5. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your personal information, including 
              SSL encryption, secure payment gateways, and regular security audits. However, no online transmission 
              is 100% secure, and we cannot guarantee absolute security.
            </p>
          </Section>

          <Section>
            <h2>6. Cookies and Tracking</h2>
            <p>
              Our website uses cookies and similar technologies to enhance your experience. You can control cookie 
              settings through your browser. Disabling cookies may affect website functionality.
            </p>
            <h3>Types of cookies we use:</h3>
            <ul>
              <li><strong>Essential Cookies:</strong> Necessary for website functionality</li>
              <li><strong>Performance Cookies:</strong> Analyze usage patterns</li>
              <li><strong>Marketing Cookies:</strong> Personalize advertisements</li>
            </ul>
          </Section>

          <Section>
            <h2>7. Your Rights</h2>
            <p>Depending on your location, you may have the following rights:</p>
            <ul>
              <li>Right to access your personal information</li>
              <li>Right to correct inaccurate data</li>
              <li>Right to delete your information</li>
              <li>Right to opt-out of marketing communications</li>
              <li>Right to data portability</li>
            </ul>
            <p>To exercise these rights, please contact us at privacy@sawaikars.com</p>
          </Section>

          <Section>
            <h2>8. Retention of Information</h2>
            <p>
              We retain your personal information for as long as necessary to provide our services, comply with 
              legal obligations, and resolve disputes. Once you delete your account, we will retain anonymized 
              data for business analytics purposes.
            </p>
          </Section>

          <Section>
            <h2>9. Third-Party Links</h2>
            <p>
              Our website may contain links to third-party websites. We are not responsible for their privacy 
              practices. Please review their privacy policies before providing any personal information.
            </p>
          </Section>

          <Section>
            <h2>10. Children's Privacy</h2>
            <p>
              Our services are not intended for children under 13 years old. We do not knowingly collect personal 
              information from children. If we become aware of such collection, we will take appropriate steps to 
              delete the information and terminate the child's account.
            </p>
          </Section>

          <Section>
            <h2>11. Policy Updates</h2>
            <p>
              We may update this Privacy Policy periodically. Changes will be effective upon posting to the website. 
              Your continued use constitutes acceptance of the updated policy. We will notify you of material changes 
              via email or a prominent website notice.
            </p>
          </Section>

          <Section>
            <h2>12. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or our privacy practices, please contact us:
            </p>
            <ContactInfo>
              <p><strong>Email:</strong> privacy@sawaikars.com</p>
              <p><strong>Phone:</strong> +91 8604559981</p>
              <p><strong>Address:</strong> Ponda, Goa, India</p>
            </ContactInfo>
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

export default Privacy;
