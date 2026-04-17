import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useLocation } from 'react-router-dom';

const LoadingBar = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const location = useLocation();

  useEffect(() => {
    // Start loading on route change
    setIsLoading(true);
    setProgress(10);

    // Simulate smooth progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 85) {
          clearInterval(interval);
          return 85;
        }
        return prev + Math.random() * 20;
      });
    }, 200);

    // Complete loading after a short delay
    const timer = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 300);
    }, 800);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [location.pathname]);

  if (!isLoading) return null;

  return (
    <LoadingBarWrapper>
      <ProgressBar style={{ width: `${progress}%` }} />
    </LoadingBarWrapper>
  );
};

const shimmer = keyframes`
  0% { background-position: -1000% 0%; }
  100% { background-position: 1000% 0%; }
`;

const LoadingBarWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  z-index: 99999;
  background: transparent;
  will-change: opacity;
`;

const ProgressBar = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #8B6F47, #C19A6B, #8B6F47);
  background-size: 200% 100%;
  animation: ${shimmer} 2s infinite;
  transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 10px rgba(139, 111, 71, 0.5);
  will-change: width;
`;

export default LoadingBar;
