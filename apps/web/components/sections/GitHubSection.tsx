import { Suspense } from "react";
import { fetchGitHubRepositories } from "../../lib/api/github";
import { GITHUB_PROFILE } from "../../lib/data/github-profile";
import GitHubRepos, { GitHubRepository, SkeletonLoader } from "../features/GitHubRepos";
import { Section } from "../layouts/PageLayout";
import { SectionHeading } from "../ui/Typography";

interface GitHubSectionProps {
    showProfile?: boolean;
    showLanguageBar?: boolean;
    showTechTags?: boolean;
    limit?: number;
}

async function GitHubReposData({
    showProfile = true,
    showLanguageBar = true,
    showTechTags = true,
    limit = 6,
}: GitHubSectionProps) {
    let repositories: GitHubRepository[] = [];
    let error: Error | null = null;

    try {
        repositories = await fetchGitHubRepositories(20);
    } catch (err) {
        console.error("Failed to fetch GitHub repositories:", err);
        error = err instanceof Error ? err : new Error('GitHubリポジトリの取得に失敗しました');
    }

    return (
        <GitHubRepos
            initialData={repositories}
            profile={GITHUB_PROFILE}
            showProfile={showProfile}
            showLanguageBar={showLanguageBar}
            showTechTags={showTechTags}
            limit={limit}
            error={error}
        />
    );
}

function GitHubReposLoading({
    showProfile = true,
    showLanguageBar = true,
    limit = 6,
}: GitHubSectionProps) {
    return (
        <SkeletonLoader
            count={limit}
            showProfile={showProfile}
            showBar={showLanguageBar}
        />
    );
}

export default function GitHubSection(props: GitHubSectionProps) {
    return (
        <Section $marginTop={64}>
            <SectionHeading>■GitHub</SectionHeading>
            <Suspense fallback={<GitHubReposLoading {...props} />}>
                <GitHubReposData {...props} />
            </Suspense>
        </Section>
    );
}
