import { Metadata } from "next";
import { createBreadcrumbStructuredData } from "../../lib/structured-data";
import { baseUrl } from "../../lib/constants";
import { fetchQiitaArticles, fetchQiitaProfile, QiitaArticle } from "../../lib/api/qiita";
import QiitaArticles, { SkeletonLoader } from "../../components/features/QiitaArticles";
import { PageContainer } from "../../components/layouts/PageLayout";
import { PageSubtitle, PageTitle, SectionHeading } from "../../components/ui/Typography";
import { Suspense } from "react";

/**
 * ISR（Incremental Static Regeneration）設定
 * 10分（600秒）ごとにページを再生成
 * 
 * 動作: revalidate時間経過後の最初のリクエストでは古いページを返し、
 * バックグラウンドで再生成を開始。2回目以降のリクエストで新しいページを表示。
 * 
 * @note Next.jsの制約により、export const revalidate はリテラル値である必要があります。
 */
export const revalidate = 600;

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

async function QiitaArticlesData() {
  // Qiita記事をサーバーサイドで取得（検索用に多めに取得）
  let articles: QiitaArticle[] = [];
  let profile = null;

  // CI環境やAPI_URLが設定されていない場合は空のデータでビルドを継続
  try {
    [articles, profile] = await Promise.all([
      fetchQiitaArticles(50), // 検索用に50件取得
      fetchQiitaProfile(),
    ]);
  } catch (error) {
    console.error('Failed to fetch Qiita data:', error);
  }

  return (
    <QiitaArticles
      initialData={articles}
      profile={profile ?? undefined}
      showProfile={true}
      enableSearch={true}
    />
  );
}

function QiitaArticlesLoading() {
  return (
    <SkeletonLoader
      count={6}
      showProfile={true}
    />
  )
}

export default async function ArticlePage() {
  return (
    <PageContainer>
      <PageTitle>■Article</PageTitle>
      <PageSubtitle>Qiitaに記載した記事です。</PageSubtitle>

      <section>
        <SectionHeading $withIcon>
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="#55c500"
            style={{ flexShrink: 0 }}
          >
            <path d="M3.57 8.343a3.653 3.653 0 0 1 1.764-3.8a3.653 3.653 0 0 1 3.8 0a3.653 3.653 0 0 1 1.764 3.8a3.653 3.653 0 0 1-1.764 3.8a3.653 3.653 0 0 1-3.8 0a3.653 3.653 0 0 1-1.764-3.8zm11.428 0a3.653 3.653 0 0 1 1.764-3.8a3.653 3.653 0 0 1 3.8 0a3.653 3.653 0 0 1 1.764 3.8a3.653 3.653 0 0 1-1.764 3.8a3.653 3.653 0 0 1-3.8 0a3.653 3.653 0 0 1-1.764-3.8zm-11.428 7.314a3.653 3.653 0 0 1 1.764-3.8a3.653 3.653 0 0 1 3.8 0a3.653 3.653 0 0 1 1.764 3.8a3.653 3.653 0 0 1-1.764 3.8a3.653 3.653 0 0 1-3.8 0a3.653 3.653 0 0 1-1.764-3.8zm11.428 0a3.653 3.653 0 0 1 1.764-3.8a3.653 3.653 0 0 1 3.8 0a3.653 3.653 0 0 1 1.764 3.8a3.653 3.653 0 0 1-1.764 3.8a3.653 3.653 0 0 1-3.8 0a3.653 3.653 0 0 1-1.764-3.8z" />
          </svg>
          Qiita
        </SectionHeading>
        <Suspense fallback={<QiitaArticlesLoading />}>
          <QiitaArticlesData />
        </Suspense>
      </section>
    </PageContainer>
  );
}
