import React, { useState } from 'react'
import { NavLink } from 'react-router-dom';
import styled from 'styled-components';
import FormatPrice from '../Helpers/FormatPrice';
import { FiShoppingCart, FiEye } from 'react-icons/fi';
import { useCartContext } from '../context/cart_context';
import { notifyAddToCart } from '../utils/customToast';
import LazyImage from './LazyImage';
import { NutritionBadgeStrip } from './NutritionBadge';
import AddToCartAnimation from './AddToCartAnimation';

const Product = (curElem) => {
    const { id, name, image, price, category, stock, variants, defaultWeight, nutritionInfo } = curElem;
    const { addToCart } = useCartContext();
    const [showAddToCartAnimation, setShowAddToCartAnimation] = useState(false);
    
    // Get the first image if it's an array, otherwise use the image directly
    const displayImage = Array.isArray(image) ? image[0] : image;

    // Get display price based on default variant or base price
    const getDisplayPrice = () => {
      if (variants && variants.length > 0) {
        const defaultVariant = variants.find(v => v.weight === defaultWeight) || variants[0];
        return defaultVariant.price;
      }
      return price;
    };

    const displayPrice = getDisplayPrice();

    // Calculate original price for showing discount
    const originalPrice = displayPrice ? Math.ceil(displayPrice * 1.2) : 0;
    const discount = originalPrice && displayPrice ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100) : 0;

    // Quick add to cart handler
    const handleQuickAdd = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const defaultColor = curElem.colors && curElem.colors.length > 0 ? curElem.colors[0] : "default";
      // Include default weight and price in product
      const productWithWeight = {
        ...curElem,
        selectedWeight: defaultWeight || (variants && variants.length > 0 ? variants[0].weight : ''),
        price: displayPrice
      };
      addToCart(id, defaultColor, 1, productWithWeight);
      setShowAddToCartAnimation(true); // Trigger animation
      notifyAddToCart(); // 🟢 Green toast with checkmark
    };

  return (
    <ProductWrapper>
      {/* Add to Cart Animation */}
      <AddToCartAnimation 
        trigger={showAddToCartAnimation}
        productImage={displayImage}
        onComplete={() => setShowAddToCartAnimation(false)}
      />
      
      <NavLink to={`/singleproduct/${id}`} className="card-link">
        <div className="product-card">
          {/* Image Container */}
          <div className="image-container">
            <LazyImage 
              src={displayImage} 
              alt={name} 
              className="product-image"
              aspectRatio="1/1"
            />
            
            {/* Discount Badge */}
            {discount > 0 && (
              <span className="discount-badge">{discount}% OFF</span>
            )}
            
            {/* Stock Badge */}
            {stock === 0 && (
              <span className="out-of-stock-badge">Out of Stock</span>
            )}

            {/* Nutrition Badges */}
            {nutritionInfo && <NutritionBadgeStrip nutritionInfo={nutritionInfo} />}

            {/* Hover Overlay */}
            <div className="hover-overlay">
              <button 
                className="quick-action view-btn"
                title="View Product"
              >
                <FiEye />
              </button>
              {stock > 0 && (
                <button 
                  className="quick-action cart-btn"
                  onClick={handleQuickAdd}
                  title="Quick Add to Cart"
                >
                  <FiShoppingCart />
                </button>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="product-info">
            <span className="category-tag">{category}</span>
            <h3 className="product-name">{name}</h3>
            
            {/* Weight options preview */}
            {variants && variants.length > 0 && (
              <div className="weight-options-preview">
                {variants.slice(0, 3).map((v, i) => (
                  <span key={i} className="weight-tag">{v.weight}</span>
                ))}
                {variants.length > 3 && <span className="more-weights">+{variants.length - 3}</span>}
              </div>
            )}
            
            <div className="price-row">
              <span className="current-price"><FormatPrice price={displayPrice}/></span>
              {originalPrice > displayPrice && (
                <span className="original-price"><FormatPrice price={originalPrice}/></span>
              )}
              {variants && variants.length > 0 && (
                <span className="per-weight">/ {defaultWeight || variants[0].weight}</span>
              )}
            </div>
          </div>
        </div>
      </NavLink>
    </ProductWrapper>
  )
}

const ProductWrapper = styled.div`
  .card-link {
    text-decoration: none;
    display: block;
  }

  .product-card {
    background: ${({ theme }) => theme.colors.bgLight};
    border-radius: 20px;
    overflow: hidden;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid ${({ theme }) => theme.colors.borderLight};
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
    box-shadow: ${({ theme }) => theme.colors.shadow};

    &:hover {
      transform: translateY(-12px);
      box-shadow: ${({ theme }) => theme.colors.shadowLarge};
      border-color: ${({ theme }) => theme.colors.border};

      .hover-overlay {
        opacity: 1;
        visibility: visible;
      }

      .product-image {
        transform: scale(1.1);
      }
    }
  }

  .image-container {
    position: relative;
    height: 28rem;
    overflow: hidden;
    background: linear-gradient(135deg, #FFF8F0 0%, #FFFBF5 100%);

    .product-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      
      /* Image zoom on hover */
      &:hover {
        transform: scale(1.08);
      }
    }

    .discount-badge {
      position: absolute;
      top: 1.5rem;
      left: 1.5rem;
      background: linear-gradient(135deg, ${({ theme }) => theme.colors.error} 0%, #A84842 100%);
      color: ${({ theme }) => theme.colors.white};
      padding: 0.8rem 1.5rem;
      border-radius: 50px;
      font-size: 1.2rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      box-shadow: 0 4px 16px rgba(200, 90, 84, 0.35);
      text-transform: uppercase;
      backdrop-filter: blur(10px);
    }

    .out-of-stock-badge {
      position: absolute;
      top: 1.5rem;
      right: 1.5rem;
      background: rgba(44, 36, 22, 0.9);
      color: ${({ theme }) => theme.colors.white};
      padding: 0.8rem 1.5rem;
      border-radius: 50px;
      font-size: 1.2rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      backdrop-filter: blur(10px);
    }

    .hover-overlay {
      position: absolute;
      inset: 0;
      padding: 2rem;
      background: linear-gradient(to top, rgba(44, 36, 22, 0.85) 0%, rgba(44, 36, 22, 0.3) 50%, transparent 100%);
      display: flex;
      justify-content: center;
      align-items: flex-end;
      gap: 1.5rem;
      opacity: 0;
      visibility: hidden;
      transition: all 0.4s ease;

      .quick-action {
        width: 5.5rem;
        height: 5.5rem;
        border-radius: 50%;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        font-size: 2rem;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);

        &.view-btn {
          background: ${({ theme }) => theme.colors.white};
          color: ${({ theme }) => theme.colors.heading};

          &:hover {
            background: ${({ theme }) => theme.colors.bg};
            color: ${({ theme }) => theme.colors.primary};
            transform: scale(1.15);
          }
        }

        &.cart-btn {
          background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary} 0%, ${({ theme }) => theme.colors.primaryDark} 100%);
          color: ${({ theme }) => theme.colors.white};

          &:hover {
            transform: scale(1.15);
            box-shadow: 0 8px 28px rgba(139, 111, 71, 0.45);
          }
        }
      }
    }
  }

  .product-info {
    padding: 2.5rem;
    flex: 1;
    display: flex;
    flex-direction: column;

    .category-tag {
      display: inline-block;
      font-size: 1.1rem;
      color: ${({ theme }) => theme.colors.primary};
      text-transform: uppercase;
      letter-spacing: 0.12em;
      font-weight: 700;
      margin-bottom: 1rem;
      opacity: 0.8;
    }

    .product-name {
      font-size: 1.8rem;
      font-weight: 700;
      color: ${({ theme }) => theme.colors.heading};
      margin-bottom: 1.2rem;
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      flex: 1;
      letter-spacing: -0.02em;
    }

    .weight-options-preview {
      display: flex;
      flex-wrap: wrap;
      gap: 0.8rem;
      margin-bottom: 1.5rem;
      
      .weight-tag {
        background: linear-gradient(135deg, rgba(139, 111, 71, 0.08), rgba(139, 111, 71, 0.12));
        color: ${({ theme }) => theme.colors.primary};
        padding: 0.6rem 1.2rem;
        border-radius: 50px;
        font-size: 1.1rem;
        font-weight: 600;
        border: 1px solid ${({ theme }) => theme.colors.border};
        transition: all 0.3s ease;

        &:hover {
          background: ${({ theme }) => theme.colors.primary};
          color: ${({ theme }) => theme.colors.white};
          transform: translateY(-2px);
        }
      }
      
      .more-weights {
        color: ${({ theme }) => theme.colors.textLight};
        font-size: 1.1rem;
        font-weight: 600;
        padding: 0.6rem 0.8rem;
        align-self: center;
      }
    }

    .price-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-top: auto;
      flex-wrap: wrap;
      padding-top: 1.5rem;
      border-top: 1px solid ${({ theme }) => theme.colors.borderLight};

      .current-price {
        font-size: 2rem;
        font-weight: 700;
        color: ${({ theme }) => theme.colors.primary};
        letter-spacing: -0.02em;
      }

      .original-price {
        font-size: 1.4rem;
        color: ${({ theme }) => theme.colors.textLight};
        text-decoration: line-through;
        font-weight: 500;
      }
      
      .per-weight {
        font-size: 1.2rem;
        color: ${({ theme }) => theme.colors.textLight};
        font-weight: 500;
        margin-left: auto;
      }
    }
  }

  @media (max-width: ${({ theme }) => theme.media.mobile}) {
    .image-container {
      height: 22rem;
    }

    .product-info {
      padding: 2rem;

      .product-name {
        font-size: 1.6rem;
      }

      .price-row .current-price {
        font-size: 1.8rem;
      }
    }
  }
`;

export default Product
