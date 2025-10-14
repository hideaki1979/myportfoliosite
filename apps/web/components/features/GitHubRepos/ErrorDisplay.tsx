'use client'

import styled from "styled-components"

const ErrorContainer = styled.h3`
    padding: 24px;
    background-color: #fff5f5;
    border: 1px solid #feb2b2;
    border-radius: 8px;
    text-align: center;
`;

const ErrorTitle = styled.h3`
    font-family: 'Noto Sans JP', sans-serif;
    font-weight: 700;
    font-size: 18px;
    color: #c53030;
    margin-bottom: 12px;
`;

const ErrorMessage = styled.p`
    font-family: 'Noto Sans JP', sans-serif;
    font-weight: 400;
    font-size: 14px;
    color: #742a2a;
    margin-bottom: 16px;
`;

const RetryButton = styled.button`
    font-family: 'Noto Sans JP', sans-serif;
    font-weight: 500;
    font-size: 14px;
    padding: 10px 24px;
    background-color: #0070f3;
    color: #fff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.3s;

    &:hover {
        background-color: #0056b3;
    }

    &:focus {
        outline: 2px solid #0070f3;
        outline-offset: 2px;
    }

    &:active {
        transform: scale(0.95);
    }
`;

interface ErrorDisplayProps {
    error: Error;
    onRetry?: () => void;
}

export default function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
    return (
        <ErrorContainer role="alert">
            <ErrorTitle>エラーが発生しました</ErrorTitle>
            <ErrorMessage>{error.message}</ErrorMessage>
            {onRetry && <RetryButton onClick={onRetry}>再試行</RetryButton>}
        </ErrorContainer>
    )
}

