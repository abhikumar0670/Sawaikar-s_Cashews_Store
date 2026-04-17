import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';

const LazyImage = ({ 
  src, 
  alt, 
  className, 
  placeholderSrc = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3C/svg%3E',
  ...props 
}) => {
  const [imageSrc, setImageSrc] = useState(placeholderSrc);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    let observer;
    
    if (imgRef.current) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              // Load the actual image
              const img = new Image();
              img.src = src;
              img.onload = () => {
                setImageSrc(src);
                setImageLoaded(true);
              };
              
              // Stop observing after loading
              observer.unobserve(entry.target);
            }
          });
        },
        {
          rootMargin: '50px' // Start loading 50px before image enters viewport
        }
      );

      observer.observe(imgRef.current);
    }

    return () => {
      if (observer && imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [src]);

  return (
    <ImageWrapper ref={imgRef} className={className}>
      <StyledImage
        src={imageSrc}
        alt={alt}
        loaded={imageLoaded}
        {...props}
      />
      {!imageLoaded && <LoadingOverlay />}
    </ImageWrapper>
  );
};

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`;

const ImageWrapper = styled.div`
  position: relative;
  overflow: hidden;
  background: #f0f0f0;
`;

const StyledImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: ${props => props.loaded ? 1 : 0.3};
  filter: ${props => props.loaded ? 'none' : 'blur(10px)'};
  transition: all 0.5s cubic-bezier(0.23, 1, 0.320, 1);
  animation: ${props => props.loaded ? fadeIn : 'none'} 0.5s ease-out;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    #f0f0f0 0%,
    #e0e0e0 20%,
    #f0f0f0 40%,
    #f0f0f0 100%
  );
  background-size: 1000px 100%;
  animation: ${shimmer} 2s infinite linear;
  pointer-events: none;
`;

export default LazyImage;
