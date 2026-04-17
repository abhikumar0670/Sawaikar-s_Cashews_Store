import styled from "styled-components";
import { useFilterContext } from "../context/filter_context";
import FormatPrice from "../Helpers/FormatPrice";
import { FiSearch, FiX, FiStar, FiCheck, FiPackage, FiTruck, FiAward, FiFilter } from "react-icons/fi";
import { MdOutlineVerified } from "react-icons/md";

const FilterSection = () => {
  const {
    filters: { text, category, price, maxPrice, minPrice, rating, inStock, featured, freeShipping },
    updateFilterValue,
    all_products,
    clearFilters,
  } = useFilterContext();

  // Get unique values with enhanced category names
  const getUniqueData = (data, attr) => {
    let newVal = data.map((curElem) => {
      return curElem[attr];
    });
    return (newVal = ["all", ...new Set(newVal)]).filter(v => v);
  };

  const categoryData = getUniqueData(all_products, "category");
  const companyData = getUniqueData(all_products, "company");

  // Professional category labels
  const categoryLabels = {
    "all": "All Categories",
    "nuts": "Premium Nuts",
    "dry fruits": "Dry Fruits",
    "snacks": "Healthy Snacks",
    "sweets": "Artisan Sweets",
    "berries": "Organic Berries",
    "flavored cashews": "Specialty Flavors",
    "dry-dates": "Dates Collection"
  };

  const getCategoryLabel = (cat) => categoryLabels[cat?.toLowerCase()] || cat;

  return (
    <Wrapper>
      {/* Filter Header */}
      <div className="filter-header">
        <h2>Filters</h2>
        <button className="clear-all-btn" onClick={clearFilters}>
          <FiX /> Clear All
        </button>
      </div>

      {/* Search */}
      <div className="filter-block">
        <h3 className="filter-title">Search</h3>
        <div className="search-box">
          <FiSearch className="search-icon" />
          <form onSubmit={(e) => e.preventDefault()}>
            <input
              type="text"
              name="text"
              placeholder="Search products..."
              value={text}
              onChange={updateFilterValue}
            />
          </form>
        </div>
      </div>

      {/* Category */}
      <div className="filter-block">
        <h3 className="filter-title">
          <FiPackage /> Category
        </h3>
        <div className="select-wrapper">
          <select
            name="category"
            id="category"
            className="category-select"
            value={category}
            onChange={updateFilterValue}>
            {categoryData.map((curElem, index) => {
              return (
                <option key={index} value={curElem} name="category">
                  {getCategoryLabel(curElem)}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Company/Brand */}
      <div className="filter-block">
        <h3 className="filter-title">
          <MdOutlineVerified /> Brands
        </h3>
        <div className="select-wrapper">
          <select
            name="company"
            id="company"
            className="brand-select"
            onChange={updateFilterValue}>
            {companyData.map((curElem, index) => {
              return (
                <option key={index} value={curElem} name="company">
                  {curElem}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Price Range */}
      <div className="filter-block">
        <h3 className="filter-title">Price Range</h3>
        <div className="price-filter">
          <div className="price-display">
            <span className="price-label">Up to</span>
            <span className="price-value"><FormatPrice price={price} /></span>
          </div>
          <input
            type="range"
            name="price"
            min={minPrice}
            max={maxPrice}
            value={price}
            onChange={updateFilterValue}
            className="price-slider"
          />
          <div className="price-range-labels">
            <span><FormatPrice price={minPrice} /></span>
            <span><FormatPrice price={maxPrice} /></span>
          </div>
        </div>
      </div>

      {/* Rating Filter */}
      <div className="filter-block">
        <h3 className="filter-title">
          <FiStar /> Customer Ratings
        </h3>
        <div className="rating-filter">
          {[5, 4, 3, 2, 1].map((star) => (
            <label key={star} className={`rating-option ${rating >= star ? 'active' : ''}`}>
              <input
                type="radio"
                name="rating"
                value={star}
                checked={rating === star}
                onChange={updateFilterValue}
              />
              <span className="rating-stars">
                {[...Array(5)].map((_, idx) => (
                  <FiStar 
                    key={idx} 
                    className={idx < star ? 'filled' : ''} 
                  />
                ))}
              </span>
              <span className="rating-text">{star === 5 ? 'Excellent' : star === 4 ? 'Very Good' : star === 3 ? 'Good' : star === 2 ? 'Fair' : 'All Ratings'} & Up</span>
            </label>
          ))}
          {rating > 0 && (
            <button 
              className="rating-clear"
              onClick={() => updateFilterValue({ target: { name: 'rating', value: 0 } })}
            >
              Clear Rating Filter
            </button>
          )}
        </div>
      </div>

      {/* Quick Filters */}
      <div className="filter-block">
        <h3 className="filter-title">Quick Filters</h3>
        <div className="quick-filters">
          <label className={`quick-filter-option ${inStock ? 'active' : ''}`}>
            <input
              type="checkbox"
              name="inStock"
              checked={inStock}
              onChange={(e) => updateFilterValue({ target: { name: 'inStock', value: e.target.checked } })}
            />
            <span className="filter-checkbox">
              {inStock && <FiCheck />}
            </span>
            <FiPackage className="filter-icon" />
            <span>In Stock Only</span>
          </label>
          
          <label className={`quick-filter-option ${featured ? 'active' : ''}`}>
            <input
              type="checkbox"
              name="featured"
              checked={featured}
              onChange={(e) => updateFilterValue({ target: { name: 'featured', value: e.target.checked } })}
            />
            <span className="filter-checkbox">
              {featured && <FiCheck />}
            </span>
            <FiAward className="filter-icon" />
            <span>Featured Products</span>
          </label>
          
          <label className={`quick-filter-option ${freeShipping ? 'active' : ''}`}>
            <input
              type="checkbox"
              name="freeShipping"
              checked={freeShipping}
              onChange={(e) => updateFilterValue({ target: { name: 'freeShipping', value: e.target.checked } })}
            />
            <span className="filter-checkbox">
              {freeShipping && <FiCheck />}
            </span>
            <FiTruck className="filter-icon" />
            <span>Free Shipping</span>
          </label>
        </div>
      </div>
    </Wrapper>
  );
};

const Wrapper = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0;

  /* Filter Header */
  .filter-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 2rem;
    border-bottom: 2px solid rgba(139, 69, 19, 0.15);
    margin-bottom: 2.5rem;

    h2 {
      font-size: 2rem;
      font-weight: 800;
      color: ${({ theme }) => theme.colors.heading};
      font-family: 'Playfair Display', serif;
      letter-spacing: -0.01em;
    }

    .clear-all-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: linear-gradient(135deg, rgba(229, 57, 53, 0.1), rgba(229, 57, 53, 0.05));
      border: 1.5px solid rgba(229, 57, 53, 0.2);
      color: #e53935;
      font-size: 1.3rem;
      font-weight: 700;
      cursor: pointer;
      padding: 0.7rem 1.2rem;
      border-radius: 0.7rem;
      transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
      text-transform: uppercase;
      letter-spacing: 0.05rem;

      svg {
        font-size: 1.5rem;
      }

      &:hover {
        background: linear-gradient(135deg, rgba(229, 57, 53, 0.2), rgba(229, 57, 53, 0.12));
        color: white;
        border-color: #e53935;
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(229, 57, 53, 0.2);
      }
    }
  }

  /* Filter Block */
  .filter-block {
    padding: 2rem 0;
    border-bottom: 1px solid rgba(139, 69, 19, 0.08);

    &:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .filter-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: ${({ theme }) => theme.colors.heading};
      margin-bottom: 1.4rem;
      text-transform: uppercase;
      letter-spacing: 0.08rem;
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }
  }

  /* Search Box */
  .search-box {
    position: relative;

    .search-icon {
      position: absolute;
      left: 1.3rem;
      top: 50%;
      transform: translateY(-50%);
      color: ${({ theme }) => theme.colors.helper};
      font-size: 1.7rem;
      transition: transform 0.3s ease;
    }

    input {
      width: 100%;
      padding: 1.3rem 1.3rem 1.3rem 4.2rem;
      border: 1.5px solid rgba(139, 69, 19, 0.15);
      border-radius: 0.9rem;
      font-size: 1.3rem;
      color: ${({ theme }) => theme.colors.text};
      background: ${({ theme }) => theme.colors.bg};
      transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
      font-weight: 500;

      &::placeholder {
        color: ${({ theme }) => theme.colors.text};
        opacity: 0.4;
        font-weight: 500;
      }

      &:focus {
        outline: none;
        border-color: ${({ theme }) => theme.colors.helper};
        box-shadow: 0 0 0 4px rgba(210, 105, 30, 0.12);
        background: white;

        &+ .search-icon {
          transform: translateY(-50%) scale(1.15);
        }
      }

      &:hover {
        border-color: ${({ theme }) => theme.colors.helper};
      }
    }
  }

  /* Category Select */
  .category-select {
    width: 100%;
    padding: 1.3rem 1.5rem;
    border: 1.5px solid rgba(139, 69, 19, 0.15);
    border-radius: 0.9rem;
    font-size: 1.3rem;
    color: ${({ theme }) => theme.colors.text};
    background: white;
    cursor: pointer;
    text-transform: capitalize;
    appearance: none;
    transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
    max-height: 20rem;
    overflow-y: auto;
    font-weight: 600;

    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.helper};
      box-shadow: 0 0 0 4px rgba(210, 105, 30, 0.12);
    }

    &:hover {
      border-color: ${({ theme }) => theme.colors.helper};
    }

    option {
      padding: 1rem;
      text-transform: capitalize;
      background: white;
      color: ${({ theme }) => theme.colors.text};
      font-weight: 500;
      
      &:hover {
        background: ${({ theme }) => theme.colors.helper};
        color: white;
      }

      &:checked {
        background: linear-gradient(135deg, ${({ theme }) => theme.colors.btn}, ${({ theme }) => theme.colors.helper});
        color: white;
        font-weight: 700;
      }
    }
  }

  /* Brand Select */
  .select-wrapper {
    position: relative;

    .brand-select {
      width: 100%;
      padding: 1.3rem 1.5rem;
      border: 1.5px solid rgba(139, 69, 19, 0.15);
      border-radius: 0.9rem;
      font-size: 1.3rem;
      color: ${({ theme }) => theme.colors.text};
      background: white;
      cursor: pointer;
      text-transform: capitalize;
      appearance: none;
      transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
      font-weight: 600;

      &:focus {
        outline: none;
        border-color: ${({ theme }) => theme.colors.helper};
        box-shadow: 0 0 0 4px rgba(210, 105, 30, 0.12);
      }

      &:hover {
        border-color: ${({ theme }) => theme.colors.helper};
      }
    }

    &::after {
      content: '▼';
      position: absolute;
      right: 1.5rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 1.1rem;
      color: ${({ theme }) => theme.colors.helper};
      pointer-events: none;
      font-weight: 700;
    }
  }

  /* Price Filter */
  .price-filter {
    .price-display {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.8rem;
      padding: 1.3rem 1.5rem;
      background: linear-gradient(135deg, ${({ theme }) => theme.colors.bg} 0%, #faf8f5 100%);
      border-radius: 0.9rem;
      border: 1px solid rgba(139, 69, 19, 0.1);

      .price-label {
        font-size: 1.3rem;
        color: ${({ theme }) => theme.colors.text};
        font-weight: 600;
      }

      .price-value {
        font-size: 1.8rem;
        font-weight: 800;
        color: ${({ theme }) => theme.colors.helper};
        letter-spacing: -0.01em;
      }
    }

    .price-slider {
      width: 100%;
      height: 0.8rem;
      -webkit-appearance: none;
      appearance: none;
      background: linear-gradient(to right, 
        ${({ theme }) => theme.colors.helper} 0%, 
        ${({ theme }) => theme.colors.helper} 50%, 
        #e0e0e0 50%, 
        #e0e0e0 100%
      );
      border-radius: 0.4rem;
      cursor: pointer;
      margin-bottom: 1.2rem;
      outline: none;
      transition: background 0.3s ease;

      &::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 2.2rem;
        height: 2.2rem;
        background: linear-gradient(135deg, ${({ theme }) => theme.colors.btn}, ${({ theme }) => theme.colors.helper});
        border-radius: 50%;
        cursor: pointer;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(139, 69, 19, 0.3);
        transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);

        &:hover {
          transform: scale(1.15);
          box-shadow: 0 4px 12px rgba(139, 69, 19, 0.4);
        }
      }

      &::-moz-range-thumb {
        width: 2.2rem;
        height: 2.2rem;
        background: linear-gradient(135deg, ${({ theme }) => theme.colors.btn}, ${({ theme }) => theme.colors.helper});
        border-radius: 50%;
        cursor: pointer;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(139, 69, 19, 0.3);
      }
    }

    .price-range-labels {
      display: flex;
      justify-content: space-between;
      font-size: 1.2rem;
      color: ${({ theme }) => theme.colors.text};
      opacity: 0.7;
      font-weight: 600;
    }
  }

  /* Rating Filter Styles */
  .rating-filter {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;

    .rating-option {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.3rem;
      border-radius: 0.9rem;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
      background: #f9fafb;
      border: 1.5px solid transparent;

      input[type="radio"] {
        display: none;
      }

      &:hover {
        background: #f3f0eb;
        border-color: rgba(139, 69, 19, 0.2);
      }

      &.active {
        background: linear-gradient(135deg, rgba(210, 105, 30, 0.12), rgba(205, 133, 63, 0.08));
        border-color: ${({ theme }) => theme.colors.helper};
      }

      .rating-stars {
        display: flex;
        gap: 0.3rem;

        svg {
          font-size: 1.5rem;
          color: #e0e0e0;
          transition: all 0.2s ease;

          &.filled {
            color: #fbbf24;
            fill: #fbbf24;
            filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));
          }
        }
      }

      .rating-text {
        font-size: 1.3rem;
        color: ${({ theme }) => theme.colors.text};
        font-weight: 600;
      }
    }

    .rating-clear {
      background: none;
      border: none;
      color: ${({ theme }) => theme.colors.helper};
      font-size: 1.2rem;
      cursor: pointer;
      padding: 0.6rem;
      text-decoration: underline;
      margin-top: 0.8rem;
      font-weight: 700;
      transition: all 0.3s ease;

      &:hover {
        color: ${({ theme }) => theme.colors.btn};
        transform: translateX(-2px);
      }
    }
  }

  /* Quick Filters Styles */
  .quick-filters {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;

    .quick-filter-option {
      display: flex;
      align-items: center;
      gap: 1.1rem;
      padding: 1.2rem 1.3rem;
      border-radius: 0.9rem;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
      background: #f9fafb;
      border: 1.5px solid transparent;

      input[type="checkbox"] {
        display: none;
      }

      .filter-checkbox {
        width: 2.2rem;
        height: 2.2rem;
        border-radius: 0.6rem;
        border: 2px solid #d1d5db;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
        background: white;

        svg {
          font-size: 1.3rem;
          color: white;
          font-weight: 700;
        }
      }

      .filter-icon {
        font-size: 1.8rem;
        color: ${({ theme }) => theme.colors.helper};
        transition: transform 0.3s ease;
      }

      span:last-child {
        font-size: 1.3rem;
        font-weight: 700;
        color: ${({ theme }) => theme.colors.text};
        letter-spacing: -0.01em;
      }

      &:hover {
        background: #f3f0eb;
        border-color: rgba(139, 69, 19, 0.2);

        .filter-icon {
          transform: scale(1.1);
        }
      }

      &.active {
        background: linear-gradient(135deg, rgba(210, 105, 30, 0.12), rgba(205, 133, 63, 0.08));
        border-color: ${({ theme }) => theme.colors.helper};

        .filter-checkbox {
          background: ${({ theme }) => theme.colors.helper};
          border-color: ${({ theme }) => theme.colors.helper};
        }

        .filter-icon {
          color: ${({ theme }) => theme.colors.helper};
        }
      }
    }
  }

  @media (max-width: ${({ theme }) => theme.media.tab}) {
    .filter-header {
      h2 {
        font-size: 1.8rem;
      }

      .clear-all-btn {
        font-size: 1.2rem;
        padding: 0.6rem 1rem;
      }
    }

    .filter-block {
      padding: 1.5rem 0;

      .filter-title {
        font-size: 1.4rem;
      }
    }
  }

  @media (max-width: ${({ theme }) => theme.media.mobile}) {
    .filter-header {
      h2 {
        font-size: 1.6rem;
      }
    }
  }
`;

export default FilterSection;