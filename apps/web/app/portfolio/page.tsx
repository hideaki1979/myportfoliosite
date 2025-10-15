import { Metadata } from "next";
import { createBreadcrumbStructuredData } from "../../lib/structured-data";
import { baseUrl } from "../../lib/constants";
import { fetchGitHubRepositories } from "../../lib/api/github";
import { GITHUB_PROFILE } from "../../lib/data/github-profile";
import GitHubRepos, { GitHubRepository } from "../../components/features/GitHubRepos";

const breadcrumbData = createBreadcrumbStructuredData({
  items: [
    { name: "ホーム", url: baseUrl },
    { name: "Portfolio", url: `${baseUrl}/portfolio` },
  ],
});

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Portfolio",
    description:
      "製作物やGitHubの主要リポジトリ、使用技術のハイライトを掲載しています。React、Next.js、TypeScript を中心とした開発実績をご覧ください。",
    openGraph: {
      title: "Portfolio | Mirrorman Portfolio",
      description:
        "製作物やGitHubの主要リポジトリ、使用技術のハイライトを掲載しています。React、Next.js、TypeScript を中心とした開発実績をご覧ください。",
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
      "ld+json:breadcrumb": JSON.stringify(breadcrumbData),
    },
  };
}

export default async function PortfolioPage() {
  // GitHubリポジトリをサーバーサイドで取得
  let repositories: GitHubRepository[] = [];

  try {
    repositories = await fetchGitHubRepositories(20);
  } catch (error) {
    console.error("Failed to fetch GitHub repositories:", error);
  }

  return (
    <div style={{ maxWidth: 1248, margin: "0 auto", padding: "24px 16px" }}>
      <h1
        style={{
          fontFamily: "Noto Sans JP, sans-serif",
          fontWeight: 700,
          fontSize: 28,
          textAlign: "center",
          marginBottom: 24,
        }}
      >
        ■Portfolio（Github）
      </h1>
      <p style={{ textAlign: "center", marginBottom: 48 }}>
        今まで作成した学校の課題やポートフォリオ、
        <br />
        Udemyや学習のために作成したアプリとなります。
      </p>

      <GitHubRepos
        initialData={repositories}
        profile={GITHUB_PROFILE}
        showProfile={true}
        showLanguageBar={true}
        showTechTags={true}
      />
    </div>
  );
}
