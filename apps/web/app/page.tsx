import { Metadata } from "next";
import Hero from "../components/sections/Hero";
import { fetchGitHubRepositories } from "../lib/api/github";
import { GITHUB_PROFILE } from "../lib/data/github-profile";
import GitHubRepos, { GitHubRepository } from "../components/features/GitHubRepos";
import { Section, WidePageContainer } from "../components/layouts/PageLayout";
import { SectionHeading } from "../components/ui/Typography";
import { fetchQiitaArticles, fetchQiitaProfile, QiitaArticle } from "../lib/api/qiita";
import QiitaArticles from "../components/features/QiitaArticles";

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
  // GitHubリポジトリをサーバーサイドで取得
  let repositories: GitHubRepository[] = [];
  // Qiita記事をサーバーサイドで取得
  let articles: QiitaArticle[] = []
  let profile = null;

  try {
    repositories = await fetchGitHubRepositories(20);
  } catch (error) {
    console.error("Failed to fetch GitHub repositories:", error);
  }

  try {
    [articles, profile] = await Promise.all([
      fetchQiitaArticles(10),
      fetchQiitaProfile(),
    ]);
  } catch (error) {
    console.error("Failed to fetch Qiita data:", error);
  }

  return (
    <WidePageContainer>
      <Hero />

      <Section $marginTop={64}>
        <SectionHeading>■GitHub</SectionHeading>
          <GitHubRepos
            initialData={repositories}
            profile={GITHUB_PROFILE}
            showProfile={true}
            showLanguageBar={true}
            showTechTags={true}
            limit={6}
          />
      </Section>
      <Section $marginTop={64}>
        <SectionHeading>■Qiita</SectionHeading>
        <QiitaArticles
          initialData={articles}
          profile={profile ?? undefined}
          showProfile={true}
          limit={6}
        />
      </Section>
    </WidePageContainer>
  );
}
