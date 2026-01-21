'use client'

import styled from "styled-components"
import { GitHubReposProps, GitHubRepository, SortBy } from "./types";
import { useMemo, useState, useCallback } from "react";
import { calculateLanguageStats, extractTechTags, sortRepositories } from "./utils";
import GitHubProfile from "./GitHubProfile";
import LanguageBar from "./LanguageBar";
import TechTags from "./TechTags";
import SortControls from "./SortControls";
import RepositoryCard from "./RepositoryCard";
import SkeletonLoader from "./SkeletonLoader";
import { fetchGitHubRepositoriesClient } from "../../../lib/api/github";
import ErrorDisplay from "./ErrorDisplay";
import LoadMoreButton from "./LoadMoreButton";

const Container = styled.section`
    width: 100%;
`;

const Section = styled.div`
    margin-bottom: 20px;
`;

const SectionTitle = styled.h2`
    font-family: 'Noto Sans JP', sans-serif;
    font-weight: 700;
    font-size: 28px;
    line-height: 1.5;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    gap: 12px;
`;

const GithubIcon = styled.span`
    font-size: 28px;
`;

const RepoGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
    gap: 24px;
`;

const EmptyState = styled.div`
    padding: 48px;
    text-align: center;
    background-color: #f5f7fb;
    border-radius: 8px;
`;

const EmptyMessage = styled.p`
    font-family: 'Noto Sans JP', sans-serif;
    font-weight: 400;
    font-size: 16px;
    color: #666;
`;

const MoreLink = styled.a`
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: 'Noto Sans JP', sans-serif;
    font-weight: bold;
    font-size: 16px;
    color: #b7b6b6;
    margin-top: 16px;
    transition: color 0.2s;

    &:hover {
        color: #0070f3;

    }

    &::before {
        content: '→';
        font-size: 16px;
    }
`;

export default function GitHubRepos({
    initialData = [],
    profile,
    showProfile = true,
    showLanguageBar = true,
    showTechTags = true,
    limit,
    isLoading = false,
    error: initialError = null,
    betweenContent,
    initialPagination,
    enableLoadMore = false,
}: GitHubReposProps) {
    const [sortBy, setSortBy] = useState<SortBy>('stars');
    const [repositories, setRepositories] = useState<GitHubRepository[]>(initialData);
    const [error, setError] = useState<{ message: string } | null>(initialError);
    const [isRetrying, setIsRetrying] = useState(false);

    // Load More state
    const [currentPage, setCurrentPage] = useState(initialPagination?.page ?? 1);
    const [hasMore, setHasMore] = useState(initialPagination?.hasMore ?? false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const perPage = initialPagination?.perPage ?? 20;

    // リトライハンドラー
    const handleRetry = async () => {
        setIsRetrying(true);
        setError(null);

        try {
            const result = await fetchGitHubRepositoriesClient(perPage, 1);
            setRepositories(result.repositories);
            setCurrentPage(1);
            setHasMore(result.pagination.hasMore);
            setError(null)
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Githubレポジトリデータの取得に失敗しました'));
        } finally {
            setIsRetrying(false)
        }
    };

    // Load Moreハンドラー
    const handleLoadMore = useCallback(async () => {
        if (isLoadingMore || !hasMore) return;

        setIsLoadingMore(true);
        try {
            const nextPage = currentPage + 1;
            const result = await fetchGitHubRepositoriesClient(perPage, nextPage);

            setRepositories(prev => [...prev, ...result.repositories]);
            setCurrentPage(nextPage);
            setHasMore(result.pagination.hasMore);
        } catch (err) {
            console.error('Failed to load more repositories:', err);
            // Load More失敗時は既存データを保持し、エラーはconsoleに出力のみ
        } finally {
            setIsLoadingMore(false);
        }
    }, [currentPage, hasMore, isLoadingMore, perPage]);

    // リポジトリをソート（Load More有効時はlimitを適用しない）
    const sortedRepos = useMemo(() => {
        const sorted = sortRepositories(repositories, sortBy);
        // Load More有効時はソート後の全データを返す（limitを適用しない）
        return (enableLoadMore || !limit) ? sorted : sorted.slice(0, limit);
    }, [repositories, sortBy, limit, enableLoadMore]);

    // 言語統計を計算
    const languageStats = useMemo(
        () => calculateLanguageStats(sortedRepos),
        [sortedRepos],
    );

    // 技術メモを抽出
    const techTags = useMemo(
        () => extractTechTags(sortedRepos),
        [sortedRepos],
    );

    if (isLoading || isRetrying) {
        return (
            <Container>
                <SkeletonLoader
                    count={limit || 6}
                    showProfile={showProfile}
                    showBar={showLanguageBar}
                    betweenContent={betweenContent}
                />
            </Container>
        )
    }

    // エラー状態
    if (error) {
        return (
            <Container>
                <ErrorDisplay
                    error={error}
                    onRetry={handleRetry}
                    isRetrying={isRetrying}
                />
            </Container>
        )
    }

    // 空チェック
    if (sortedRepos.length === 0) {
        return (
            <EmptyState>
                <EmptyMessage>リポジトリが見つかりませんでした</EmptyMessage>
            </EmptyState>
        );
    }

    return (
        <Container>
            {showProfile && profile && (
                <Section>
                    <GitHubProfile profile={profile} />
                </Section>
            )}

            {showLanguageBar && languageStats.length > 0 && (
                <Section>
                    <LanguageBar stats={languageStats} />
                </Section>
            )}

            {showTechTags && techTags.length > 0 && (
                <Section>
                    <TechTags tags={techTags} />
                </Section>
            )}
            {betweenContent && (
                <Section>
                    {betweenContent}
                </Section>
            )}

            <Section>
                <SectionTitle>
                    <GithubIcon>📁</GithubIcon>
                    Repository
                </SectionTitle>
                <SortControls value={sortBy} onChange={setSortBy} />

                <RepoGrid role="list" aria-label="リポジトリ一覧">
                    {sortedRepos.map((repo) => (
                        <RepositoryCard key={repo.id} repository={repo} />
                    ))}
                </RepoGrid>

                {enableLoadMore && (
                    <LoadMoreButton
                        onClick={handleLoadMore}
                        isLoading={isLoadingMore}
                        hasMore={hasMore}
                    />
                )}

                {profile && !enableLoadMore && (
                    <MoreLink
                        href={profile.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        More
                    </MoreLink>
                )}
            </Section>
        </Container>
    )
}

