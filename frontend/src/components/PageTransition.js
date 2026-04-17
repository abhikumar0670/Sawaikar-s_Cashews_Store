import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useLocation } from 'react-router-dom';

const PageTransition = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    // Smooth scroll to top on route change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return (
    <TransitionWrapper>
      {children}
    </TransitionWrapper>
  );
};

const TransitionWrapper = styled.div`
  min-height: 100vh;
  will-change: contents;
`;

export default PageTransition;
