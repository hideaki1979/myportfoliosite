import { Suspense } from "react";
import { fetchGitHubContributions, fetchGitHubRepositories } from "../../lib/api/github";
import { GITHUB_PROFILE } from "../../lib/data/github-profile";
import GitHubRepos, { GitHubRepository, SkeletonLoader } from "../features/GitHubRepos";
import { Section } from "../layouts/PageLayout";
import { SectionHeading } from "../ui/Typography";
import { ContributionChart } from "../features/GitHubContributions";

interface GitHubSectionProps {
    showProfile?: boolean;
    showLanguageBar?: boolean;
    showTechTags?: boolean;
    limit?: number;
    showContributions?: boolean;
    title?: string;
    showTitle?: boolean;
    enableLoadMore?: boolean;
}

async function GitHubReposData({
    showProfile = true,
    showLanguageBar = true,
    showTechTags = true,
    limit = 6,
    showContributions = true,
    enableLoadMore = false,
}: GitHubSectionProps) {
    let repositories: GitHubRepository[] = [];
    let error: { message: string } | null = null;
    let pagination: { page: number; perPage: number; hasMore: boolean } | undefined;

    try {
        const result = await fetchGitHubRepositories(enableLoadMore ? 20 : (limit ?? 20));
        repositories = result.repositories;
        pagination = result.pagination;
    } catch (err) {
        console.error("Failed to fetch GitHub repositories:", err);
        error = { message: err instanceof Error ? err.message : 'GitHubリポジトリの取得に失敗しました' };
    }

    return (
        <GitHubRepos
            initialData={repositories}
            profile={GITHUB_PROFILE}
            showProfile={showProfile}
            showLanguageBar={showLanguageBar}
            showTechTags={showTechTags}
            limit={enableLoadMore ? undefined : limit}
            error={error}
            initialPagination={pagination}
            enableLoadMore={enableLoadMore}
            betweenContent={
                showContributions ? (
                    <Suspense fallback={<GitHubContributionsLoading />}>
                        <GitHubContributionsData />
                    </Suspense>
                ) : undefined
            }
        />
    );
}

async function GitHubContributionsData() {
    const contributions = await fetchGitHubContributions();
    return <ContributionChart data={contributions} />;
}


function GitHubReposLoading({
    showProfile = true,
    showLanguageBar = true,
    showContributions = true,
    limit = 6,
}: GitHubSectionProps) {
    return (
        <SkeletonLoader
            count={limit}
            showProfile={showProfile}
            showBar={showLanguageBar}
            betweenContent={showContributions ? <GitHubContributionsLoading /> : undefined}
        />
    );
}

function GitHubContributionsLoading() {
    return (
        <div className="contribution-skeleton-loader" />
    );
}

export default function GitHubSection(props: GitHubSectionProps) {
    const { title = '■GitHub', showTitle = true, ...reposProps } = props;

    return (
        <Section $marginTop={64}>
            {showTitle && <SectionHeading>{title}</SectionHeading>}

            <Suspense fallback={<GitHubReposLoading {...reposProps} />}>
                <GitHubReposData {...reposProps} />
            </Suspense>
        </Section>
    );
}

