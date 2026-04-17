import styled from "styled-components";

export const Button = styled.button`
  text-decoration: none;
  max-width: auto;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary} 0%, ${({ theme }) => theme.colors.primaryDark} 100%);
  color: ${({ theme }) => theme.colors.bgLight};
  padding: 1.6rem 3.2rem;
  border: none;
  text-transform: uppercase;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  font-size: 1.5rem;
  box-shadow: ${({ theme }) => theme.colors.shadowMedium};
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, ${({ theme }) => theme.colors.primaryDark} 0%, ${({ theme }) => theme.colors.primary} 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(245, 241, 232, 0.2);
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.colors.shadowLarge};
    
    &::before {
      opacity: 1;
    }
  }
  
  &:active {
    transform: translateY(0);
    
    &::after {
      width: 300px;
      height: 300px;
    }
  }

  a {
    text-decoration: none;
    color: ${({ theme }) => theme.colors.bgLight};
    font-size: 1.5rem;
    position: relative;
    z-index: 1;
  }
  
  /* Secondary Button Variant */
  &.btn-secondary {
    background: ${({ theme }) => theme.colors.bgLight};
    color: ${({ theme }) => theme.colors.primary};
    border: 2px solid ${({ theme }) => theme.colors.primary};
    
    &::before {
      background: ${({ theme }) => theme.colors.primary};
    }
    
    &:hover {
      color: ${({ theme }) => theme.colors.bgLight};
    }
  }
  
  /* Outline Button Variant */
  &.btn-outline {
    background: transparent;
    color: ${({ theme }) => theme.colors.primary};
    border: 2px solid ${({ theme }) => theme.colors.primary};
    box-shadow: none;
    
    &::before {
      background: ${({ theme }) => theme.colors.primary};
    }
    
    &:hover {
      color: ${({ theme }) => theme.colors.bgLight};
      box-shadow: ${({ theme }) => theme.colors.shadowMedium};
    }
  }
`;
