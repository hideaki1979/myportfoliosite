'use client'

import styled, { keyframes } from "styled-components"

const shimmer = keyframes`
    0% {
        background-color: -468px 0;
    }
    100% {
        background-color: 468% 0;
    }
`;

const SkeletonBase = styled.div`
    background: linear-gradient(
        to right,
        #eeeeee 8%,
        #dddddd 18%,
        #eeeeee 33%,
    );
    background-size: 800px 104px;
    animation: ${shimmer} 1.5s ease-in-out infinite;
    border-radius: 4px;
`;

const ProfileSkeleton = styled(SkeletonBase)`
    height: 151px;
    margin-bottom: 32px;
`;

const ArticleRowSkeleton = styled(SkeletonBase)`
    height: 104px;
    border-bottom: 1px solid #cacaca;
`;

const ArticlesContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0;
`;

interface SkeletonLoaderProps {
    count?: number;
    showProfile?: boolean;
}

export default function SkeletonLoader({
    count = 6,
    showProfile = false,
}: SkeletonLoaderProps) {
    return (
        <div role="status" aria-label="読み込み中">
            {showProfile && <ProfileSkeleton />}
            <ArticlesContainer>
                {Array.from({ length: count }).map((_, index) => (
                    <ArticleRowSkeleton key={index} />
                ))}
            </ArticlesContainer>
            <span className="sr-only">記事情報読み込み中...</span>
        </div>
    )
}
