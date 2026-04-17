import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useSignUp } from '@clerk/clerk-react';
import { useNavigate, Link } from 'react-router-dom';
import { FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiArrowRight, FiAlertCircle, FiCheckCircle, FiRefreshCw } from 'react-icons/fi';

const CustomSignUp = () => {
  const { signUp, isLoaded, setActive } = useSignUp();
  const navigate = useNavigate();

  // Form states
  const [step, setStep] = useState('signup'); // 'signup' | 'verify'
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const checkPasswordStrength = (pwd) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;
    setPasswordStrength(strength);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'password') {
      checkPasswordStrength(value);
    }
    setError('');
  };

  const parseClerkError = (err) => {
    let errorMsg = 'Something went wrong. Please try again.';
    let shouldRedirectToSignIn = false;

    if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
      const firstError = err.errors[0];
      const code = firstError.code;
      const message = firstError.message || '';
      const longMessage = firstError.longMessage || '';

      // Handle specific Clerk error codes
      const errorMessages = {
        'form_param_unknown': `Field "${firstError.meta?.paramName || 'unknown'}" is not supported.`,
        'form_identifier_exists': 'An account with this email already exists.',
        'form_username_invalid_character': 'Username can only contain letters, numbers, and underscores.',
        'form_username_invalid_length': 'Username must be between 3 and 20 characters.',
        'form_username_exists': 'This username is already taken. Please choose another.',
        'form_password_pwned': 'This password has been found in a data breach. Please choose a different password.',
        'form_password_length_too_short': 'Password must be at least 8 characters long.',
        'form_password_not_strong_enough': 'Password is not strong enough. Add uppercase, numbers, or symbols.',
        'form_code_incorrect': 'Invalid verification code. Please check and try again.',
        'verification_expired': 'Verification code expired. Please request a new one.',
        'verification_already_verified': 'Email already verified! Please sign in.',
        'verification_failed': 'Verification failed. Please request a new code.',
        'identifier_already_signed_in': 'You are already signed in.',
        'too_many_requests': 'Too many attempts. Please wait a moment and try again.',
        'session_exists': 'You already have an active session.',
        'not_allowed_access': 'Access not allowed. Please try again.',
        'form_param_nil': 'Missing required information. Please fill all fields.',
      };

      // Check for already verified scenario in various ways
      const isAlreadyVerified =
        code === 'verification_already_verified' ||
        message.toLowerCase().includes('already been verified') ||
        message.toLowerCase().includes('already verified') ||
        longMessage.toLowerCase().includes('already been verified') ||
        longMessage.toLowerCase().includes('already verified');

      const isExistingAccount = code === 'form_identifier_exists';

      if (isAlreadyVerified) {
        shouldRedirectToSignIn = true;
        errorMsg = 'Email already verified! Redirecting to sign in...';
      } else if (isExistingAccount) {
        shouldRedirectToSignIn = true;
        errorMsg = 'An account with this email already exists. Redirecting to sign in...';
      } else if (errorMessages[code]) {
        errorMsg = errorMessages[code];
      } else if (longMessage && longMessage !== 'is unknown') {
        errorMsg = longMessage;
      } else if (message && message !== 'is unknown') {
        errorMsg = message;
      }
    } else if (err.message) {
      errorMsg = err.message;
      if (errorMsg.toLowerCase().includes('already') && errorMsg.toLowerCase().includes('verified')) {
        shouldRedirectToSignIn = true;
        errorMsg = 'Email already verified! Redirecting to sign in...';
      }
    }

    return { errorMsg, shouldRedirectToSignIn };
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!isLoaded || loading) return;

    // Validation
    if (!formData.firstName.trim()) {
      setError('Please enter your first name');
      return;
    }

    if (!formData.username.trim()) {
      setError('Please choose a username');
      return;
    }

    // Username format validation
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username.trim())) {
      setError('Username can only contain letters, numbers, and underscores');
      return;
    }

    if (formData.username.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (!formData.email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!agreedToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create sign-up
      const signUpParams = {
        emailAddress: formData.email.trim(),
        password: formData.password,
        username: formData.username.trim(),
      };

      // Add name fields if provided
      if (formData.firstName.trim()) {
        signUpParams.firstName = formData.firstName.trim();
      }
      if (formData.lastName.trim()) {
        signUpParams.lastName = formData.lastName.trim();
      }

      const result = await signUp.create(signUpParams);

      if (result.status === 'complete') {
        // No email verification required - sign in directly
        await setActive({ session: result.createdSessionId });
        setSuccessMessage('Account created successfully! Redirecting...');
        setTimeout(() => navigate('/'), 1500);
      } else {
        // Email verification required - prepare and send code
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        setStep('verify');
        setSuccessMessage(`Verification code sent to ${formData.email}`);
      }
    } catch (err) {
      const { errorMsg, shouldRedirectToSignIn } = parseClerkError(err);
      setError(errorMsg);

      if (shouldRedirectToSignIn) {
        setTimeout(() => navigate('/sign-in'), 2000);
      }

      console.error('Sign-up error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e) => {
    e.preventDefault();
    if (!isLoaded || loading) return;

    // Check if signUp object is available
    if (!signUp) {
      setError('Session expired. Please start the sign-up process again.');
      setTimeout(() => {
        setStep('signup');
        setFormData({ firstName: '', lastName: '', username: '', email: '', password: '', confirmPassword: '' });
      }, 2000);
      return;
    }

    if (!verificationCode.trim() || verificationCode.length < 6) {
      setError('Please enter a valid 6-digit verification code');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode.trim(),
      });

      console.log('Verification result:', result.status, result);

      if (result.status === 'complete') {
        // Verification complete - activate session
        if (result.createdSessionId) {
          await setActive({ session: result.createdSessionId });
          setSuccessMessage('Account created successfully! Redirecting...');
          setTimeout(() => navigate('/'), 1500);
        } else {
          // Session should exist but doesn't - redirect to sign in
          setSuccessMessage('Account created! Please sign in.');
          setTimeout(() => navigate('/sign-in'), 2000);
        }
      } else if (result.status === 'missing_requirements') {
        // Check what's missing
        const missing = result.missingFields || [];
        console.log('Missing requirements:', missing);

        if (missing.length > 0) {
          setError(`Additional information required: ${missing.join(', ')}`);
        } else {
          // Try to complete anyway
          setSuccessMessage('Almost done! Please sign in to continue.');
          setTimeout(() => navigate('/sign-in'), 2000);
        }
      } else {
        // Other status - log and try sign in
        console.log('Unexpected status:', result.status);
        setSuccessMessage('Verification processed. Please sign in.');
        setTimeout(() => navigate('/sign-in'), 2000);
      }
    } catch (err) {
      console.error('Verification error:', err);
      const { errorMsg, shouldRedirectToSignIn } = parseClerkError(err);

      // Check if this is an "already verified" type error
      if (shouldRedirectToSignIn) {
        setSuccessMessage(errorMsg);
        setError('');
        setTimeout(() => navigate('/sign-in'), 2000);
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded || loading) return;

    // Check if signUp object is available
    if (!signUp) {
      setError('Session expired. Please start the sign-up process again.');
      setTimeout(() => {
        setStep('signup');
        setFormData({ firstName: '', lastName: '', username: '', email: '', password: '', confirmPassword: '' });
      }, 2000);
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setSuccessMessage('New verification code sent! Check your email.');
      setVerificationCode('');
    } catch (err) {
      console.error('Resend code error:', err);
      const { errorMsg, shouldRedirectToSignIn } = parseClerkError(err);

      if (shouldRedirectToSignIn) {
        setSuccessMessage(errorMsg);
        setError('');
        setTimeout(() => navigate('/sign-in'), 2000);
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (!isLoaded || loading) return;

    try {
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/',
      });
    } catch (err) {
      const { errorMsg } = parseClerkError(err);
      setError(errorMsg);
      console.error('Google sign-up error:', err);
    }
  };

  const getPasswordStrengthLabel = () => {
    if (!formData.password) return '';
    const labels = ['Weak', 'Fair', 'Good', 'Strong'];
    return labels[Math.min(passwordStrength, 3)];
  };

  const getPasswordStrengthColor = () => {
    const colors = ['#ef4444', '#f59e0b', '#eab308', '#22c55e'];
    return colors[Math.min(passwordStrength, 3)] || '#e5e7eb';
  };

  // Verification Step UI
  if (step === 'verify') {
    return (
      <VerificationWrapper>
        <VerificationContainer>
          <VerificationCard>
            <IconWrapper>
              <FiMail size={40} />
            </IconWrapper>

            <VerifyTitle>Verify Your Email</VerifyTitle>
            <VerifySubtitle>
              We've sent a 6-digit verification code to<br />
              <EmailHighlight>{formData.email}</EmailHighlight>
            </VerifySubtitle>

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

            <VerifyForm onSubmit={handleVerification}>
              <CodeInputGroup>
                <CodeLabel>Enter Verification Code</CodeLabel>
                <CodeInput
                  type="text"
                  value={verificationCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setVerificationCode(val);
                    setError('');
                  }}
                  placeholder="000000"
                  maxLength={6}
                  disabled={loading}
                  autoFocus
                  autoComplete="one-time-code"
                />
                <CodeHint>Check your email inbox and spam folder</CodeHint>
              </CodeInputGroup>

              <VerifyButton type="submit" disabled={loading || verificationCode.length < 6}>
                {loading ? (
                  <>
                    <Spinner /> Verifying...
                  </>
                ) : (
                  <>
                    Verify & Continue <FiArrowRight />
                  </>
                )}
              </VerifyButton>
            </VerifyForm>

            <ResendSection>
              <ResendText>Didn't receive the code?</ResendText>
              <ResendButton type="button" onClick={handleResendCode} disabled={loading}>
                <FiRefreshCw size={14} /> Resend Code
              </ResendButton>
            </ResendSection>

            <Divider style={{ margin: '2rem 0' }}>
              <DividerLine />
            </Divider>

            <BackLink onClick={() => setStep('signup')}>
              ← Back to Sign Up
            </BackLink>
          </VerificationCard>
        </VerificationContainer>
      </VerificationWrapper>
    );
  }

  // Sign Up Form UI
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
              <BrandTitle>Join Sawaikar's<br />Family</BrandTitle>
              <BrandSubtitle>Premium Goan Cashews Since 1986</BrandSubtitle>

              <BenefitsList>
                <BenefitItem delay="0.4s">
                  <BenefitIcon delay="0s">✓</BenefitIcon>
                  <BenefitContent>
                    <BenefitTitle>Welcome Bonus</BenefitTitle>
                    <BenefitDesc>Get 100 loyalty points on signup</BenefitDesc>
                  </BenefitContent>
                </BenefitItem>
                <BenefitItem delay="0.5s">
                  <BenefitIcon delay="0.2s">✓</BenefitIcon>
                  <BenefitContent>
                    <BenefitTitle>Free Delivery</BenefitTitle>
                    <BenefitDesc>On orders above ₹2000</BenefitDesc>
                  </BenefitContent>
                </BenefitItem>
                <BenefitItem delay="0.6s">
                  <BenefitIcon delay="0.4s">✓</BenefitIcon>
                  <BenefitContent>
                    <BenefitTitle>Earn Rewards</BenefitTitle>
                    <BenefitDesc>Points on every purchase</BenefitDesc>
                  </BenefitContent>
                </BenefitItem>
                <BenefitItem delay="0.7s">
                  <BenefitIcon delay="0.6s">✓</BenefitIcon>
                  <BenefitContent>
                    <BenefitTitle>Refer & Earn</BenefitTitle>
                    <BenefitDesc>Get rewards when friends join</BenefitDesc>
                  </BenefitContent>
                </BenefitItem>
              </BenefitsList>
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
            <Title>Create Account</Title>
            <Subtitle>Start your premium cashew journey</Subtitle>
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

          {/* Google Sign Up */}
          <GoogleButton type="button" onClick={handleGoogleSignUp} disabled={loading}>
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
            <DividerText>or sign up with email</DividerText>
            <DividerLine />
          </Divider>

          <Form onSubmit={handleSignUp}>
            <NameRow>
              <FormGroup>
                <Label htmlFor="firstName">First Name *</Label>
                <InputWrapper>
                  <InputIcon><FiUser /></InputIcon>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Enter first name"
                    disabled={loading}
                    required
                  />
                </InputWrapper>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="lastName">Last Name</Label>
                <InputWrapper>
                  <InputIcon><FiUser /></InputIcon>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Enter last name"
                    disabled={loading}
                  />
                </InputWrapper>
              </FormGroup>
            </NameRow>

            <FormGroup>
              <Label htmlFor="username">Username *</Label>
              <InputWrapper>
                <InputIcon><FiUser /></InputIcon>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Choose a username"
                  disabled={loading}
                  required
                />
              </InputWrapper>
              <FieldHint>Letters, numbers, and underscores only</FieldHint>
            </FormGroup>

            <FormGroup>
              <Label htmlFor="email">Email Address *</Label>
              <InputWrapper>
                <InputIcon><FiMail /></InputIcon>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  disabled={loading}
                  required
                />
              </InputWrapper>
            </FormGroup>

            <FormGroup>
              <LabelRow>
                <Label htmlFor="password">Password *</Label>
                {formData.password && (
                  <PasswordStrength>
                    <StrengthDots>
                      {[1, 2, 3, 4].map((i) => (
                        <StrengthDot key={i} $active={passwordStrength >= i} $color={getPasswordStrengthColor()} />
                      ))}
                    </StrengthDots>
                    <StrengthLabel $color={getPasswordStrengthColor()}>{getPasswordStrengthLabel()}</StrengthLabel>
                  </PasswordStrength>
                )}
              </LabelRow>
              <InputWrapper>
                <InputIcon><FiLock /></InputIcon>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  disabled={loading}
                  required
                />
                <TogglePassword type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </TogglePassword>
              </InputWrapper>
              <PasswordHint>Minimum 8 characters with letters and numbers</PasswordHint>
            </FormGroup>

            <FormGroup>
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <InputWrapper>
                <InputIcon><FiLock /></InputIcon>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  disabled={loading}
                  required
                />
                <TogglePassword type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </TogglePassword>
              </InputWrapper>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <FieldError>Passwords don't match</FieldError>
              )}
            </FormGroup>

            <CheckboxWrapper>
              <Checkbox
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                disabled={loading}
              />
              <CheckboxLabel htmlFor="terms">
                I agree to the <TermsLink to="/terms">Terms of Service</TermsLink> and{' '}
                <TermsLink to="/privacy">Privacy Policy</TermsLink>
              </CheckboxLabel>
            </CheckboxWrapper>

            <PrimaryButton type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Spinner /> Creating Account...
                </>
              ) : (
                <>
                  Create Account <FiArrowRight />
                </>
              )}
            </PrimaryButton>
          </Form>

          <SignInPrompt>
            Already have an account? <SignInLink to="/sign-in">Sign In</SignInLink>
          </SignInPrompt>

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

const BenefitsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
`;

const BenefitItem = styled.div`
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

const BenefitIcon = styled.div`
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

const BenefitContent = styled.div``;

const BenefitTitle = styled.h4`
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: 0.2rem;
  color: #FFFFFF;
`;

const BenefitDesc = styled.p`
  font-size: 1.2rem;
  opacity: 0.9;
  color: rgba(255, 255, 255, 0.85);
`;

const LeftPanelFooter = styled.div`
  position: relative;
  z-index: 2;
  padding: 1.5rem 3rem 2rem 3rem;
  text-align: center;
  animation: ${slideInLeft} 0.6s ease-out 0.7s both;
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
  max-width: 480px;
  animation: ${fadeIn} 0.6s ease-out 0.3s both;
`;

// Verification Page Styles - Full page centered
const VerificationWrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(145deg, var(--primary-color) 0%, #A68A5E 30%, var(--primary-dark) 70%, #4A3828 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;

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
    pointer-events: none;
  }
`;

const VerificationContainer = styled.div`
  width: 100%;
  max-width: 460px;
  position: relative;
  z-index: 1;
`;

const VerificationCard = styled.div`
  background: white;
  padding: 3rem;
  border-radius: 24px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  text-align: center;
  animation: ${fadeIn} 0.5s ease-out;
`;

const IconWrapper = styled.div`
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  color: white;
  box-shadow: 0 8px 25px rgba(139, 111, 71, 0.35);
`;

const VerifyTitle = styled.h1`
  font-size: 2.2rem;
  font-weight: 700;
  color: var(--text-dark);
  margin-bottom: 0.8rem;
`;

const VerifySubtitle = styled.p`
  font-size: 1.4rem;
  color: var(--text-medium);
  line-height: 1.6;
  margin-bottom: 2rem;
`;

const EmailHighlight = styled.strong`
  color: var(--primary-color);
  font-weight: 600;
`;

const VerifyForm = styled.form`
  margin-bottom: 1.5rem;
`;

const CodeInputGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const CodeLabel = styled.label`
  display: block;
  font-size: 1.3rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.8rem;
  text-align: left;
`;

const CodeInput = styled.input`
  width: 100%;
  padding: 1.5rem;
  border: 2px solid #E8E4DF;
  border-radius: 12px;
  font-size: 2.4rem;
  font-family: 'SF Mono', 'Consolas', monospace;
  text-align: center;
  letter-spacing: 0.8rem;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: var(--bg-cream);

  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 4px rgba(139, 111, 71, 0.1);
    background: white;
  }

  &::placeholder {
    letter-spacing: 0.8rem;
    color: var(--text-light);
  }

  &:disabled {
    background: var(--bg-beige);
    cursor: not-allowed;
  }
`;

const CodeHint = styled.p`
  font-size: 1.2rem;
  color: var(--text-light);
  margin-top: 0.8rem;
  text-align: center;
`;

const VerifyButton = styled.button`
  width: 100%;
  padding: 1.5rem;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.6rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 15px rgba(139, 111, 71, 0.25);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(139, 111, 71, 0.35);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
`;

const ResendSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
`;

const ResendText = styled.span`
  font-size: 1.4rem;
  color: var(--text-medium);
`;

const ResendButton = styled.button`
  background: none;
  border: none;
  color: var(--primary-color);
  font-size: 1.4rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: rgba(139, 111, 71, 0.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    transition: transform 0.3s ease;
  }

  &:hover:not(:disabled) svg {
    transform: rotate(180deg);
  }
`;

const BackLink = styled.button`
  background: none;
  border: none;
  color: var(--text-medium);
  font-size: 1.4rem;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    color: var(--text-dark);
    background: var(--bg-beige);
  }
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
  align-items: flex-start;
  gap: 1rem;
  padding: 1.3rem 1.6rem;
  border-radius: 14px;
  margin-bottom: 1.5rem;
  font-size: 1.4rem;
  text-align: left;
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
    margin-top: 0.1rem;
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

const NameRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
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

const PasswordHint = styled.span`
  font-size: 1.2rem;
  color: var(--text-light);
`;

const FieldHint = styled.span`
  font-size: 1.2rem;
  color: var(--text-light);
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

const PasswordStrength = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
`;

const StrengthDots = styled.div`
  display: flex;
  gap: 4px;
`;

const StrengthDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $active, $color }) => $active ? $color : '#e5e7eb'};
  transition: background 0.2s ease;
`;

const StrengthLabel = styled.span`
  font-size: 1.2rem;
  font-weight: 500;
  color: ${({ $color }) => $color};
`;

const FieldError = styled.span`
  font-size: 1.2rem;
  color: #dc2626;
  margin-top: 0.3rem;
`;

const CheckboxWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
`;

const Checkbox = styled.input`
  width: 1.8rem;
  height: 1.8rem;
  margin-top: 0.2rem;
  accent-color: var(--primary-color);
  cursor: pointer;
`;

const CheckboxLabel = styled.label`
  font-size: 1.3rem;
  color: var(--text-medium);
  line-height: 1.5;
  cursor: pointer;
`;

const TermsLink = styled(Link)`
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;

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

const SignInPrompt = styled.p`
  text-align: center;
  font-size: 1.4rem;
  color: var(--text-medium);
  margin-top: 2rem;
`;

const SignInLink = styled(Link)`
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

export default CustomSignUp;
