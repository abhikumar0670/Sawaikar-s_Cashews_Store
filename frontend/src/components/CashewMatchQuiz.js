import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { FaArrowRight, FaArrowLeft, FaCheck, FaGift, FaShoppingBag, FaLeaf } from 'react-icons/fa';
import { GiPeanut, GiSpoon, GiHeartBeats, GiPartyPopper, GiChefToque, GiHoneyJar, GiBellPepper, GiSeedling } from 'react-icons/gi';
import { MdRestaurant, MdLocalFireDepartment, MdLock, MdAutorenew } from 'react-icons/md';
import { FiPackage, FiTarget } from 'react-icons/fi';
import { Button } from '../styles/Button';
import { useCartContext } from '../context/cart_context';
import { toast } from 'react-toastify';

const CashewMatchQuiz = () => {
  const navigate = useNavigate();
  const { addToCart } = useCartContext();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const questions = [
    {
      id: 'taste',
      question: 'What flavor profile appeals to you most?',
      icon: <MdRestaurant />,
      options: [
        { value: 'classic', label: 'Classic & Buttery', desc: 'Pure, natural cashew taste' },
        { value: 'savory', label: 'Savory & Salted', desc: 'Light salt enhancement' },
        { value: 'spicy', label: 'Bold & Spicy', desc: 'Kick of heat and spice' },
        { value: 'sweet', label: 'Sweet & Coated', desc: 'Honey, caramel, or chocolate' }
      ]
    },
    {
      id: 'texture',
      question: 'How do you prefer your cashew texture?',
      icon: <GiPeanut />,
      options: [
        { value: 'crunchy', label: 'Extra Crunchy', desc: 'Deep roasted, satisfying crunch' },
        { value: 'medium', label: 'Medium Roast', desc: 'Balanced crunch and softness' },
        { value: 'soft', label: 'Lightly Roasted', desc: 'Softer, more buttery texture' },
        { value: 'raw', label: 'Raw & Natural', desc: 'Unroasted, pure and mild' }
      ]
    },
    {
      id: 'occasion',
      question: 'What will you mainly use these cashews for?',
      icon: <GiPartyPopper />,
      options: [
        { value: 'snacking', label: 'Daily Snacking', desc: 'Everyday healthy munchies' },
        { value: 'cooking', label: 'Cooking & Recipes', desc: 'Curries, desserts, garnishes' },
        { value: 'gifting', label: 'Premium Gifting', desc: 'Special occasions and festivals' },
        { value: 'health', label: 'Health & Fitness', desc: 'Protein-rich nutrition' }
      ]
    },
    {
      id: 'quantity',
      question: 'How much do you typically consume?',
      icon: <GiSpoon />,
      options: [
        { value: 'light', label: 'Light Consumer', desc: 'A handful occasionally' },
        { value: 'regular', label: 'Regular Snacker', desc: 'Few times a week' },
        { value: 'heavy', label: 'Cashew Lover', desc: 'Daily indulgence' },
        { value: 'bulk', label: 'Family/Bulk', desc: 'For entire household' }
      ]
    },
    {
      id: 'priority',
      question: 'What matters most to you?',
      icon: <GiHeartBeats />,
      options: [
        { value: 'quality', label: 'Premium Quality', desc: 'Whole, large W180/W240 grade' },
        { value: 'value', label: 'Best Value', desc: 'Great taste at fair price' },
        { value: 'variety', label: 'Variety Pack', desc: 'Mix of different flavors' },
        { value: 'organic', label: '100% Organic', desc: 'Certified organic sourcing' }
      ]
    }
  ];

  const recommendations = {
    'classic-crunchy-snacking': {
      id: 'quiz-premium-w240',
      name: 'Premium Roasted W240',
      match: 95,
      desc: 'Perfect for the purist who appreciates classic flavor with satisfying crunch',
      benefits: ['Whole large kernels', 'Traditional wood-fire roast', 'Zero additives'],
      icon: 'peanut',
      price: 899,
      priceDisplay: '₹899',
      size: '500g'
    },
    'savory-medium-snacking': {
      id: 'quiz-salted-roasted',
      name: 'Salted Roasted Cashews',
      match: 92,
      desc: 'Lightly salted perfection for your daily snacking needs',
      benefits: ['Himalayan pink salt', 'Balanced flavor', 'Resealable pack'],
      icon: 'peanut',
      price: 799,
      priceDisplay: '₹799',
      size: '400g'
    },
    'spicy-crunchy-snacking': {
      id: 'quiz-masala-roasted',
      name: 'Masala Roasted Cashews',
      match: 94,
      desc: 'Bold Goan spices meet premium cashews for the adventurous snacker',
      benefits: ['Secret family recipe', 'Authentic Goan spices', 'Medium heat'],
      icon: 'pepper',
      price: 849,
      priceDisplay: '₹849',
      size: '400g'
    },
    'sweet-medium-gifting': {
      id: 'quiz-honey-glazed-gift',
      name: 'Honey Glazed Premium Gift Box',
      match: 96,
      desc: 'Elegant presentation with irresistible honey-roasted cashews',
      benefits: ['Premium gift packaging', 'Natural honey glaze', 'W180 grade'],
      icon: 'honey',
      price: 1299,
      priceDisplay: '₹1,299',
      size: '500g'
    },
    'classic-soft-cooking': {
      id: 'quiz-whole-w320',
      name: 'Whole Cashews W320',
      match: 91,
      desc: 'Ideal for cooking curries, making cashew cream, and garnishing',
      benefits: ['Perfect for recipes', 'Easy to chop/blend', 'Bulk friendly'],
      icon: 'chef',
      price: 699,
      priceDisplay: '₹699',
      size: '500g'
    },
    'raw-health': {
      id: 'quiz-raw-organic',
      name: 'Raw Organic Cashews',
      match: 97,
      desc: 'Pure, unprocessed nutrition for the health-conscious',
      benefits: ['Zero processing', 'Maximum nutrients', 'USDA Organic'],
      icon: 'seedling',
      price: 999,
      priceDisplay: '₹999',
      size: '400g'
    },
    default: {
      id: 'quiz-signature-collection',
      name: 'Sawaikar\'s Signature Collection',
      match: 90,
      desc: 'Our bestselling variety pack with something for every taste',
      benefits: ['4 popular flavors', 'Premium W240 grade', 'Perfect sampler'],
      icon: 'gift',
      price: 1499,
      priceDisplay: '₹1,499',
      size: '4 x 200g'
    }
  };

  const getProductIcon = (iconName) => {
    const iconMap = {
      peanut: <GiPeanut />,
      pepper: <GiBellPepper />,
      honey: <GiHoneyJar />,
      chef: <GiChefToque />,
      seedling: <GiSeedling />,
      gift: <FaGift />
    };
    return iconMap[iconName] || <GiPeanut />;
  };

  const handleAddToCart = () => {
    if (!recommendation || isAddingToCart) return;

    setIsAddingToCart(true);

    // Convert price to paise (x100) since FormatPrice divides by 100
    const priceInPaise = recommendation.price * 100;

    const productData = {
      id: recommendation.id,
      name: `${recommendation.name} (${recommendation.size}) - Quiz Recommendation`,
      price: priceInPaise,
      image: ['/images/premium.jpg'],
      category: 'Cashews',
      company: "Sawaikar's",
      selectedWeight: recommendation.size,
      stock: 100,
      isQuizRecommendation: true,
      matchPercentage: recommendation.match
    };

    addToCart(recommendation.id, 'default', 1, productData);

    toast.success(`${recommendation.name} added to cart! ${recommendation.match}% match for you`, {
      icon: <FiTarget style={{ color: '#4CAF50' }} />,
      position: 'top-center'
    });

    // Navigate to cart after short delay
    setTimeout(() => {
      setIsAddingToCart(false);
      window.scrollTo(0, 0);
      navigate('/cart');
    }, 1500);
  };

  const handleAnswer = (value) => {
    const newAnswers = { ...answers, [questions[currentQuestion].id]: value };
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
      }, 300);
    } else {
      calculateRecommendation(newAnswers);
    }
  };

  const calculateRecommendation = (finalAnswers) => {
    const key = `${finalAnswers.taste}-${finalAnswers.texture}-${finalAnswers.occasion}`;

    let result = recommendations[key];

    if (!result) {
      if (finalAnswers.taste === 'raw' || finalAnswers.priority === 'organic') {
        result = recommendations['raw-health'];
      } else if (finalAnswers.occasion === 'gifting') {
        result = recommendations['sweet-medium-gifting'];
      } else if (finalAnswers.taste === 'spicy') {
        result = recommendations['spicy-crunchy-snacking'];
      } else if (finalAnswers.occasion === 'cooking') {
        result = recommendations['classic-soft-cooking'];
      } else {
        result = recommendations.default;
      }
    }

    setRecommendation(result);
    setShowResult(true);
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResult(false);
    setRecommendation(null);
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  if (showResult && recommendation) {
    return (
      <Wrapper>
        <div className="container">
          <div className="result-card">
            <div className="confetti"><GiPartyPopper /></div>
            <div className="result-header">
              <span className="match-badge">{recommendation.match}% Match</span>
              <h2>Your Perfect Cashew Match!</h2>
            </div>

            <div className="result-content">
              <div className="product-visual">
                <span className="product-icon">{getProductIcon(recommendation.icon)}</span>
              </div>

              <div className="product-info">
                <h3>{recommendation.name}</h3>
                <p className="product-desc">{recommendation.desc}</p>

                <div className="benefits-list">
                  {recommendation.benefits.map((benefit, index) => (
                    <span key={index} className="benefit">
                      <FaCheck /> {benefit}
                    </span>
                  ))}
                </div>

                <div className="price-row">
                  <div className="price">
                    <span className="amount">{recommendation.priceDisplay}</span>
                    <span className="size">/ {recommendation.size}</span>
                  </div>
                  <div className="cta-buttons">
                    <Button
                      className={`shop-btn ${isAddingToCart ? 'adding' : ''}`}
                      onClick={handleAddToCart}
                      disabled={isAddingToCart}
                    >
                      {isAddingToCart ? (
                        <>
                          <FaCheck /> Added!
                        </>
                      ) : (
                        <>
                          <FaShoppingBag /> Add to Cart
                        </>
                      )}
                    </Button>
                    <button className="retry-btn" onClick={resetQuiz}>
                      Retake Quiz
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="also-consider">
              <h4><FaGift /> Also Consider</h4>
              <div className="mini-recommendations">
                <div className="mini-card">
                  <span className="mini-icon"><FaGift /></span>
                  <div>
                    <strong>Gift Combo</strong>
                    <span>3 flavors box</span>
                  </div>
                </div>
                <div className="mini-card">
                  <span className="mini-icon"><MdAutorenew /></span>
                  <div>
                    <strong>Subscribe & Save</strong>
                    <span>15% off monthly</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <div className="container">
        <div className="quiz-header">
          <span className="quiz-tag">
            <GiPeanut /> Cashew Match Quiz
          </span>
          <h2>Find Your Perfect Cashew</h2>
          <p>Answer 5 quick questions and we'll recommend the ideal cashews for you</p>
        </div>

        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
          <span className="progress-text">{currentQuestion + 1} of {questions.length}</span>
        </div>

        <div className="quiz-card">
          <div className="question-icon">
            {questions[currentQuestion].icon}
          </div>
          <h3 className="question-text">{questions[currentQuestion].question}</h3>

          <div className="options-grid">
            {questions[currentQuestion].options.map((option) => (
              <button
                key={option.value}
                className={`option-card ${answers[questions[currentQuestion].id] === option.value ? 'selected' : ''}`}
                onClick={() => handleAnswer(option.value)}
              >
                <span className="option-label">{option.label}</span>
                <span className="option-desc">{option.desc}</span>
              </button>
            ))}
          </div>

          {currentQuestion > 0 && (
            <button
              className="back-btn"
              onClick={() => setCurrentQuestion(currentQuestion - 1)}
            >
              <FaArrowLeft /> Previous
            </button>
          )}
        </div>

        <div className="quiz-footer">
          <span><MdLock /> Your preferences help us personalize your experience</span>
        </div>
      </div>
    </Wrapper>
  );
};

const Wrapper = styled.section`
  padding: 4rem 0;
  background: linear-gradient(180deg, #f5f0e1 0%, #FFF8DC 100%);

  .container {
    max-width: 80rem;
    margin: 0 auto;
    padding: 0 2rem;
  }

  .quiz-header {
    text-align: center;
    margin-bottom: 3rem;

    .quiz-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.8rem;
      background: linear-gradient(135deg, rgba(205, 133, 63, 0.15), rgba(139, 69, 19, 0.1));
      color: ${({ theme }) => theme.colors.helper};
      padding: 0.8rem 1.8rem;
      border-radius: 5rem;
      font-size: 1.3rem;
      font-weight: 600;
      margin-bottom: 1.2rem;
    }

    h2 {
      font-size: 3.2rem;
      font-weight: 700;
      color: ${({ theme }) => theme.colors.heading};
      margin-bottom: 0.8rem;
      letter-spacing: -0.01em;
    }

    p {
      font-size: 1.5rem;
      color: ${({ theme }) => theme.colors.text};
    }
  }

  .progress-container {
    position: relative;
    height: 7px;
    background: #e0d5c5;
    border-radius: 10px;
    margin-bottom: 2.5rem;
    overflow: hidden;

    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #CD853F, #8B4513);
      border-radius: 10px;
      transition: width 0.4s ease;
    }

    .progress-text {
      position: absolute;
      right: 0;
      top: -2.5rem;
      font-size: 1.2rem;
      font-weight: 600;
      color: ${({ theme }) => theme.colors.helper};
    }
  }

  .quiz-card {
    background: #fff;
    border-radius: 1.8rem;
    padding: 3.5rem;
    box-shadow: 0 12px 40px rgba(139, 69, 19, 0.1);
    text-align: center;

    .question-icon {
      width: 7.5rem;
      height: 7.5rem;
      background: linear-gradient(135deg, ${({ theme }) => theme.colors.bg}, #f5f0e1);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.8rem;

      svg {
        font-size: 3.2rem;
        color: ${({ theme }) => theme.colors.helper};
      }
    }

    .question-text {
      font-size: 2.2rem;
      font-weight: 700;
      color: ${({ theme }) => theme.colors.heading};
      margin-bottom: 2.5rem;
      letter-spacing: -0.01em;
    }
  }

  .options-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.2rem;
    margin-bottom: 1.8rem;
  }

  .option-card {
    background: #fff;
    border: 2px solid #e0d5c5;
    border-radius: 1.2rem;
    padding: 1.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: left;

    &:hover {
      border-color: ${({ theme }) => theme.colors.helper};
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(139, 69, 19, 0.12);
    }

    &.selected {
      border-color: ${({ theme }) => theme.colors.helper};
      background: linear-gradient(135deg, rgba(205, 133, 63, 0.1), rgba(139, 69, 19, 0.05));
    }

    .option-label {
      display: block;
      font-size: 1.5rem;
      font-weight: 700;
      color: ${({ theme }) => theme.colors.heading};
      margin-bottom: 0.4rem;
    }

    .option-desc {
      font-size: 1.2rem;
      color: ${({ theme }) => theme.colors.text};
    }
  }

  .back-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.8rem;
    background: transparent;
    border: none;
    color: ${({ theme }) => theme.colors.helper};
    font-size: 1.4rem;
    font-weight: 600;
    cursor: pointer;
    padding: 1rem;
    transition: all 0.3s ease;

    &:hover {
      transform: translateX(-5px);
    }
  }

  .quiz-footer {
    text-align: center;
    margin-top: 2rem;
    font-size: 1.3rem;
    color: ${({ theme }) => theme.colors.text};
    opacity: 0.7;
  }

  /* Result Card Styles */
  .result-card {
    background: #fff;
    border-radius: 1.5rem;
    padding: 3rem;
    box-shadow: 0 12px 40px rgba(139, 69, 19, 0.12);
    position: relative;
    overflow: hidden;

    .confetti {
      position: absolute;
      top: -1rem;
      right: 2rem;
      font-size: 4rem;
      color: ${({ theme }) => theme.colors.helper};
      animation: bounce 1s ease infinite;
    }

    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
  }

  .result-header {
    text-align: center;
    margin-bottom: 2.2rem;

    .match-badge {
      display: inline-block;
      background: linear-gradient(135deg, #4CAF50, #2E7D32);
      color: #fff;
      padding: 0.7rem 1.8rem;
      border-radius: 5rem;
      font-size: 1.3rem;
      font-weight: 700;
      margin-bottom: 1.2rem;
    }

    h2 {
      font-size: 2.8rem;
      color: ${({ theme }) => theme.colors.heading};
    }
  }

  .result-content {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 3rem;
    align-items: center;
    margin-bottom: 2.5rem;
  }

  .product-visual {
    background: linear-gradient(135deg, ${({ theme }) => theme.colors.bg}, #f5f0e1);
    border-radius: 1.5rem;
    padding: 3rem;
    text-align: center;

    .product-icon {
      font-size: 7rem;
      color: ${({ theme }) => theme.colors.helper};
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .product-info {
    h3 {
      font-size: 2.2rem;
      font-weight: 700;
      color: ${({ theme }) => theme.colors.heading};
      margin-bottom: 0.8rem;
    }

    .product-desc {
      font-size: 1.4rem;
      line-height: 1.6;
      color: ${({ theme }) => theme.colors.text};
      margin-bottom: 1.6rem;
    }

    .benefits-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.8rem;
      margin-bottom: 1.5rem;

      .benefit {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        background: #f0f7f0;
        color: #2E7D32;
        padding: 0.5rem 1rem;
        border-radius: 5rem;
        font-size: 1.1rem;
        font-weight: 600;
      }
    }

    .price-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1.5rem;

      .price {
        .amount {
          font-size: 2.5rem;
          font-weight: 800;
          color: ${({ theme }) => theme.colors.helper};
        }

        .size {
          font-size: 1.3rem;
          color: ${({ theme }) => theme.colors.text};
        }
      }

      .cta-buttons {
        display: flex;
        gap: 1rem;

        .shop-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.8rem;
          cursor: pointer;
          transition: all 0.3s ease;

          &.adding {
            background: #4CAF50 !important;
            cursor: not-allowed;
          }
        }

        .retry-btn {
          background: transparent;
          border: 2px solid ${({ theme }) => theme.colors.helper};
          color: ${({ theme }) => theme.colors.helper};
          padding: 1rem 2rem;
          border-radius: 8px;
          font-size: 1.4rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;

          &:hover {
            background: ${({ theme }) => theme.colors.helper};
            color: #fff;
          }
        }
      }
    }
  }

  .also-consider {
    background: #f8f4e6;
    border-radius: 1.5rem;
    padding: 2rem;

    h4 {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      font-size: 1.4rem;
      color: ${({ theme }) => theme.colors.heading};
      margin-bottom: 1.5rem;
    }

    .mini-recommendations {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .mini-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: #fff;
      padding: 1.5rem;
      border-radius: 1rem;

      .mini-icon {
        font-size: 2.2rem;
        color: ${({ theme }) => theme.colors.helper};
        display: flex;
        align-items: center;
      }

      strong {
        display: block;
        font-size: 1.3rem;
        color: ${({ theme }) => theme.colors.heading};
      }

      div span {
        font-size: 1.1rem;
        color: ${({ theme }) => theme.colors.text};
      }
    }
  }

  @media (max-width: 768px) {
    padding: 5rem 0;

    .quiz-header h2 {
      font-size: 2.6rem;
    }

    .quiz-card {
      padding: 2.5rem 2rem;

      .question-text {
        font-size: 2rem;
      }
    }

    .options-grid {
      grid-template-columns: 1fr;
    }

    .result-content {
      grid-template-columns: 1fr;
      text-align: center;
    }

    .product-visual {
      padding: 3rem;

      .product-icon {
        font-size: 6rem;
      }
    }

    .product-info {
      .benefits-list {
        justify-content: center;
      }

      .price-row {
        flex-direction: column;
        text-align: center;

        .cta-buttons {
          flex-direction: column;
          width: 100%;

          a, button {
            width: 100%;
          }
        }
      }
    }

    .mini-recommendations {
      grid-template-columns: 1fr !important;
    }
  }
`;

export default CashewMatchQuiz;
