'use client'

import styled from "styled-components"
import { GitHubRepository } from "./types";
import { formatNumber, getLanguageColor, getRelativeTime } from "./utils";

const Card = styled.article`
    border: 1px solid #cacaca;
    padding: 16px;
    background-color: #fff;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    gap: 16px;
    height: 140px;

    &:hover {
        border-color: #0070f3;
        box-shadow: 0 2px 8px rgba(0, 112, 243, 0.1);
    }
`;

const RepoTitle = styled.a`
    font-family: 'Noto Sans JP', sans-serif;
    font-weight: 700;
    font-size: 16px;
    line-height: 1.5;
    color: #000;
    text-decoration: underline;
    text-decoration-skip-ink: none;
    transition: color 0.3s;
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
    line-height: 1.5;
    color: #606060;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const MetaInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
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
    line-height: 1.5;
    color: #585757;
    white-space: nowrap;
`;

const UpdateAt = styled.span`
    font-family: 'Noto Sans JP', sans-serif;
    font-weight: 400;
    font-size: 12px;
    line-height: 1.5;
    color: #606060;
`;

const StatsInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
    margin-left: auto;
`;

const StatItem = styled.span`
    font-family: 'Noto Sans JP', sans-serif;
    font-weight: 400;
    font-size: 12px;
    color: #606060;
    display: flex;
    align-items: center;
    gap: 8px;

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

    return (
        <Card>
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

                <UpdateAt>Updated: {getRelativeTime(repository.updatedAt)}</UpdateAt>

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
