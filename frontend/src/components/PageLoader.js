import React from 'react';
import styled, { keyframes } from 'styled-components';

const PageLoader = () => {
  return (
    <LoaderContainer>
      <LoaderContent>
        <CashewIcon>🥜</CashewIcon>
        <LoadingText>Loading...</LoadingText>
        <ProgressBar>
          <ProgressFill />
        </ProgressBar>
      </LoaderContent>
    </LoaderContainer>
  );
};

const bounce = keyframes`
  0%, 100% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  50% {
    transform: translateY(-20px) scale(1.1);
    opacity: 0.8;
  }
`;

const progress = keyframes`
  0% {
    width: 0%;
  }
  50% {
    width: 70%;
  }
  100% {
    width: 100%;
  }
`;

const LoaderContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fef7f0 0%, #fdf0e6 100%);
  background-attachment: fixed;
  will-change: contents;
`;

const LoaderContent = styled.div`
  text-align: center;
  will-change: transform;
`;

const CashewIcon = styled.div`
  font-size: 64px;
  animation: ${bounce} 1.5s ease-in-out infinite;
  margin-bottom: 24px;
  will-change: transform, opacity;
`;

const LoadingText = styled.p`
  font-size: 18px;
  color: #8B6F47;
  font-weight: 600;
  margin-bottom: 16px;
  letter-spacing: 0.5px;
  will-change: opacity;
`;

const ProgressBar = styled.div`
  width: 200px;
  height: 4px;
  background: rgba(139, 111, 71, 0.2);
  border-radius: 2px;
  overflow: hidden;
  margin: 0 auto;
  will-change: background-color;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #8B6F47, #C19A6B);
  border-radius: 2px;
  animation: ${progress} 2s ease-in-out infinite;
  will-change: width;
`;

export default PageLoader;
