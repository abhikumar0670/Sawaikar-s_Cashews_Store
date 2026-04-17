import React from 'react';
import styled from 'styled-components';
import { FiHeart, FiZap, FiShield, FiActivity, FiAward, FiPackage, FiTrendingUp } from 'react-icons/fi';
import { GiBrain } from 'react-icons/gi';

// Professional icon mapping
const ICON_MAP = {
  'high-protein': FiActivity,
  'heart-healthy': FiHeart,
  'iron-rich': FiAward,
  'high-fiber': FiPackage,
  'energy-boost': FiZap,
  'immunity-boost': FiShield,
  'brain-health': GiBrain,
  'bone-health': FiTrendingUp
};

// Nutrient thresholds for badges (per 100g)
const BADGE_THRESHOLDS = {
  'high-protein': { nutrient: 'protein', min: 18, label: 'High Protein', color: '#E53E3E' },
  'heart-healthy': { nutrient: 'unsaturatedFat', min: 25, label: 'Heart Healthy', color: '#E91E63' },
  'iron-rich': { nutrient: 'iron', min: 5, label: 'Iron Rich', color: '#FF5722' },
  'high-fiber': { nutrient: 'fiber', min: 5, label: 'High Fiber', color: '#4CAF50' },
  'energy-boost': { nutrient: 'calories', min: 500, label: 'Energy Boost', color: '#FFC107' },
  'immunity-boost': { nutrient: 'zinc', min: 5, label: 'Immunity', color: '#2196F3' },
  'brain-health': { nutrient: 'vitaminE', min: 4, label: 'Brain Health', color: '#9C27B0' },
  'bone-health': { nutrient: 'calcium', min: 40, label: 'Bone Health', color: '#795548' }
};

/**
 * Calculate badges for a product based on its nutrition info
 */
export const calculateBadges = (nutritionInfo) => {
  if (!nutritionInfo) return [];

  const badges = [];

  // Check each badge threshold
  Object.entries(BADGE_THRESHOLDS).forEach(([badgeId, config]) => {
    const value = nutritionInfo[config.nutrient] || 0;
    if (value >= config.min) {
      badges.push({
        id: badgeId,
        ...config
      });
    }
  });

  // Special case: Heart healthy needs low saturated fat too
  const heartIndex = badges.findIndex(b => b.id === 'heart-healthy');
  if (heartIndex !== -1 && nutritionInfo.saturatedFat > 8) {
    badges.splice(heartIndex, 1);
  }

  return badges.slice(0, 3); // Max 3 badges per product
};

/**
 * Single nutrition badge component
 */
export const NutritionBadge = ({ badge, size = 'small', showLabel = true }) => {
  if (!badge) return null;

  const IconComponent = ICON_MAP[badge.id];

  return (
    <BadgeWrapper size={size} color={badge.color}>
      <BadgeIcon size={size}>
        {IconComponent && <IconComponent />}
      </BadgeIcon>
      {showLabel && <BadgeLabel size={size}>{badge.label}</BadgeLabel>}
    </BadgeWrapper>
  );
};

/**
 * Container for multiple badges
 */
export const NutritionBadges = ({ nutritionInfo, size = 'small', maxBadges = 3 }) => {
  const badges = calculateBadges(nutritionInfo);

  if (badges.length === 0) return null;

  return (
    <BadgesContainer>
      {badges.slice(0, maxBadges).map(badge => (
        <NutritionBadge key={badge.id} badge={badge} size={size} />
      ))}
    </BadgesContainer>
  );
};

/**
 * Compact badge strip for product cards
 */
export const NutritionBadgeStrip = ({ nutritionInfo }) => {
  const badges = calculateBadges(nutritionInfo);

  if (badges.length === 0) return null;

  return (
    <BadgeStrip>
      {badges.map(badge => {
        const IconComponent = ICON_MAP[badge.id];
        return (
          <MicroBadge key={badge.id} title={badge.label}>
            {IconComponent && <IconComponent />}
          </MicroBadge>
        );
      })}
    </BadgeStrip>
  );
};

/**
 * Health tag component for product detail page
 */
export const HealthTag = ({ tag, onClick }) => {
  const config = BADGE_THRESHOLDS[tag] || {
    label: tag.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    color: '#8B4513'
  };
  const IconComponent = ICON_MAP[tag];

  return (
    <TagWrapper color={config.color} onClick={onClick}>
      {IconComponent && <IconComponent />}
      <span>{config.label}</span>
    </TagWrapper>
  );
};

/**
 * Nutrition facts mini panel
 */
export const NutritionMiniPanel = ({ nutritionInfo }) => {
  if (!nutritionInfo) return null;

  const keyNutrients = [
    { key: 'calories', label: 'Calories', unit: 'kcal', value: nutritionInfo.calories },
    { key: 'protein', label: 'Protein', unit: 'g', value: nutritionInfo.protein },
    { key: 'fiber', label: 'Fiber', unit: 'g', value: nutritionInfo.fiber },
    { key: 'iron', label: 'Iron', unit: 'mg', value: nutritionInfo.iron }
  ].filter(n => n.value > 0);

  return (
    <MiniPanel>
      <MiniPanelTitle>Per 100g</MiniPanelTitle>
      <MiniPanelGrid>
        {keyNutrients.map(nutrient => (
          <MiniPanelItem key={nutrient.key}>
            <MiniPanelValue>{nutrient.value}{nutrient.unit}</MiniPanelValue>
            <MiniPanelLabel>{nutrient.label}</MiniPanelLabel>
          </MiniPanelItem>
        ))}
      </MiniPanelGrid>
    </MiniPanel>
  );
};

// Styled Components
const BadgesContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const BadgeWrapper = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${props => props.size === 'large' ? '6px' : '4px'};
  padding: ${props => props.size === 'large' ? '6px 12px' : '3px 8px'};
  background: ${props => props.color}15;
  border: 1px solid ${props => props.color}30;
  border-radius: 20px;
  font-size: ${props => props.size === 'large' ? '13px' : '11px'};
  color: ${props => props.color};
  font-weight: 500;
`;

const BadgeIcon = styled.span`
  font-size: ${props => props.size === 'large' ? '16px' : '12px'};
`;

const BadgeLabel = styled.span`
  white-space: nowrap;
`;

const BadgeStrip = styled.div`
  position: absolute;
  bottom: 8px;
  left: 8px;
  display: flex;
  gap: 4px;
  z-index: 2;
`;

const MicroBadge = styled.span`
  background: rgba(255, 255, 255, 0.95);
  padding: 4px 6px;
  border-radius: 6px;
  font-size: 14px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  cursor: default;
`;

const TagWrapper = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: ${props => props.color}15;
  border: 1px solid ${props => props.color}30;
  border-radius: 25px;
  font-size: 13px;
  color: ${props => props.color};
  font-weight: 500;
  cursor: ${props => props.onClick ? 'pointer' : 'default'};
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.color}25;
  }
`;

const MiniPanel = styled.div`
  background: #f8f9fa;
  border-radius: 12px;
  padding: 12px;
  margin-top: 12px;
`;

const MiniPanelTitle = styled.div`
  font-size: 11px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
`;

const MiniPanelGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
`;

const MiniPanelItem = styled.div`
  text-align: center;
`;

const MiniPanelValue = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #333;
`;

const MiniPanelLabel = styled.div`
  font-size: 10px;
  color: #999;
`;

export default NutritionBadges;
