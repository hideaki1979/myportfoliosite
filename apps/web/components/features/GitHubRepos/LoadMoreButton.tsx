'use client'

import styled, { keyframes } from "styled-components"

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 32px;
`;

const Button = styled.button`
  font-family: 'Noto Sans JP', sans-serif;
  font-weight: 500;
  font-size: 16px;
  padding: 14px 32px;
  background-color: #f5f7fb;
  color: #333;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover:not(:disabled) {
    background-color: #e2e8f0;
    border-color: #cbd5e0;
  }

  &:focus {
    outline: 2px solid #0070f3;
    outline-offset: 2px;
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const LoadingSpinner = styled.span`
  width: 16px;
  height: 16px;
  border: 2px solid #e2e8f0;
  border-top-color: #0070f3;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

interface LoadMoreButtonProps {
  onClick: () => void;
  isLoading: boolean;
  hasMore: boolean;
}

export default function LoadMoreButton({ onClick, isLoading, hasMore }: LoadMoreButtonProps) {
  if (!hasMore) {
    return null;
  }

  return (
    <ButtonContainer>
      <Button
        type="button"
        onClick={onClick}
        disabled={isLoading}
        aria-label={isLoading ? '読み込み中' : 'さらに読み込む'}
      >
        {isLoading ? (
          <>
            <LoadingSpinner aria-hidden="true" />
            読み込み中...
          </>
        ) : (
          'もっと見る'
        )}
      </Button>
    </ButtonContainer>
  )
}
