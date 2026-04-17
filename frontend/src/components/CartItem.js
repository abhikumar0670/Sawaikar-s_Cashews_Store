import React, { useState } from "react";
import styled from "styled-components";
import FormatPrice from "../Helpers/FormatPrice";
import CartAmountToggle from "./CartAmountToggle";
import { FaTrash } from "react-icons/fa";
import { useCartContext } from "../context/cart_context";
import { notifyRemoveFromCart } from "../utils/customToast";

const CartItem = ({ id, name, image, color, price, amount, weight }) => {
  const { removeItem, setDecrease, setIncrement } = useCartContext();

  // Handler to remove item with toast notification
  const handleRemoveItem = () => {
    removeItem(id);
    notifyRemoveFromCart(); // 🔴 Red toast with trash icon
  };

  return (
    <CartItemWrapper className="grid grid-five-column">
      <div className="cart-image--name">
        <div>
          <figure>
            <img src={image} alt={name} />
          </figure>
        </div>
        <div>
          <p>{name}</p>
          {weight && <span className="weight-badge">{weight}</span>}
        </div>
      </div>
      {/* price   */}
      <div className="cart-hide">
        <p>
          <FormatPrice price={price} />
        </p>
      </div>

      {/* Quantity  */}
      <CartAmountToggle
        amount={amount}
        setDecrease={() => setDecrease(id)}
        setIncrease={() => setIncrement(id)}
      />

      {/* //Subtotal */}
      <div className="cart-hide">
        <p>
          <FormatPrice price={price * amount} />
        </p>
      </div>

      <div>
        <FaTrash className="remove_icon" onClick={handleRemoveItem} />
      </div>
    </CartItemWrapper>
  );
};

const CartItemWrapper = styled.div`
  padding: 2.5rem 0;
  border-bottom: 2px solid rgba(139, 69, 19, 0.08);
  transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
  
  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: rgba(193, 154, 107, 0.03);
    padding-left: 1rem;
    padding-right: 1rem;
    margin-left: -1rem;
    margin-right: -1rem;
    border-radius: 12px;
  }

  .cart-image--name {
    display: flex;
    align-items: center;
    gap: 1.8rem;

    figure {
      margin: 0;
    }

    p {
      font-size: 1.6rem;
      font-weight: 600;
      color: #5A4A3A;
      margin: 0 0 0.5rem 0;
      line-height: 1.4;
    }
    
    .weight-badge {
      display: inline-block;
      background: linear-gradient(135deg, #8B6F47 0%, #C19A6B 100%);
      color: white;
      padding: 0.4rem 1rem;
      border-radius: 50px;
      font-size: 1.2rem;
      font-weight: 700;
      margin-top: 0.3rem;
      box-shadow: 0 2px 6px rgba(139, 111, 71, 0.2);
      letter-spacing: 0.03em;
    }
  }

  .cart-hide {
    p {
      font-size: 1.6rem;
      font-weight: 700;
      color: #5A4A3A;
      margin: 0;
      font-variant-numeric: tabular-nums;
    }
  }

  @media (max-width: 768px) {
    padding: 2rem 0;
    
    &:hover {
      padding-left: 0.5rem;
      padding-right: 0.5rem;
      margin-left: -0.5rem;
      margin-right: -0.5rem;
    }
  }
`;

export default CartItem;