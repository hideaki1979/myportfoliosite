import { Metadata } from "next";
import Hero from "../components/sections/Hero";
import { WidePageContainer } from "../components/layouts/PageLayout";
import QiitaSection from "../components/sections/QiitaSection";
import GitHubSection from "../components/sections/GitHubSection";

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

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "ホーム",
    openGraph: {
      title: "Mirrorman Portfolio - ホーム",
      url: "/",
      type: "website",
      images: [
        {
          url: "/og-home.jpg",
          width: 1200,
          height: 630,
          alt: "Mirrorman Portfolio - ホーム",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      images: ["/og-home.jpg"],
    },
    alternates: {
      canonical: "/",
    },
  };
}

export default async function Home() {

  return (
    <WidePageContainer>
      <Hero />
      <GitHubSection
        showProfile={true}
        showLanguageBar={true}
        showTechTags={true}
        limit={6}
      />
      <QiitaSection
        showProfile={true}
        limit={6}
      />
    </WidePageContainer>
  );
}
