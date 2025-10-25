'use client'

import styled from "styled-components"
import { GitHubRepository } from "./types";
import { formatNumber, getLanguageColor, getRelativeTime } from "./utils";
import { useEffect, useState } from "react";

const Card = styled.article`
  border: 1px solid #cacaca;
  padding: 20px;
  background-color: #fff;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 120px;

  &:hover {
    border-color: #0070f3;
    box-shadow: 0 2px 8px rgba(0, 112, 243, 0.1);
  }

  &:focus-within {
    outline: 2px solid #0070f3;
    outline-offset: 2px;
  }
`;

const RepoTitle = styled.a`
  font-family: 'Noto Sans JP', sans-serif;
  font-weight: 700;
  font-size: 16px;
  line-height: 1;
  color: #000;
  text-decoration: underline;
  text-decoration-skip-ink: none;
  transition: color 0.2s;
  display: block;
  width: fit-content;

  &:hover {
    color: #0070f3;
  }
`;

const RepoDescription = styled.p`
  font-family: 'Noto Sans JP', sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 1.15;
  color: #606060;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MetaInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: auto;
`;

const LanguageInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const LanguageDot = styled.div<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${(props) => props.$color};
  flex-shrink: 0;
`;

const LanguageName = styled.span`
  font-family: 'Noto Sans JP', sans-serif;
  font-weight: 400;
  font-size: 12px;
  line-height: 1.1;
  color: #585757;
  white-space: nowrap;
`;

const UpdateAt = styled.span`
  font-family: 'Noto Sans JP', sans-serif;
  font-weight: 400;
  font-size: 12px;
  line-height: 1.3;
  color: #606060;
  white-space: nowrap;
`;

const StatsInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
`;

const StatItem = styled.span`
  font-family: 'Noto Sans JP', sans-serif;
  font-weight: 400;
  font-size: 12px;
  color: #606060;
  display: flex;
  align-items: center;
  gap: 4px;

  &::before {
    content: '';
    display: inline-block;
  }
`;

const StarIcon = styled(StatItem)`
  &::before {
    content: '★';
    color: #ffd700;
  }
`;

const ForkIcon = styled(StatItem)`
  &::before {
    content: '⑂';
    color: #606060;
  }
`;

interface RepositoryCardProps {
  repository: GitHubRepository;
}

export default function RepositoryCard({ repository }: RepositoryCardProps) {
  const languageColor = repository.primaryLanguage
    ? getLanguageColor(repository.primaryLanguage)
    : "#858585";
  
  const [relativeTime, setRelativeTime] = useState("");

  useEffect(() => {
    // クライアントサイドでのみ相対時間を計算
    setRelativeTime(getRelativeTime(repository.updatedAt));
  }, [repository.updatedAt]);

  return (
    <Card role="listitem">
      <RepoTitle
        href={repository.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${repository.name}のリポジトリを開く`}
      >
        {repository.name}
      </RepoTitle>

      {repository.description && (
        <RepoDescription>{repository.description}</RepoDescription>
      )}

      <MetaInfo>
        {repository.primaryLanguage && (
          <LanguageInfo>
            <LanguageDot $color={languageColor} />
            <LanguageName>{repository.primaryLanguage}</LanguageName>
          </LanguageInfo>
        )}

        <UpdateAt>Updated: {relativeTime || "計算中..."}</UpdateAt>

        <StatsInfo>
          {repository.starCount > 0 && (
            <StarIcon aria-label={`${repository.starCount}個のスター`}>
              {formatNumber(repository.starCount)}
            </StarIcon>
          )}
          {repository.forkCount > 0 && (
            <ForkIcon aria-label={`${repository.forkCount}個のフォーク`}>
              {formatNumber(repository.forkCount)}
            </ForkIcon>
          )}
        </StatsInfo>
      </MetaInfo>
    </Card>
  )
}

