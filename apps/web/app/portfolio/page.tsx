import { Metadata } from "next";

export const metadata: Metadata = {
    title: "About Me",
    description: "フルスタックエンジニアを目指すための学習記録、スキル、経験について詳しく紹介しています。React、Next.js、TypeScriptを中心としたGithubのリポジトリをご覧ください。",
    openGraph: {
        title: "About Me | Mirrorman Portfolio",
        description: "フルスタックエンジニアを目指すための学習記録、スキル、経験について詳しく紹介しています。React、Next.js、TypeScriptを中心としたGithubのリポジトリをご覧ください。",
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
        description: "フルスタックエンジニアを目指すための学習記録、スキル、経験について詳しく紹介しています。React、Next.js、TypeScriptを中心としたGithubのリポジトリをご覧ください。",
        images: ["/og-about.jpg"],
    },
};

export default function PortfolioPage() {
    return (
        <main style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
            <h1>Portfolio</h1>
            <p>このページは Portfolio のプレースホルダーです。後でGithub連携機能を実装します。</p>
        </main>
    )
}