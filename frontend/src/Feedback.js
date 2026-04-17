import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { FiStar, FiSend, FiCheckCircle, FiX, FiHome, FiArrowRight } from 'react-icons/fi';
import axios from 'axios';
import API_BASE_URL from './config/api';

const API_URL = API_BASE_URL;

const Feedback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useUser();

  const orderId = searchParams.get('orderId');

  const [submitted, setSubmitted] = useState(false);
  const [feedbackId, setFeedbackId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);

  const [formData, setFormData] = useState({
    orderId: orderId || '',
    rating: 0,
    title: '',
    message: '',
    category: 'quality',
    userName: user?.firstName || '',
    userEmail: user?.primaryEmailAddress?.emailAddress || '',
    userPhone: '',
    isAnonymous: false
  });

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle rating click - separate function to avoid validation
  const handleRatingChange = (rating) => {
    setFormData(prev => ({
      ...prev,
      rating
    }));
    setHoveredRating(0);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.rating || !formData.title.trim() || !formData.message.trim()) {
        toast.error('Please complete all required fields (rating, title, and feedback)');
        setLoading(false);
        return;
      }

      if (formData.title.length < 5) {
        toast.error('Title must be at least 5 characters');
        setLoading(false);
        return;
      }

      if (formData.message.length < 20) {
        toast.error('Feedback message must be at least 20 characters');
        setLoading(false);
        return;
      }

      // Make API request
      const response = await axios.post(`${API_URL}/feedback`, formData);

      if (response.data.success) {
        setFeedbackId(response.data.feedback.feedbackId);
        setSubmitted(true);
        
        // Reset form
        setFormData({
          orderId: orderId || '',
          rating: 0,
          title: '',
          message: '',
          category: 'quality',
          userName: user?.firstName || '',
          userEmail: user?.primaryEmailAddress?.emailAddress || '',
          userPhone: '',
          isAnonymous: false
        });

        toast.success('Feedback submitted successfully!');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error(error.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  // Render star rating component
  const renderStarRating = () => {
    return (
      <StarRatingContainer>
        <StarLabel>Click to rate (1-5 stars)</StarLabel>
        <StarsWrapper>
          {[1, 2, 3, 4, 5].map(star => (
            <StarButton
              key={star}
              type="button"
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => handleRatingChange(star)}
              $filled={star <= (hoveredRating || formData.rating)}
              title={`Rate ${star} star${star > 1 ? 's' : ''}`}
            >
              <FiStar />
            </StarButton>
          ))}
        </StarsWrapper>
        <RatingText>
          {hoveredRating > 0 
            ? `${hoveredRating} star${hoveredRating > 1 ? 's' : ''}`
            : (formData.rating > 0 ? `${formData.rating} star${formData.rating > 1 ? 's' : ''} selected` : 'No rating selected')
          }
        </RatingText>
      </StarRatingContainer>
    );
  };

  if (submitted) {
    return (
      <Wrapper>
        <SuccessSection>
          <SuccessCard>
            <SuccessIconContainer>
              <FiCheckCircle />
            </SuccessIconContainer>
            
            <SuccessTitle>Thank You for Your Feedback!</SuccessTitle>
            
            <SuccessMessage>
              We truly appreciate your valuable feedback. Our team will review your comments and use them to improve our services.
            </SuccessMessage>

            <FeedbackIdBox>
              <IdLabel>Feedback Reference ID:</IdLabel>
              <IdValue>{feedbackId}</IdValue>
            </FeedbackIdBox>

            <SuccessDetails>
              <DetailItem>
                <DetailIcon>✓</DetailIcon>
                <DetailText>Your feedback has been recorded successfully</DetailText>
              </DetailItem>
              <DetailItem>
                <DetailIcon>✓</DetailIcon>
                <DetailText>Our team will review it within 24-48 hours</DetailText>
              </DetailItem>
              <DetailItem>
                <DetailIcon>✓</DetailIcon>
                <DetailText>You'll receive a response at your email address</DetailText>
              </DetailItem>
            </SuccessDetails>

            <ButtonGroup>
              <ContinueButton onClick={() => navigate('/products')}>
                <FiHome /> Continue Shopping
                <FiArrowRight className="arrow" />
              </ContinueButton>
              <BackToOrdersButton onClick={() => navigate('/orders')}>
                <FiArrowRight /> Back to Orders
              </BackToOrdersButton>
            </ButtonGroup>

            <GratitudeMessage>
              Thank you for being part of our family!<br/>
              Keep enjoying premium cashews
            </GratitudeMessage>
          </SuccessCard>
        </SuccessSection>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      {/* Header Section */}
      <HeaderSection>
        <HeaderContent>
          <HeaderTitle>Share Your Experience</HeaderTitle>
          <HeaderSubtitle>
            Your feedback helps us improve and serve you better
          </HeaderSubtitle>
        </HeaderContent>
      </HeaderSection>

      {/* Main Content */}
      <ContentSection>
        <FormContainer>
          <FormGrid>
            {/* Left Column - Feedback Form */}
            <FormColumn>
              <SectionTitle>

                Feedback Details
              </SectionTitle>

              <Form onSubmit={handleSubmit}>
                {/* Order ID (if provided) */}
                {orderId && (
                  <FormGroup>
                    <Label>Order Reference</Label>
                    <OrderIdBox>
                      <OrderIdValue>#{orderId}</OrderIdValue>
                      <OrderIdText>Your feedback will be linked to this order</OrderIdText>
                    </OrderIdBox>
                  </FormGroup>
                )}

                {/* Rating */}
                <FormGroup>
                  <LabelRequired>
                    Your Rating <Required>*</Required>
                  </LabelRequired>
                  {renderStarRating()}
                </FormGroup>

                {/* Category */}
                <FormGroup>
                  <Label htmlFor="category">Feedback Category</Label>
                  <Select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                  >
                    <option value="quality">Product Quality</option>
                    <option value="delivery">Delivery Experience</option>
                    <option value="packaging">Packaging</option>
                    <option value="customer_service">Customer Service</option>
                    <option value="other">Other</option>
                  </Select>
                </FormGroup>

                {/* Title */}
                <FormGroup>
                  <LabelRequired>
                    Feedback Title <Required>*</Required>
                  </LabelRequired>
                  <Input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="In 5-50 characters (e.g., 'Excellent Quality Cashews')"
                    maxLength="50"
                  />
                  <CharCount>{formData.title.length}/50</CharCount>
                </FormGroup>

                {/* Message */}
                <FormGroup>
                  <LabelRequired>
                    Your Feedback <Required>*</Required>
                  </LabelRequired>
                  <TextArea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Please share your detailed feedback (minimum 20 characters)..."
                    rows="5"
                    maxLength="500"
                  />
                  <CharCount>{formData.message.length}/500</CharCount>
                </FormGroup>

                {/* Contact Information */}
                <ContactSection>
                  <SectionLabel>Contact Information (Optional)</SectionLabel>

                  <FormRow>
                    <FormGroup>
                      <Label htmlFor="userName">Name</Label>
                      <Input
                        type="text"
                        id="userName"
                        name="userName"
                        value={formData.userName}
                        onChange={handleChange}
                        placeholder="Your name"
                        disabled={formData.isAnonymous}
                      />
                    </FormGroup>

                    <FormGroup>
                      <Label htmlFor="userEmail">Email</Label>
                      <Input
                        type="email"
                        id="userEmail"
                        name="userEmail"
                        value={formData.userEmail}
                        onChange={handleChange}
                        placeholder="your@email.com"
                        disabled={formData.isAnonymous}
                      />
                    </FormGroup>
                  </FormRow>

                  <FormGroup>
                    <Label htmlFor="userPhone">Phone (Optional)</Label>
                    <Input
                      type="tel"
                      id="userPhone"
                      name="userPhone"
                      value={formData.userPhone}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      disabled={formData.isAnonymous}
                    />
                  </FormGroup>

                  {/* Anonymous Option */}
                  <AnonymousCheckbox>
                    <CheckboxInput
                      type="checkbox"
                      id="isAnonymous"
                      name="isAnonymous"
                      checked={formData.isAnonymous}
                      onChange={handleChange}
                    />
                    <CheckboxLabel htmlFor="isAnonymous">
                      Submit this feedback anonymously
                    </CheckboxLabel>
                  </AnonymousCheckbox>
                </ContactSection>

                {/* Submit Button */}
                <SubmitButton type="submit" disabled={loading}>
                  <FiSend />
                  {loading ? 'Submitting...' : 'Submit Feedback'}
                </SubmitButton>
              </Form>
            </FormColumn>

            {/* Right Column - Tips */}
            <TipsColumn>
              <TipsCard>
                <TipsTitle>Tips for Better Feedback</TipsTitle>
                <TipsList>
                  <TipItem>
                    <TipIcon><FiCheckCircle /></TipIcon>
                    <TipText>Be specific about your experience</TipText>
                  </TipItem>
                  <TipItem>
                    <TipIcon><FiCheckCircle /></TipIcon>
                    <TipText>Mention both positives and areas for improvement</TipText>
                  </TipItem>
                  <TipItem>
                    <TipIcon><FiCheckCircle /></TipIcon>
                    <TipText>Keep feedback constructive and respectful</TipText>
                  </TipItem>
                  <TipItem>
                    <TipIcon><FiCheckCircle /></TipIcon>
                    <TipText>Include product name if relevant</TipText>
                  </TipItem>
                </TipsList>
              </TipsCard>

              <BenefitCard>
                <BenefitTitle>Why Your Feedback Matters</BenefitTitle>
                <BenefitsList>
                  <BenefitItem>Helps us improve our products</BenefitItem>
                  <BenefitItem>Guides our service enhancements</BenefitItem>
                  <BenefitItem>Builds trust with community</BenefitItem>
                  <BenefitItem>May earn you loyalty points</BenefitItem>
                </BenefitsList>
              </BenefitCard>

              <ContactCard>
                <ContactTitle>Need Help?</ContactTitle>
                <ContactText>
                  If you have immediate concerns, please reach out to our support team:
                </ContactText>
                <ContactLinks>
                  <ContactLink href="mailto:support@sawaikarcashew.com">
                    support@sawaikarcashew.com
                  </ContactLink>
                  <ContactLink href="tel:+919876543210">
                    +91 98765 43210
                  </ContactLink>
                </ContactLinks>
              </ContactCard>
            </TipsColumn>
          </FormGrid>
        </FormContainer>
      </ContentSection>
    </Wrapper>
  );
};

// ===============================================
// STYLED COMPONENTS
// ===============================================

const Wrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #faf9f6 0%, #f5f3f0 100%);
`;

const HeaderSection = styled.div`
  background: linear-gradient(135deg, #8B4513 0%, #A0522D 50%, #D2691E 100%);
  color: white;
  padding: 60px 24px;
  text-align: center;
`;

const HeaderContent = styled.div`
  max-width: 600px;
  margin: 0 auto;
`;

const HeaderTitle = styled.h1`
  font-size: 42px;
  font-weight: 700;
  margin-bottom: 12px;

  @media (max-width: 768px) {
    font-size: 32px;
  }
`;

const HeaderSubtitle = styled.p`
  font-size: 18px;
  opacity: 0.9;
`;

const ContentSection = styled.div`
  max-width: 1200px;
  margin: -40px auto 60px;
  padding: 0 24px;
`;

const FormContainer = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 40px;
  padding: 48px;

  @media (max-width: 968px) {
    grid-template-columns: 1fr;
    gap: 32px;
    padding: 32px;
  }
`;

const FormColumn = styled.div``;

const TipsColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const SectionTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: #374151;
`;

const LabelRequired = styled(Label)``;

const Required = styled.span`
  color: #ef4444;
`;

const Input = styled.input`
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #CD853F;
    box-shadow: 0 0 0 3px rgba(205, 133, 63, 0.1);
  }

  &:disabled {
    background: #f3f4f6;
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const TextArea = styled.textarea`
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #CD853F;
    box-shadow: 0 0 0 3px rgba(205, 133, 63, 0.1);
  }

  &:disabled {
    background: #f3f4f6;
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const Select = styled.select`
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  background: white;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #CD853F;
    box-shadow: 0 0 0 3px rgba(205, 133, 63, 0.1);
  }
`;

const CharCount = styled.div`
  font-size: 12px;
  color: #9ca3af;
  text-align: right;
`;

const StarRatingContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const StarLabel = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
`;

const StarsWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const StarButton = styled.button`
  background: none;
  border: 2px solid #e5e7eb;
  font-size: 32px;
  cursor: pointer;
  color: ${props => props.$filled ? '#FBBF24' : '#e5e7eb'};
  transition: all 0.2s ease;
  padding: 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    transform: scale(1.15);
    border-color: #FBBF24;
  }

  svg {
    fill: currentColor;
  }
`;

const RatingText = styled.span`
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
`;

const OrderIdBox = styled.div`
  background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
  border-left: 4px solid #D97706;
  padding: 16px;
  border-radius: 8px;
`;

const OrderIdValue = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #92400E;
`;

const OrderIdText = styled.div`
  font-size: 12px;
  color: #b45309;
  margin-top: 4px;
`;

const ContactSection = styled.div`
  background: #f9fafb;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
`;

const SectionLabel = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 16px;
`;

const AnonymousCheckbox = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
`;

const CheckboxInput = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
`;

const CheckboxLabel = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
`;

const SubmitButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: linear-gradient(135deg, #CD853F 0%, #8B4513 100%);
  color: white;
  border: none;
  padding: 14px 32px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 16px;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(205, 133, 63, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

// Tips Card
const TipsCard = styled.div`
  background: linear-gradient(135deg, #F3E8FF 0%, #EDE9FE 100%);
  border-left: 4px solid #7C3AED;
  padding: 24px;
  border-radius: 12px;
`;

const TipsTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: #6B21A8;
  margin-bottom: 16px;
`;

const TipsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const TipItem = styled.li`
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: #6B21A8;
`;

const TipIcon = styled.span`
  flex-shrink: 0;
  font-weight: 700;
  color: #7C3AED;
`;

const TipText = styled.span``;

// Benefit Card
const BenefitCard = styled.div`
  background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
  border-left: 4px solid #D97706;
  padding: 24px;
  border-radius: 12px;
`;

const BenefitTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: #92400E;
  margin-bottom: 16px;
`;

const BenefitsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const BenefitItem = styled.li`
  font-size: 13px;
  color: #92400E;
  padding-left: 20px;
  position: relative;

  &:before {
    content: '';
    position: absolute;
    left: 0;
    width: 12px;
    height: 12px;
    background: #D97706;
    border-radius: 2px;
  }
`;

// Contact Card
const ContactCard = styled.div`
  background: linear-gradient(135deg, #DBEAFE 0%, #BAE6FD 100%);
  border-left: 4px solid #0EA5E9;
  padding: 24px;
  border-radius: 12px;
`;

const ContactTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  color: #0369a1;
  margin-bottom: 12px;
`;

const ContactText = styled.p`
  font-size: 13px;
  color: #0369a1;
  margin: 0 0 12px 0;
`;

const ContactLinks = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ContactLink = styled.a`
  font-size: 13px;
  color: #0369a1;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    text-decoration: underline;
    color: #0c4a6e;
  }
`;

// Success Section
const SuccessSection = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

const SuccessCard = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  padding: 48px 32px;
  text-align: center;
`;

const SuccessIconContainer = styled.div`
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  font-size: 40px;
  color: white;
`;

const SuccessTitle = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 16px;
`;

const SuccessMessage = styled.p`
  font-size: 16px;
  color: #6b7280;
  line-height: 1.6;
  margin-bottom: 24px;
`;

const FeedbackIdBox = styled.div`
  background: #f3f4f6;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
`;

const IdLabel = styled.div`
  font-size: 12px;
  color: #9ca3af;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 8px;
`;

const IdValue = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  font-family: 'Courier New', monospace;
`;

const SuccessDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 32px;
  text-align: left;
`;

const DetailItem = styled.div`
  display: flex;
  gap: 12px;
  font-size: 14px;
  color: #4b5563;
`;

const DetailIcon = styled.span`
  color: #10b981;
  font-weight: 700;
  flex-shrink: 0;
`;

const DetailText = styled.span``;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ContinueButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: linear-gradient(135deg, #CD853F 0%, #8B4513 100%);
  color: white;
  border: none;
  padding: 14px 32px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(205, 133, 63, 0.3);
  }

  .arrow {
    transition: transform 0.3s ease;
  }

  &:hover .arrow {
    transform: translateX(4px);
  }
`;

const BackToOrdersButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: white;
  color: #CD853F;
  border: 2px solid #CD853F;
  padding: 12px 32px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #CD853FCC;
    color: white;
  }
`;

const GratitudeMessage = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin-top: 24px;
  line-height: 1.6;
`;

export default Feedback;
