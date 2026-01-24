'use client';

import styled from 'styled-components';
import { useState, useMemo } from 'react';
import { AIArticlesProps } from './types';
import AIArticleCard from './AIArticleCard';
import { extractUniqueTags, filterArticles } from '../../../lib/search-utils';
import SearchBar from '../QiitaArticles/SearchBar';
import TagFilter from '../QiitaArticles/TagFilter';

const Container = styled.section`
  width: 100%;
`;

const Section = styled.div`
  margin-bottom: 32px;
`;

const SectionTitle = styled.h2`
  font-family: 'Noto Sans JP', sans-serif;
  font-weight: 700;
  font-size: 24px;
  line-height: 32px;
  margin-bottom: 16px;
  color: #fff;
`;

const LastUpdated = styled.p`
  font-family: 'Noto Sans JP', sans-serif;
  font-size: 14px;
  color: #999;
  margin-bottom: 24px;
`;

const ArticlesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`;

const EmptyState = styled.div`
  padding: 48px;
  text-align: center;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px dashed #555;
`;

const EmptyMessage = styled.p`
  font-family: 'Noto Sans JP', sans-serif;
  font-weight: 400;
  font-size: 16px;
  color: #999;
`;

const SearchFilterSection = styled.div`
  margin-bottom: 24px;
`;

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Tokyo',
};

export default function AIArticles({
  initialData = [],
  lastUpdated,
  enableSearch = true,
}: AIArticlesProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // 利用可能なタグを抽出
  const availableTags = useMemo(() => {
    return extractUniqueTags(initialData);
  }, [initialData]);

  // フィルタリング
  const filteredArticles = useMemo(() => {
    return filterArticles(initialData, searchQuery, selectedTags);
  }, [initialData, searchQuery, selectedTags]);

  // フォーマット済み最終更新日時
  const formattedLastUpdated = useMemo(() => {
    if (!lastUpdated) return null;
    return new Date(lastUpdated).toLocaleString('ja-JP', DATE_FORMAT_OPTIONS);
  }, [lastUpdated]);

  const hasActiveFilters = searchQuery.trim() !== '' || selectedTags.length > 0;

  // 元データが空の場合
  if (initialData.length === 0) {
    return (
      <EmptyState>
        <EmptyMessage>
          AI関連記事がまだ取得されていません。
          <br />
          毎日AM3:00 (JST) に自動更新されます。
        </EmptyMessage>
      </EmptyState>
    );
  }

  return (
    <Container role="region" aria-label="AI関連記事">
      <Section>
        <SectionTitle>AI関連記事</SectionTitle>
        {formattedLastUpdated && (
          <LastUpdated>最終更新: {formattedLastUpdated}</LastUpdated>
        )}

        {/* 検索UI */}
        {enableSearch && (
          <SearchFilterSection>
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              resultCount={filteredArticles.length}
              totalCount={initialData.length}
              placeholder="タイトルまたはタグで検索..."
            />
            <TagFilter
              tags={availableTags}
              selectedTags={selectedTags}
              onChange={setSelectedTags}
              maxInitialDisplay={15}
            />
          </SearchFilterSection>
        )}

        {/* フィルタリング結果が0件の場合 */}
        {hasActiveFilters && filteredArticles.length === 0 ? (
          <EmptyState>
            <EmptyMessage>
              検索条件に一致する記事が見つかりませんでした。
            </EmptyMessage>
          </EmptyState>
        ) : (
          <ArticlesContainer role="list" aria-label="AI関連記事一覧">
            {filteredArticles.map((article) => (
              <AIArticleCard key={article.id} article={article} />
            ))}
          </ArticlesContainer>
        )}
      </Section>
    </Container>
  );
}
