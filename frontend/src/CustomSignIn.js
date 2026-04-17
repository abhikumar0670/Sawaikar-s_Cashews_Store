import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useSignIn, useUser } from '@clerk/clerk-react';
import { useNavigate, Link } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

const CustomSignIn = () => {
  const { signIn, isLoaded, setActive } = useSignIn();
  const { user } = useUser();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Redirect if already signed in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const parseClerkError = (err) => {
    let errorMsg = 'Invalid email or password';

    if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
      const firstError = err.errors[0];
      const code = firstError.code;

      const errorMessages = {
        'form_identifier_not_found': 'No account found with this email address.',
        'form_password_incorrect': 'Incorrect password. Please try again.',
        'strategy_for_user_invalid': 'This account uses Google sign-in. Please use the Google button.',
        'form_param_format_invalid': 'Please enter a valid email address.',
        'too_many_requests': 'Too many attempts. Please wait a moment and try again.',
        'session_exists': 'You are already signed in.',
      };

      if (errorMessages[code]) {
        errorMsg = errorMessages[code];
      } else if (firstError.longMessage) {
        errorMsg = firstError.longMessage;
      } else if (firstError.message && firstError.message !== 'is unknown') {
        errorMsg = firstError.message;
      }
    } else if (err.message) {
      errorMsg = err.message;
    }

    return errorMsg;
  };

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    if (!isLoaded || loading) return;

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await signIn.create({
        strategy: 'password',
        identifier: email.trim(),
        password: password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        setSuccessMessage('Welcome back! Redirecting...');
        setTimeout(() => navigate('/'), 1000);
      }
    } catch (err) {
      setError(parseClerkError(err));
      console.error('Sign-in error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isLoaded || loading) return;

    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/',
      });
    } catch (err) {
      setError(parseClerkError(err));
      console.error('Google sign-in error:', err);
    }
  };

  return (
    <PageWrapper>
      <SplitCard>
        <LeftPanel>
          <LeftPanelHeader>
            <LogoContainer>
              <LogoImage src="/images/logo3.png" alt="Sawaikar's" onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/images/cashew-logo.svg';
              }} />
            </LogoContainer>

            <BackToWebsite to="/">
              Back to website <FiArrowRight />
            </BackToWebsite>
          </LeftPanelHeader>

          <LeftPanelContent>
            <BrandSection>
              <BrandTitle>Welcome Back to<br />Sawaikar's Store</BrandTitle>
              <BrandSubtitle>Premium Goan Cashews Since 1986</BrandSubtitle>

              <FeaturesList>
                <FeatureItem delay="0.4s">
                  <FeatureIcon delay="0s">✓</FeatureIcon>
                  <FeatureContent>
                    <FeatureTitle>100% Organic</FeatureTitle>
                    <FeatureDesc>Hand-picked from Goan orchards</FeatureDesc>
                  </FeatureContent>
                </FeatureItem>
                <FeatureItem delay="0.5s">
                  <FeatureIcon delay="0.2s">✓</FeatureIcon>
                  <FeatureContent>
                    <FeatureTitle>Premium Quality</FeatureTitle>
                    <FeatureDesc>Wood-fire roasted to perfection</FeatureDesc>
                  </FeatureContent>
                </FeatureItem>
                <FeatureItem delay="0.6s">
                  <FeatureIcon delay="0.4s">✓</FeatureIcon>
                  <FeatureContent>
                    <FeatureTitle>Free Shipping</FeatureTitle>
                    <FeatureDesc>On orders above ₹2000</FeatureDesc>
                  </FeatureContent>
                </FeatureItem>
              </FeaturesList>

              <TestimonialCard>
                <QuoteText>
                  "The best cashews I've ever tasted! So fresh and flavorful. Highly recommended!"
                </QuoteText>
                <AuthorInfo>
                  <AuthorName>Priya Sharma</AuthorName>
                  <AuthorLocation>Mumbai, India</AuthorLocation>
                </AuthorInfo>
              </TestimonialCard>
            </BrandSection>
          </LeftPanelContent>

          <LeftPanelFooter>
            <Tagline>"Capturing Moments, Creating Memories"</Tagline>
            <CarouselDots>
              <CarouselDot delay="0s" />
              <CarouselDot delay="1s" />
              <CarouselDot delay="2s" />
            </CarouselDots>
          </LeftPanelFooter>
        </LeftPanel>

        <RightPanel>
          <FormCard>
          <FormHeader>
            <Title>Sign In</Title>
            <Subtitle>Access your Sawaikar's account</Subtitle>
          </FormHeader>

          {error && (
            <AlertBox type="error">
              <FiAlertCircle />
              <span>{error}</span>
            </AlertBox>
          )}

          {successMessage && (
            <AlertBox type="success">
              <FiCheckCircle />
              <span>{successMessage}</span>
            </AlertBox>
          )}

          {/* Google Sign In */}
          <GoogleButton type="button" onClick={handleGoogleSignIn} disabled={loading}>
            <GoogleIcon viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </GoogleIcon>
            Continue with Google
          </GoogleButton>

          <Divider>
            <DividerLine />
            <DividerText>or sign in with email</DividerText>
            <DividerLine />
          </Divider>

          <Form onSubmit={handleEmailSignIn}>
            <FormGroup>
              <Label htmlFor="email">Email Address</Label>
              <InputWrapper>
                <InputIcon><FiMail /></InputIcon>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter your email"
                  disabled={loading}
                  required
                />
              </InputWrapper>
            </FormGroup>

            <FormGroup>
              <LabelRow>
                <Label htmlFor="password">Password</Label>
                <ForgotLink to="/forgot-password">Forgot password?</ForgotLink>
              </LabelRow>
              <InputWrapper>
                <InputIcon><FiLock /></InputIcon>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter your password"
                  disabled={loading}
                  required
                />
                <TogglePassword type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </TogglePassword>
              </InputWrapper>
            </FormGroup>

            <PrimaryButton type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Spinner /> Signing in...
                </>
              ) : (
                <>
                  Sign In <FiArrowRight />
                </>
              )}
            </PrimaryButton>
          </Form>

          <SignUpPrompt>
            Don't have an account? <SignUpLink to="/sign-up">Create one</SignUpLink>
          </SignUpPrompt>

          <SecurityBadge>
            <SecurityIcon viewBox="0 0 24 24">
              <path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
            </SecurityIcon>
            Secured with Clerk Authentication
          </SecurityBadge>
        </FormCard>
      </RightPanel>
    </SplitCard>
  </PageWrapper>
  );
};

// Animations
const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideInLeft = keyframes`
  from { opacity: 0; transform: translateX(-30px); }
  to { opacity: 1; transform: translateX(0); }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
`;

const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;

const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
`;

const ripple = keyframes`
  0% { transform: scale(0); opacity: 1; }
  100% { transform: scale(4); opacity: 0; }
`;

const carouselDot = keyframes`
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
`;

// Styled Components with CSS Variables
const PageWrapper = styled.div`
  --primary-color: #8B6F47;
  --primary-dark: #6B5435;
  --primary-light: #C19A6B;
  --accent-color: #C19A6B;
  --bg-cream: #FFFBF5;
  --bg-beige: #F5F1E8;
  --text-dark: #2C2416;
  --text-medium: #5A4A3A;
  --text-light: #A68A5E;
  
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, var(--bg-cream) 0%, var(--bg-beige) 100%);
  padding: 2rem;
  animation: ${fadeIn} 0.6s ease-out;
`;

const SplitCard = styled.div`
  display: flex;
  width: 80%;
  max-width: 1400px;
  height: 85vh;
  background: white;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 25px 80px rgba(139, 111, 71, 0.15);
  animation: ${fadeUp} 0.8s cubic-bezier(0.4, 0, 0.2, 1);

  @media (max-width: 1024px) {
    width: 95%;
    height: auto;
    flex-direction: column;
  }
`;

const LeftPanel = styled.div`
  flex: 0 0 45%;
  position: relative;
  background: linear-gradient(145deg, var(--primary-color) 0%, #A68A5E 30%, var(--primary-dark) 70%, #4A3828 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    animation: ${shimmer} 20s linear infinite;
    background-size: 1000px 100%;
  }

  &::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
    animation: ${float} 8s ease-in-out infinite;
  }

  @media (max-width: 1024px) {
    flex: 0 0 auto;
    min-height: 300px;
  }
`;

const LeftPanelHeader = styled.div`
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem 3rem 1rem 3rem;
  animation: ${slideInLeft} 0.6s ease-out 0.2s both;
  flex-shrink: 0;
`;

const LogoContainer = styled.div`
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.25);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  animation: ${pulse} 3s ease-in-out infinite;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: 16px;
    padding: 2px;
    background: linear-gradient(45deg, rgba(255,255,255,0.3), transparent);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
  }
`;

const LogoImage = styled.img`
  width: 40px;
  height: 40px;
  object-fit: contain;
  animation: ${float} 3s ease-in-out infinite;
`;

const BackToWebsite = styled(Link)`
  color: white;
  text-decoration: none;
  font-size: 1.3rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateX(5px);
  }
`;

const LeftPanelContent = styled.div`
  position: relative;
  z-index: 2;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding: 1rem 3rem 2rem 3rem;
  color: white;
  overflow-y: auto;
  
  /* Custom scrollbar for better UX */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
    
    &:hover {
      background: rgba(255, 255, 255, 0.5);
    }
  }
`;

const BrandSection = styled.div`
  animation: ${slideInLeft} 0.6s ease-out 0.3s both;
`;

const BrandTitle = styled.h1`
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 0.8rem;
  letter-spacing: -0.5px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  line-height: 1.2;
  color: #FFFFFF;
`;

const BrandSubtitle = styled.p`
  font-size: 1.4rem;
  opacity: 1;
  margin-bottom: 2rem;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  color: rgba(255, 255, 255, 0.95);
`;

const FeaturesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  margin-bottom: 2rem;
`;

const FeatureItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1.2rem;
  padding: 0.8rem 0;
  animation: ${slideInLeft} 0.6s ease-out both;
  animation-delay: ${props => props.delay || '0.4s'};
  transition: transform 0.3s ease;

  &:hover {
    transform: translateX(10px);
  }
`;

const FeatureIcon = styled.div`
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  box-shadow: 0 4px 15px rgba(139, 111, 71, 0.4);
  color: white;
  font-weight: bold;
  animation: ${float} 3s ease-in-out infinite;
  animation-delay: ${props => props.delay || '0s'};
`;

const FeatureContent = styled.div``;

const FeatureTitle = styled.h4`
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: 0.2rem;
  color: #FFFFFF;
`;

const FeatureDesc = styled.p`
  font-size: 1.2rem;
  opacity: 0.9;
  color: rgba(255, 255, 255, 0.85);
`;

const TestimonialCard = styled.div`
  background: rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  padding: 2rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  animation: ${slideInLeft} 0.6s ease-out 0.7s both;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  margin-bottom: 1rem;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }
`;

const QuoteText = styled.p`
  font-size: 1.3rem;
  font-style: italic;
  line-height: 1.5;
  margin-bottom: 1.2rem;
  opacity: 1;
  color: rgba(255, 255, 255, 0.95);
`;

const AuthorInfo = styled.div``;

const AuthorName = styled.div`
  font-weight: 600;
  font-size: 1.3rem;
  color: #FFFFFF;
`;

const AuthorLocation = styled.div`
  font-size: 1.2rem;
  opacity: 0.85;
  margin-top: 0.2rem;
  color: rgba(255, 255, 255, 0.8);
`;

const LeftPanelFooter = styled.div`
  position: relative;
  z-index: 2;
  padding: 1.5rem 3rem 2rem 3rem;
  text-align: center;
  animation: ${slideInLeft} 0.6s ease-out 0.8s both;
  flex-shrink: 0;
`;

const Tagline = styled.p`
  font-size: 1.6rem;
  font-weight: 500;
  color: #FFFFFF;
  margin-bottom: 1.2rem;
  font-style: italic;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
`;

const CarouselDots = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.8rem;
`;

const CarouselDot = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  animation: ${carouselDot} 3s ease-in-out infinite;
  animation-delay: ${props => props.delay || '0s'};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.8);
    transform: scale(1.3);
  }
`;

const RightPanel = styled.div`
  flex: 0 0 55%;
  background: linear-gradient(135deg, var(--bg-cream) 0%, var(--bg-beige) 100%);
  padding: 3rem;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow-y: auto;

  @media (max-width: 1024px) {
    padding: 2rem;
  }
`;

const FormCard = styled.div`
  width: 100%;
  max-width: 460px;
  animation: ${fadeIn} 0.6s ease-out 0.3s both;
`;

const FormHeader = styled.div`
  margin-bottom: 2rem;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 2.8rem;
  font-weight: 700;
  color: var(--text-dark);
  margin-bottom: 0.5rem;
  letter-spacing: -0.5px;
`;

const Subtitle = styled.p`
  font-size: 1.5rem;
  color: var(--text-medium);
`;

const AlertBox = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.3rem 1.6rem;
  border-radius: 14px;
  margin-bottom: 1.5rem;
  font-size: 1.4rem;
  animation: ${props => props.type === 'error' ? shake : fadeIn} 0.5s ease-out;

  ${({ type }) => type === 'error' ? `
    background: #fef2f2;
    border: 1.5px solid #fecaca;
    color: #dc2626;
  ` : `
    background: #f0fdf4;
    border: 1.5px solid #bbf7d0;
    color: #16a34a;
  `}

  svg {
    flex-shrink: 0;
    font-size: 1.8rem;
  }
`;

const GoogleButton = styled.button`
  width: 100%;
  padding: 1.4rem;
  background: white;
  border: 2px solid #E8E4DF;
  border-radius: 12px;
  font-size: 1.5rem;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    border-color: var(--primary-color);
    background: var(--bg-cream);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const GoogleIcon = styled.svg`
  width: 20px;
  height: 20px;
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 2rem 0;
`;

const DividerLine = styled.div`
  flex: 1;
  height: 1px;
  background: #e5e7eb;
`;

const DividerText = styled.span`
  font-size: 1.3rem;
  color: #9ca3af;
  white-space: nowrap;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

const Label = styled.label`
  font-size: 1.4rem;
  font-weight: 600;
  color: #374151;
`;

const LabelRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const InputIcon = styled.div`
  position: absolute;
  left: 1.4rem;
  color: #9ca3af;
  font-size: 1.6rem;
  display: flex;
`;

const Input = styled.input`
  width: 100%;
  padding: 1.4rem 1.5rem 1.4rem 4.4rem;
  border: 2px solid #E8E4DF;
  border-radius: 14px;
  font-size: 1.5rem;
  font-family: inherit;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: var(--bg-cream);

  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 4px rgba(139, 111, 71, 0.1);
    background: white;
    transform: translateY(-1px);
  }

  &:disabled {
    background: var(--bg-beige);
    cursor: not-allowed;
    opacity: 0.6;
  }

  &::placeholder {
    color: var(--text-light);
  }
`;

const TogglePassword = styled.button`
  position: absolute;
  right: 1.4rem;
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 1.6rem;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;

  &:hover {
    color: #6b7280;
  }
`;

const ForgotLink = styled(Link)`
  font-size: 1.3rem;
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s ease;

  &:hover {
    color: var(--primary-dark);
    text-decoration: underline;
  }
`;

const PrimaryButton = styled.button`
  width: 100%;
  padding: 1.6rem;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 1.6rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 15px rgba(139, 111, 71, 0.3);
  margin-top: 0.5rem;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
  }

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 25px rgba(139, 111, 71, 0.4);
    background: linear-gradient(135deg, var(--primary-dark) 0%, var(--primary-color) 100%);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    
    &::before {
      width: 300px;
      height: 300px;
    }
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
`;

const Spinner = styled.div`
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

const SignUpPrompt = styled.p`
  text-align: center;
  font-size: 1.4rem;
  color: var(--text-medium);
  margin-top: 2rem;
`;

const SignUpLink = styled(Link)`
  color: var(--primary-color);
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    color: var(--primary-dark);
    text-decoration: underline;
  }
`;

const SecurityBadge = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  margin-top: 2rem;
  font-size: 1.2rem;
  color: #9ca3af;
`;

const SecurityIcon = styled.svg`
  width: 16px;
  height: 16px;
  color: #22c55e;
`;

export default CustomSignIn;
