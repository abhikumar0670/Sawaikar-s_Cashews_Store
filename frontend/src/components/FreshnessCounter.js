import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { FaLeaf, FaClock, FaShieldAlt, FaBoxOpen, FaTemperatureLow } from 'react-icons/fa';
import { GiCheckMark, GiFruitBowl } from 'react-icons/gi';
import { MdRefresh, MdVerified } from 'react-icons/md';

const FreshnessCounter = ({ product, variant = 'full' }) => {
  const [timeElapsed, setTimeElapsed] = useState({ days: 0, hours: 0 });

  // Helper to safely parse date
  const parseDate = (dateValue) => {
    if (!dateValue) return null;
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? null : date;
  };

  // Helper to get a consistent pseudo-random number from product id
  const getProductSeed = (productId) => {
    if (!productId || typeof productId !== 'string') return 3;
    const lastChars = productId.slice(-2);
    const parsed = parseInt(lastChars, 16);
    return isNaN(parsed) ? 3 : (parsed % 7) + 1;
  };

  // Memoize dates to prevent flickering from random regeneration on each render
  const { roastDate, packDate, bestBefore } = useMemo(() => {
    // Try to parse existing dates first
    let roast = parseDate(product?.roastDate);
    let pack = parseDate(product?.packDate);
    let best = parseDate(product?.bestBefore);

    // Generate fallback dates if not available
    if (!roast) {
      const date = new Date();
      const daysAgo = getProductSeed(product?.id);
      date.setDate(date.getDate() - daysAgo);
      roast = date;
    }

    if (!pack) {
      const date = new Date(roast);
      date.setDate(date.getDate() + 1);
      pack = date;
    }

    if (!best) {
      const date = new Date(pack);
      date.setMonth(date.getMonth() + 6);
      best = date;
    }

    return { roastDate: roast, packDate: pack, bestBefore: best };
  }, [product?.id, product?.roastDate, product?.packDate, product?.bestBefore]);

  useEffect(() => {
    const calculateFreshness = () => {
      const now = new Date();
      const roasted = new Date(roastDate);
      const diff = now - roasted;

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      setTimeElapsed({ days, hours });
    };

    calculateFreshness();
    const interval = setInterval(calculateFreshness, 1000 * 60 * 60);

    return () => clearInterval(interval);
  }, [roastDate]);

  // Safely calculate days remaining and freshness percentage
  const daysRemaining = useMemo(() => {
    const bestDate = new Date(bestBefore);
    const now = new Date();
    if (isNaN(bestDate.getTime())) return 180; // Default to 6 months
    return Math.max(0, Math.ceil((bestDate - now) / (1000 * 60 * 60 * 24)));
  }, [bestBefore]);

  const totalShelfLife = useMemo(() => {
    const bestDate = new Date(bestBefore);
    const packDateObj = new Date(packDate);
    if (isNaN(bestDate.getTime()) || isNaN(packDateObj.getTime())) return 180;
    return Math.max(1, Math.ceil((bestDate - packDateObj) / (1000 * 60 * 60 * 24)));
  }, [bestBefore, packDate]);

  const freshnessPercentage = Math.max(0, Math.min(100, (daysRemaining / totalShelfLife) * 100));

  const getFreshnessLevel = () => {
    if (freshnessPercentage > 80) return { level: 'Peak Fresh', color: '#4CAF50', icon: '🌟' };
    if (freshnessPercentage > 60) return { level: 'Very Fresh', color: '#8BC34A', icon: '✨' };
    if (freshnessPercentage > 40) return { level: 'Fresh', color: '#FFC107', icon: '👍' };
    if (freshnessPercentage > 20) return { level: 'Good', color: '#FF9800', icon: '⏰' };
    return { level: 'Order Soon', color: '#FF5722', icon: '⚡' };
  };

  const freshness = getFreshnessLevel();

  const formatDate = (date) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Safe display for time elapsed
  const getTimeElapsedText = () => {
    const { days, hours } = timeElapsed;
    if (isNaN(days) || isNaN(hours)) return 'Recently';
    if (days === 0) return hours > 0 ? `${hours}h ago` : 'Just now';
    return `${days}d ${hours}h ago`;
  };

  if (variant === 'mini') {
    return (
      <MiniWrapper style={{ '--freshness-color': freshness.color }}>
        <div className="freshness-indicator">
          <FaLeaf />
          <span>{freshness.icon} Roasted {timeElapsed.days === 0 && timeElapsed.hours === 0 ? 'Today' : timeElapsed.days === 0 ? `${timeElapsed.hours}h ago` : `${timeElapsed.days}d ago`}</span>
        </div>
      </MiniWrapper>
    );
  }

  if (variant === 'badge') {
    return (
      <BadgeWrapper style={{ '--freshness-color': freshness.color }}>
        <span className="freshness-badge">
          <FaLeaf /> {freshness.level}
        </span>
      </BadgeWrapper>
    );
  }

  return (
    <Wrapper>
      <div className="freshness-header">
        <div className="header-title">
          <FaLeaf className="leaf-icon" />
          <h4>Freshness Tracker</h4>
        </div>
        <div className="freshness-level" style={{ '--level-color': freshness.color }}>
          {freshness.icon} {freshness.level}
        </div>
      </div>

      {/* Freshness Meter */}
      <div className="freshness-meter">
        <div className="meter-track">
          <div
            className="meter-fill"
            style={{
              width: `${freshnessPercentage}%`,
              background: `linear-gradient(90deg, ${freshness.color}, #4CAF50)`
            }}
          />
        </div>
        <div className="meter-info">
          <span>{Math.round(freshnessPercentage)}% Peak Freshness</span>
          <span>{daysRemaining} days remaining</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="freshness-timeline">
        <div className="timeline-item completed">
          <div className="timeline-icon">
            <GiFruitBowl />
          </div>
          <div className="timeline-content">
            <span className="timeline-label">Roasted on</span>
            <span className="timeline-value">{formatDate(roastDate)}</span>
          </div>
          <div className="timeline-elapsed">
            {getTimeElapsedText()}
          </div>
        </div>

        <div className="timeline-connector" />

        <div className="timeline-item completed">
          <div className="timeline-icon">
            <FaBoxOpen />
          </div>
          <div className="timeline-content">
            <span className="timeline-label">Packed on</span>
            <span className="timeline-value">{formatDate(packDate)}</span>
          </div>
          <div className="timeline-badge">
            <FaShieldAlt /> N₂ Sealed
          </div>
        </div>

        <div className="timeline-connector" />

        <div className="timeline-item future">
          <div className="timeline-icon">
            <FaClock />
          </div>
          <div className="timeline-content">
            <span className="timeline-label">Best before</span>
            <span className="timeline-value">{formatDate(bestBefore)}</span>
          </div>
        </div>
      </div>

      {/* Storage Tips */}
      <div className="storage-tips">
        <h5><FaTemperatureLow /> Storage Tips for Maximum Freshness</h5>
        <div className="tips-grid">
          <div className="tip">
            <GiCheckMark />
            <span>Store in cool, dry place</span>
          </div>
          <div className="tip">
            <GiCheckMark />
            <span>Keep away from sunlight</span>
          </div>
          <div className="tip">
            <GiCheckMark />
            <span>Reseal after opening</span>
          </div>
          <div className="tip">
            <GiCheckMark />
            <span>Refrigerate for longer life</span>
          </div>
        </div>
      </div>

      {/* Quality Assurance */}
      <div className="quality-assurance">
        <MdVerified className="verified-icon" />
        <div>
          <strong>Quality Guaranteed</strong>
          <span>Every batch tested for freshness before shipping</span>
        </div>
      </div>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  background: linear-gradient(135deg, #f9f5eb, #fff);
  border: 1px solid rgba(139, 69, 19, 0.12);
  border-radius: 1.5rem;
  padding: 2rem;
  margin-top: 2rem;

  .freshness-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;

    .header-title {
      display: flex;
      align-items: center;
      gap: 0.8rem;

      .leaf-icon {
        color: #4CAF50;
        font-size: 2rem;
      }

      h4 {
        font-size: 1.6rem;
        font-weight: 700;
        color: ${({ theme }) => theme.colors.heading};
        margin: 0;
      }
    }

    .freshness-level {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: linear-gradient(135deg, var(--level-color), #4CAF50);
      color: #fff;
      padding: 0.6rem 1.4rem;
      border-radius: 5rem;
      font-size: 1.2rem;
      font-weight: 700;
    }
  }

  .freshness-meter {
    margin-bottom: 2.5rem;

    .meter-track {
      height: 12px;
      background: #e0d5c5;
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 0.8rem;

      .meter-fill {
        height: 100%;
        border-radius: 10px;
        transition: width 0.5s ease;
        position: relative;

        &::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.3) 50%,
            transparent 100%
          );
          animation: shimmer 2s infinite;
        }
      }
    }

    .meter-info {
      display: flex;
      justify-content: space-between;
      font-size: 1.2rem;
      color: ${({ theme }) => theme.colors.text};

      span:first-child {
        font-weight: 600;
        color: #4CAF50;
      }
    }
  }

  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }

  .freshness-timeline {
    position: relative;
    margin-bottom: 2rem;
  }

  .timeline-item {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 1.2rem;
    background: #fff;
    border-radius: 1rem;
    margin-bottom: 0.5rem;
    position: relative;

    .timeline-icon {
      width: 4rem;
      height: 4rem;
      background: #f0f7f0;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      svg {
        font-size: 1.8rem;
        color: #4CAF50;
      }
    }

    .timeline-content {
      flex: 1;

      .timeline-label {
        display: block;
        font-size: 1.1rem;
        color: ${({ theme }) => theme.colors.text};
        opacity: 0.7;
      }

      .timeline-value {
        font-size: 1.4rem;
        font-weight: 700;
        color: ${({ theme }) => theme.colors.heading};
      }
    }

    .timeline-elapsed {
      background: linear-gradient(135deg, rgba(76, 175, 80, 0.15), rgba(76, 175, 80, 0.05));
      color: #2E7D32;
      padding: 0.5rem 1rem;
      border-radius: 5rem;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .timeline-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #e3f2fd;
      color: #1976D2;
      padding: 0.5rem 1rem;
      border-radius: 5rem;
      font-size: 1.1rem;
      font-weight: 600;
    }

    &.future {
      opacity: 0.7;

      .timeline-icon {
        background: #f5f5f5;

        svg {
          color: #9e9e9e;
        }
      }
    }
  }

  .timeline-connector {
    width: 2px;
    height: 1.5rem;
    background: #e0d5c5;
    margin-left: 3.2rem;
  }

  .storage-tips {
    background: #fff;
    border-radius: 1rem;
    padding: 1.5rem;
    margin-bottom: 1.5rem;

    h5 {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-size: 1.3rem;
      color: ${({ theme }) => theme.colors.heading};
      margin-bottom: 1rem;

      svg {
        color: #2196F3;
      }
    }

    .tips-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.8rem;
    }

    .tip {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-size: 1.2rem;
      color: ${({ theme }) => theme.colors.text};

      svg {
        color: #4CAF50;
        font-size: 1rem;
      }
    }
  }

  .quality-assurance {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: linear-gradient(135deg, rgba(33, 150, 243, 0.1), rgba(33, 150, 243, 0.05));
    padding: 1.2rem;
    border-radius: 1rem;

    .verified-icon {
      font-size: 2.5rem;
      color: #2196F3;
    }

    strong {
      display: block;
      font-size: 1.3rem;
      color: ${({ theme }) => theme.colors.heading};
    }

    span {
      font-size: 1.2rem;
      color: ${({ theme }) => theme.colors.text};
    }
  }

  @media (max-width: 768px) {
    padding: 1.5rem;

    .freshness-header {
      flex-direction: column;
      gap: 1rem;
      text-align: center;
    }

    .timeline-item {
      flex-wrap: wrap;
      gap: 1rem;

      .timeline-elapsed,
      .timeline-badge {
        width: 100%;
        justify-content: center;
      }
    }

    .tips-grid {
      grid-template-columns: 1fr !important;
    }
  }
`;

const MiniWrapper = styled.div`
  .freshness-indicator {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    background: linear-gradient(135deg, rgba(76, 175, 80, 0.15), rgba(76, 175, 80, 0.05));
    color: #2E7D32;
    padding: 0.5rem 1rem;
    border-radius: 5rem;
    font-size: 1.2rem;
    font-weight: 600;

    svg {
      font-size: 1.2rem;
    }
  }
`;

const BadgeWrapper = styled.div`
  display: inline-block;

  .freshness-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: var(--freshness-color);
    color: #fff;
    padding: 0.4rem 1rem;
    border-radius: 5rem;
    font-size: 1.1rem;
    font-weight: 600;
  }
`;

export default FreshnessCounter;
