'use client'

import styled from "styled-components"
import { QiitaArticlesProps } from "./types";
import { useMemo, useState } from "react";
import QiitaProfile from "./QiitaProfile";
import ArticleCard from "./ArticleCard";
import SkeletonLoader from "./SkeletonLoader";
import { fetchQiitaArticlesClient } from "../../../lib/api/qiita";
import ErrorDisplay from "./ErrorDisplay";

const Container = styled.section`
    width: 100%;
`;

const Section = styled.div`
    margin-bottom: 32px;
`;

const SectionTitle = styled.h2`
    font-family: 'Noto Sans JP', sans-serif;
    font-weight: 700;
    font-size: 24px;
    line-height: 32px;
    margin-bottom: 24px;
    color: #fff;
`;

const ArticlesContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0;
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

const MoreLinkContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 24px;
    gap: 8px;
`;

const MoreLink = styled.a`
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: 'Noto Sans JP', sans-serif;
    font-weight: 500;
    font-size: 14px;
    color: #fff;
    transition: color 0.3s;

    &:hover {
        color: #55c500;
    }
`;

const ChevronIcon = styled.svg`
    width: 13.5px;
    height: 13.5px;
    fill: currentColor;
`;

export default function QiitaArticles({
    initialData = [],
    profile,
    showProfile,
    limit,
    isLoading = false,
    error: initialError = null,
}: QiitaArticlesProps) {
    const [articles, setArticles] = useState(initialData);
    const [error, setError] = useState<Error | null>(initialError);
    const [isRetrying, setIsRetrying] = useState(false);

    // リトライハンドラー
    const handleRetry = async () => {
        setIsRetrying(true);
        setError(null);

        try {
            const data = await fetchQiitaArticlesClient(limit || 10);
            setArticles(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('データの取得に失敗しました'));
        } finally {
            setIsRetrying(false);
        }
    };

    // 記事を制限
    const displayArticles = useMemo(() => {
        return limit ? articles.slice(0, limit) : articles;
    }, [articles, limit]);

    // ローディング状態
    if (isLoading || isRetrying) {
        return (
            <Container>
                <SkeletonLoader
                    count={limit || 6}
                    showProfile={showProfile}
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
        );
    }

    // 空チェック
    if (displayArticles.length === 0) {
        return (
            <EmptyState>
                <EmptyMessage>記事が見つかりませんでした。</EmptyMessage>
            </EmptyState>
        )
    }

    return (
        <Container role="region" aria-label="Qiita">
            {showProfile && profile && (
                <Section>
                    <QiitaProfile profile={profile}></QiitaProfile>
                </Section>
            )}

            <Section>
                <SectionTitle>投稿記事</SectionTitle>
                <ArticlesContainer role="list" aria-label="Qiita記事一覧">
                    {displayArticles.map((article) => (
                        <ArticleCard key={article.id} article={article} />
                    ))}
                </ArticlesContainer>
                {profile?.websiteUrl && (
                    <MoreLinkContainer>
                        <ChevronIcon
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"
                                fill="currentColor"
                            />
                        </ChevronIcon>
                        <MoreLink
                            href={profile.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            More
                        </MoreLink>
                    </MoreLinkContainer>
                )}
            </Section>
        </Container>
    );
}
