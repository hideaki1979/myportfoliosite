'use client';

import { useState, useMemo, useCallback } from 'react';
import type { QiitaArticle } from '../../../../lib/api/qiita';
import { filterArticles, extractUniqueTags } from '../../../../lib/search-utils';

/**
 * 記事検索・フィルタリングの状態管理Hook
 */
export interface UseArticleSearchResult {
  // 状態
  searchQuery: string;
  selectedTags: string[];
  
  // 派生データ
  filteredArticles: QiitaArticle[];
  availableTags: string[];
  
  // カウント
  totalCount: number;
  filteredCount: number;
  
  // アクション
  setSearchQuery: (query: string) => void;
  setSelectedTags: (tags: string[]) => void;
  toggleTag: (tag: string) => void;
  clearFilters: () => void;
  
  // フィルター状態
  hasActiveFilters: boolean;
}

export default function useArticleSearch(
  articles: QiitaArticle[],
): UseArticleSearchResult {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // 利用可能なタグを抽出（全記事から）
  const availableTags = useMemo(() => {
    return extractUniqueTags(articles);
  }, [articles]);

  // フィルタリングされた記事
  const filteredArticles = useMemo(() => {
    return filterArticles(articles, searchQuery, selectedTags);
  }, [articles, searchQuery, selectedTags]);

  // タグの切り替え
  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((t) => t !== tag);
      }
      return [...prev, tag];
    });
  }, []);

  // フィルターのクリア
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedTags([]);
  }, []);

  // フィルターがアクティブかどうか
  const hasActiveFilters = searchQuery.trim() !== '' || selectedTags.length > 0;

  return {
    // 状態
    searchQuery,
    selectedTags,
    
    // 派生データ
    filteredArticles,
    availableTags,
    
    // カウント
    totalCount: articles.length,
    filteredCount: filteredArticles.length,
    
    // アクション
    setSearchQuery,
    setSelectedTags,
    toggleTag,
    clearFilters,
    
    // フィルター状態
    hasActiveFilters,
  };
}
