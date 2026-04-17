import React from 'react'
import { NavLink } from 'react-router-dom';
import {Button} from '../styles/Button'
import styled from 'styled-components';

const HeroSection = ({myData}) => {
    const { name, intro } = myData;
    
  return (
    <Wrapper>
     <div className='container'>
        <div className="grid grid-two-column">
            <div className="hero-section-data">
              <span className="premium-badge">Premium Quality Since 1985</span>
              <h1>{name}</h1>
              <p className="hero-description">
                {intro || "Experience the finest selection of premium cashews from Goa's heritage farms. From traditional roasted varieties to exotic flavored cashews, we bring you the authentic taste of quality nuts with every bite."}
              </p>
              <div className="hero-features">
                <div className="feature">
                  <span className="feature-icon">✓</span>
                  <span>100% Organic</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">✓</span>
                  <span>Farm Fresh</span>
                </div>
                <div className="feature">
                  <span className="feature-icon">✓</span>
                  <span>Free Shipping</span>
                </div>
              </div>
              <NavLink to="/products" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                <Button className="hero-btn">Shop Now</Button>
              </NavLink>
            </div>
            <div className="hero-section-image">
              <div className="image-container">
                <img src="images/hero.jpg" alt="Premium cashews display" className="img-style"/>
                <div className="floating-badge top-badge">
                  <span className="badge-number">50K+</span>
                  <span className="badge-text">Happy Customers</span>
                </div>
                <div className="floating-badge bottom-badge">
                  <span className="badge-number">38+</span>
                  <span className="badge-text">Years of Trust</span>
                </div>
              </div>
            </div>
        </div>
     </div>
    </Wrapper>
  )
}

const Wrapper = styled.section`
  padding: 8rem 0 10rem;
  background: linear-gradient(180deg, ${({ theme }) => theme.colors.bgLight} 0%, ${({ theme }) => theme.colors.bg} 100%);
  overflow: hidden;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 50%;
    height: 100%;
    background: radial-gradient(circle at 80% 20%, rgba(139, 111, 71, 0.03) 0%, transparent 70%);
    pointer-events: none;
  }
  
  .container {
    max-width: 130rem;
    margin: 0 auto;
    padding: 0 3rem;
    position: relative;
    z-index: 1;
  }
  
  .grid {
    display: grid;
    gap: 6rem;
    align-items: center;
  }
  
  .grid-two-column {
    grid-template-columns: 1.1fr 1fr;
  }
  
  .hero-section-data {
    .premium-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.8rem;
      background: linear-gradient(135deg, rgba(139, 111, 71, 0.08), rgba(139, 111, 71, 0.12));
      color: ${({ theme }) => theme.colors.primary};
      padding: 1.2rem 2.4rem;
      border-radius: 50px;
      font-size: 1.3rem;
      font-weight: 600;
      margin-bottom: 2.5rem;
      border: 1px solid ${({ theme }) => theme.colors.border};
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
      letter-spacing: 0.05em;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(139, 111, 71, 0.15);
      }
    }

    h1 {
      font-size: 6.5rem;
      font-weight: 700;
      line-height: 1.1;
      color: ${({ theme }) => theme.colors.heading};
      margin-bottom: 2.5rem;
      letter-spacing: -0.03em;
      
      background: linear-gradient(135deg, ${({ theme }) => theme.colors.heading} 0%, ${({ theme }) => theme.colors.primary} 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .hero-description {
      font-size: 1.8rem;
      line-height: 1.8;
      color: ${({ theme }) => theme.colors.text};
      margin-bottom: 3rem;
      max-width: 58rem;
      font-weight: 400;
    }

    .hero-features {
      display: flex;
      gap: 3rem;
      margin-bottom: 4rem;
      flex-wrap: wrap;

      .feature {
        display: flex;
        align-items: center;
        gap: 1rem;
        font-size: 1.5rem;
        color: ${({ theme }) => theme.colors.text};
        font-weight: 500;

        .feature-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2.8rem;
          height: 2.8rem;
          background: linear-gradient(135deg, ${({ theme }) => theme.colors.success} 0%, #3A6347 100%);
          color: ${({ theme }) => theme.colors.white};
          border-radius: 50%;
          font-size: 1.2rem;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(74, 124, 89, 0.25);
        }
      }
    }

    .hero-btn {
      font-size: 1.6rem;
      padding: 1.8rem 4.5rem;
      box-shadow: ${({ theme }) => theme.colors.shadowLarge};
      
      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 20px 50px rgba(139, 111, 71, 0.3);
      }
    }
  }
  
  .hero-section-image {
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
  }

  .image-container {
    position: relative;
    max-width: 55rem;
    width: 100%;
    
    &::before {
      content: "";
      position: absolute;
      top: -3rem;
      right: -3rem;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary} 0%, ${({ theme }) => theme.colors.primaryDark} 100%);
      border-radius: 24px;
      z-index: 0;
      opacity: 0.15;
    }

    &::after {
      content: "";
      position: absolute;
      bottom: -4rem;
      left: -4rem;
      width: 20rem;
      height: 20rem;
      background: linear-gradient(135deg, ${({ theme }) => theme.colors.accent} 0%, ${({ theme }) => theme.colors.accentLight} 100%);
      border-radius: 50%;
      z-index: 0;
      opacity: 0.12;
      filter: blur(40px);
    }
  }
  
  .img-style {
    position: relative;
    z-index: 1;
    width: 100%;
    height: auto;
    border-radius: 24px;
    box-shadow: 0 30px 70px rgba(139, 111, 71, 0.25);
    transition: transform 0.5s ease;
    
    &:hover {
      transform: scale(1.02);
    }
  }

  .floating-badge {
    position: absolute;
    z-index: 2;
    background: ${({ theme }) => theme.colors.white};
    padding: 2rem 2.5rem;
    border-radius: 16px;
    box-shadow: 0 12px 40px rgba(139, 111, 71, 0.2);
    text-align: center;
    backdrop-filter: blur(10px);
    border: 1px solid ${({ theme }) => theme.colors.borderLight};
    transition: transform 0.3s ease;
    
    &:hover {
      transform: translateY(-5px) scale(1.05);
    }

    .badge-number {
      display: block;
      font-size: 2.8rem;
      font-weight: 700;
      color: ${({ theme }) => theme.colors.primary};
      line-height: 1;
      margin-bottom: 0.5rem;
      letter-spacing: -0.02em;
    }

    .badge-text {
      font-size: 1.2rem;
      color: ${({ theme }) => theme.colors.textLight};
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  }

  .top-badge {
    top: 3rem;
    right: -2rem;
    animation: float 3s ease-in-out infinite;
  }

  .bottom-badge {
    bottom: 4rem;
    left: -2rem;
    animation: float 3s ease-in-out infinite;
    animation-delay: 1.5s;
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-15px);
    }
  }
  
  @media (max-width: ${({ theme }) => theme.media.tab}) {
    padding: 6rem 0 8rem;
    
    .grid-two-column {
      grid-template-columns: 1fr;
      text-align: center;
      gap: 5rem;
    }
    
    .hero-section-data {
      h1 {
        font-size: 5rem;
      }
      
      .hero-description {
        max-width: 100%;
      }

      .hero-features {
        justify-content: center;
        flex-wrap: wrap;
      }
    }

    .hero-section-image {
      order: -1;
    }

    .image-container {
      max-width: 45rem;
    }

    .floating-badge {
      padding: 1.5rem 2rem;
      
      .badge-number {
        font-size: 2.2rem;
      }
      
      .badge-text {
        font-size: 1.1rem;
      }
    }
  }
  
  @media (max-width: ${({ theme }) => theme.media.mobile}) {
    padding: 5rem 0 6rem;
    
    .container {
      padding: 0 2rem;
    }
    
    .hero-section-data {
      .premium-badge {
        font-size: 1.2rem;
        padding: 1rem 2rem;
      }

      h1 {
        font-size: 3.5rem;
      }
      
      .hero-description {
        font-size: 1.6rem;
      }

      .hero-features {
        gap: 2rem;

        .feature {
          font-size: 1.4rem;
          
          .feature-icon {
            width: 2.4rem;
            height: 2.4rem;
            font-size: 1rem;
          }
        }
      }
      
      .hero-btn {
        padding: 1.6rem 3.5rem;
        font-size: 1.4rem;
      }
    }
    
    .image-container {
      max-width: 35rem;
      
      &::before {
        top: -2rem;
        right: -2rem;
        border-radius: 20px;
      }

      &::after {
        width: 15rem;
        height: 15rem;
        bottom: -3rem;
        left: -3rem;
      }
    }
    
    .img-style {
      border-radius: 20px;
    }
    
    .floating-badge {
      display: none;
    }
  }
`;

export default HeroSection
