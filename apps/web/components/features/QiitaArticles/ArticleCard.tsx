'use client'

import styled from "styled-components"
import { QiitaArticle } from "./types";

const Card = styled.article`
    background-color: #dcecde;
    border-bottom: 1px solid #adadad;
    padding: 24px;
    transition: background-color 0.3s;

    &:hover {
        background-color: #d0e0d2;
    }
`;

const CardHeader = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 12px;
`;

const QiitaIcon = styled.div`
    width: 24px;
    height: 24px;
    flex-shrink: 0;

    svg {
        width: 100%;
        height: 100%;
    }
`;

const TitleLink = styled.a`
    font-family: 'Noto Sans JP', sans-serif;
    font-weight: 700;
    font-size: 16px;
    line-height: 1.5;
    color: #000000;
    flex: 1;
    transition: color 0.3s;

    &:hover {
        color: #55c500;
    }
`;

const TagsContainer = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 8px;
`;

const Tag = styled.span`
    background-color: #dddddd;
    color: #868686;
    font-family: 'Noto Sans JP', sans-serif;
    font-weight: 700;
    font-size: 14px;
    line-height: 1.5;
    padding: 4px;
`;

const CreatedAt = styled.time`
    font-family: 'Noto Sans JP', sans-serif;
    font-weight: 700;
    font-size: 12px;
    line-height: 1.5;
    color: #868686;
`;

interface ArticleCardProps {
    article: QiitaArticle;
}

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tokyo',
};

export default function ArticleCard({ article }: ArticleCardProps) {
    // SSR対応: 固定のロケール設定で一貫性を保つ
    const formattedDate = new Date(article.createdAt).toLocaleString('ja-JP', DATE_FORMAT_OPTIONS);

    return (
        <Card role="listitem">
            <CardHeader>
                <QiitaIcon aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="#55c500">
                        <path d="M3.57 8.343a3.653 3.653 0 0 1 1.764-3.8a3.653 3.653 0 0 1 3.8 0a3.653 3.653 0 0 1 1.764 3.8a3.653 3.653 0 0 1-1.764 3.8a3.653 3.653 0 0 1-3.8 0a3.653 3.653 0 0 1-1.764-3.8zm11.428 0a3.653 3.653 0 0 1 1.764-3.8a3.653 3.653 0 0 1 3.8 0a3.653 3.653 0 0 1 1.764 3.8a3.653 3.653 0 0 1-1.764 3.8a3.653 3.653 0 0 1-3.8 0a3.653 3.653 0 0 1-1.764-3.8zm-11.428 7.314a3.653 3.653 0 0 1 1.764-3.8a3.653 3.653 0 0 1 3.8 0a3.653 3.653 0 0 1 1.764 3.8a3.653 3.653 0 0 1-1.764 3.8a3.653 3.653 0 0 1-3.8 0a3.653 3.653 0 0 1-1.764-3.8zm11.428 0a3.653 3.653 0 0 1 1.764-3.8a3.653 3.653 0 0 1 3.8 0a3.653 3.653 0 0 1 1.764 3.8a3.653 3.653 0 0 1-1.764 3.8a3.653 3.653 0 0 1-3.8 0a3.653 3.653 0 0 1-1.764-3.8z" />
                    </svg>
                </QiitaIcon>
                <TitleLink
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${article.title}の記事を新しいタブで開く`}
                >
                    {article.title}
                </TitleLink>
            </CardHeader>

            {article.tags.length > 0 && (
                <TagsContainer>
                    {article.tags.map((tag, index) => (
                        <Tag key={`${tag.name}-${index}`} data-testid="article-tag">{tag.name}</Tag>
                    ))}
                </TagsContainer>
            )}

            <CreatedAt dateTime={article.createdAt}>{formattedDate}</CreatedAt>
        </Card>
    );
}
