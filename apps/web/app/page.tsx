import { Metadata } from "next";
import Hero from "../components/sections/Hero";
import { fetchGitHubRepositories } from "../lib/api/github";
import GitHubRepos, { GitHubRepository } from "../components/features/GitHubRepos";
import { GITHUB_PROFILE } from "../lib/data/github-profile";

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

  try {
    repositories = await fetchGitHubRepositories(20);
  } catch (error) {
    console.error("Failed to fetch GitHub repositories:", error);
  }

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 16px" }}>
      <Hero />

      <section style={{ marginTop: 64 }}>
        <h2
          style={{
            fontFamily: "Noto Sans JP, sans-serif",
            fontWeight: 700,
            fontSize: 28,
            marginBottom: 24,
          }}
        >
          GitHub
        </h2>
        <GitHubRepos
          initialData={repositories}
          profile={GITHUB_PROFILE}
          showProfile={true}
          showLanguageBar={true}
          showTechTags={true}
          limit={6}
        />
      </section>
    </div>
  );
}
