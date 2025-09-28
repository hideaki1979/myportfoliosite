// Design tokens for styled-components ThemeProvider
export const theme = {
    colors: {
        text: "#111",
        subText: "#666",
        background: "#fff",
        primary: "#0070f3",
        surface: "#f5f7fb",
        border: "#e5e7eb",
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
        sm: 576,
        md: 768,
        lg: 992,
        xl: 1200,
    },
} as const;

export type AppTheme = typeof theme;



