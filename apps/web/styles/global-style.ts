import { createGlobalStyle } from "styled-components";
import { cssVariables } from "./theme";

export const GlobalStyle = createGlobalStyle`
  /* CSS Variables for theme colors */
  :root {
    color-scheme: light dark;
    ${Object.entries(cssVariables.light)
      .map(([key, value]) => `${key}: ${value};`)
      .join("\n    ")}
  }

  [data-theme='dark'] {
    color-scheme: dark;
    ${Object.entries(cssVariables.dark)
      .map(([key, value]) => `${key}: ${value};`)
      .join("\n    ")}
  }
  /* Base */
  *, *::before, *::after { box-sizing: border-box; }
  html, body, #__next { height: 100%; }
  html { -webkit-text-size-adjust: 100%; text-rendering: optimizeLegibility; }
  body {
    margin: 0;
    line-height: 1.5;
    font-family: var(--font-geist-sans, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: var(--color-bg-primary);
    color: var(--color-text-primary);
    transition: background-color 0.3s ease, color 0.3s ease;
  }

  /* Modern reset */
  img, picture, video, canvas, svg { display: block; max-width: 100%; height: auto; }
  ul[role='list'], ol[role='list'] { list-style: none; }
  h1, h2, h3, h4, h5, h6, p, figure, blockquote, dl, dd { margin: 0; }
  a { color: inherit; text-decoration: none; text-decoration-skip-ink: auto; }
  input, button, textarea, select { font: inherit; }
  button { cursor: pointer; }

  /* Accessibility: reduced motion */
  @media (prefers-reduced-motion: reduce) {
    html:focus-within { scroll-behavior: auto; }
    *, *::before, *::after { 
      animation-duration: 0.01ms !important; 
      animation-iteration-count: 1 !important; 
      transition-duration: 0.01ms !important; 
      scroll-behavior: auto !important; 
    }
  }
`;
