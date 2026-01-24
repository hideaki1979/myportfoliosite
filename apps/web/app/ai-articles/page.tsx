import { Metadata } from 'next';
import { Suspense } from 'react';
import { createBreadcrumbStructuredData } from '../../lib/structured-data';
import { baseUrl } from '../../lib/constants';
import { fetchAIArticles } from '../../lib/api/ai-articles';
import AIArticles from '../../components/features/AIArticles';
import { PageContainer } from '../../components/layouts/PageLayout';
import { PageSubtitle, PageTitle, SectionHeading } from '../../components/ui/Typography';

/**
 * ISR（Incremental Static Regeneration）設定
 * 10分（600秒）ごとにページを再生成
 */
export const revalidate = 600;

const breadcrumbData = createBreadcrumbStructuredData({
  items: [
    { name: 'ホーム', url: baseUrl },
    { name: 'AI Articles', url: `${baseUrl}/ai-articles` },
  ],
});

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'AI Articles',
    description:
      'AI、機械学習、ChatGPT、LLMなどのAI関連技術記事を自動収集して紹介しています。最新のAI技術トレンドをチェックできます。',
    openGraph: {
      title: 'AI Articles | Mirrorman Portfolio',
      description:
        'AI、機械学習、ChatGPT、LLMなどのAI関連技術記事を自動収集して紹介しています。最新のAI技術トレンドをチェックできます。',
      url: '/ai-articles',
      type: 'website',
      images: [
        {
          url: '/og-ai-articles.jpg',
          width: 1200,
          height: 630,
          alt: 'AI Articles - Mirrorman Portfolio',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      images: ['/og-ai-articles.jpg'],
    },
    alternates: {
      canonical: '/ai-articles',
    },
    other: {
      'ld+json:breadcrumb': JSON.stringify(breadcrumbData),
    },
  };
}

async function AIArticlesData() {
  // AI記事をサーバーサイドで取得
  const { articles, lastUpdated } = await fetchAIArticles();

  return (
    <AIArticles
      initialData={articles}
      lastUpdated={lastUpdated}
      enableSearch={true}
    />
  );
}

function AIArticlesLoading() {
  return (
    <div
      style={{
        padding: '48px',
        textAlign: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '8px',
      }}
    >
      <p style={{ color: '#999' }}>読み込み中...</p>
    </div>
  );
}

export default async function AIArticlesPage() {
  return (
    <PageContainer>
      <PageTitle>■AI Articles</PageTitle>
      <PageSubtitle>
        AI、機械学習、LLMなどの最新技術記事を自動収集しています。
        <br />
        毎日AM3:00 (JST) に更新されます。
      </PageSubtitle>

      <section>
        <SectionHeading $withIcon>
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="#1a6b1a"
            style={{ flexShrink: 0 }}
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          Qiita AI Articles
        </SectionHeading>
        <Suspense fallback={<AIArticlesLoading />}>
          <AIArticlesData />
        </Suspense>
      </section>
    </PageContainer>
  );
}
