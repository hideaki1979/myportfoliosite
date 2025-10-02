import { Metadata } from "next";
import { createBreadcrumbStructuredData, createPersonStructuredData, StructuredData } from "../../lib/structured-data";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mirrorman-portfolio.vercel.app';

const personData = createPersonStructuredData({
  name: "Mirrorman",
  jobTitle: "フルスタックエンジニア",
  description: "フルスタックエンジニアを目指す46歳おじさん。React、Next.js、TypeScriptを中心としたWebアプリケーション開発に取り組んでいます。",
  url: `${baseUrl}/about`,
  image: `${baseUrl}/og-about.jpg`,
  sameAs: [
    "https://github.com/hideaki1979",
    "https://qiita.com/H_Kagami_Gs",
  ]
});

const breadcrumbData = createBreadcrumbStructuredData({
  items: [
    { name: "ホーム", url: baseUrl },
    { name: "About Me", url: `${baseUrl}/about` }
  ],
});


export const metadata: Metadata = {
  title: "About Me",
  description: "25年以上SIerに勤めていたシステムエンジニアがフルスタックエンジニアを目指すための学習記録について詳しく紹介しています。React、Next.js、TypeScriptを中心とした技術スタックと実績をご覧ください。",
  openGraph: {
    title: "About Me | Mirrorman Portfolio",
    description: "25年以上SIerに勤めていたシステムエンジニアがフルスタックエンジニアを目指すための学習記録について詳しく紹介しています。React、Next.js、TypeScriptを中心とした技術スタックと実績をご覧ください。",
    url: "/about",
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
    images: ["/og-about.jpg"],
  },
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <>
      <StructuredData data={personData} />
      <StructuredData data={breadcrumbData} />
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
        <h1>About Me</h1>
        <p>このページは About のプレースホルダーです。後でFigmaに沿って実装します。</p>
      </main>
    </>
  )
}