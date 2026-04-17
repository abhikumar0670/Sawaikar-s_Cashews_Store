import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiX, FiChevronRight, FiChevronLeft, FiCheckCircle } from 'react-icons/fi';
import { NavLink } from 'react-router-dom';

const WelcomeTour = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const steps = [
    {
      title: "Welcome to Sawaikar's Premium Cashews",
      description: "Discover authentic Goan cashews, hand-roasted to perfection since 1985. Let's take you through our premium offerings.",
      icon: '🌰',
      highlight: null
    },
    {
      title: "Browse Premium Products",
      description: "Explore our carefully curated selection of handpicked cashews with various roasting styles and package sizes.",
      icon: '🛍️',
      highlight: null
    },
    {
      title: "Find Your Perfect Match",
      description: "Use our Cashew Match Quiz to discover the perfect cashew variety that matches your taste preferences.",
      icon: '🎯',
      highlight: null
    },
    {
      title: "Learn Our Legacy",
      description: "From Goa orchards to your home - understand our meticulous 4-step process ensuring premium quality.",
      icon: '📖',
      highlight: null
    },
    {
      title: "Smart Bundles & Savings",
      description: "Mix and match our curated bundles and enjoy special deals and discounts on bulk orders.",
      icon: '💝',
      highlight: null
    },
    {
      title: "Trusted by Thousands",
      description: "Join our community of satisfied customers across India. Free shipping on orders above ₹2000!",
      icon: '⭐',
      highlight: null
    },
    {
      title: "Ready to Shop?",
      description: "Sign up or log in to start shopping. Create your account in seconds and begin your premium cashew journey.",
      icon: '🚀',
      highlight: null,
      isLast: true
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    // Only save tour as "seen" if they completed it by clicking "Start Shopping" on last step
    const isCompletedTour = currentStep === steps.length - 1;
    if (isCompletedTour) {
      localStorage.setItem('sawaikar_tour_completed', 'true');
    }
    setTimeout(onClose, 300);
  };

  const handleSkip = () => {
    setIsVisible(false);
    // DON'T save to localStorage on skip - tour will show again on next visit
    setTimeout(onClose, 300);
  };

  if (!isVisible) return null;

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <Wrapper>
      <Overlay onClick={handleSkip} />
      <ModalContainer>
        <Header>
          <ProgressBar>
            <Progress style={{ width: `${progress}%` }} />
          </ProgressBar>
          <CloseButton onClick={handleSkip}>
            <FiX />
          </CloseButton>
        </Header>

        <Content>
          <IconWrapper>{step.icon}</IconWrapper>
          
          <Title>{step.title}</Title>
          <Description>{step.description}</Description>

          <StepIndicator>
            {steps.map((_, index) => (
              <Dot 
                key={index} 
                isActive={index === currentStep}
                onClick={() => setCurrentStep(index)}
              />
            ))}
          </StepIndicator>
        </Content>

        <Footer>
          <ButtonGroup>
            {currentStep > 0 && (
              <Button variant="secondary" onClick={handlePrev}>
                <FiChevronLeft /> Previous
              </Button>
            )}
            
            <SkipButton onClick={handleSkip}>Skip Tour</SkipButton>

            {step.isLast ? (
              <NavLink to="/login" style={{ textDecoration: 'none', flex: 1 }}>
                <Button variant="primary" onClick={handleClose} style={{ width: '100%' }}>
                  Start Shopping <FiCheckCircle />
                </Button>
              </NavLink>
            ) : (
              <Button variant="primary" onClick={handleNext}>
                Next <FiChevronRight />
              </Button>
            )}
          </ButtonGroup>
        </Footer>
      </ModalContainer>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  cursor: pointer;
  backdrop-filter: blur(2px);
`;

const ModalContainer = styled.div`
  position: relative;
  background: #fff;
  border-radius: 2rem;
  width: 90%;
  max-width: 50rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  animation: slideUp 0.4s ease;

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(50px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 640px) {
    width: 95%;
    max-width: 100%;
    border-radius: 1.5rem;
  }
`;

const Header = styled.div`
  position: relative;
  padding: 2rem;
  background: linear-gradient(135deg, #8B4513 0%, #5D3A1A 100%);
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 0.4rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2rem;
  overflow: hidden;
`;

const Progress = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #FF9800 0%, #FF6B6B 100%);
  transition: width 0.5s ease;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  color: #fff;
  font-size: 2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.05);
  }
`;

const Content = styled.div`
  padding: 4rem 3rem;
  text-align: center;

  @media (max-width: 640px) {
    padding: 3rem 2rem;
  }
`;

const IconWrapper = styled.div`
  font-size: 6rem;
  margin-bottom: 2rem;
  animation: bounce 0.6s ease;

  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }
`;

const Title = styled.h2`
  font-size: 2.4rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 1rem;
  line-height: 1.3;
`;

const Description = styled.p`
  font-size: 1.5rem;
  color: #666;
  line-height: 1.8;
  margin-bottom: 3rem;
`;

const StepIndicator = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.8rem;
`;

const Dot = styled.button`
  width: 0.8rem;
  height: 0.8rem;
  border-radius: 50%;
  border: 2px solid #ddd;
  background: ${props => props.isActive ? '#8B4513' : '#fff'};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: #8B4513;
  }
`;

const Footer = styled.div`
  padding: 2rem 3rem;
  background: #f8f8f8;
  border-top: 1px solid #eee;

  @media (max-width: 640px) {
    padding: 2rem;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;

  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const Button = styled.button`
  padding: 1.2rem 2rem;
  border: none;
  border-radius: 0.8rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  transition: all 0.3s ease;
  white-space: nowrap;

  ${props => props.variant === 'primary' ? `
    background: linear-gradient(135deg, #FF9800 0%, #FF6B6B 100%);
    color: #fff;
    flex: 1;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(255, 107, 107, 0.3);
    }
  ` : `
    background: #fff;
    color: #8B4513;
    border: 2px solid #8B4513;

    &:hover {
      background: #f5f5f5;
    }
  `}

  @media (max-width: 640px) {
    width: 100%;
  }
`;

const SkipButton = styled.button`
  background: transparent;
  border: none;
  color: #999;
  font-size: 1.1rem;
  cursor: pointer;
  transition: color 0.3s ease;
  padding: 0.5rem 1rem;

  &:hover {
    color: #666;
  }
`;

export default WelcomeTour;
