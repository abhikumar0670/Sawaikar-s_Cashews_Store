import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { GiTreeBranch, GiFruitBowl, GiCookingPot, GiCardboardBox, GiCheckMark } from 'react-icons/gi';
import { FaMapMarkerAlt, FaLeaf, FaFire, FaSun, FaHandsHelping } from 'react-icons/fa';
import { MdTimer } from 'react-icons/md';

const OriginStory = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  const journeySteps = [
    {
      id: 1,
      icon: <GiTreeBranch />,
      title: "The Orchard",
      location: "Ponda, Goa",
      month: "February - April",
      description: "Our cashew trees grow in the mineral-rich red laterite soil of Ponda, where the perfect balance of monsoon rains and tropical sun creates the ideal conditions for premium cashews.",
      detail: "Each tree is maintained organically for over 15 years before reaching peak production. Our farmers handpick only the ripest cashew apples at dawn.",
      visualIcon: <GiTreeBranch />,
      color: "#2E7D32",
      bgGradient: "linear-gradient(135deg, #2E7D32 0%, #1B5E20 50%, #388E3C 100%)"
    },
    {
      id: 2,
      icon: <FaSun />,
      title: "Sun Drying",
      location: "Traditional Drying Yards",
      month: "April - May",
      description: "Freshly harvested cashews are spread on clean concrete yards and sun-dried for 3-4 days using our traditional Goan method passed down through generations.",
      detail: "The slow drying process preserves natural oils and develops the distinctive sweet, buttery flavor profile that sets our cashews apart.",
      visualIcon: <FaSun />,
      color: "#F9A825",
      bgGradient: "linear-gradient(135deg, #F9A825 0%, #FF8F00 50%, #FFB300 100%)"
    },
    {
      id: 3,
      icon: <FaHandsHelping />,
      title: "Hand Shelling",
      location: "Family Processing Unit",
      month: "May - June",
      description: "Skilled artisans with decades of experience carefully extract each kernel by hand, ensuring zero damage and maximum whole-nut yield.",
      detail: "Unlike machine processing, hand shelling preserves the delicate outer skin and natural curve of premium W180, W240, and W320 grade cashews.",
      visualIcon: <FaHandsHelping />,
      color: "#8D6E63",
      bgGradient: "linear-gradient(135deg, #8D6E63 0%, #6D4C41 50%, #A1887F 100%)"
    },
    {
      id: 4,
      icon: <FaFire />,
      title: "Wood Fire Roasting",
      location: "Traditional Roasting House",
      month: "Year Round",
      description: "Our signature wood-fire roasting uses sustainably sourced cashew wood, creating that unmistakable smoky-sweet aroma that defines authentic Goan cashews.",
      detail: "Small batches are roasted at precise temperatures for 25-30 minutes. Master roasters test each batch by hand to ensure perfect golden color and crunch.",
      visualIcon: <FaFire />,
      color: "#E65100",
      bgGradient: "linear-gradient(135deg, #E65100 0%, #BF360C 50%, #FF6D00 100%)"
    },
    {
      id: 5,
      icon: <GiCardboardBox />,
      title: "Fresh Packing",
      location: "Quality Control Center",
      month: "Within 24 Hours",
      description: "Roasted cashews are cooled, graded, and sealed in nitrogen-flushed, food-grade pouches within 24 hours to lock in peak freshness.",
      detail: "Every batch is assigned a unique lot number with roast date, enabling full traceability from our orchard to your doorstep.",
      visualIcon: <GiCardboardBox />,
      color: "#5D4037",
      bgGradient: "linear-gradient(135deg, #5D4037 0%, #3E2723 50%, #795548 100%)"
    }
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % journeySteps.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isVisible, journeySteps.length]);

  return (
    <Wrapper ref={sectionRef} className={isVisible ? 'visible' : ''}>
      <div className="container">
        <div className="section-header">
          <span className="section-tag">
            <FaMapMarkerAlt /> Our Journey
          </span>
          <h2>From Goa Orchard to Your Pack</h2>
          <p>Every cashew tells a story of tradition, care, and Goan heritage spanning 38 years</p>
        </div>

        {/* Interactive Timeline */}
        <div className="timeline-container">
          <div className="timeline-track">
            {journeySteps.map((step, index) => (
              <div
                key={step.id}
                className={`timeline-point ${activeStep === index ? 'active' : ''} ${index < activeStep ? 'completed' : ''}`}
                onClick={() => setActiveStep(index)}
              >
                <div className="point-icon" style={{ '--step-color': step.color }}>
                  {index < activeStep ? <GiCheckMark /> : step.icon}
                </div>
                <span className="point-label">{step.title}</span>
              </div>
            ))}
            <div
              className="timeline-progress"
              style={{ width: `${(activeStep / (journeySteps.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Active Step Content */}
        <div className="story-content">
          <div className="story-visual">
            <div className="visual-circle" style={{ background: journeySteps[activeStep].bgGradient }}>
              <div className="visual-icon">
                {journeySteps[activeStep].visualIcon}
              </div>
              <div className="visual-ring"></div>
              <div className="visual-ring ring-2"></div>
            </div>
            <div className="floating-info location-badge">
              <FaMapMarkerAlt />
              <span>{journeySteps[activeStep].location}</span>
            </div>
            <div className="floating-info time-badge">
              <MdTimer />
              <span>{journeySteps[activeStep].month}</span>
            </div>
          </div>

          <div className="story-text">
            <div className="step-number">Step {journeySteps[activeStep].id} of 5</div>
            <h3>{journeySteps[activeStep].title}</h3>
            <p className="main-description">{journeySteps[activeStep].description}</p>
            <p className="detail-text">{journeySteps[activeStep].detail}</p>

            <div className="quality-badges">
              <span className="badge"><FaLeaf /> 100% Organic</span>
              <span className="badge"><GiCheckMark /> Hand-Selected</span>
              <span className="badge"><FaFire /> Traditional Methods</span>
            </div>
          </div>
        </div>

        {/* Step Navigation Dots */}
        <div className="step-dots">
          {journeySteps.map((_, index) => (
            <button
              key={index}
              className={`dot ${activeStep === index ? 'active' : ''}`}
              onClick={() => setActiveStep(index)}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>

        {/* Map Illustration */}
        <div className="origin-map">
          <div className="map-content">
            <div className="goa-badge">
              <FaMapMarkerAlt />
              <div>
                <strong>Ponda, Goa</strong>
                <span>Origin of Excellence</span>
              </div>
            </div>
            <div className="map-stats">
              <div className="stat">
                <span className="stat-number">38+</span>
                <span className="stat-label">Years of Heritage</span>
              </div>
              <div className="stat">
                <span className="stat-number">50K+</span>
                <span className="stat-label">Happy Families</span>
              </div>
              <div className="stat">
                <span className="stat-number">100%</span>
                <span className="stat-label">Goan Sourced</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Wrapper>
  );
};

const Wrapper = styled.section`
  padding: 8rem 0;
  background: linear-gradient(180deg, #fff 0%, #FFF8DC 50%, #f5f0e1 100%);
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.8s ease;

  &.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .container {
    max-width: 120rem;
    margin: 0 auto;
    padding: 0 2rem;
  }

  .section-header {
    text-align: center;
    margin-bottom: 5rem;

    .section-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.8rem;
      color: ${({ theme }) => theme.colors.helper};
      font-size: 1.4rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.2rem;
      margin-bottom: 1rem;

      svg {
        font-size: 1.6rem;
      }
    }

    h2 {
      font-size: 3.8rem;
      font-weight: 700;
      color: ${({ theme }) => theme.colors.heading};
      margin-bottom: 1rem;
      background: linear-gradient(135deg, #8B4513, #CD853F);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    p {
      font-size: 1.6rem;
      color: ${({ theme }) => theme.colors.text};
      max-width: 60rem;
      margin: 0 auto;
    }
  }

  /* Timeline */
  .timeline-container {
    margin-bottom: 4rem;
    padding: 0 2rem;
  }

  .timeline-track {
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    padding: 2rem 0;

    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 4px;
      background: #e0d5c5;
      transform: translateY(-50%);
      z-index: 0;
    }
  }

  .timeline-progress {
    position: absolute;
    top: 50%;
    left: 0;
    height: 4px;
    background: linear-gradient(90deg, #8B4513, #CD853F);
    transform: translateY(-50%);
    transition: width 0.5s ease;
    z-index: 1;
  }

  .timeline-point {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    cursor: pointer;
    z-index: 2;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-5px);
    }

    .point-icon {
      width: 5rem;
      height: 5rem;
      background: #fff;
      border: 3px solid #e0d5c5;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;

      svg {
        font-size: 2rem;
        color: #8B4513;
      }
    }

    .point-label {
      font-size: 1.2rem;
      font-weight: 600;
      color: ${({ theme }) => theme.colors.text};
      white-space: nowrap;
    }

    &.active {
      .point-icon {
        background: var(--step-color);
        border-color: var(--step-color);
        transform: scale(1.15);
        box-shadow: 0 8px 25px rgba(139, 69, 19, 0.3);

        svg {
          color: #fff;
        }
      }

      .point-label {
        color: ${({ theme }) => theme.colors.helper};
        font-weight: 700;
      }
    }

    &.completed {
      .point-icon {
        background: #4CAF50;
        border-color: #4CAF50;

        svg {
          color: #fff;
        }
      }
    }
  }

  /* Story Content */
  .story-content {
    display: grid;
    grid-template-columns: 1fr 1.5fr;
    gap: 5rem;
    align-items: center;
    margin-bottom: 4rem;
    min-height: 35rem;
  }

  .story-visual {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;

    .visual-circle {
      width: 25rem;
      height: 25rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2),
                  inset 0 -5px 20px rgba(0, 0, 0, 0.15),
                  inset 0 5px 20px rgba(255, 255, 255, 0.1);
      position: relative;
      animation: pulse 2s ease-in-out infinite;
    }

    .visual-icon {
      z-index: 2;

      svg {
        font-size: 8rem;
        color: rgba(255, 255, 255, 0.95);
        filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
      }
    }

    .visual-ring {
      position: absolute;
      width: 100%;
      height: 100%;
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      animation: ringPulse 2s ease-in-out infinite;
    }

    .visual-ring.ring-2 {
      width: 115%;
      height: 115%;
      animation-delay: 0.5s;
      border-color: rgba(255, 255, 255, 0.1);
    }

    .floating-info {
      position: absolute;
      background: #fff;
      padding: 1rem 1.5rem;
      border-radius: 5rem;
      display: flex;
      align-items: center;
      gap: 0.8rem;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
      font-size: 1.3rem;
      font-weight: 600;
      color: ${({ theme }) => theme.colors.heading};

      svg {
        color: ${({ theme }) => theme.colors.helper};
      }
    }

    .location-badge {
      top: 1rem;
      right: -2rem;
      animation: floatBadge 3s ease-in-out infinite;
    }

    .time-badge {
      bottom: 1rem;
      left: -2rem;
      animation: floatBadge 3s ease-in-out infinite;
      animation-delay: 1.5s;
    }
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.03);
    }
  }

  @keyframes ringPulse {
    0%, 100% {
      transform: scale(1);
      opacity: 0.5;
    }
    50% {
      transform: scale(1.08);
      opacity: 0.2;
    }
  }

  @keyframes floatBadge {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-8px);
    }
  }

  .story-text {
    .step-number {
      display: inline-block;
      background: linear-gradient(135deg, rgba(205, 133, 63, 0.15), rgba(139, 69, 19, 0.1));
      color: ${({ theme }) => theme.colors.helper};
      padding: 0.6rem 1.5rem;
      border-radius: 5rem;
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
    }

    h3 {
      font-size: 3rem;
      font-weight: 700;
      color: ${({ theme }) => theme.colors.heading};
      margin-bottom: 1.5rem;
    }

    .main-description {
      font-size: 1.7rem;
      line-height: 1.8;
      color: ${({ theme }) => theme.colors.text};
      margin-bottom: 1.5rem;
    }

    .detail-text {
      font-size: 1.5rem;
      line-height: 1.7;
      color: ${({ theme }) => theme.colors.text};
      opacity: 0.8;
      margin-bottom: 2rem;
      padding-left: 1.5rem;
      border-left: 3px solid ${({ theme }) => theme.colors.helper};
    }

    .quality-badges {
      display: flex;
      gap: 1.5rem;
      flex-wrap: wrap;

      .badge {
        display: inline-flex;
        align-items: center;
        gap: 0.6rem;
        background: #fff;
        padding: 0.8rem 1.5rem;
        border-radius: 5rem;
        font-size: 1.2rem;
        font-weight: 600;
        color: ${({ theme }) => theme.colors.heading};
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);

        svg {
          color: #4CAF50;
        }
      }
    }
  }

  /* Step Dots */
  .step-dots {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 5rem;

    .dot {
      width: 1.2rem;
      height: 1.2rem;
      border-radius: 50%;
      background: #d0c4b0;
      border: none;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        background: ${({ theme }) => theme.colors.helper};
        transform: scale(1.2);
      }

      &.active {
        background: ${({ theme }) => theme.colors.helper};
        transform: scale(1.3);
      }
    }
  }

  /* Origin Map */
  .origin-map {
    background: linear-gradient(135deg, #8B4513 0%, #5D3A1A 100%);
    border-radius: 2rem;
    padding: 4rem;
    color: #fff;
  }

  .map-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 3rem;
  }

  .goa-badge {
    display: flex;
    align-items: center;
    gap: 1.5rem;

    svg {
      font-size: 3rem;
      color: #FFD700;
    }

    strong {
      display: block;
      font-size: 2.2rem;
      margin-bottom: 0.3rem;
    }

    span {
      font-size: 1.4rem;
      opacity: 0.8;
    }
  }

  .map-stats {
    display: flex;
    gap: 4rem;

    .stat {
      text-align: center;

      .stat-number {
        display: block;
        font-size: 3rem;
        font-weight: 800;
        color: #FFD700;
        margin-bottom: 0.5rem;
      }

      .stat-label {
        font-size: 1.3rem;
        opacity: 0.85;
      }
    }
  }

  /* Responsive */
  @media (max-width: 1024px) {
    .story-content {
      grid-template-columns: 1fr;
      text-align: center;
    }

    .story-visual {
      margin-bottom: 2rem;

      .visual-circle {
        width: 20rem;
        height: 20rem;
      }

      .visual-icon svg {
        font-size: 6rem;
      }

      .floating-info {
        display: none;
      }

      .visual-ring {
        display: none;
      }
    }

    .story-text {
      .detail-text {
        border-left: none;
        padding-left: 0;
        border-top: 3px solid ${({ theme }) => theme.colors.helper};
        padding-top: 1.5rem;
      }

      .quality-badges {
        justify-content: center;
      }
    }

    .timeline-point {
      .point-label {
        font-size: 1rem;
      }
    }
  }

  @media (max-width: 768px) {
    padding: 5rem 0;

    .section-header h2 {
      font-size: 2.8rem;
    }

    .timeline-container {
      overflow-x: auto;
      padding-bottom: 1rem;
    }

    .timeline-track {
      min-width: 60rem;
    }

    .story-text {
      h3 {
        font-size: 2.4rem;
      }

      .main-description {
        font-size: 1.5rem;
      }
    }

    .origin-map {
      padding: 3rem 2rem;
    }

    .map-content {
      flex-direction: column;
      text-align: center;
    }

    .map-stats {
      gap: 2rem;
    }
  }
`;

export default OriginStory;
