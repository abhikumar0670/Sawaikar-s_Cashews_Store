import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import styled from "styled-components";
import Nav from "./Nav";
import ProfessionalLogo from "./ProfessionalLogo";

const Header = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  return (
    <MainHeader $scrolled={scrolled}>
      <NavLink to="/" className="logo-link">
        <div className="logo-desktop">
          <ProfessionalLogo size={scrolled ? "small" : "medium"} showText={true} variant="horizontal" />
        </div>
        <div className="logo-mobile">
          <ProfessionalLogo size="small" showText={true} variant="horizontal" />
        </div>
      </NavLink>
      <div className="nav-section">
        <Nav />
      </div>
    </MainHeader>
  );
};

const MainHeader = styled.header`
  padding: ${({ $scrolled }) => $scrolled ? '1.2rem 5rem' : '2rem 5rem'};
  height: auto;
  min-height: ${({ $scrolled }) => $scrolled ? '7rem' : '9rem'};
  background: ${({ theme, $scrolled }) => 
    $scrolled 
      ? 'rgba(245, 241, 232, 0.95)' 
      : theme.colors.bgLight};
  backdrop-filter: ${({ $scrolled }) => $scrolled ? 'blur(12px) saturate(180%)' : 'none'};
  -webkit-backdrop-filter: ${({ $scrolled }) => $scrolled ? 'blur(12px) saturate(180%)' : 'none'};
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 999;
  box-shadow: ${({ $scrolled, theme }) => 
    $scrolled 
      ? '0 4px 20px rgba(139, 111, 71, 0.12)' 
      : '0 2px 12px rgba(139, 111, 71, 0.06)'};
  border-bottom: ${({ $scrolled, theme }) => 
    $scrolled 
      ? '1px solid rgba(139, 111, 71, 0.12)' 
      : '1px solid rgba(139, 111, 71, 0.06)'};
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

  .logo-link {
    text-decoration: none;
    display: flex;
    align-items: center;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    
    &:hover {
      transform: scale(1.03);
    }
  }

  .logo-desktop {
    display: block;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .logo-mobile {
    display: none;
  }

  .nav-section {
    display: flex;
    align-items: center;
  }

  @media (max-width: ${({ theme }) => theme.media.tab}) {
    padding: ${({ $scrolled }) => $scrolled ? '1rem 3rem' : '1.5rem 3rem'};
    
    .logo-desktop {
      display: block;
    }
    
    .logo-mobile {
      display: none;
    }
  }

  @media (max-width: ${({ theme }) => theme.media.mobile}) {
    padding: ${({ $scrolled }) => $scrolled ? '1rem 2rem' : '1.5rem 2rem'};
    flex-direction: column;
    gap: ${({ $scrolled }) => $scrolled ? '1rem' : '1.5rem'};
    min-height: auto;
    position: sticky;
    
    .logo-desktop {
      display: none;
    }
    
    .logo-mobile {
      display: block;
    }
    
    .nav-section {
      width: 100%;
      justify-content: center;
    }
  }
`;

export default Header;