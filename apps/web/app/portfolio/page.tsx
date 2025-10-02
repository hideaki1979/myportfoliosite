import { Metadata } from "next";
import { createBreadcrumbStructuredData } from "../../lib/structured-data";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mirrorman-portfolio.vercel.app';

const breadcrumbData = createBreadcrumbStructuredData({
    items: [
        { name: "ホーム", url: baseUrl },
        { name: "Portfolio", url: `${baseUrl}/portfolio` },
    ],
})

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "Portfolio",
        description: "製作物やGitHubの主要リポジトリ、使用技術のハイライトを掲載しています。React、Next.js、TypeScript を中心とした開発実績をご覧ください。",
        openGraph: {
            title: "Portfolio | Mirrorman Portfolio",
            description: "製作物やGitHubの主要リポジトリ、使用技術のハイライトを掲載しています。React、Next.js、TypeScript を中心とした開発実績をご覧ください。",
            url: "/portfolio",
            type: "website",
            images: [
                {
                    url: "/og-portfolio.jpg",
                    width: 1200,
                    height: 630,
                    alt: "Portfolio - Mirrorman Portfolio",
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            images: ["/og-portfolio.jpg"],
        },
        alternates: {
            canonical: "/portfolio",
        },
        other: {
            'ld+json:breadcrumb': JSON.stringify(breadcrumbData),
        },
    }
};

export default function PortfolioPage() {
    return (
        <main style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
            <h1>Portfolio</h1>
            <p>このページは Portfolio のプレースホルダーです。後でGitHub連携機能を実装します。</p>
        </main>
    )
}