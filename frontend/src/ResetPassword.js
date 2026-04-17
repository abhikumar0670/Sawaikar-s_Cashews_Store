import React, { useState } from 'react';
import styled from 'styled-components';
import { useSignIn } from '@clerk/clerk-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiLock, FiEye, FiEyeOff, FiArrowRight, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

const ResetPassword = () => {
  const { signIn, isLoaded } = useSignIn();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);

  const checkPasswordStrength = (pwd) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;
    setPasswordStrength(strength);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 1) return '#FF6B6B';
    if (passwordStrength === 2) return '#FFA500';
    if (passwordStrength === 3) return '#FFD700';
    return '#4CAF50';
  };

  const getPasswordStrengthText = () => {
    if (!password) return '';
    if (passwordStrength <= 1) return 'Weak';
    if (passwordStrength === 2) return 'Fair';
    if (passwordStrength === 3) return 'Good';
    return 'Strong';
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    checkPasswordStrength(value);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLoaded || loading) return;

    // Validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
      setError('Password must contain both uppercase and lowercase letters');
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await signIn.resetPassword({
        password: password,
      });

      if (result.status === 'complete') {
        navigate('/sign-in', { replace: true, state: { message: 'Password reset successful! Please sign in.' } });
      }
    } catch (err) {
      console.error('Password reset error details:', err);
      let errorMsg = 'Failed to reset password. Please try again.';
      
      if (err.errors && err.errors.length > 0) {
        errorMsg = err.errors[0].message;
      } else if (err.message) {
        errorMsg = err.message;
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
            <h2>Set New Password</h2>
            <p>Create a strong password to secure your account</p>
          </HeritageText>

          <Features>
            <Feature>
              <FeatureIcon>✓</FeatureIcon>
              <div>
                <h4>Strong Security</h4>
                <p>Your password is encrypted and secure</p>
              </div>
            </Feature>
            <Feature>
              <FeatureIcon>✓</FeatureIcon>
              <div>
                <h4>Easy to Remember</h4>
                <p>Create a password that's strong yet memorable</p>
              </div>
            </Feature>
            <Feature>
              <FeatureIcon>✓</FeatureIcon>
              <div>
                <h4>Instant Access</h4>
                <p>Regain access to your Sawaikar's account immediately</p>
              </div>
            </Feature>
          </Features>

          <TestimonialBox>
            <Quote>
              "Love the security measures. My account feels completely safe!"
            </Quote>
            <Author>
              <strong>Meera Singh</strong>
              <span>Delhi</span>
            </Author>
          </TestimonialBox>
        </BrandContent>
      </LeftSection>

      {/* Right Side - Form */}
      <RightSection>
        <FormContainer>
          <FormHeader>
            <Title>Create New Password</Title>
            <Subtitle>Make sure it's strong and unique</Subtitle>
          </FormHeader>

          {error && (
            <ErrorBox>
              <FiAlertCircle />
              <span>{error}</span>
            </ErrorBox>
          )}

          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label htmlFor="password">
                New Password
                {password && (
                  <PasswordStrength strength={passwordStrength}>
                    <StrengthBar bgColor={getPasswordStrengthColor()} />
                    <StrengthText>{getPasswordStrengthText()}</StrengthText>
                  </PasswordStrength>
                )}
              </Label>
              <InputWrapper>
                <FiLock className="icon" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="At least 8 characters"
                  disabled={loading}
                  required
                />
                <ToggleButton
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </ToggleButton>
              </InputWrapper>
              <PasswordHint>
                • At least 8 characters<br/>
                • Mix of uppercase and lowercase letters<br/>
                • Numbers and symbols for extra security
              </PasswordHint>
            </FormGroup>

            <FormGroup>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <InputWrapper>
                <FiLock className="icon" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  disabled={loading}
                  required
                />
                <ToggleButton
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </ToggleButton>
              </InputWrapper>
            </FormGroup>

            <SubmitButton type="submit" disabled={loading}>
              {loading ? 'Resetting password...' : (
                <>
                  Reset Password <FiArrowRight />
                </>
              )}
            </SubmitButton>
          </Form>

          <FormFooter>
            <p>
              Remember your old password?{' '}
              <SignInLink href="/sign-in">Sign in here</SignInLink>
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
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const PasswordStrength = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-size: 1.2rem;
`;

const StrengthBar = styled.div`
  width: 8rem;
  height: 0.4rem;
  background: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;

  &::after {
    content: '';
    display: block;
    height: 100%;
    width: ${props => ((props.strength || 0) / 4) * 100}%;
    background: ${props => props.bgColor || '#FF6B6B'};
    transition: width 0.3s ease;
  }
`;

const StrengthText = styled.span`
  font-size: 1.2rem;
  font-weight: 600;
  color: ${props => props.color || '#FF6B6B'};
  min-width: 5rem;
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
  padding: 1.4rem 4rem 1.4rem 4rem;
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

const ToggleButton = styled.button`
  position: absolute;
  right: 1.5rem;
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.3s ease;

  &:hover:not(:disabled) {
    color: #FF9800;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  svg {
    width: 2rem;
    height: 2rem;
  }
`;

const PasswordHint = styled.p`
  font-size: 1.2rem;
  color: #999;
  line-height: 1.6;
  margin: 0;
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
  margin-top: 1rem;

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

const FormFooter = styled.div`
  text-align: center;
  margin-top: 2rem;

  p {
    font-size: 1.3rem;
    color: #666;

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

export default ResetPassword;
