// Design tokens for styled-components ThemeProvider
export const theme = {
  colors: {
    text: {
      primary: "#111",
      secondary: "#666",
      tertiary: "#999",
    },
    background: {
      primary: "#fff",
      secondary: "#f5f7fb",
      tertiary: "#e5e7eb",
    },
    primary: "#0070f3",
    primaryDark: "#0051c7",
    surface: "#f5f7fb",
    border: "#e5e7eb",
    onPrimary: "#fff",
    success: "#10b981",
    error: "#ef4444",
    warning: "#f59e0b",
    info: "#3b82f6",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    fontFamily: `var(--font-geist-sans), system-ui, -apple-system, Segoe UI, Roboto, Arial`,
    headings: {
      h1: 32,
      h2: 28,
      h3: 24,
    },
    body: 16,
    small: 14,
  },
  breakpoints: {
    mobile: 480,
    tablet: 768,
    desktop: 1024,
    wide: 1280,
  },
} as const;

export type AppTheme = typeof theme;
