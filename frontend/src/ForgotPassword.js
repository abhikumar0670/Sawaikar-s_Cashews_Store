import React, { useState } from 'react';
import styled from 'styled-components';
import { useSignIn } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiArrowRight, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

const ForgotPassword = () => {
  const { signIn, isLoaded } = useSignIn();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState('email'); // 'email' or 'code'
  const [code, setCode] = useState('');

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!isLoaded || loading) return;

    // Trim email
    const trimmedEmail = email.trim().toLowerCase();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Attempting password reset for:', trimmedEmail);
      
      // First, try to create a sign-in session
      const result = await signIn.create({
        strategy: 'password_reset',
        identifier: trimmedEmail,
      });
      
      console.log('Password reset response:', result);
      console.log('Response status:', result.status);
      
      // Success - we got a response, now proceed to code verification
      setSuccess(true);
      setStep('code');
      
    } catch (err) {
      console.error('Full error object:', err);
      console.error('Error status:', err.status);
      console.error('Error message:', err.message);
      
      let errorMsg = 'Unable to process password reset';
      
      // Parse different error scenarios
      if (err.errors && err.errors.length > 0) {
        errorMsg = err.errors[0].message;
        console.error('Clerk error:', err.errors[0]);
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      // Specific error handling
      if (errorMsg.toLowerCase().includes('invalid') && errorMsg.toLowerCase().includes('identifier')) {
        errorMsg = 'This email is not registered. Please sign up first or check the email address.';
      } else if (errorMsg.toLowerCase().includes('invalid')) {
        errorMsg = 'Email format is invalid. Please check and try again.';
      } else if (errorMsg.toLowerCase().includes('not found')) {
        errorMsg = 'No account found with this email. Please sign up or use another email.';
      } else if (errorMsg.toLowerCase().includes('oauth') || errorMsg.toLowerCase().includes('google')) {
        errorMsg = 'This account uses Google sign-in. Please sign in with Google and set a password in your account settings.';
      } else if (errorMsg.toLowerCase().includes('password')) {
        errorMsg = 'Unable to reset password. Please try again or contact support.';
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    if (!isLoaded || loading || !code) return;

    // Validate code format (should be 6 digits)
    const codeValue = code.trim().toUpperCase();
    if (codeValue.length < 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Attempt to verify the reset code
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_code',
        code: codeValue,
      });

      console.log('Code verification result:', result.status);

      if (result.status === 'needs_new_password') {
        // Navigate to reset password page with email in state
        navigate('/reset-password', { 
          state: { email: email.trim() },
          replace: false 
        });
      }
    } catch (err) {
      console.error('Code verification full error:', err);
      let errorMsg = 'Invalid code. Please try again.';
      
      if (err.errors && err.errors.length > 0) {
        errorMsg = err.errors[0].message;
        console.error('Error details:', err.errors[0]);
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      // Better error messages for code
      if (errorMsg.toLowerCase().includes('code')) {
        errorMsg = 'The code is invalid or expired. Please request a new one.';
      } else if (errorMsg.toLowerCase().includes('expired')) {
        errorMsg = 'This code has expired. Please request a new reset code.';
      } else if (errorMsg.toLowerCase().includes('attempt')) {
        errorMsg = 'Too many attempts. Please request a new code.';
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Wrapper>
      {/* Left Side - Brand/Heritage */}
      <LeftSection>
        <BrandContent>
          <Logo>
            <img src="/images/cashew-logo.svg" alt="Sawaikar's Premium Cashews" style={{ width: '100%', height: 'auto' }} />
          </Logo>
          
          <HeritageText>
            <h2>Recover Your Account</h2>
            <p>We'll help you regain access safely</p>
          </HeritageText>

          <Features>
            <Feature>
              <FeatureIcon>✓</FeatureIcon>
              <div>
                <h4>Fast & Secure</h4>
                <p>Multi-step verification for your safety</p>
              </div>
            </Feature>
            <Feature>
              <FeatureIcon>✓</FeatureIcon>
              <div>
                <h4>Easy Process</h4>
                <p>Just verify your email and set a new password</p>
              </div>
            </Feature>
            <Feature>
              <FeatureIcon>✓</FeatureIcon>
              <div>
                <h4>Back in Minutes</h4>
                <p>Get access to your Sawaikar's account quickly</p>
              </div>
            </Feature>
          </Features>

          <TestimonialBox>
            <Quote>
              "Great customer support! Helped me reset my password instantly."
            </Quote>
            <Author>
              <strong>Rajesh Patel</strong>
              <span>Bangalore</span>
            </Author>
          </TestimonialBox>
        </BrandContent>
      </LeftSection>

      {/* Right Side - Form */}
      <RightSection>
        <FormContainer>
          <FormHeader>
            <Title>Forgot Your Password?</Title>
            <Subtitle>Enter your email to receive a reset code</Subtitle>
          </FormHeader>

          {error && (
            <ErrorBox>
              <FiAlertCircle />
              <span>{error}</span>
            </ErrorBox>
          )}

          {error && step === 'email' && (
            <HelpBox>
              <p><strong>Having trouble?</strong></p>
              <p>If you're still having issues:</p>
              <ul>
                <li>Make sure you're entering the email address associated with your account</li>
                <li>Try <SignInLink href="/sign-in">signing in</SignInLink> instead - you might remember your password</li>
                <li>If your account uses Google Sign-In, you won't need to reset your password</li>
              </ul>
              <p>Need more help? <SignInLink href="/contact">Contact our support team</SignInLink></p>
            </HelpBox>
          )}

          {success && step === 'code' && (
            <SuccessBox>
              <FiCheckCircle />
              <span>Check your email for the verification code</span>
            </SuccessBox>
          )}

          {step === 'email' ? (
            <Form onSubmit={handleEmailSubmit}>
              <FormGroup>
                <Label htmlFor="email">Email Address</Label>
                <InputWrapper>
                  <FiMail className="icon" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    placeholder="Enter your registered email"
                    disabled={loading}
                    required
                  />
                </InputWrapper>
              </FormGroup>

              <SubmitButton type="submit" disabled={loading}>
                {loading ? 'Sending...' : (
                  <>
                    Send Reset Code <FiArrowRight />
                  </>
                )}
              </SubmitButton>
            </Form>
          ) : (
            <Form onSubmit={handleCodeSubmit}>
              <FormGroup>
                <Label htmlFor="code">Verification Code</Label>
                <InputWrapper>
                  <FiMail className="icon" />
                  <Input
                    id="code"
                    type="text"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.toUpperCase());
                      setError('');
                    }}
                    placeholder="Enter 6-digit code from your email"
                    maxLength="6"
                    disabled={loading}
                    required
                  />
                </InputWrapper>
                <CodeHint>Check your email for the verification code</CodeHint>
              </FormGroup>

              <SubmitButton type="submit" disabled={loading}>
                {loading ? 'Verifying...' : (
                  <>
                    Verify Code <FiArrowRight />
                  </>
                )}
              </SubmitButton>

              <BackButton type="button" onClick={() => { setStep('email'); setError(''); setCode(''); }}>
                Back to email
              </BackButton>
            </Form>
          )}

          <FormFooter>
            <p>
              Remember your password?{' '}
              <SignInLink href="/sign-in">Sign in here</SignInLink>
            </p>
            <p>
              Don't have an account?{' '}
              <SignUpLink href="/sign-up">Create one</SignUpLink>
            </p>
          </FormFooter>

          <SecurityBadge>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
            </svg>
            Secured by Clerk
          </SecurityBadge>
        </FormContainer>
      </RightSection>
    </Wrapper>
  );
};

// Styled Components

const Wrapper = styled.div`
  display: flex;
  min-height: 100vh;
  background: linear-gradient(135deg, #fefef9 0%, #f8f3e8 100%);
`;

const LeftSection = styled.div`
  flex: 1;
  padding: 4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #A0522D 0%, #6B4423 100%);
  color: #fff;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle, rgba(255, 200, 124, 0.08) 0%, transparent 70%);
    pointer-events: none;
  }

  @media (max-width: 1024px) {
    display: none;
  }
`;

const BrandContent = styled.div`
  position: relative;
  z-index: 1;
  max-width: 45rem;
`;

const Logo = styled.div`
  margin-bottom: 3rem;
  
  img {
    width: 8rem;
    height: 8rem;
    border-radius: 50%;
    border: 3px solid rgba(255, 255, 255, 0.2);
  }
`;

const HeritageText = styled.div`
  margin-bottom: 4rem;

  h2 {
    font-size: 2.8rem;
    font-weight: 800;
    margin-bottom: 0.8rem;
    line-height: 1.3;
    color: #ffffff;
    letter-spacing: -0.5px;
  }

  p {
    font-size: 1.5rem;
    opacity: 0.95;
    font-weight: 400;
    color: #f0e6d2;
  }
`;

const Features = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-bottom: 3rem;
`;

const Feature = styled.div`
  display: flex;
  gap: 1.8rem;
  align-items: flex-start;
  padding: 1.2rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  &:last-child {
    border-bottom: none;
  }

  h4 {
    font-size: 1.4rem;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 0.3rem;
    margin: 0 0 0.3rem 0;
  }

  p {
    font-size: 1.2rem;
    color: #e8d4b8;
    font-weight: 400;
    margin: 0;
  }
`;

const FeatureIcon = styled.div`
  width: 3.5rem;
  height: 3.5rem;
  background: linear-gradient(135deg, #FF9800 0%, #FF8C00 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.6rem;
  flex-shrink: 0;
  box-shadow: 0 6px 20px rgba(255, 152, 0, 0.35);
  color: #fff;
  font-weight: 700;
`;

const TestimonialBox = styled.div`
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  padding: 2.2rem;
  border-radius: 1.2rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
`;

const Quote = styled.p`
  font-size: 1.4rem;
  font-style: italic;
  margin-bottom: 1.5rem;
  line-height: 1.6;
  color: #f0e6d2;
  margin: 0 0 1.5rem 0;
`;

const Author = styled.div`
  display: flex;
  flex-direction: column;

  strong {
    font-size: 1.3rem;
    color: #ffffff;
    font-weight: 700;
    margin-bottom: 0.2rem;
  }

  span {
    font-size: 1.1rem;
    opacity: 0.85;
    color: #e8d4b8;
    font-weight: 400;
  }
`;

const RightSection = styled.div`
  flex: 1;
  padding: 4rem;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 1024px) {
    background: #fff;
    flex: none;
    width: 100%;
  }
`;

const FormContainer = styled.div`
  width: 100%;
  max-width: 50rem;
`;

const FormHeader = styled.div`
  margin-bottom: 3rem;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 3rem;
  font-weight: 800;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  font-size: 1.5rem;
  color: #666;
  font-weight: 400;
`;

const ErrorBox = styled.div`
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid #FF6B6B;
  color: #d32f2f;
  padding: 1.2rem;
  border-radius: 1rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  font-size: 1.4rem;
  word-break: break-word;

  svg {
    flex-shrink: 0;
    margin-top: 0.2rem;
  }
  
  span {
    line-height: 1.5;
  }
`;

const SuccessBox = styled.div`
  background: rgba(76, 175, 80, 0.1);
  border: 1px solid #4CAF50;
  color: #2e7d32;
  padding: 1.2rem;
  border-radius: 1rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 1.4rem;

  svg {
    flex-shrink: 0;
  }
`;

const HelpBox = styled.div`
  background: rgba(33, 150, 243, 0.08);
  border: 1px solid rgba(33, 150, 243, 0.3);
  color: #1565c0;
  padding: 1.5rem;
  border-radius: 1rem;
  margin-bottom: 2rem;
  font-size: 1.3rem;

  p {
    margin: 0.8rem 0;
    line-height: 1.5;
  }

  strong {
    font-weight: 700;
    display: block;
    margin-bottom: 0.5rem;
  }

  ul {
    margin: 1rem 0;
    padding-left: 1.5rem;
    
    li {
      margin: 0.5rem 0;
      line-height: 1.4;
    }
  }

  a {
    color: #FF9800;
    text-decoration: none;
    font-weight: 600;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.8rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

const Label = styled.label`
  font-size: 1.4rem;
  font-weight: 600;
  color: #1a1a1a;
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;

  .icon {
    position: absolute;
    left: 1.5rem;
    width: 2rem;
    height: 2rem;
    color: #999;
    pointer-events: none;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 1.4rem 1.4rem 1.4rem 4rem;
  border: 2px solid #e0e0e0;
  border-radius: 1rem;
  font-size: 1.5rem;
  font-weight: 500;
  transition: all 0.3s ease;
  background: #fff;

  &::placeholder {
    color: #aaa;
  }

  &:focus {
    outline: none;
    border-color: #FF9800;
    box-shadow: 0 0 0 3px rgba(255, 152, 0, 0.1);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: #f5f5f5;
  }
`;

const CodeHint = styled.p`
  font-size: 1.2rem;
  color: #999;
  margin-top: -0.5rem;
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 1.5rem;
  background: linear-gradient(135deg, #FF9800 0%, #FF8C00 100%);
  color: #fff;
  border: none;
  border-radius: 1rem;
  font-size: 1.6rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  transition: all 0.3s ease;
  box-shadow: 0 6px 20px rgba(255, 152, 0, 0.3);

  &:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(255, 152, 0, 0.4);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  svg {
    width: 2rem;
    height: 2rem;
  }
`;

const BackButton = styled.button`
  width: 100%;
  padding: 1.2rem;
  background: transparent;
  color: #FF9800;
  border: 2px solid #FF9800;
  border-radius: 1rem;
  font-size: 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;

  &:hover:not(:disabled) {
    background: rgba(255, 152, 0, 0.05);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const FormFooter = styled.div`
  text-align: center;
  margin-top: 2rem;

  p {
    font-size: 1.3rem;
    color: #666;
    margin-bottom: 1rem;

    a {
      color: #FF9800;
      text-decoration: none;
      font-weight: 600;
      transition: all 0.3s ease;

      &:hover {
        color: #FF8C00;
        text-decoration: underline;
      }
    }
  }
`;

const SignInLink = styled.a`
  color: #FF9800;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    color: #FF8C00;
    text-decoration: underline;
  }
`;

const SignUpLink = styled.a`
  color: #FF9800;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    color: #FF8C00;
    text-decoration: underline;
  }
`;

const SecurityBadge = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  margin-top: 3rem;
  font-size: 1.3rem;
  color: #999;

  svg {
    width: 1.6rem;
    height: 1.6rem;
    color: #FF9800;
  }
`;

export default ForgotPassword;
