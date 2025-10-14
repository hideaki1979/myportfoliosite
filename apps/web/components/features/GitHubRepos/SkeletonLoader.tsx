'use client'

import styled, { keyframes } from "styled-components"

const shimmer = keyframes`
    0% {
        background-position: -468px 0;
    }
    100% {
        background-position: 468px 0;
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
    border-radius: 8px;
`;

const ProfileSkeleton = styled(SkeletonBase)`
    height: 160px;
    margin-bottom: 24px;
`;

const BarSkeleton = styled(SkeletonBase)`
    height: 12px;
    margin-bottom: 24px;
`;

const CardSkeleton = styled(SkeletonBase)`
    height: 140px;
    border: 1px solid #cacaca;
`;

const GridContainer = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(460px, 1fr));
    gap: 24px;

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
`;

interface SkeletonLoaderProps {
    count?: number;
    showProfile?: boolean;
    showBar?: boolean;
}

export default function SkeletonLoader({
    count = 6,
    showProfile = false,
    showBar = false,
}: SkeletonLoaderProps) {
    return (
        <div role="status" aria-label="読み込み中">
            {showProfile && <ProfileSkeleton />}
            {showBar && <BarSkeleton />}
            <GridContainer>
                {Array.from({ length: count }).map((_, index) => (
                    <CardSkeleton key={index} />
                ))}
            </GridContainer>
            <span className="sr-only">リポジトリを読み込む中...</span>
        </div>
    );
}
