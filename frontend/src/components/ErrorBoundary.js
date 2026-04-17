import React from 'react';
import styled from 'styled-components';
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorContainer>
          <ErrorCard>
            <IconWrapper>
              <FiAlertTriangle />
            </IconWrapper>
            <h1>Oops! Something went wrong</h1>
            <p>We're sorry for the inconvenience. The page encountered an unexpected error.</p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <ErrorDetails>
                <h3>Error Details (Development Only):</h3>
                <pre>{this.state.error.toString()}</pre>
                {this.state.errorInfo && (
                  <pre>{this.state.errorInfo.componentStack}</pre>
                )}
              </ErrorDetails>
            )}

            <ButtonGroup>
              <PrimaryButton onClick={this.handleReload}>
                <FiRefreshCw />
                Reload Page
              </PrimaryButton>
              <SecondaryButton onClick={this.handleGoHome}>
                <FiHome />
                Go to Homepage
              </SecondaryButton>
            </ButtonGroup>

            <HelpText>
              If this problem persists, please contact our support team at{' '}
              <a href="mailto:sawaikarcashewstore1980@gmail.com">
                sawaikarcashewstore1980@gmail.com
              </a>
            </HelpText>
          </ErrorCard>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

const ErrorContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fef7f0 0%, #fdf0e6 100%);
  padding: 20px;
`;

const ErrorCard = styled.div`
  background: white;
  border-radius: 20px;
  padding: 60px 40px;
  max-width: 600px;
  width: 100%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(139, 69, 19, 0.15);

  h1 {
    font-size: 32px;
    color: #2C2416;
    margin-bottom: 16px;
    font-weight: 700;
  }

  p {
    font-size: 16px;
    color: #5A4A3A;
    margin-bottom: 32px;
    line-height: 1.6;
  }

  @media (max-width: 768px) {
    padding: 40px 24px;

    h1 {
      font-size: 24px;
    }

    p {
      font-size: 14px;
    }
  }
`;

const IconWrapper = styled.div`
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;

  svg {
    font-size: 40px;
    color: white;
  }
`;

const ErrorDetails = styled.div`
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 16px;
  margin: 24px 0;
  text-align: left;
  max-height: 300px;
  overflow-y: auto;

  h3 {
    font-size: 14px;
    color: #495057;
    margin-bottom: 12px;
  }

  pre {
    font-size: 12px;
    color: #dc3545;
    white-space: pre-wrap;
    word-break: break-word;
    margin: 0;
    font-family: 'Courier New', monospace;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const PrimaryButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #8B4513, #A0522D);
  color: white;
  border: none;
  padding: 14px 28px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(139, 69, 19, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(139, 69, 19, 0.4);
  }

  svg {
    font-size: 18px;
  }
`;

const SecondaryButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  color: #8B4513;
  border: 2px solid #8B4513;
  padding: 14px 28px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #fef7f0;
    transform: translateY(-2px);
  }

  svg {
    font-size: 18px;
  }
`;

const HelpText = styled.p`
  font-size: 14px;
  color: #6c757d;
  margin-top: 24px;

  a {
    color: #8B4513;
    text-decoration: none;
    font-weight: 600;

    &:hover {
      text-decoration: underline;
    }
  }
`;

export default ErrorBoundary;
