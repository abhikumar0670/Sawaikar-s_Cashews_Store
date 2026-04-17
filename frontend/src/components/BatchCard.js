import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { FaLeaf, FaFire, FaCalendarAlt, FaCertificate, FaInfoCircle, FaTimes } from 'react-icons/fa';
import { GiWheat, GiFruitBowl, GiPeanut, GiCheckMark } from 'react-icons/gi';
import { MdTimer, MdLocalFireDepartment } from 'react-icons/md';

const BatchCard = ({ product }) => {
  const [showDetails, setShowDetails] = useState(false);

  // Memoize batch info to prevent flickering from regeneration on each render
  const batchInfo = useMemo(() => {
    // Generate consistent batch number based on product id
    const generateBatchNumber = () => {
      if (product?.batchNumber) return product.batchNumber;
      const year = new Date().getFullYear();
      // Use product id to generate a consistent "random" number
      const seed = product?.id ? parseInt(product.id.slice(-4), 16) % 9000 + 1000 : 5432;
      return `SC-${year}-${seed}`;
    };

    const generateBestBefore = () => {
      if (product?.bestBefore) return product.bestBefore;
      const date = new Date();
      date.setMonth(date.getMonth() + 6);
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return {
      batchNumber: generateBatchNumber(),
      harvestMonth: product?.harvestMonth || 'March 2026',
      harvestRegion: product?.harvestRegion || 'Ponda, Goa',
      roastDate: product?.roastDate || new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      roastLevel: product?.roastLevel || 'Medium',
      roastMethod: product?.roastMethod || 'Wood Fire',
      bestBefore: generateBestBefore(),
      grade: product?.grade || 'W240',
      tastingNotes: product?.tastingNotes || ['Buttery', 'Slightly Sweet', 'Nutty Finish'],
      certifications: product?.certifications || ['Organic', 'FSSAI Certified', 'No Preservatives']
    };
  }, [product?.id, product?.batchNumber, product?.harvestMonth, product?.harvestRegion,
      product?.roastDate, product?.roastLevel, product?.roastMethod, product?.bestBefore,
      product?.grade, product?.tastingNotes, product?.certifications]);

  const roastLevelConfig = {
    'Light': { percentage: 30, color: '#F9A825', description: 'Soft, buttery, mild flavor' },
    'Medium': { percentage: 55, color: '#FF8F00', description: 'Balanced crunch with sweet notes' },
    'Medium-Dark': { percentage: 75, color: '#E65100', description: 'Rich flavor with subtle smokiness' },
    'Dark': { percentage: 90, color: '#BF360C', description: 'Deep, intense, smoky character' }
  };

  const currentRoast = roastLevelConfig[batchInfo.roastLevel] || roastLevelConfig['Medium'];

  return (
    <>
      <Wrapper>
        <div className="batch-header">
          <div className="batch-id">
            <FaCertificate />
            <span>Batch #{batchInfo.batchNumber}</span>
          </div>
          <button className="info-btn" onClick={() => setShowDetails(true)}>
            <FaInfoCircle /> Full Details
          </button>
        </div>

        <div className="batch-grid">
          {/* Harvest Info */}
          <div className="batch-item">
            <div className="item-icon harvest">
              <GiWheat />
            </div>
            <div className="item-content">
              <span className="item-label">Harvested</span>
              <span className="item-value">{batchInfo.harvestMonth}</span>
              <span className="item-sublabel">{batchInfo.harvestRegion}</span>
            </div>
          </div>

          {/* Roast Info */}
          <div className="batch-item">
            <div className="item-icon roast">
              <MdLocalFireDepartment />
            </div>
            <div className="item-content">
              <span className="item-label">Roasted</span>
              <span className="item-value">{batchInfo.roastDate}</span>
              <span className="item-sublabel">{batchInfo.roastMethod}</span>
            </div>
          </div>

          {/* Grade */}
          <div className="batch-item">
            <div className="item-icon grade">
              <GiPeanut />
            </div>
            <div className="item-content">
              <span className="item-label">Grade</span>
              <span className="item-value grade-value">{batchInfo.grade}</span>
              <span className="item-sublabel">Premium Quality</span>
            </div>
          </div>
        </div>

        {/* Roast Level Meter */}
        <div className="roast-meter">
          <div className="meter-header">
            <FaFire /> Roast Level: <strong>{batchInfo.roastLevel}</strong>
          </div>
          <div className="meter-track">
            <div
              className="meter-fill"
              style={{ width: `${currentRoast.percentage}%`, backgroundColor: currentRoast.color }}
            />
            <div className="meter-labels">
              <span>Light</span>
              <span>Medium</span>
              <span>Dark</span>
            </div>
          </div>
          <p className="meter-description">{currentRoast.description}</p>
        </div>

        {/* Tasting Notes */}
        <div className="tasting-notes">
          <h4><GiFruitBowl /> Tasting Notes</h4>
          <div className="notes-tags">
            {batchInfo.tastingNotes.map((note, index) => (
              <span key={index} className="note-tag">{note}</span>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div className="certifications">
          {batchInfo.certifications.map((cert, index) => (
            <span key={index} className="cert-badge">
              <GiCheckMark /> {cert}
            </span>
          ))}
        </div>
      </Wrapper>

      {/* Details Modal */}
      {showDetails && (
        <Modal>
          <div className="modal-overlay" onClick={() => setShowDetails(false)} />
          <div className="modal-content">
            <button className="close-btn" onClick={() => setShowDetails(false)}>
              <FaTimes />
            </button>

            <div className="modal-header">
              <FaCertificate />
              <div>
                <h3>Certificate of Authenticity</h3>
                <span>Batch #{batchInfo.batchNumber}</span>
              </div>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h4>Origin & Harvest</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">Region</span>
                    <span className="value">{batchInfo.harvestRegion}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Harvest Season</span>
                    <span className="value">{batchInfo.harvestMonth}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Tree Age</span>
                    <span className="value">15-20 years</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Soil Type</span>
                    <span className="value">Red Laterite</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>Processing & Quality</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">Grade</span>
                    <span className="value">{batchInfo.grade}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Roast Method</span>
                    <span className="value">{batchInfo.roastMethod}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Roast Level</span>
                    <span className="value">{batchInfo.roastLevel}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Roast Date</span>
                    <span className="value">{batchInfo.roastDate}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>Freshness Guarantee</h4>
                <div className="freshness-info">
                  <div className="freshness-dates">
                    <div>
                      <span className="label">Packed On</span>
                      <span className="value">{batchInfo.roastDate}</span>
                    </div>
                    <div className="arrow">→</div>
                    <div>
                      <span className="label">Best Before</span>
                      <span className="value">{batchInfo.bestBefore}</span>
                    </div>
                  </div>
                  <p className="freshness-note">
                    Sealed in nitrogen-flushed packaging within 24 hours of roasting for maximum freshness.
                  </p>
                </div>
              </div>

              <div className="detail-section">
                <h4>Quality Certifications</h4>
                <div className="cert-list">
                  {batchInfo.certifications.map((cert, index) => (
                    <div key={index} className="cert-item">
                      <GiCheckMark />
                      <span>{cert}</span>
                    </div>
                  ))}
                  <div className="cert-item">
                    <GiCheckMark />
                    <span>Lab Tested for Purity</span>
                  </div>
                  <div className="cert-item">
                    <GiCheckMark />
                    <span>Traceable from Farm to Pack</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <p>Scan QR code on pack for real-time batch verification</p>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

const Wrapper = styled.div`
  background: linear-gradient(135deg, #f9f5eb, #fff);
  border: 1px solid rgba(139, 69, 19, 0.15);
  border-radius: 1.5rem;
  padding: 2rem;
  margin-top: 2rem;

  .batch-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px dashed rgba(139, 69, 19, 0.2);

    .batch-id {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      font-size: 1.3rem;
      font-weight: 600;
      color: ${({ theme }) => theme.colors.helper};

      svg {
        font-size: 1.6rem;
      }
    }

    .info-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: transparent;
      border: 1px solid ${({ theme }) => theme.colors.helper};
      color: ${({ theme }) => theme.colors.helper};
      padding: 0.6rem 1.2rem;
      border-radius: 5rem;
      font-size: 1.2rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        background: ${({ theme }) => theme.colors.helper};
        color: #fff;
      }
    }
  }

  .batch-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .batch-item {
    display: flex;
    align-items: flex-start;
    gap: 1rem;

    .item-icon {
      width: 4rem;
      height: 4rem;
      border-radius: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      svg {
        font-size: 1.8rem;
        color: #fff;
      }

      &.harvest {
        background: linear-gradient(135deg, #4CAF50, #2E7D32);
      }

      &.roast {
        background: linear-gradient(135deg, #FF8F00, #E65100);
      }

      &.grade {
        background: linear-gradient(135deg, #8D6E63, #5D4037);
      }
    }

    .item-content {
      display: flex;
      flex-direction: column;

      .item-label {
        font-size: 1.1rem;
        color: ${({ theme }) => theme.colors.text};
        opacity: 0.7;
      }

      .item-value {
        font-size: 1.4rem;
        font-weight: 700;
        color: ${({ theme }) => theme.colors.heading};

        &.grade-value {
          color: ${({ theme }) => theme.colors.helper};
        }
      }

      .item-sublabel {
        font-size: 1.1rem;
        color: ${({ theme }) => theme.colors.text};
        opacity: 0.6;
      }
    }
  }

  .roast-meter {
    background: #fff;
    border-radius: 1rem;
    padding: 1.5rem;
    margin-bottom: 2rem;

    .meter-header {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-size: 1.3rem;
      color: ${({ theme }) => theme.colors.heading};
      margin-bottom: 1rem;

      svg {
        color: #FF8F00;
      }

      strong {
        color: ${({ theme }) => theme.colors.helper};
      }
    }

    .meter-track {
      position: relative;
      height: 8px;
      background: #e0d5c5;
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 0.5rem;

      .meter-fill {
        height: 100%;
        border-radius: 10px;
        transition: width 0.5s ease;
      }

      .meter-labels {
        display: flex;
        justify-content: space-between;
        position: absolute;
        width: 100%;
        top: 1.2rem;
        font-size: 1rem;
        color: ${({ theme }) => theme.colors.text};
        opacity: 0.7;
      }
    }

    .meter-description {
      font-size: 1.2rem;
      color: ${({ theme }) => theme.colors.text};
      margin-top: 1.5rem;
      font-style: italic;
    }
  }

  .tasting-notes {
    margin-bottom: 1.5rem;

    h4 {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-size: 1.3rem;
      color: ${({ theme }) => theme.colors.heading};
      margin-bottom: 1rem;

      svg {
        color: ${({ theme }) => theme.colors.helper};
      }
    }

    .notes-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.8rem;

      .note-tag {
        background: linear-gradient(135deg, rgba(205, 133, 63, 0.15), rgba(139, 69, 19, 0.1));
        color: ${({ theme }) => theme.colors.helper};
        padding: 0.5rem 1.2rem;
        border-radius: 5rem;
        font-size: 1.2rem;
        font-weight: 600;
      }
    }
  }

  .certifications {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;

    .cert-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: #f0f7f0;
      color: #2E7D32;
      padding: 0.5rem 1rem;
      border-radius: 5rem;
      font-size: 1.1rem;
      font-weight: 600;

      svg {
        font-size: 1rem;
      }
    }
  }

  @media (max-width: 768px) {
    padding: 1.5rem;

    .batch-grid {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    .batch-header {
      flex-direction: column;
      gap: 1rem;
      text-align: center;
    }
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;

  .modal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
  }

  .modal-content {
    position: relative;
    background: #fff;
    border-radius: 2rem;
    max-width: 60rem;
    max-height: 90vh;
    overflow-y: auto;
    z-index: 1;
  }

  .close-btn {
    position: absolute;
    top: 1.5rem;
    right: 1.5rem;
    background: #f5f0e1;
    border: none;
    width: 4rem;
    height: 4rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;

    svg {
      font-size: 1.8rem;
      color: #8B4513;
    }

    &:hover {
      background: #8B4513;

      svg {
        color: #fff;
      }
    }
  }

  .modal-header {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 3rem;
    background: linear-gradient(135deg, #8B4513, #5D3A1A);
    color: #fff;
    border-radius: 2rem 2rem 0 0;

    > svg {
      font-size: 4rem;
      color: #FFD700;
    }

    h3 {
      font-size: 2rem;
      margin-bottom: 0.3rem;
    }

    span {
      opacity: 0.8;
      font-size: 1.3rem;
    }
  }

  .modal-body {
    padding: 2.5rem;
  }

  .detail-section {
    margin-bottom: 2.5rem;

    &:last-child {
      margin-bottom: 0;
    }

    h4 {
      font-size: 1.5rem;
      color: #8B4513;
      margin-bottom: 1.5rem;
      padding-bottom: 0.8rem;
      border-bottom: 2px solid #f5f0e1;
    }
  }

  .detail-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }

  .detail-item {
    .label {
      display: block;
      font-size: 1.2rem;
      color: #666;
      margin-bottom: 0.3rem;
    }

    .value {
      font-size: 1.5rem;
      font-weight: 600;
      color: #333;
    }
  }

  .freshness-info {
    .freshness-dates {
      display: flex;
      align-items: center;
      gap: 2rem;
      margin-bottom: 1.5rem;

      > div:not(.arrow) {
        flex: 1;
        text-align: center;
        padding: 1.5rem;
        background: #f5f0e1;
        border-radius: 1rem;
      }

      .arrow {
        font-size: 2rem;
        color: #8B4513;
      }

      .label {
        display: block;
        font-size: 1.2rem;
        color: #666;
        margin-bottom: 0.5rem;
      }

      .value {
        font-size: 1.6rem;
        font-weight: 700;
        color: #333;
      }
    }

    .freshness-note {
      font-size: 1.3rem;
      color: #666;
      font-style: italic;
      text-align: center;
    }
  }

  .cert-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;

    .cert-item {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      padding: 1rem;
      background: #f0f7f0;
      border-radius: 0.8rem;

      svg {
        color: #2E7D32;
        font-size: 1.4rem;
      }

      span {
        font-size: 1.3rem;
        color: #333;
      }
    }
  }

  .modal-footer {
    padding: 2rem 3rem;
    background: #f5f0e1;
    text-align: center;
    border-radius: 0 0 2rem 2rem;

    p {
      font-size: 1.3rem;
      color: #666;
    }
  }

  @media (max-width: 768px) {
    padding: 1rem;

    .modal-content {
      border-radius: 1.5rem;
    }

    .modal-header {
      padding: 2rem;
      flex-direction: column;
      text-align: center;

      > svg {
        font-size: 3rem;
      }

      h3 {
        font-size: 1.8rem;
      }
    }

    .modal-body {
      padding: 1.5rem;
    }

    .detail-grid {
      grid-template-columns: 1fr;
    }

    .freshness-dates {
      flex-direction: column;

      .arrow {
        transform: rotate(90deg);
      }
    }

    .cert-list {
      grid-template-columns: 1fr;
    }
  }
`;

export default BatchCard;
