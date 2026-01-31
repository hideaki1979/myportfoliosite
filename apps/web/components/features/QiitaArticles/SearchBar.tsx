'use client';

import styled from 'styled-components';
import { useEffect, useMemo, useRef, useState } from 'react';
import { debounce } from '../../../lib/search-utils';

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

const SearchInputWrapper = styled.div`
  position: relative;
  flex: 1;
  max-width: 400px;
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #868686;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;

  svg {
    width: 18px;
    height: 18px;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 12px 12px 42px;
  font-family: 'Noto Sans JP', sans-serif;
  font-size: 14px;
  line-height: 1.5;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #fff;
  color: #000;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus {
    outline: none;
    border-color: #55c500;
    box-shadow: 0 0 0 2px rgba(85, 197, 0, 0.2);
  }

  &::placeholder {
    color: #999;
  }
`;

const ClearButton = styled.button`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #868686;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s, color 0.2s;

  &:hover {
    background-color: #eee;
    color: #333;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(85, 197, 0, 0.3);
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const ResultCount = styled.span`
  font-family: 'Noto Sans JP', sans-serif;
  font-size: 14px;
  color: #868686;
  white-space: nowrap;
`;

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  resultCount?: number;
  totalCount?: number;
  debounceMs?: number;
  placeholder?: string;
}

export default function SearchBar({
  value,
  onChange,
  resultCount,
  totalCount,
  debounceMs = 300,
  placeholder = '記事を検索...',
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // 外部からの値変更を反映
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // デバウンスされた onChange を作成
  const debouncedOnChange = useMemo(
    () =>
      debounce((newValue: string) => {
        onChange(newValue);
      }, debounceMs),
    [onChange, debounceMs]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    debouncedOnChange(newValue);
  };

  const handleClear = () => {
    setLocalValue('');
    onChange('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Escape') {
      return;
    }

    if (!localValue) {
      return;
    }

    handleClear();
  };

  const showCount =
    resultCount !== undefined && totalCount !== undefined && value.trim() !== '';

  return (
    <SearchContainer>
      <SearchInputWrapper>
        <SearchIcon aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </SearchIcon>
        <SearchInput
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="記事を検索"
        />
        {localValue && (
          <ClearButton
            type="button"
            onClick={handleClear}
            aria-label="検索をクリア"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </ClearButton>
        )}
      </SearchInputWrapper>
      {showCount && (
        <ResultCount aria-live="polite">
          {resultCount} / {totalCount} 件
        </ResultCount>
      )}
    </SearchContainer>
  );
}
