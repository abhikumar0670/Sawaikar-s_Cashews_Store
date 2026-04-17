import React from "react";
import styled from "styled-components";
import { FaMinus, FaPlus } from "react-icons/fa";

const CartAmountToggle = ({ amount, setDecrease, setIncrease }) => {
  return (
    <QuantityWrapper>
      <button className="minus-btn" onClick={() => setDecrease()}>
        <FaMinus />
      </button>
      <div className="quantity-display">{amount}</div>
      <button className="plus-btn" onClick={() => setIncrease()}>
        <FaPlus />
      </button>
    </QuantityWrapper>
  );
};

const QuantityWrapper = styled.div`
  display: grid;
  grid-template-columns: auto auto auto;
  border: 2px solid #8B6F47;
  border-radius: 12px;
  overflow: hidden;
  background: white;
  width: fit-content;
  box-shadow: 0 2px 8px rgba(139, 111, 71, 0.12);
  transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);

  &:hover {
    box-shadow: 0 4px 12px rgba(139, 111, 71, 0.2);
    transform: translateY(-1px);
  }

  button {
    width: 48px;
    height: 48px;
    border: none;
    background: white;
    color: #8B6F47;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.4rem;
    font-weight: 700;
    transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);

    &:hover {
      background: linear-gradient(135deg, #8B6F47, #C19A6B);
      color: white;
      transform: scale(1.05);
    }

    &:active {
      transform: scale(0.95);
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      
      &:hover {
        background: white;
        color: #8B6F47;
        transform: none;
      }
    }
  }

  .minus-btn {
    border-right: 2px solid #8B6F47;
  }

  .plus-btn {
    border-left: 2px solid #8B6F47;
  }

  .quantity-display {
    width: 52px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.7rem;
    font-weight: 800;
    color: #5A4A3A;
    background: #F5F1E8;
    font-variant-numeric: tabular-nums;
  }

  @media (max-width: 768px) {
    button {
      width: 44px;
      height: 44px;
      font-size: 1.3rem;
    }

    .quantity-display {
      width: 48px;
      height: 44px;
      font-size: 1.6rem;
    }
  }
`;

export default CartAmountToggle;