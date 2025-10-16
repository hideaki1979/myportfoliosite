'use client'

import styled from "styled-components"
import { SortBy } from "./types";

const Container = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

const Label = styled.span`
  font-family: 'Noto Sans JP', sans-serif;
  font-weight: 500;
  font-size: 14px;
  color: #333;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const SortButton = styled.button<{ $active: boolean }>`
  font-family: 'Noto Sans JP', sans-serif;
  font-weight: 500;
  font-size: 14px;
  padding: 8px 16px;
  border: 1px solid ${(props) => (props.$active ? '#0070f3' : '#cacaca')};
  background-color: ${(props) => (props.$active ? '#0070f3' : '#fff')};
  color: ${(props) => (props.$active ? '#fff' : '#333')};
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #0070f3;
    background-color: ${(props) => (props.$active ? '#0056b3' : '#f0f8ff')};
  }

  &:focus {
    outline: 2px solid #0070f3;
    outline-offset: 2px;
  }

  &:active {
    transform: scale(0.98);
  }
`

interface SortControlProps {
  value: SortBy;
  onChange: (sortBy: SortBy) => void;
}

export default function SortControls({ value, onChange }: SortControlProps) {
  return (
    <Container role="group" aria-label="並び順の選択">
      <Label>並び順：</Label>
      <ButtonGroup>
        <SortButton
          type="button"
          $active={value === 'stars'}
          onClick={() => onChange('stars')}
          aria-pressed={value === 'stars'}
          aria-label="スター数順に並び替え"
        >
          スター数順
        </SortButton>
        <SortButton
          type="button"
          $active={value === 'updated'}
          onClick={() => onChange('updated')}
          aria-pressed={value === 'updated'}
          aria-label="更新日順に並び替え"
        >
          更新日順
        </SortButton>
      </ButtonGroup>
    </Container>
  )
}

