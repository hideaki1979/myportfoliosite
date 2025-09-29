import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Me",
  description: "25年以上SIerに勤めていたシステムエンジニアがフルスタックエンジニアを目指すための学習記録について詳しく紹介しています。React、Next.js、TypeScriptを中心とした技術スタックと実績をご覧ください。",
  openGraph: {
    title: "About Me | Mirrorman Portfolio",
    description: "25年以上SIerに勤めていたシステムエンジニアがフルスタックエンジニアを目指すための学習記録について詳しく紹介しています。React、Next.js、TypeScriptを中心とした技術スタックと実績をご覧ください。",
    url: "https://mirrorman-portfolio.vercel.app/about",
    type: "profile",
    images: [
      {
        url: "/og-about.jpg",
        width: 1200,
        height: 630,
        alt: "About Me - Mirrorman Portfolio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Me | Mirrorman Portfolio",
    description: "25年以上SIerに勤めていたシステムエンジニアがフルスタックエンジニアを目指すための学習記録について詳しく紹介しています。React、Next.js、TypeScriptを中心とした技術スタックと実績をご覧ください。",
    images: ["/og-about.jpg"],
  },
};

export default function AboutPage() {
  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
      <h1>About Me</h1>
      <p>このページは About のプレースホルダーです。後でFigmaに沿って実装します。</p>
    </main>
  )
}