import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';

const Confetti = ({ trigger, duration = 3000 }) => {
  const [pieces, setPieces] = useState([]);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (trigger) {
      setIsActive(true);
      
      // Generate confetti pieces
      const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 2,
        color: getRandomColor(),
        rotation: Math.random() * 360,
        size: 8 + Math.random() * 8
      }));
      
      setPieces(confettiPieces);

      // Clear confetti after duration
      const timer = setTimeout(() => {
        setIsActive(false);
        setPieces([]);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [trigger, duration]);

  const getRandomColor = () => {
    const colors = [
      '#8B6F47', // Primary brown
      '#C19A6B', // Gold
      '#10b981', // Green
      '#f59e0b', // Orange
      '#ef4444', // Red
      '#3b82f6', // Blue
      '#8b5cf6', // Purple
      '#ec4899'  // Pink
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  if (!isActive) return null;

  return (
    <ConfettiWrapper>
      {pieces.map(piece => (
        <ConfettiPiece
          key={piece.id}
          left={piece.left}
          delay={piece.delay}
          duration={piece.duration}
          color={piece.color}
          rotation={piece.rotation}
          size={piece.size}
        />
      ))}
    </ConfettiWrapper>
  );
};

const fall = keyframes`
  0% {
    transform: translateY(-100vh) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
`;

const ConfettiWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 99999;
  overflow: hidden;
`;

const ConfettiPiece = styled.div`
  position: absolute;
  top: -10px;
  left: ${props => props.left}%;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  background: ${props => props.color};
  opacity: 0.9;
  animation: ${fall} ${props => props.duration}s linear ${props => props.delay}s forwards;
  transform: rotate(${props => props.rotation}deg);
  border-radius: 2px;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: inherit;
    border-radius: inherit;
    filter: brightness(1.2);
  }
`;

export default Confetti;
