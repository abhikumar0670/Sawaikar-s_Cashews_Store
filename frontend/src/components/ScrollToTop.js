import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { FiArrowUp } from 'react-icons/fi';

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Show button when page is scrolled down
  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  // Scroll to top smoothly
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  return (
    <ScrollButton
      onClick={scrollToTop}
      className={isVisible ? 'visible' : ''}
      aria-label="Scroll to top"
    >
      <FiArrowUp />
    </ScrollButton>
  );
};

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const pulse = keyframes`
  0%, 100% {
    box-shadow: 0 4px 16px rgba(139, 111, 71, 0.3);
  }
  50% {
    box-shadow: 0 6px 24px rgba(139, 111, 71, 0.5);
  }
`;

const ScrollButton = styled.button`
  position: fixed;
  bottom: 40px;
  right: 40px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8B6F47, #C19A6B);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.4rem;
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transform: translateY(20px) scale(0.8);
  transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
  box-shadow: 0 4px 16px rgba(139, 111, 71, 0.3);

  &.visible {
    opacity: 1;
    visibility: visible;
    transform: translateY(0) scale(1);
    animation: ${fadeIn} 0.3s ease-out;
  }

  &:hover {
    transform: translateY(-4px) scale(1.05);
    box-shadow: 0 8px 28px rgba(139, 111, 71, 0.4);
    animation: ${pulse} 1.5s infinite;
  }

  &:active {
    transform: translateY(-2px) scale(0.98);
  }

  svg {
    transition: transform 0.3s ease;
  }

  &:hover svg {
    transform: translateY(-3px);
  }

  @media (max-width: 768px) {
    bottom: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
    font-size: 2rem;
  }
`;

export default ScrollToTop;
