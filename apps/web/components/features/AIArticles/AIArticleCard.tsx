'use client';

import styled from 'styled-components';
import { AIArticleCardProps } from './types';

const Card = styled.article`
  background-color: #e8f4e8;
  border-bottom: 1px solid #adadad;
  padding: 24px;
  transition: background-color 0.3s;

  &:hover {
    background-color: #dcecde;
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 12px;
`;

const AIIcon = styled.div`
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;

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

const MetaContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 8px;
`;

const AuthorInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const AuthorAvatar = styled.img`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
`;

const AuthorName = styled.span`
  font-family: 'Noto Sans JP', sans-serif;
  font-size: 12px;
  color: #666;
`;

const Stats = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const StatItem = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: 'Noto Sans JP', sans-serif;
  font-size: 12px;
  color: #666;

  svg {
    width: 14px;
    height: 14px;
  }
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
`;

const Tag = styled.span`
  background-color: #d0e8d0;
  color: #1a6b1a;
  font-family: 'Noto Sans JP', sans-serif;
  font-weight: 500;
  font-size: 12px;
  line-height: 1.5;
  padding: 2px 8px;
  border-radius: 4px;
`;

const CreatedAt = styled.time`
  font-family: 'Noto Sans JP', sans-serif;
  font-weight: 500;
  font-size: 12px;
  line-height: 1.5;
  color: #868686;
`;

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: 'Asia/Tokyo',
};

export default function AIArticleCard({ article }: AIArticleCardProps) {
  const formattedDate = new Date(article.createdAt).toLocaleString(
    'ja-JP',
    DATE_FORMAT_OPTIONS
  );

  return (
    <Card role="listitem">
      <CardHeader>
        <AIIcon aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="#1a6b1a">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </AIIcon>
        <TitleLink
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${article.title}の記事を新しいタブで開く`}
        >
          {article.title}
        </TitleLink>
      </CardHeader>

      <MetaContainer>
        <AuthorInfo>
          <AuthorAvatar
            src={article.author.profileImageUrl}
            alt={`${article.author.name}のアバター`}
            width={20}
            height={20}
          />
          <AuthorName>@{article.author.id}</AuthorName>
        </AuthorInfo>
        <Stats>
          <StatItem title="いいね数">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {article.likesCount}
          </StatItem>
          <StatItem title="ストック数">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            {article.stocksCount}
          </StatItem>
        </Stats>
      </MetaContainer>

      {article.tags.length > 0 && (
        <TagsContainer>
          {article.tags.slice(0, 5).map((tag, index) => (
            <Tag key={`${tag.name}-${index}`}>{tag.name}</Tag>
          ))}
          {article.tags.length > 5 && (
            <Tag>+{article.tags.length - 5}</Tag>
          )}
        </TagsContainer>
      )}

      <CreatedAt dateTime={article.createdAt}>{formattedDate}</CreatedAt>
    </Card>
  );
}
