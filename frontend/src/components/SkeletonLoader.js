import React from 'react';
import styled, { keyframes } from 'styled-components';

// Shimmer animation
const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`;

// Product Card Skeleton
export const ProductCardSkeleton = () => {
  return (
    <ProductSkeletonWrapper>
      <div className="skeleton-image"></div>
      <div className="skeleton-content">
        <div className="skeleton-title"></div>
        <div className="skeleton-title short"></div>
        <div className="skeleton-price"></div>
        <div className="skeleton-button"></div>
      </div>
    </ProductSkeletonWrapper>
  );
};

// Cart Item Skeleton
export const CartItemSkeleton = () => {
  return (
    <CartSkeletonWrapper>
      <div className="skeleton-image-small"></div>
      <div className="skeleton-details">
        <div className="skeleton-line"></div>
        <div className="skeleton-line short"></div>
      </div>
      <div className="skeleton-price"></div>
    </CartSkeletonWrapper>
  );
};

// Single Product Skeleton
export const SingleProductSkeleton = () => {
  return (
    <SingleProductSkeletonWrapper>
      <div className="skeleton-gallery">
        <div className="skeleton-thumbnails">
          <div className="skeleton-thumb"></div>
          <div className="skeleton-thumb"></div>
          <div className="skeleton-thumb"></div>
        </div>
        <div className="skeleton-main-image"></div>
      </div>
      <div className="skeleton-details">
        <div className="skeleton-title-large"></div>
        <div className="skeleton-rating"></div>
        <div className="skeleton-price-large"></div>
        <div className="skeleton-description"></div>
        <div className="skeleton-description"></div>
        <div className="skeleton-description short"></div>
        <div className="skeleton-button-large"></div>
      </div>
    </SingleProductSkeletonWrapper>
  );
};

// Full Cart Page Skeleton
export const CartSkeleton = () => {
  return (
    <FullCartSkeletonWrapper>
      <div className="cart-header-skeleton">
        <div className="skeleton-title-large"></div>
      </div>
      <div className="cart-content-skeleton">
        <div className="cart-items-skeleton">
          <CartItemSkeleton />
          <CartItemSkeleton />
          <CartItemSkeleton />
        </div>
        <div className="cart-summary-skeleton">
          <div className="skeleton-summary-title"></div>
          <div className="skeleton-summary-line"></div>
          <div className="skeleton-summary-line"></div>
          <div className="skeleton-summary-line"></div>
          <div className="skeleton-summary-total"></div>
          <div className="skeleton-button-large"></div>
        </div>
      </div>
    </FullCartSkeletonWrapper>
  );
};

// Styled Components
const ProductSkeletonWrapper = styled.div`
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(139, 69, 19, 0.08);
  border: 1px solid rgba(139, 69, 19, 0.08);

  .skeleton-image {
    width: 100%;
    height: 280px;
    background: linear-gradient(
      90deg,
      #f0f0f0 0%,
      #e0e0e0 20%,
      #f0f0f0 40%,
      #f0f0f0 100%
    );
    background-size: 1000px 100%;
    animation: ${shimmer} 2s infinite linear;
  }

  .skeleton-content {
    padding: 2rem;
  }

  .skeleton-title,
  .skeleton-price,
  .skeleton-button {
    background: linear-gradient(
      90deg,
      #f0f0f0 0%,
      #e0e0e0 20%,
      #f0f0f0 40%,
      #f0f0f0 100%
    );
    background-size: 1000px 100%;
    animation: ${shimmer} 2s infinite linear;
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .skeleton-title {
    height: 20px;
    width: 100%;

    &.short {
      width: 60%;
    }
  }

  .skeleton-price {
    height: 24px;
    width: 40%;
    margin-bottom: 1.5rem;
  }

  .skeleton-button {
    height: 45px;
    width: 100%;
    margin-bottom: 0;
  }
`;

const CartSkeletonWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 2rem 0;
  border-bottom: 1px solid rgba(139, 69, 19, 0.08);

  .skeleton-image-small {
    width: 90px;
    height: 90px;
    border-radius: 12px;
    background: linear-gradient(
      90deg,
      #f0f0f0 0%,
      #e0e0e0 20%,
      #f0f0f0 40%,
      #f0f0f0 100%
    );
    background-size: 1000px 100%;
    animation: ${shimmer} 2s infinite linear;
    flex-shrink: 0;
  }

  .skeleton-details {
    flex: 1;
  }

  .skeleton-line {
    height: 16px;
    background: linear-gradient(
      90deg,
      #f0f0f0 0%,
      #e0e0e0 20%,
      #f0f0f0 40%,
      #f0f0f0 100%
    );
    background-size: 1000px 100%;
    animation: ${shimmer} 2s infinite linear;
    border-radius: 8px;
    margin-bottom: 0.8rem;

    &.short {
      width: 60%;
    }
  }

  .skeleton-price {
    width: 80px;
    height: 20px;
    background: linear-gradient(
      90deg,
      #f0f0f0 0%,
      #e0e0e0 20%,
      #f0f0f0 40%,
      #f0f0f0 100%
    );
    background-size: 1000px 100%;
    animation: ${shimmer} 2s infinite linear;
    border-radius: 8px;
  }
`;

const SingleProductSkeletonWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  padding: 2rem 0;

  .skeleton-gallery {
    display: flex;
    gap: 1rem;
  }

  .skeleton-thumbnails {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .skeleton-thumb {
    width: 80px;
    height: 80px;
    border-radius: 8px;
    background: linear-gradient(
      90deg,
      #f0f0f0 0%,
      #e0e0e0 20%,
      #f0f0f0 40%,
      #f0f0f0 100%
    );
    background-size: 1000px 100%;
    animation: ${shimmer} 2s infinite linear;
  }

  .skeleton-main-image {
    flex: 1;
    height: 500px;
    border-radius: 16px;
    background: linear-gradient(
      90deg,
      #f0f0f0 0%,
      #e0e0e0 20%,
      #f0f0f0 40%,
      #f0f0f0 100%
    );
    background-size: 1000px 100%;
    animation: ${shimmer} 2s infinite linear;
  }

  .skeleton-details {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .skeleton-title-large,
  .skeleton-rating,
  .skeleton-price-large,
  .skeleton-description,
  .skeleton-button-large {
    background: linear-gradient(
      90deg,
      #f0f0f0 0%,
      #e0e0e0 20%,
      #f0f0f0 40%,
      #f0f0f0 100%
    );
    background-size: 1000px 100%;
    animation: ${shimmer} 2s infinite linear;
    border-radius: 8px;
  }

  .skeleton-title-large {
    height: 32px;
    width: 80%;
  }

  .skeleton-rating {
    height: 20px;
    width: 150px;
  }

  .skeleton-price-large {
    height: 36px;
    width: 200px;
  }

  .skeleton-description {
    height: 16px;
    width: 100%;

    &.short {
      width: 70%;
    }
  }

  .skeleton-button-large {
    height: 50px;
    width: 100%;
    margin-top: 1rem;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 2rem;

    .skeleton-gallery {
      flex-direction: column;
    }

    .skeleton-thumbnails {
      flex-direction: row;
      justify-content: center;
    }

    .skeleton-main-image {
      height: 300px;
    }
  }
`;

const FullCartSkeletonWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;

  .cart-header-skeleton {
    margin-bottom: 3rem;

    .skeleton-title-large {
      height: 36px;
      width: 200px;
      background: linear-gradient(
        90deg,
        #f0f0f0 0%,
        #e0e0e0 20%,
        #f0f0f0 40%,
        #f0f0f0 100%
      );
      background-size: 1000px 100%;
      animation: ${shimmer} 2s infinite linear;
      border-radius: 8px;
    }
  }

  .cart-content-skeleton {
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: 3rem;

    @media (max-width: 968px) {
      grid-template-columns: 1fr;
    }
  }

  .cart-items-skeleton {
    background: white;
    border-radius: 16px;
    padding: 2rem;
    box-shadow: 0 2px 12px rgba(139, 69, 19, 0.08);
  }

  .cart-summary-skeleton {
    background: white;
    border-radius: 16px;
    padding: 2rem;
    box-shadow: 0 2px 12px rgba(139, 69, 19, 0.08);
    height: fit-content;
    position: sticky;
    top: 2rem;

    .skeleton-summary-title,
    .skeleton-summary-line,
    .skeleton-summary-total,
    .skeleton-button-large {
      background: linear-gradient(
        90deg,
        #f0f0f0 0%,
        #e0e0e0 20%,
        #f0f0f0 40%,
        #f0f0f0 100%
      );
      background-size: 1000px 100%;
      animation: ${shimmer} 2s infinite linear;
      border-radius: 8px;
      margin-bottom: 1.5rem;
    }

    .skeleton-summary-title {
      height: 24px;
      width: 150px;
      margin-bottom: 2rem;
    }

    .skeleton-summary-line {
      height: 18px;
      width: 100%;
    }

    .skeleton-summary-total {
      height: 28px;
      width: 100%;
      margin-top: 2rem;
      margin-bottom: 2rem;
    }

    .skeleton-button-large {
      height: 50px;
      width: 100%;
      margin-bottom: 0;
    }
  }
`;

export default ProductCardSkeleton;
