"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemeProvider as SCThemeProvider } from "styled-components";
import { theme } from "../styles/theme";
import { GlobalStyle } from "../styles/global-style";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="system"
      enableSystem={true}
      themes={["light", "dark"]}
    >
      <SCThemeProvider theme={theme}>
        <GlobalStyle />
        {children}
      </SCThemeProvider>
    </NextThemesProvider>
  );
}
