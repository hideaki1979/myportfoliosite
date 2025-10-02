import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "styled-components";
import { theme } from "../styles/theme";
import { GlobalStyle } from "../styles/global-style";
import { Header } from "../components/navigation/Header";
import { createPersonStructuredData, createWebsiteStructuredData } from "../lib/structured-data";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mirrorman-portfolio.vercel.app";

  const website = createWebsiteStructuredData({
    name: "Mirrorman Portfolio",
    description:
      "フルスタックエンジニアを目指す46歳おじさんのポートフォリオサイト。React、Next.js、TypeScriptを活用したWebアプリケーション開発・学習の実績を紹介しています。",
    url: baseUrl,
    author: { name: "Mirrorman", url: baseUrl },
    inLanguage: "ja-JP",
    copyrightYear: new Date().getFullYear(),
  });

  const person = createPersonStructuredData({
    name: "Mirrorman",
    jobTitle: "フルスタックエンジニア",
    description:
      "フルスタックエンジニアを目指す46歳おじさん。React、Next.js、TypeScriptを中心としたWebアプリケーション開発に取り組んでいます。",
    url: baseUrl,
    image: `${baseUrl}/og-image.jpg`,
    sameAs: [
      "https://github.com/hideaki1979",
      "https://qiita.com/H_Kagami_Gs",
    ],
  });

  return {
    other: {
      "ld+json:website": JSON.stringify(website),
      "ld+json:person": JSON.stringify(person),
    },
  };
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://mirrorman-portfolio.vercel.app"),
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
    locale: "ja_JP",
    url: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://mirrorman-portfolio.vercel.app"),
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
