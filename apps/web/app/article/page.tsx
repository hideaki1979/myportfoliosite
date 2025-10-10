import { Metadata } from "next";
import { createBreadcrumbStructuredData } from "../../lib/structured-data";
import { baseUrl } from "../../lib/constants";

const breadcrumbData = createBreadcrumbStructuredData({
  items: [
    { name: "ホーム", url: baseUrl },
    { name: "Article", url: `${baseUrl}/article` },
  ],
});

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Article",
    description:
      "技術記事、ブログ投稿、Qiitaでの執筆活動を紹介しています。フルスタック開発、React、Next.js、TypeScriptに関する技術的な知見を共有しています。",
    openGraph: {
      title: "Article | Mirrorman Portfolio",
      description:
        "技術記事、ブログ投稿、Qiitaでの執筆活動を紹介しています。フルスタック開発、React、Next.js、TypeScriptに関する技術的な知見を共有しています。",
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
    other: {
      "ld+json:breadcrumb": JSON.stringify(breadcrumbData),
    },
  };
}

export default function ArticlePage() {
  return (
    <div style={{ maxWidth: 1248, margin: "0 auto", padding: "24px 16px" }}>
      <h1>Article</h1>
      <p>
        このページは Article のプレースホルダーです。Qiita連携を後で追加します。
      </p>
    </div>
  );
}
