import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';

// Flying product animation
const flyToCart = (startX, startY, endX, endY) => keyframes`
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  50% {
    transform: translate(${(endX - startX) / 2}px, ${(endY - startY) / 2}px) scale(0.8);
    opacity: 0.8;
  }
  100% {
    transform: translate(${endX - startX}px, ${endY - startY}px) scale(0.3);
    opacity: 0;
  }
`;

// Cart icon bounce animation
const cartBounce = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  25% {
    transform: scale(1.2);
  }
  50% {
    transform: scale(0.95);
  }
  75% {
    transform: scale(1.1);
  }
`;

// Success pulse animation
const successPulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.3);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
`;

const AddToCartAnimation = ({ trigger, productImage, onComplete }) => {
  const [cartPosition, setCartPosition] = useState({ x: 0, y: 0 });
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!trigger) return;

    // Get cart icon position
    const cartIcon = document.querySelector('.cart-icon-target') || document.querySelector('[data-cart-icon]');
    if (cartIcon) {
      const rect = cartIcon.getBoundingClientRect();
      setCartPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      });
    }

    // Set start position to center of viewport
    setStartPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    });

    setIsAnimating(true);

    // Animation duration
    const timer = setTimeout(() => {
      setIsAnimating(false);
      if (onComplete) onComplete();
    }, 800);

    return () => clearTimeout(timer);
  }, [trigger, onComplete]);

  if (!isAnimating || !trigger) return null;

  return (
    <AnimationWrapper
      startX={startPosition?.x || 0}
      startY={startPosition?.y || 0}
      endX={cartPosition?.x || 0}
      endY={cartPosition?.y || 0}
    >
      {productImage && <img src={productImage} alt="Product" className="flying-product" />}
    </AnimationWrapper>
  );
};

// Cart Icon Bounce Component (to be added to Header)
export const CartIconBounce = ({ trigger }) => {
  const [shouldBounce, setShouldBounce] = useState(false);

  useEffect(() => {
    if (trigger) {
      setShouldBounce(true);
      const timer = setTimeout(() => setShouldBounce(false), 600);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  return shouldBounce ? <BounceEffect /> : null;
};

// Success Checkmark Component
export const SuccessCheckmark = ({ show }) => {
  if (!show) return null;

  return (
    <CheckmarkWrapper>
      <svg className="checkmark" viewBox="0 0 52 52">
        <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
        <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
      </svg>
    </CheckmarkWrapper>
  );
};

const AnimationWrapper = styled.div`
  position: fixed;
  left: ${props => props.startX}px;
  top: ${props => props.startY}px;
  z-index: 9999;
  pointer-events: none;

  .flying-product {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    animation: ${props => flyToCart(props.startX, props.startY, props.endX, props.endY)} 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  }
`;

const BounceEffect = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  animation: ${cartBounce} 0.6s ease-in-out;
`;

const CheckmarkWrapper = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10000;
  pointer-events: none;

  .checkmark {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    display: block;
    stroke-width: 3;
    stroke: #10b981;
    stroke-miterlimit: 10;
    box-shadow: inset 0 0 0 #10b981;
    animation: ${successPulse} 0.8s ease-in-out;
  }

  .checkmark-circle {
    stroke-dasharray: 166;
    stroke-dashoffset: 166;
    stroke-width: 3;
    stroke-miterlimit: 10;
    stroke: #10b981;
    fill: white;
    animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
  }

  .checkmark-check {
    transform-origin: 50% 50%;
    stroke-dasharray: 48;
    stroke-dashoffset: 48;
    animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.3s forwards;
  }

  @keyframes stroke {
    100% {
      stroke-dashoffset: 0;
    }
  }
`;

export default AddToCartAnimation;
