'use client'

import styled from "styled-components"
import { GitHubReposProps, SortBy } from "./types";
import { useMemo, useState } from "react";
import { calculateLanguageStats, extractTechTags, sortRepositories } from "./utils";
import GitHubProfile from "./GitHubProfile";
import LanguageBar from "./LanguageBar";
import TechTags from "./TechTags";
import SortControls from "./SortControls";
import RepositoryCard from "./RepositoryCard";
import SkeletonLoader from "./SkeletonLoader";

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
    font-weight: 500;
    font-size: 14px;
    color: #858383;
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
}: GitHubReposProps) {
    const [sortBy, setSortBy] = useState<SortBy>('stars');

    // リポジトリをソート
    const sortedRepos = useMemo(() => {
        const sorted = sortRepositories(initialData, sortBy);
        return limit ? sorted.slice(0, limit) : sorted;
    }, [initialData, sortBy, limit]);

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

    if (isLoading) {
        return (
            <Container>
                <SkeletonLoader
                    count={limit || 6}
                    showProfile={showProfile}
                    showBar={showLanguageBar}
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

                {profile && (
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

