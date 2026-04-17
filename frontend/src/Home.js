import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { NavLink } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import FeactureProducts from './components/FeaturedProducts';
import HeroSection from './components/HeroSection';
import Services from './components/Services';
import Truested from './components/Trusted';
import OriginStory from './components/OriginStory';
import CashewMatchQuiz from './components/CashewMatchQuiz';
import SmartBundles from './components/SmartBundles';
import WelcomeTour from './components/WelcomeTour';
import { GiWheat, GiSunrise, GiDiamondTrophy, GiCardboardBox } from 'react-icons/gi';
import { FaQuoteLeft, FaStar } from 'react-icons/fa';
import { Button } from './styles/Button';

const Home = () => {
  const { user, isSignedIn } = useUser();
  const [showWelcomeTour, setShowWelcomeTour] = useState(false);

  // Show welcome tour on every visit if NOT logged in
  useEffect(() => {
    if (!isSignedIn) {
      // Show tour for non-logged-in users every time they visit
      // Only skip if they've actually completed the tour
      const tourCompleted = localStorage.getItem('sawaikar_tour_completed');
      if (!tourCompleted) {
        const timer = setTimeout(() => {
          setShowWelcomeTour(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    } else {
      // Hide tour if user logs in
      setShowWelcomeTour(false);
    }
  }, [isSignedIn]);
  const premiumData = {
    name: "Sawaikar's Legacy",
    intro: "Rooted in the red soil of Ponda since 1985. We don't just sell cashews; we deliver a slice of Goan heritage, hand-roasted to perfection in traditional wood-fire drums.",
    image: "/images/hero-cashew-farm.jpg",
  }

  const processSteps = [
    { icon: <GiWheat />, title: 'Hand Harvested', desc: 'Carefully hand-picked at peak ripeness from our family-owned orchards in Goa' },
    { icon: <GiSunrise />, title: 'Sun Dried', desc: 'Traditional Goan sun-drying method preserves natural oils and flavors' },
    { icon: <GiDiamondTrophy />, title: 'Wood Fire Roasted', desc: 'Slow-roasted over cashew wood fire for that authentic smoky taste' },
    { icon: <GiCardboardBox />, title: 'Fresh Packed', desc: 'Sealed within 24 hours in eco-friendly, airtight packaging' },
  ];

  const testimonials = [
    { name: 'Priya Sharma', location: 'Mumbai', rating: 5, text: 'The best cashews I\'ve ever tasted! So fresh and flavorful. Will definitely order again.' },
    { name: 'Rajesh Patel', location: 'Delhi', rating: 5, text: 'Premium quality that matches the price. My family loved the roasted variety!' },
    { name: 'Anita Desai', location: 'Bangalore', rating: 5, text: 'Finally found authentic Goan cashews. The taste reminds me of my childhood in Goa.' },
  ];

  return (
    <Wrapper>
      {showWelcomeTour && <WelcomeTour onClose={() => setShowWelcomeTour(false)} />}
      
      {/* 1. HERO - First Impression */}
      <HeroSection myData={premiumData}/>

      {/* 2. FEATURED PRODUCTS - Show products immediately (most important for e-commerce) */}
      <FeactureProducts/>

      {/* 3. SERVICES/USPs - Why choose us */}
      <Services/>

      {/* 4. SMART BUNDLES - Upsell opportunities */}
      <SmartBundles />

      {/* 5. OUR PROCESS - Build trust with transparency */}
      <section className="process-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Farm to Table</span>
            <h2>Our Process</h2>
            <p>Every cashew goes through our meticulous 4-step process to ensure premium quality</p>
          </div>

          <div className="process-grid">
            {processSteps.map((step, index) => (
              <div className="process-card" key={index}>
                <div className="step-number">{String(index + 1).padStart(2, '0')}</div>
                <div className="process-icon">{step.icon}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
                {index < processSteps.length - 1 && <div className="connector"></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. ORIGIN STORY - Emotional connection */}
      <OriginStory />

      {/* 7. TESTIMONIALS - Social proof */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Testimonials</span>
            <h2>What Our Customers Say</h2>
            <p>Join thousands of satisfied customers who trust Sawaikar's for premium cashews</p>
          </div>

          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div className="testimonial-card" key={index}>
                <FaQuoteLeft className="quote-icon" />
                <p className="testimonial-text">{testimonial.text}</p>
                <div className="rating">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <FaStar key={i} className="star" />
                  ))}
                </div>
                <div className="customer-info">
                  <div className="customer-avatar">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <h4>{testimonial.name}</h4>
                    <span>{testimonial.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="cta-center">
            <NavLink to="/products" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <Button>Shop Premium Cashews</Button>
            </NavLink>
          </div>
        </div>
      </section>

      {/* 8. CASHEW MATCH QUIZ - Personalization (moved down as it's interactive) */}
      <CashewMatchQuiz />

      {/* 9. TRUSTED BY - Final trust signals */}
      <Truested/>
    </Wrapper>
  )
}

const Wrapper = styled.div`
  /* Global Container */
  .container {
    max-width: 128rem;
    margin: 0 auto;
    padding: 0 2rem;
  }

  /* Process Section */
  .process-section {
    padding: 12rem 0;
    background: ${({ theme }) => theme.colors.bg};
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: 
        radial-gradient(circle at 20% 50%, rgba(139, 111, 71, 0.025) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(193, 154, 107, 0.02) 0%, transparent 50%);
      pointer-events: none;
    }
  }

  .section-header {
    text-align: center;
    margin-bottom: 8rem;
    position: relative;
    z-index: 1;

    .section-tag {
      display: inline-block;
      color: ${({ theme }) => theme.colors.primary};
      font-size: 1.3rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      margin-bottom: 2rem;
      padding: 0.8rem 2rem;
      background: linear-gradient(135deg, rgba(139, 111, 71, 0.08), rgba(139, 111, 71, 0.12));
      border-radius: 50px;
      transition: all 0.3s ease;
      border: 1px solid ${({ theme }) => theme.colors.border};
    }

    h2 {
      font-size: 4.8rem;
      font-weight: 700;
      color: ${({ theme }) => theme.colors.heading};
      margin-bottom: 2rem;
      line-height: 1.2;
      letter-spacing: -0.03em;
    }

    p {
      font-size: 1.8rem;
      color: ${({ theme }) => theme.colors.text};
      max-width: 70rem;
      margin: 0 auto;
      line-height: 1.7;
      font-weight: 400;
    }
  }

  .process-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 3rem;
    position: relative;
    z-index: 1;
  }

  .process-card {
    text-align: center;
    padding: 4rem 3rem;
    background: ${({ theme }) => theme.colors.bgLight};
    border-radius: 20px;
    position: relative;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: ${({ theme }) => theme.colors.shadow};
    border: 1px solid ${({ theme }) => theme.colors.borderLight};
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 5px;
      background: linear-gradient(90deg, ${({ theme }) => theme.colors.primary}, ${({ theme }) => theme.colors.accent});
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    &:hover {
      transform: translateY(-12px);
      box-shadow: ${({ theme }) => theme.colors.shadowLarge};
      border-color: ${({ theme }) => theme.colors.border};

      &::before {
        opacity: 1;
      }

      .process-icon {
        transform: scale(1.1) rotate(5deg);
        box-shadow: 0 12px 30px rgba(139, 111, 71, 0.25);
      }
    }

    .step-number {
      position: absolute;
      top: 2.5rem;
      right: 2.5rem;
      font-size: 1.6rem;
      font-weight: 700;
      color: ${({ theme }) => theme.colors.primary};
      opacity: 0.2;
    }

    .process-icon {
      width: 10rem;
      height: 10rem;
      margin: 0 auto 3rem;
      background: linear-gradient(135deg, ${({ theme }) => theme.colors.accent} 0%, ${({ theme }) => theme.colors.accentLight} 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.4s ease;
      box-shadow: 0 8px 24px rgba(139, 111, 71, 0.15);

      svg {
        font-size: 4.5rem;
        color: ${({ theme }) => theme.colors.primary};
      }
    }

    h3 {
      font-size: 2.2rem;
      font-weight: 700;
      color: ${({ theme }) => theme.colors.heading};
      margin-bottom: 1.5rem;
      letter-spacing: -0.01em;
    }

    p {
      font-size: 1.5rem;
      color: ${({ theme }) => theme.colors.text};
      line-height: 1.7;
      font-weight: 400;
    }

    .connector {
      display: none;
    }
  }

  /* Testimonials Section */
  .testimonials-section {
    padding: 12rem 0;
    background: linear-gradient(135deg, ${({ theme }) => theme.colors.heading} 0%, ${({ theme }) => theme.colors.primaryDark} 100%);
    position: relative;
    overflow: hidden;

    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: 
        radial-gradient(circle at 100% 0%, rgba(193, 154, 107, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 0% 100%, rgba(166, 138, 94, 0.08) 0%, transparent 50%);
      pointer-events: none;
    }
  }

  .testimonials-section .section-header {
    .section-tag {
      background: rgba(255, 255, 255, 0.12);
      color: rgba(255, 255, 255, 0.95);
      border-color: rgba(255, 255, 255, 0.15);
    }

    h2 {
      color: ${({ theme }) => theme.colors.white};
      font-size: 4.8rem;
    }

    p {
      color: rgba(255, 255, 255, 0.85);
    }
  }

  .testimonials-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 3.5rem;
    margin-bottom: 5rem;
    position: relative;
    z-index: 1;
  }

  .testimonial-card {
    background: ${({ theme }) => theme.colors.bgLight};
    backdrop-filter: blur(10px);
    padding: 4rem;
    border-radius: 20px;
    position: relative;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid rgba(255, 255, 255, 0.1);
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 5px;
      background: linear-gradient(90deg, ${({ theme }) => theme.colors.primary}, ${({ theme }) => theme.colors.accent});
    }

    &:hover {
      transform: translateY(-10px);
      box-shadow: 0 30px 70px rgba(0, 0, 0, 0.3);
    }

    .quote-icon {
      font-size: 4rem;
      color: ${({ theme }) => theme.colors.primary};
      opacity: 0.15;
      margin-bottom: 2rem;
    }

    .testimonial-text {
      font-size: 1.6rem;
      line-height: 1.85;
      color: ${({ theme }) => theme.colors.text};
      margin-bottom: 3rem;
      font-style: italic;
      font-weight: 400;
    }

    .rating {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 2.5rem;

      .star {
        color: #FFB800;
        font-size: 1.8rem;
      }
    }

    .customer-info {
      display: flex;
      align-items: center;
      gap: 1.5rem;

      .customer-avatar {
        width: 5.5rem;
        height: 5.5rem;
        background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary} 0%, ${({ theme }) => theme.colors.accent} 100%);
        color: ${({ theme }) => theme.colors.white};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 2rem;
        flex-shrink: 0;
        box-shadow: 0 6px 16px rgba(139, 111, 71, 0.25);
      }

      h4 {
        font-size: 1.7rem;
        font-weight: 700;
        color: ${({ theme }) => theme.colors.heading};
        margin-bottom: 0.4rem;
      }

      span {
        font-size: 1.4rem;
        color: ${({ theme }) => theme.colors.textLight};
        font-weight: 400;
      }
    }
  }

  .cta-center {
    text-align: center;
    position: relative;
    z-index: 1;
    
    a {
      text-decoration: none;
    }
  }

  /* Responsive Design */
  @media (max-width: 1024px) {
    .process-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .testimonials-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 768px) {
    .process-section,
    .testimonials-section {
      padding: 6rem 0;
    }

    .section-header {
      margin-bottom: 5rem;
      
      h2 {
        font-size: 3.2rem;
      }
      
      p {
        font-size: 1.6rem;
      }
    }

    .process-grid {
      grid-template-columns: 1fr;
      gap: 2.5rem;
    }

    .testimonials-grid {
      grid-template-columns: 1fr;
      gap: 2.5rem;
    }

    .process-card {
      padding: 3rem 2.5rem;
    }
    
    .testimonial-card {
      padding: 3rem;
    }
  }
`;

export default Home
