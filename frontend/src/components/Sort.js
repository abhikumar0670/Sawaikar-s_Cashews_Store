import React from "react";
import styled from "styled-components";
import { BsFillGridFill, BsList } from "react-icons/bs";
import { FiChevronDown } from "react-icons/fi";
import { useFilterContext } from "../context/filter_context";

const Sort = () => {
  const { filter_products, grid_view, setGridView, setListView, sorting } =
    useFilterContext();
  return (
    <Wrapper>
      {/* View Toggle */}
      <div className="view-toggle">
        <button
          className={`view-btn ${grid_view ? "active" : ""}`}
          onClick={setGridView}
          title="Grid View"
        >
          <BsFillGridFill />
        </button>
        <button
          className={`view-btn ${!grid_view ? "active" : ""}`}
          onClick={setListView}
          title="List View"
        >
          <BsList />
        </button>
      </div>

      {/* Product Count */}
      <div className="product-count">
        <span className="count-number">{filter_products.length}</span>
        <span className="count-text">Products Found</span>
      </div>

      {/* Sort Dropdown */}
      <div className="sort-dropdown">
        <label htmlFor="sort" className="sort-label">Sort by:</label>
        <div className="select-wrapper">
          <select
            name="sort"
            id="sort"
            className="sort-select"
            onClick={sorting}
          >
            <option value="lowest">Price: Low to High</option>
            <option value="highest">Price: High to Low</option>
            <option value="a-z">Name: A to Z</option>
            <option value="z-a">Name: Z to A</option>
            <option value="newest">Newest First</option>
            <option value="bestselling">Best Selling</option>
            <option value="rating">Highest Rated</option>
            <option value="discount">Most Discounted</option>
          </select>
          <FiChevronDown className="select-icon" />
        </div>
      </div>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2.5rem;
  flex-wrap: wrap;

  /* View Toggle */
  .view-toggle {
    display: flex;
    gap: 0.5rem;
    background: ${({ theme }) => theme.colors.bg};
    padding: 0.5rem;
    border-radius: 0.9rem;
    border: 1px solid rgba(139, 69, 19, 0.1);

    .view-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 4.2rem;
      height: 4.2rem;
      border: none;
      background: transparent;
      border-radius: 0.7rem;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
      color: ${({ theme }) => theme.colors.text};
      font-weight: 500;

      svg {
        font-size: 1.9rem;
        transition: transform 0.3s ease;
      }

      &:hover {
        background: white;
        color: ${({ theme }) => theme.colors.helper};

        svg {
          transform: scale(1.1);
        }
      }

      &.active {
        background: ${({ theme }) => theme.colors.btn};
        color: white;
        box-shadow: 0 4px 12px rgba(139, 69, 19, 0.25);
      }
    }
  }

  /* Product Count */
  .product-count {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: linear-gradient(135deg, rgba(210, 105, 30, 0.05), rgba(205, 133, 63, 0.05));
    padding: 1rem 1.8rem;
    border-radius: 0.9rem;
    border: 1px solid rgba(139, 69, 19, 0.1);

    .count-number {
      font-size: 2.2rem;
      font-weight: 800;
      color: ${({ theme }) => theme.colors.helper};
    }

    .count-text {
      font-size: 1.4rem;
      color: ${({ theme }) => theme.colors.text};
      font-weight: 600;
    }
  }

  /* Sort Dropdown */
  .sort-dropdown {
    display: flex;
    align-items: center;
    gap: 1.2rem;

    .sort-label {
      font-size: 1.4rem;
      color: ${({ theme }) => theme.colors.heading};
      font-weight: 700;
      letter-spacing: -0.01em;
    }

    .select-wrapper {
      position: relative;

      .sort-select {
        appearance: none;
        padding: 1.1rem 4.5rem 1.1rem 1.6rem;
        border: 1.5px solid rgba(139, 69, 19, 0.15);
        border-radius: 0.9rem;
        font-size: 1.3rem;
        color: ${({ theme }) => theme.colors.heading};
        background: white;
        cursor: pointer;
        min-width: 22rem;
        transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
        font-weight: 600;
        letter-spacing: -0.01em;

        &:focus {
          outline: none;
          border-color: ${({ theme }) => theme.colors.helper};
          box-shadow: 0 0 0 4px rgba(210, 105, 30, 0.12);
        }

        &:hover {
          border-color: ${({ theme }) => theme.colors.helper};
          background: linear-gradient(135deg, #fff 0%, ${({ theme }) => theme.colors.bg} 100%);
        }

        option {
          font-weight: 500;
          padding: 0.8rem;
        }
      }

      .select-icon {
        position: absolute;
        right: 1.4rem;
        top: 50%;
        transform: translateY(-50%);
        font-size: 1.8rem;
        color: ${({ theme }) => theme.colors.helper};
        pointer-events: none;
        transition: transform 0.3s ease;
      }
    }
  }

  /* Responsive */
  @media (max-width: ${({ theme }) => theme.media.tab}) {
    .product-count {
      order: -1;
      width: 100%;
      justify-content: center;
      margin-bottom: 1rem;
    }

    .view-toggle {
      margin-left: auto;
    }

    .sort-dropdown {
      order: 2;
      width: calc(100% - 5rem);
    }
  }

  @media (max-width: ${({ theme }) => theme.media.mobile}) {
    flex-direction: column;
    gap: 1.5rem;

    .view-toggle {
      order: 1;
      width: 100%;
      justify-content: center;
      margin: 0;
    }

    .product-count {
      order: 2;
      width: 100%;
      justify-content: center;
    }

    .sort-dropdown {
      order: 3;
      width: 100%;
      flex-direction: column;
      align-items: stretch;

      .sort-label {
        width: 100%;
      }

      .select-wrapper {
        width: 100%;

        .sort-select {
          width: 100%;
          min-width: 100%;
        }
      }
    }
  }
`;

export default Sort;