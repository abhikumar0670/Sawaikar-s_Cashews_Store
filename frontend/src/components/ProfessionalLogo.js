import React from 'react';
import styled from 'styled-components';

const ProfessionalLogo = ({ size = 'medium', showText = true, variant = 'horizontal' }) => {
  const sizes = {
    small: { icon: 38, primary: '1.6rem', secondary: '0.85rem' },
    medium: { icon: 48, primary: '2rem', secondary: '1rem' },
    large: { icon: 64, primary: '2.6rem', secondary: '1.3rem' },
  };

  const currentSize = sizes[size] || sizes.medium;

  return (
    <LogoWrapper $variant={variant} $size={size}>
      {/* Modern Minimalist Cashew Icon */}
      <div className="logo-icon">
        <svg
          width={currentSize.icon}
          height={currentSize.icon}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Modern gradient - more subtle and premium */}
            <linearGradient id="modernCashewGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#A68A5E" />
              <stop offset="50%" stopColor="#8B6F47" />
              <stop offset="100%" stopColor="#6B5435" />
            </linearGradient>
            
            {/* Accent gradient for leaf */}
            <linearGradient id="modernLeafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4A7C59" />
              <stop offset="100%" stopColor="#3A6347" />
            </linearGradient>
            
            {/* Subtle shadow */}
            <filter id="softShadow">
              <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
              <feOffset dx="0" dy="2" result="offsetblur"/>
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.3"/>
              </feComponentTransfer>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Main cashew body - refined kidney shape */}
          <path
            d="M72 28C80 36 84 48 80 62C76 76 62 86 48 85C34 84 22 74 20 60C18 46 24 32 36 25C48 18 64 20 72 28Z"
            fill="url(#modernCashewGradient)"
            filter="url(#softShadow)"
          />
          
          {/* Inner highlight for depth */}
          <path
            d="M68 33C74 39 77 48 74 58C71 68 61 76 50 75C39 74 30 67 28 57"
            stroke="#FFFBF5"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.25"
          />
          
          {/* Modern leaf accent - simplified */}
          <path
            d="M30 20C35 15 43 14 48 17C44 17 36 18 30 20Z"
            fill="url(#modernLeafGradient)"
            opacity="0.9"
          />
          
          {/* Leaf vein detail */}
          <path
            d="M32 18L42 16"
            stroke="#3A6347"
            strokeWidth="0.8"
            strokeLinecap="round"
            opacity="0.5"
          />
          
          {/* Premium shine effect */}
          <ellipse
            cx="58"
            cy="42"
            rx="10"
            ry="6"
            fill="#FFFBF5"
            opacity="0.2"
            transform="rotate(-35 58 42)"
          />
          
          {/* Small accent shine */}
          <circle
            cx="52"
            cy="38"
            r="3"
            fill="#FFFBF5"
            opacity="0.3"
          />
        </svg>
      </div>

      {showText && (
        <div className="logo-text">
          <span className="brand-name">Sawaikar's</span>
          <span className="brand-tagline">PREMIUM CASHEWS</span>
        </div>
      )}
    </LogoWrapper>
  );
};

const LogoWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ $size }) => ($size === 'small' ? '1rem' : $size === 'large' ? '1.6rem' : '1.2rem')};
  flex-direction: ${({ $variant }) => ($variant === 'vertical' ? 'column' : 'row')};

  .logo-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(139, 111, 71, 0.08) 0%, rgba(139, 111, 71, 0.12) 100%);
    border-radius: 50%;
    padding: ${({ $size }) => ($size === 'small' ? '0.6rem' : $size === 'large' ? '1.2rem' : '0.8rem')};
    box-shadow: 
      0 4px 16px rgba(139, 111, 71, 0.12),
      inset 0 1px 3px rgba(255, 255, 255, 0.5);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid rgba(139, 111, 71, 0.08);

    &:hover {
      transform: translateY(-2px) scale(1.03);
      box-shadow: 
        0 8px 24px rgba(139, 111, 71, 0.18),
        inset 0 1px 3px rgba(255, 255, 255, 0.5);
    }

    svg {
      display: block;
    }
  }

  .logo-text {
    display: flex;
    flex-direction: column;
    text-align: ${({ $variant }) => ($variant === 'vertical' ? 'center' : 'left')};
    line-height: 1.1;
    gap: 0.2rem;

    .brand-name {
      font-family: 'Inter', 'Work Sans', -apple-system, sans-serif;
      font-size: ${({ $size }) => 
        $size === 'small' ? '1.6rem' : 
        $size === 'large' ? '2.6rem' : '2rem'};
      font-weight: 700;
      color: ${({ theme }) => theme.colors.heading};
      letter-spacing: -0.02em;
      line-height: 1;
    }

    .brand-tagline {
      font-family: 'Inter', 'Work Sans', sans-serif;
      font-size: ${({ $size }) => 
        $size === 'small' ? '0.85rem' : 
        $size === 'large' ? '1.3rem' : '1rem'};
      font-weight: 600;
      color: ${({ theme }) => theme.colors.primary};
      letter-spacing: 0.15em;
      text-transform: uppercase;
      opacity: 0.85;
    }
  }

  @media (max-width: 768px) {
    gap: ${({ $size }) => ($size === 'small' ? '0.8rem' : '1rem')};

    .logo-icon {
      padding: ${({ $size }) => ($size === 'small' ? '0.5rem' : '0.7rem')};
    }

    .logo-text {
      .brand-name {
        font-size: ${({ $size }) => 
          $size === 'small' ? '1.4rem' : 
          $size === 'large' ? '2.2rem' : '1.7rem'};
      }

      .brand-tagline {
        font-size: ${({ $size }) => 
          $size === 'small' ? '0.75rem' : 
          $size === 'large' ? '1.1rem' : '0.9rem'};
        letter-spacing: 0.12em;
      }
    }
  }
`;

export default ProfessionalLogo;
