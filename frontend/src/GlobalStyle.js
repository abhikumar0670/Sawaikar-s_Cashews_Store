import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: "Inter", "Work Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}


html {
  font-size: 62.5%;
  scroll-behavior: smooth;
  /* 1rem = 10px */
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

body {
  overflow-x: hidden;
  scrollbar-color: #8B6F47 #FFFBF5;
  scrollbar-width: thin;
  /* Premium unified warm background */
  background-color: #FFFBF5;
  background-image: 
    radial-gradient(circle at 20% 50%, rgba(139, 111, 71, 0.015) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(193, 154, 107, 0.015) 0%, transparent 50%);
  background-attachment: fixed;
  position: relative;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  will-change: scroll-position;
}

body::-webkit-scrollbar {
  width: 1rem;
}

body::-webkit-scrollbar-track {
   background-color: #FFFBF5;
}

body::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #8B6F47 0%, #6B5435 100%);
  border-radius: 10px;
  border: 2px solid #FFFBF5;
  
  &:hover {
    background: linear-gradient(180deg, #6B5435 0%, #4A3A25 100%);
  }
}

/* Prevent layout shift from scrollbar */
html {
  overflow-y: scroll;
}

/* Optimize animations */
@media (prefers-reduced-motion: no-preference) {
  * {
    scroll-behavior: smooth;
  }
}

h1,
h2,
h3,
h4 {
   font-family: "Inter", "Work Sans", sans-serif;
   letter-spacing: -0.02em;
}

h1 {
  color: ${({ theme }) => theme.colors.heading};
  font-size: 6rem;
  font-weight: 700;
  line-height: 1.1;
}

 h2 {
   color: ${({ theme }) => theme.colors.heading};
   font-size: 4.4rem;
   font-weight: 600;
   white-space: normal;
   line-height: 1.2;
  }

h3 {
  font-size: 2rem;
  font-weight: 600;
  line-height: 1.3;
}

p, button {
  color: ${({ theme }) => theme.colors.text};
  font-size: 1.6rem;
  line-height: 1.7;
  font-weight: 400;
}

a {
  text-decoration: none;
  transition: all 0.3s ease;
}

li {
  list-style: none;
}


${"" /* reusable code section  */}

.container {
  max-width: 128rem;
  margin: 0 auto;
  padding: 0 2rem;
}

.grid {
  display: grid;
  gap: 4rem;
}

.grid-two-column {
  grid-template-columns: repeat(2, 1fr);
}

.grid-three-column {
  grid-template-columns: repeat(3, 1fr);
}

.grid-four-column{
   grid-template-columns: 1fr 1.2fr .5fr .8fr;
}

.grid-five-column{
  grid-template-columns: repeat(5, 1fr);
}

  .common-heading {
      font-size: 3.8rem;
      font-weight: 700;
      margin-bottom: 6rem;
      text-transform: capitalize;
      letter-spacing: -0.02em;
      color: ${({ theme }) => theme.colors.heading};
    }

     .intro-data {
      margin-bottom: 0;
      text-transform: uppercase;
      color: ${({ theme }) => theme.colors.primary};
      font-weight: 600;
      letter-spacing: 0.1em;
    }

   .caption {
      position: absolute;
      top: 15%;
      right: 10%;
      text-transform: uppercase;
      background-color: ${({ theme }) => theme.colors.white};
      color: ${({ theme }) => theme.colors.primary};
      padding: 1rem 2.5rem;
      font-size: 1.3rem;
      border-radius: 50px;
      font-weight: 600;
      box-shadow: 0 8px 24px rgba(139, 111, 71, 0.15);
      backdrop-filter: blur(10px);
    }

input, textarea{
    max-width: 50rem;
    color: ${({ theme }) => theme.colors.black};
    padding: 1.6rem 2rem;
    border: 2px solid ${({ theme }) => theme.colors.border};
    border-radius: 12px;
    font-size: 1.5rem;
    transition: all 0.3s ease;
    background: ${({ theme }) => theme.colors.white};
    
    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.primary};
      box-shadow: 0 0 0 4px rgba(139, 111, 71, 0.1);
    }
}
    input[type="submit"]{
    max-width: 18rem;
    margin-top: 2rem;
    background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary} 0%, ${({ theme }) => theme.colors.primaryDark} 100%);
    color: ${({ theme }) => theme.colors.white};
    padding: 1.6rem 3rem;
    border: none;
    border-radius: 12px;
    text-transform: uppercase;
    font-size: 1.5rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 8px 20px rgba(139, 111, 71, 0.25);
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 28px rgba(139, 111, 71, 0.35);
    }
    
    &:active {
      transform: translateY(0);
    }
    }
    @media (max-width: ${({ theme }) => theme.media.tab}) {
      .container {
      max-width: 130rem;
      padding: 0 3.2rem;
    }
    }
  
     @media (max-width: ${({ theme }) => theme.media.mobile}) {
         html {
        font-size: 50%;
      }
.grid{
  gap: 3.2rem;
}
      .grid-two-column , .grid-three-column, .grid-four-column{
          grid-template-columns: 1fr;
        }
    }

`;
