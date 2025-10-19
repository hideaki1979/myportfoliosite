'use client'

import styled from "styled-components"
import { QiitaArticlesProps } from "./types";
import { useMemo } from "react";
import QiitaProfile from "./QiitaProfile";
import ArticleCard from "./ArticleCard";

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
}: QiitaArticlesProps) {
    // 記事を制限
    const articles = useMemo(() => {
        return limit ? initialData.slice(0, limit) : initialData;
    }, [initialData, limit]);

    // 空チェック
    if (articles.length === 0) {
        return (
            <EmptyState>
                <EmptyMessage>記事が見つかりませんでした。</EmptyMessage>
            </EmptyState>
        )
    }

    return (
        <Container>
            {showProfile && profile && (
                <Section>
                    <QiitaProfile profile={profile}></QiitaProfile>
                </Section>
            )}

            <Section>
                <SectionTitle>投稿記事</SectionTitle>
                <ArticlesContainer role="list" aria-label="Qiita記事一覧">
                    {articles.map((article) => (
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
