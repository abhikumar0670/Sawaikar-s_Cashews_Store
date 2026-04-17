import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '@clerk/clerk-react';
import { API_ENDPOINTS } from '../config/api';
import { FiX, FiCheck, FiArrowRight, FiArrowLeft } from 'react-icons/fi';

const HealthProfileSetup = ({ isOpen, onClose, onComplete }) => {
  const { userId, isSignedIn } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [healthGoals, setHealthGoals] = useState([]);
  const [dietaryRestrictions, setDietaryRestrictions] = useState([]);
  const [allergens, setAllergens] = useState([]);

  const healthGoalOptions = [
    { id: 'muscle-building', label: 'Muscle Building', icon: '💪', description: 'High protein foods for muscle growth' },
    { id: 'weight-loss', label: 'Weight Loss', icon: '⚖️', description: 'High fiber, low sugar options' },
    { id: 'heart-health', label: 'Heart Health', icon: '❤️', description: 'Foods with healthy fats' },
    { id: 'immunity-boost', label: 'Immunity Boost', icon: '🛡️', description: 'Zinc and vitamin-rich foods' },
    { id: 'bone-health', label: 'Bone Health', icon: '🦴', description: 'Calcium-rich options' },
    { id: 'energy-boost', label: 'Energy Boost', icon: '⚡', description: 'Iron and B-vitamin rich foods' },
    { id: 'diabetes-friendly', label: 'Diabetes Friendly', icon: '🩺', description: 'Low sugar, high fiber' },
    { id: 'brain-health', label: 'Brain Health', icon: '🧠', description: 'Vitamin E and healthy fats' }
  ];

  const dietaryOptions = [
    { id: 'vegan', label: 'Vegan' },
    { id: 'vegetarian', label: 'Vegetarian' },
    { id: 'keto', label: 'Keto' },
    { id: 'low-sodium', label: 'Low Sodium' },
    { id: 'gluten-free', label: 'Gluten Free' },
    { id: 'low-fat', label: 'Low Fat' },
    { id: 'none', label: 'No Restrictions' }
  ];

  const allergenOptions = [
    { id: 'tree-nuts', label: 'Tree Nuts' },
    { id: 'peanuts', label: 'Peanuts' },
    { id: 'soy', label: 'Soy' },
    { id: 'gluten', label: 'Gluten' },
    { id: 'dairy', label: 'Dairy' },
    { id: 'none', label: 'No Allergies' }
  ];

  const toggleSelection = (array, setArray, id) => {
    if (id === 'none') {
      setArray(['none']);
    } else {
      const newArray = array.filter(item => item !== 'none');
      if (newArray.includes(id)) {
        setArray(newArray.filter(item => item !== id));
      } else {
        setArray([...newArray, id]);
      }
    }
  };

  const handleSubmit = async () => {
    if (!isSignedIn || !userId) {
      onComplete?.();
      onClose();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.NUTRITION_ONBOARDING, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          healthGoals,
          dietaryRestrictions: dietaryRestrictions.filter(r => r !== 'none'),
          allergens: allergens.filter(a => a !== 'none'),
          skipped: false
        })
      });

      const data = await response.json();
      if (data.success) {
        onComplete?.(data.data);
      }
    } catch (error) {
      console.error('Error saving health profile:', error);
    } finally {
      setLoading(false);
      onClose();
    }
  };

  const handleSkip = async () => {
    if (isSignedIn && userId) {
      try {
        await fetch(API_ENDPOINTS.NUTRITION_ONBOARDING, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId,
            skipped: true
          })
        });
      } catch (error) {
        console.error('Error skipping onboarding:', error);
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Overlay>
      <Modal>
        <CloseButton onClick={handleSkip}>
          <FiX size={20} />
        </CloseButton>

        <ProgressBar>
          <Progress width={`${(step / 3) * 100}%`} />
        </ProgressBar>

        <ModalContent>
          {step === 1 && (
            <>
              <Title>What are your health goals?</Title>
              <Subtitle>Select all that apply - we'll personalize your recommendations</Subtitle>
              <OptionsGrid>
                {healthGoalOptions.map(goal => (
                  <OptionCard
                    key={goal.id}
                    selected={healthGoals.includes(goal.id)}
                    onClick={() => toggleSelection(healthGoals, setHealthGoals, goal.id)}
                  >
                    <OptionIcon>{goal.icon}</OptionIcon>
                    <OptionLabel>{goal.label}</OptionLabel>
                    <OptionDesc>{goal.description}</OptionDesc>
                    {healthGoals.includes(goal.id) && (
                      <CheckMark><FiCheck /></CheckMark>
                    )}
                  </OptionCard>
                ))}
              </OptionsGrid>
            </>
          )}

          {step === 2 && (
            <>
              <Title>Any dietary preferences?</Title>
              <Subtitle>Optional - helps us filter recommendations</Subtitle>
              <ChipsContainer>
                {dietaryOptions.map(option => (
                  <Chip
                    key={option.id}
                    selected={dietaryRestrictions.includes(option.id)}
                    onClick={() => toggleSelection(dietaryRestrictions, setDietaryRestrictions, option.id)}
                  >
                    {option.label}
                    {dietaryRestrictions.includes(option.id) && <FiCheck />}
                  </Chip>
                ))}
              </ChipsContainer>
            </>
          )}

          {step === 3 && (
            <>
              <Title>Any food allergies?</Title>
              <Subtitle>We'll make sure to show safe options</Subtitle>
              <ChipsContainer>
                {allergenOptions.map(option => (
                  <Chip
                    key={option.id}
                    selected={allergens.includes(option.id)}
                    onClick={() => toggleSelection(allergens, setAllergens, option.id)}
                    variant={option.id !== 'none' ? 'warning' : 'default'}
                  >
                    {option.label}
                    {allergens.includes(option.id) && <FiCheck />}
                  </Chip>
                ))}
              </ChipsContainer>
            </>
          )}
        </ModalContent>

        <ButtonRow>
          {step > 1 && (
            <BackButton onClick={() => setStep(step - 1)}>
              <FiArrowLeft /> Back
            </BackButton>
          )}
          <SkipButton onClick={handleSkip}>Skip</SkipButton>
          {step < 3 ? (
            <NextButton onClick={() => setStep(step + 1)}>
              Next <FiArrowRight />
            </NextButton>
          ) : (
            <SubmitButton onClick={handleSubmit} disabled={loading}>
              {loading ? 'Saving...' : 'Complete Setup'}
            </SubmitButton>
          )}
        </ButtonRow>
      </Modal>
    </Overlay>
  );
};

// Styled Components
const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
`;

const Modal = styled.div`
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: #f5f5f5;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #666;
  z-index: 1;

  &:hover {
    background: #eee;
  }
`;

const ProgressBar = styled.div`
  height: 4px;
  background: #eee;
  border-radius: 20px 20px 0 0;
  overflow: hidden;
`;

const Progress = styled.div`
  height: 100%;
  width: ${props => props.width};
  background: linear-gradient(90deg, #8B4513, #A0522D);
  transition: width 0.3s ease;
`;

const ModalContent = styled.div`
  padding: 32px 32px 16px;
`;

const Title = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin: 0 0 8px;
  text-align: center;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #666;
  margin: 0 0 24px;
  text-align: center;
`;

const OptionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
`;

const OptionCard = styled.div`
  background: ${props => props.selected ? 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)' : '#f8f8f8'};
  color: ${props => props.selected ? 'white' : '#333'};
  border-radius: 12px;
  padding: 16px 12px;
  text-align: center;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
  border: 2px solid ${props => props.selected ? '#8B4513' : 'transparent'};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const OptionIcon = styled.div`
  font-size: 28px;
  margin-bottom: 8px;
`;

const OptionLabel = styled.div`
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 4px;
`;

const OptionDesc = styled.div`
  font-size: 11px;
  opacity: 0.8;
  line-height: 1.3;
`;

const CheckMark = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  background: white;
  color: #8B4513;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ChipsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
`;

const Chip = styled.button`
  padding: 12px 20px;
  border-radius: 25px;
  border: 2px solid ${props => props.selected
    ? (props.variant === 'warning' ? '#E53E3E' : '#8B4513')
    : '#ddd'};
  background: ${props => props.selected
    ? (props.variant === 'warning' ? '#FED7D7' : '#FDF2E9')
    : 'white'};
  color: ${props => props.selected
    ? (props.variant === 'warning' ? '#C53030' : '#8B4513')
    : '#666'};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${props => props.variant === 'warning' ? '#E53E3E' : '#8B4513'};
  }
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 32px 32px;
  gap: 12px;
`;

const BaseButton = styled.button`
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
`;

const BackButton = styled(BaseButton)`
  background: transparent;
  border: none;
  color: #666;

  &:hover {
    color: #333;
  }
`;

const SkipButton = styled(BaseButton)`
  background: transparent;
  border: none;
  color: #999;
  margin-left: auto;

  &:hover {
    color: #666;
  }
`;

const NextButton = styled(BaseButton)`
  background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
  color: white;
  border: none;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(139, 69, 19, 0.3);
  }
`;

const SubmitButton = styled(NextButton)`
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

export default HealthProfileSetup;
