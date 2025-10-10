import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
  /* Base */
  :root { color-scheme: light dark; }
  *, *::before, *::after { box-sizing: border-box; }
  html, body, #__next { height: 100%; }
  html { -webkit-text-size-adjust: 100%; text-rendering: optimizeLegibility; }
  body {
    margin: 0;
    line-height: 1.5;
    font-family: var(--font-geist-sans, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
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
    *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
  }
`;
