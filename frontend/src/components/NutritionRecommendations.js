import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';
import { NutritionBadges } from './NutritionBadge';
import { FiChevronRight, FiHeart, FiTarget } from 'react-icons/fi';

const NutritionRecommendations = ({ limit = 6 }) => {
  const { userId, isSignedIn } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [healthProfile, setHealthProfile] = useState(null);

  useEffect(() => {
    if (isSignedIn && userId) {
      fetchRecommendations();
      fetchHealthProfile();
    } else {
      setLoading(false);
    }
  }, [userId, isSignedIn]);

  const fetchHealthProfile = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.NUTRITION_PROFILE}?userId=${userId}`);
      const data = await response.json();
      if (data.success && data.data) {
        setHealthProfile(data.data);
      }
    } catch (error) {
      console.error('Error fetching health profile:', error);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await fetch(
        `${API_ENDPOINTS.NUTRITION_RECOMMENDATIONS}?userId=${userId}&limit=${limit}`
      );
      const data = await response.json();
      if (data.success) {
        setRecommendations(data.data);
      }
    } catch (error) {
      console.error('Error fetching nutrition recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Don't show if user is not signed in or no recommendations
  if (!isSignedIn || loading) {
    return null;
  }

  if (recommendations.length === 0) {
    return null;
  }

  const getHealthGoalLabel = (goal) => {
    const labels = {
      'muscle-building': 'Muscle Building',
      'weight-loss': 'Weight Loss',
      'heart-health': 'Heart Health',
      'immunity-boost': 'Immunity',
      'bone-health': 'Bone Health',
      'energy-boost': 'Energy',
      'diabetes-friendly': 'Diabetes Friendly',
      'brain-health': 'Brain Health'
    };
    return labels[goal] || goal;
  };

  return (
    <Section>
      <SectionHeader>
        <HeaderLeft>
          <SectionIcon>
            <FiTarget />
          </SectionIcon>
          <div>
            <SectionTitle>Based on Your Health Goals</SectionTitle>
            {healthProfile?.healthGoals?.length > 0 && (
              <GoalsDisplay>
                {healthProfile.healthGoals.slice(0, 3).map(goal => (
                  <GoalTag key={goal}>{getHealthGoalLabel(goal)}</GoalTag>
                ))}
              </GoalsDisplay>
            )}
          </div>
        </HeaderLeft>
        <ViewAllLink to="/products?filter=nutrition">
          View All <FiChevronRight />
        </ViewAllLink>
      </SectionHeader>

      <ProductsGrid>
        {recommendations.map((rec, index) => {
          const product = rec.product;
          if (!product) return null;

          return (
            <ProductCard key={product.id || product._id || index}>
              <ProductImageWrapper>
                <ProductImage
                  src={Array.isArray(product.image) ? product.image[0] : product.image}
                  alt={product.name}
                />
                {product.nutritionInfo && (
                  <BadgeOverlay>
                    <NutritionBadges
                      nutritionInfo={product.nutritionInfo}
                      size="small"
                      maxBadges={2}
                    />
                  </BadgeOverlay>
                )}
              </ProductImageWrapper>

              <ProductInfo>
                <ProductName to={`/products/${product.id || product._id}`}>
                  {product.name}
                </ProductName>

                <ReasonTag>
                  <FiHeart size={12} />
                  {rec.explanation || `Good for ${getHealthGoalLabel(rec.matchedGoal)}`}
                </ReasonTag>

                <PriceRow>
                  <Price>₹{((product.price || 0) / 100).toFixed(0)}</Price>
                  {product.rating > 0 && (
                    <Rating>⭐ {product.rating.toFixed(1)}</Rating>
                  )}
                </PriceRow>
              </ProductInfo>
            </ProductCard>
          );
        })}
      </ProductsGrid>
    </Section>
  );
};

// Styled Components
const Section = styled.section`
  padding: 40px 0;
  background: linear-gradient(180deg, #FDF2E9 0%, #fff 100%);
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding: 0 20px;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const SectionIcon = styled.div`
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
`;

const SectionTitle = styled.h2`
  font-size: 22px;
  font-weight: 700;
  color: #333;
  margin: 0 0 6px;
`;

const GoalsDisplay = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const GoalTag = styled.span`
  font-size: 12px;
  color: #8B4513;
  background: #FDF2E9;
  padding: 4px 10px;
  border-radius: 12px;
  border: 1px solid #DEB887;
`;

const ViewAllLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 4px;
  color: #8B4513;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const ProductsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;
  padding: 0 20px;
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
`;

const ProductCard = styled.div`
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
  }
`;

const ProductImageWrapper = styled.div`
  position: relative;
  width: 100%;
  padding-top: 100%;
  background: #f8f8f8;
`;

const ProductImage = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const BadgeOverlay = styled.div`
  position: absolute;
  top: 8px;
  left: 8px;
`;

const ProductInfo = styled.div`
  padding: 14px;
`;

const ProductName = styled(Link)`
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  text-decoration: none;
  margin-bottom: 8px;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;

  &:hover {
    color: #8B4513;
  }
`;

const ReasonTag = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #8B4513;
  background: #FDF2E9;
  padding: 6px 10px;
  border-radius: 6px;
  margin-bottom: 10px;
  line-height: 1.3;
`;

const PriceRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Price = styled.span`
  font-size: 16px;
  font-weight: 700;
  color: #333;
`;

const Rating = styled.span`
  font-size: 12px;
  color: #666;
`;

export default NutritionRecommendations;
