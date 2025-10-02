import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Article",
    description: "技術記事、ブログ投稿、Qiitaでの執筆活動を紹介しています。フルスタック開発、React、Next.js、TypeScriptに関する技術的な知見を共有しています。",
    openGraph: {
        title: "Article | Mirrorman Portfolio",
        description: "技術記事、ブログ投稿、Qiitaでの執筆活動を紹介しています。フルスタック開発、React、Next.js、TypeScriptに関する技術的な知見を共有しています。",
        url: "/article",
        type: "website",
        images: [
            {
                url: "/og-article.jpg",
                width: 1200,
                height: 630,
                alt: "Article - Mirrorman Portfolio",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        images: ["/og-article.jpg"],
    },
    alternates: {
        canonical: "/article",
    },
};

export default function ArticlePage() {
    return (
        <main style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
            <h1>Article</h1>
            <p>このページは Article のプレースホルダーです。Qiita連携を後で追加します。</p>
        </main>
    )
}