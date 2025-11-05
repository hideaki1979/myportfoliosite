// CSS Variable 定義（ライト/ダークテーマの実際の色の値）
export const cssVariables = {
  light: {
    "--color-text-primary": "#111",
    "--color-text-secondary": "#666",
    "--color-text-tertiary": "#757575",
    "--color-bg-primary": "#fff",
    "--color-bg-secondary": "#f5f7fb",
    "--color-bg-tertiary": "#e5e7eb",
    "--color-primary": "#0070f3",
    "--color-primary-dark": "#0051c7",
    "--color-surface": "#f5f7fb",
    "--color-border": "#e5e7eb",
    "--color-on-primary": "#fff",
    "--color-success": "#10b981",
    "--color-error": "#ef4444",
    "--color-warning": "#f59e0b",
    "--color-info": "#3b82f6",
  },
  dark: {
    "--color-text-primary": "#f5f5f5",
    "--color-text-secondary": "#b3b3b3",
    "--color-text-tertiary": "#999",
    "--color-bg-primary": "#1a1a1a",
    "--color-bg-secondary": "#2d2d2d",
    "--color-bg-tertiary": "#404040",
    "--color-primary": "#3b82f6",
    "--color-primary-dark": "#2563eb",
    "--color-surface": "#2d2d2d",
    "--color-border": "#404040",
    "--color-on-primary": "#fff",
    "--color-success": "#10b981",
    "--color-error": "#ef4444",
    "--color-warning": "#f59e0b",
    "--color-info": "#3b82f6",
  },
} as const;

// styled-components テーマオブジェクト（CSS変数を参照）
// このオブジェクト自体は固定なのでハイドレーションエラーが発生しない
export const theme = {
  colors: {
    text: {
      primary: "var(--color-text-primary)",
      secondary: "var(--color-text-secondary)",
      tertiary: "var(--color-text-tertiary)",
    },
    background: {
      primary: "var(--color-bg-primary)",
      secondary: "var(--color-bg-secondary)",
      tertiary: "var(--color-bg-tertiary)",
    },
    primary: "var(--color-primary)",
    primaryDark: "var(--color-primary-dark)",
    surface: "var(--color-surface)",
    border: "var(--color-border)",
    onPrimary: "var(--color-on-primary)",
    success: "var(--color-success)",
    error: "var(--color-error)",
    warning: "var(--color-warning)",
    info: "var(--color-info)",
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
