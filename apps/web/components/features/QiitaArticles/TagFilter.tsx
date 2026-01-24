'use client';

import styled from 'styled-components';
import { useState, useMemo } from 'react';

const FilterContainer = styled.div`
  margin-bottom: 24px;
`;

const FilterHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const FilterLabel = styled.span`
  font-family: 'Noto Sans JP', sans-serif;
  font-weight: 500;
  font-size: 14px;
  color: #fff;
`;

const ClearAllButton = styled.button`
  font-family: 'Noto Sans JP', sans-serif;
  font-size: 12px;
  color: #868686;
  background: none;
  border: none;
  padding: 4px 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s, color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(85, 197, 0, 0.3);
  }

  &:disabled {
    cursor: default;
    opacity: 0.5;
  }
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const TagChip = styled.button<{ $isSelected: boolean }>`
  font-family: 'Noto Sans JP', sans-serif;
  font-size: 13px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 16px;
  border: 1px solid ${({ $isSelected }) => ($isSelected ? '#55c500' : '#ccc')};
  background-color: ${({ $isSelected }) => ($isSelected ? '#55c500' : '#fff')};
  color: ${({ $isSelected }) => ($isSelected ? '#fff' : '#333')};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #55c500;
    background-color: ${({ $isSelected }) => ($isSelected ? '#4ab300' : '#f0f8e8')};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(85, 197, 0, 0.3);
  }
`;

const ExpandButton = styled.button`
  font-family: 'Noto Sans JP', sans-serif;
  font-size: 13px;
  color: #55c500;
  background: none;
  border: none;
  padding: 6px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  border-radius: 16px;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(85, 197, 0, 0.1);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(85, 197, 0, 0.3);
  }

  svg {
    width: 14px;
    height: 14px;
    transition: transform 0.2s;
  }
`;

interface TagFilterProps {
  tags: string[];
  selectedTags: string[];
  onChange: (selectedTags: string[]) => void;
  maxInitialDisplay?: number;
}

export default function TagFilter({
  tags,
  selectedTags,
  onChange,
  maxInitialDisplay = 10,
}: TagFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const displayTags = useMemo(() => {
    if (isExpanded || tags.length <= maxInitialDisplay) {
      return tags;
    }
    return tags.slice(0, maxInitialDisplay);
  }, [tags, isExpanded, maxInitialDisplay]);

  const remainingCount = tags.length - maxInitialDisplay;
  const showExpandButton = tags.length > maxInitialDisplay;

  const handleTagClick = (tag: string) => {
    const isSelected = selectedTags.includes(tag);
    if (isSelected) {
      onChange(selectedTags.filter((t) => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  const handleClearAll = () => {
    onChange([]);
  };

  if (tags.length === 0) {
    return null;
  }

  return (
    <FilterContainer>
      <FilterHeader>
        <FilterLabel>タグでフィルタ</FilterLabel>
        {selectedTags.length > 0 && (
          <ClearAllButton type="button" onClick={handleClearAll}>
            すべてクリア ({selectedTags.length})
          </ClearAllButton>
        )}
      </FilterHeader>
      <TagsContainer role="group" aria-label="タグフィルター">
        {displayTags.map((tag) => (
          <TagChip
            key={tag}
            type="button"
            $isSelected={selectedTags.includes(tag)}
            onClick={() => handleTagClick(tag)}
            aria-pressed={selectedTags.includes(tag)}
          >
            {tag}
          </TagChip>
        ))}
        {showExpandButton && (
          <ExpandButton
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
          >
            {isExpanded ? (
              <>
                閉じる
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m18 15-6-6-6 6" />
                </svg>
              </>
            ) : (
              <>
                +{remainingCount} 件
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </>
            )}
          </ExpandButton>
        )}
      </TagsContainer>
    </FilterContainer>
  );
}
