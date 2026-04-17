import styled from "styled-components";
import FilterSection from "./components/FilterSection";
import ProductList from "./components/ProductList";
import Sort from "./components/Sort";
import { NavLink } from "react-router-dom";
import { FiChevronRight } from "react-icons/fi";

const Products = () => {
  return (
    <Wrapper>
      {/* Breadcrumb */}
      <div className="breadcrumb-section">
        <div className="container">
          <nav className="breadcrumb">
            <NavLink to="/" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Home</NavLink>
            <FiChevronRight className="separator" />
            <span className="current">Products</span>
          </nav>
          <h1 className="page-title">Our Premium Collection</h1>
          <p className="page-subtitle">Discover the finest Goan cashews, handpicked for quality and taste</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="products-container">
        <div className="container">
          <div className="products-layout">
            {/* Sidebar Filter */}
            <aside className="filter-sidebar">
              <FilterSection />
            </aside>

            {/* Products Grid */}
            <main className="products-main">
              <div className="sort-bar">
                <Sort />
              </div>
              <div className="products-grid">
                <ProductList />
              </div>
            </main>
          </div>
        </div>
      </div>
    </Wrapper>
  );
};

const Wrapper = styled.section`
  background: ${({ theme }) => theme.colors.bg};
  min-height: 100vh;
  overflow-x: hidden;
  width: 100%;

  /* Breadcrumb Section */
  .breadcrumb-section {
    background: linear-gradient(180deg, ${({ theme }) => theme.colors.bgLight} 0%, ${({ theme }) => theme.colors.bg} 100%);
    padding: 4rem 0 5rem;
    border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};

    .container {
      max-width: 130rem;
      margin: 0 auto;
      padding: 0 2rem;
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      margin-bottom: 2.5rem;
      font-size: 1.4rem;

      a {
        color: ${({ theme }) => theme.colors.textLight};
        text-decoration: none;
        transition: all 0.3s ease;
        font-weight: 500;

        &:hover {
          color: ${({ theme }) => theme.colors.primary};
        }
      }

      .separator {
        color: ${({ theme }) => theme.colors.textLight};
        opacity: 0.5;
      }

      .current {
        color: ${({ theme }) => theme.colors.primary};
        font-weight: 600;
      }
    }

    .page-title {
      font-size: 4.5rem;
      font-weight: 700;
      color: ${({ theme }) => theme.colors.heading};
      margin-bottom: 1.2rem;
      letter-spacing: -0.03em;
      line-height: 1.1;
    }

    .page-subtitle {
      font-size: 1.8rem;
      color: ${({ theme }) => theme.colors.text};
      font-weight: 400;
      line-height: 1.6;
    }
  }

  /* Products Container */
  .products-container {
    padding: 3.2rem 0 5rem;
    width: 100%;
    overflow-x: hidden;
    background: transparent;

    .container {
      max-width: 130rem;
      margin: 0 auto;
      padding: 0 1.8rem;
      box-sizing: border-box;
    }
  }

  /* Products Layout - 2 Column */
  .products-layout {
    display: grid;
    grid-template-columns: 25.5rem 1fr;
    gap: 2.8rem;
    align-items: start;
  }

  /* Filter Sidebar */
  .filter-sidebar {
    position: sticky;
    top: 11rem;
    background: ${({ theme }) => theme.colors.bgLight};
    border-radius: 16px;
    padding: 2.5rem;
    box-shadow: ${({ theme }) => theme.colors.shadow};
    border: 1px solid ${({ theme }) => theme.colors.borderLight};
    max-height: calc(100vh - 13rem);
    overflow-y: auto;
    transition: all 0.3s ease;

    /* Custom scrollbar */
    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: ${({ theme }) => theme.colors.bgDark};
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: ${({ theme }) => theme.colors.primary};
      border-radius: 3px;

      &:hover {
        background: ${({ theme }) => theme.colors.primaryDark};
      }
    }
  }

  /* Products Main Area */
  .products-main {
    overflow: hidden;
    min-width: 0;

    .sort-bar {
      background: ${({ theme }) => theme.colors.bgLight};
      border-radius: 12px;
      padding: 2rem 2.5rem;
      margin-bottom: 2.5rem;
      box-shadow: ${({ theme }) => theme.colors.shadow};
      border: 1px solid ${({ theme }) => theme.colors.borderLight};
    }

    .products-grid {
      background: transparent;
      min-height: 50rem;
    }
  }

  /* Responsive Design */
  @media (max-width: 1024px) {
    .products-layout {
      grid-template-columns: 24rem 1fr;
      gap: 2.5rem;
    }
  }

  @media (max-width: ${({ theme }) => theme.media.tab}) {
    .breadcrumb-section {
      padding: 2.5rem 0 3.5rem;

      .page-title {
        font-size: 3rem;
      }

      .page-subtitle {
        font-size: 1.5rem;
      }
    }

    .products-layout {
      grid-template-columns: 1fr;
      gap: 2rem;
    }

    .filter-sidebar {
      position: relative;
      top: 0;
      max-height: none;
      margin-bottom: 2rem;
    }

    .products-main {
      .sort-bar {
        padding: 1.5rem 2rem;
      }
    }
  }

  @media (max-width: ${({ theme }) => theme.media.mobile}) {
    .breadcrumb-section {
      padding: 1.5rem 0 2.5rem;

      .page-title {
        font-size: 2.2rem;
      }

      .page-subtitle {
        font-size: 1.3rem;
      }
    }

    .products-container {
      padding: 2rem 0;
    }

    .products-main {
      .sort-bar {
        padding: 1.2rem 1.5rem;
      }

      .products-grid {
        padding: 0;
      }
    }
  }
`;

export default Products;