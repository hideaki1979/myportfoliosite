'use client'

import styled from "styled-components"

const ErrorContainer = styled.div`
    padding: 32px;
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
  margin: 0 0 12px 0;
`;

const ErrorMessage = styled.p`
  font-family: 'Noto Sans JP', sans-serif;
  font-weight: 400;
  font-size: 14px;
  color: #742a2a;
  margin: 0 0 16px 0;
`;

const RetryButton = styled.button`
  font-family: 'Noto Sans JP', sans-serif;
  font-weight: 500;
  font-size: 14px;
  padding: 10px 24px;
  background-color: #55c500;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #4a9f00;
  }

  &:focus {
    outline: 2px solid #55c500;
    outline-offset: 2px;
  }

  &:active {
    transform: scale(0.98);
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

interface ErrorDisplayProps {
    error: {message: string};
    onRetry?: () => void;
    isRetrying?: boolean;
}

export default function ErrorDisplay({error, onRetry, isRetrying = false}: ErrorDisplayProps) {
    return (
        <ErrorContainer role="alert">
            <ErrorTitle>エラーが発生しました</ErrorTitle>
            <ErrorMessage>{error.message}</ErrorMessage>
            {onRetry && (
                <RetryButton
                type="button"
                onClick={onRetry}
                disabled={isRetrying}
                >
                    {isRetrying ? '再試行中...' : '再試行'}
                </RetryButton>
            )}
        </ErrorContainer>
    )
}
