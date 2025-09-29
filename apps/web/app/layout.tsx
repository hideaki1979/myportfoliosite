import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "styled-components";
import { theme } from "../styles/theme";
import { GlobalStyle } from "../styles/global-style";
import { Header } from "../components/navigation/Header";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Mirrorman Portfolio",
    template: "%s | Mirrorman Portfolio",
  },
  description: "フルスタックエンジニアを目指す46歳おじさんのポートフォリオサイト。React、Next.js、TypeScriptを活用したWebアプリケーション開発・学習の実績を紹介しています。",
  keywords: ["ポートフォリオ", "フロントエンド", "バックエンド", "フルスタック", "React", "Next.js", "TypeScript", "Web開発"],
  authors: [{ name: "Mirrorman" }],
  creator: "Mirrorman",
  publisher: "Mirrorman",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "ja-JP",
    url: "https://mirrorman-portfolio.vercel.app",
    siteName: "Mirrorman Portfolio",
    title: "Mirrorman Portfolio",
    description: "フルスタックエンジニアを目指す46歳おじさんのポートフォリオサイト。React、Next.js、TypeScriptを活用したWebアプリケーション開発・学習の実績を紹介しています。",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Mirrorman Portfolio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mirrorman Portfolio",
    description: "フルスタックエンジニアを目指す46歳おじさんのポートフォリオサイト。React、Next.js、TypeScriptを活用したWebアプリケーション開発・学習の実績を紹介しています。",
    images: ["/og-image.jpg"],
  },
  alternates: {
    canonical: "https://mirrorman-portfolio.vercel.app",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThemeProvider theme={theme}>
          <GlobalStyle />
          <a href="#main" className="skip-link">メインコンテンツへスキップ</a>
          <Header />
          <main id="main" tabIndex={-1}>
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
