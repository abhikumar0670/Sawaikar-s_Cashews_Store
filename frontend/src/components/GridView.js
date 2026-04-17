import React from "react";
import styled from "styled-components";
import Product from "./Product";
import { ProductCardSkeleton } from "./SkeletonLoader";
import { useProductContext } from "../context/productContext";

const GridView = ({ products }) => {
  const { isLoading } = useProductContext();
  
  // Show skeleton loaders while loading
  if (isLoading) {
    return (
      <Wrapper className="section">
        <div className="container grid grid-three-column">
          {Array.from({ length: 6 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper className="section">
      <div className="container grid grid-three-column">
        {products.map((curElem) => {
          return <Product key={curElem.id} {...curElem} />;
        })}
      </div>
    </Wrapper>
  );
};

const Wrapper = styled.section`
  padding: 0;
  background: transparent;
  width: 100%;
  overflow: hidden;

  .container {
    max-width: 100%;
    margin: 0 auto;
    box-sizing: border-box;
  }

  .grid {
    gap: 2rem;
    animation: fadeInUp 0.6s ease-out;
  }

  .grid-three-column {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(25.5rem, 1fr));
    width: 100%;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 1024px) {
    .grid {
      gap: 1.8rem;
    }

    .grid-three-column {
      grid-template-columns: repeat(auto-fill, minmax(23rem, 1fr));
    }
  }

  @media (max-width: 768px) {
    padding: 0;
    
    .grid {
      gap: 2rem;
    }
    
    .grid-three-column {
      grid-template-columns: repeat(auto-fill, minmax(22rem, 1fr));
    }
  }

  @media (max-width: 480px) {
    .grid {
      gap: 1.5rem;
    }

    .grid-three-column {
      grid-template-columns: 1fr;
    }
  }

  a {
    color: rgb(98 84 243);
    font-size: 1.4rem;
  }
`;

export default GridView;