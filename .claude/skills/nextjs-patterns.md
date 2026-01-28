# Next.js開発パターン スキル

## スキル概要

Next.js 15（App Router）+ React 19 + styled-components環境での開発パターンを提供するサブエージェントスキル。

## コンポーネント作成チェックリスト

新規コンポーネント作成時に確認すべき項目:

### 1. Server/Client判定
- [ ] データフェッチが必要か → Server Component
- [ ] イベントハンドラ（onClick等）があるか → Client Component
- [ ] useState/useEffect等のフックを使うか → Client Component
- [ ] window/localStorage等ブラウザAPIを使うか → Client Component

### 2. 配置場所の決定
| コンポーネントの特性 | 配置先 |
|---------------------|--------|
| ビジネスロジックを含む | `components/features/` |
| ページの視覚的セクション | `components/sections/` |
| 汎用UI（Button, Card等） | `components/ui/` |
| レイアウト関連 | `components/layouts/` |
| ナビゲーション関連 | `components/navigation/` |

### 3. ファイル構成
```
ComponentName/
├── ComponentName.tsx      # メインコンポーネント
├── ComponentName.test.tsx # テスト（必須）
├── ComponentName.styles.ts # スタイル（styled-components使用時）
└── index.ts               # re-export（必要に応じて）
```

### 4. コンポーネントテンプレート

#### Server Component
```tsx
// components/sections/ArticleSection.tsx
import type { Article } from '@repo/shared-types';
import { getArticles } from '@/lib/api/server';
import { ArticleCard } from '@/components/ui/ArticleCard';

export async function ArticleSection() {
  const articles = await getArticles();
  
  return (
    <section>
      <h2>最新の記事</h2>
      <div>
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
}
```

#### Client Component
```tsx
// components/features/SearchForm.tsx
'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface SearchFormProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function SearchForm({ 
  onSearch, 
  placeholder = '検索キーワードを入力' 
}: SearchFormProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  }, [query, onSearch]);

  return (
    <form onSubmit={handleSubmit}>
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
      />
      <Button type="submit">検索</Button>
    </form>
  );
}
```

## API統合パターン

### サーバーサイドデータフェッチ
```typescript
// lib/api/server.ts
import type { ApiResponse, Article } from '@repo/shared-types';

const API_URL = process.env.API_URL!;
const API_KEY = process.env.API_KEY!;

interface FetchOptions {
  revalidate?: number;
  tags?: string[];
}

async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { revalidate = 600, tags } = options;

  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'x-api-key': API_KEY,
      'Content-Type': 'application/json',
    },
    next: { revalidate, tags },
  });

  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`);
  }

  const data: ApiResponse<T> = await res.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Unknown API error');
  }

  return data.data;
}

export async function getArticles(): Promise<Article[]> {
  return apiFetch<Article[]>('/articles', {
    revalidate: 600,
    tags: ['articles'],
  });
}

export async function getArticleBySlug(slug: string): Promise<Article> {
  return apiFetch<Article>(`/articles/${slug}`, {
    revalidate: 3600,
    tags: ['article', `article-${slug}`],
  });
}
```

### クライアントサイドデータフェッチ
```typescript
// lib/api/client.ts
'use client';

import type { ApiResponse } from '@repo/shared-types';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function clientFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`/api${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data: ApiResponse<T> = await res.json();

  if (!res.ok || !data.success) {
    throw new ApiError(
      data.error || '予期しないエラーが発生しました',
      res.status
    );
  }

  return data.data;
}

export const api = {
  articles: {
    search: (q: string, limit = 10, offset = 0) =>
      clientFetch<Article[]>(
        `/articles/search?q=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}`
      ),
  },
};
```

## カスタムフックパターン

### データフェッチフック
```typescript
// components/hooks/useArticles.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Article } from '@repo/shared-types';
import { api } from '@/lib/api/client';

interface UseArticlesOptions {
  initialQuery?: string;
  limit?: number;
}

interface UseArticlesReturn {
  articles: Article[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  search: (query: string) => Promise<void>;
  loadMore: () => Promise<void>;
  reset: () => void;
}

export function useArticles(options: UseArticlesOptions = {}): UseArticlesReturn {
  const { initialQuery = '', limit = 10 } = options;

  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState(initialQuery);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const search = useCallback(async (newQuery: string) => {
    setIsLoading(true);
    setError(null);
    setQuery(newQuery);
    setOffset(0);

    try {
      const data = await api.articles.search(newQuery, limit, 0);
      setArticles(data);
      setHasMore(data.length === limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : '検索に失敗しました');
      setArticles([]);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    const newOffset = offset + limit;

    try {
      const data = await api.articles.search(query, limit, newOffset);
      setArticles((prev) => [...prev, ...data]);
      setOffset(newOffset);
      setHasMore(data.length === limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : '読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [query, limit, offset, isLoading, hasMore]);

  const reset = useCallback(() => {
    setArticles([]);
    setQuery('');
    setOffset(0);
    setError(null);
    setHasMore(true);
  }, []);

  return {
    articles,
    isLoading,
    error,
    hasMore,
    search,
    loadMore,
    reset,
  };
}
```

### ローカルストレージフック
```typescript
// components/hooks/useLocalStorage.ts
'use client';

import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
    }
  }, [key]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}
```

## スタイリングパターン

### styled-components + CSS Variables
```typescript
// styles/styled.d.ts
import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    colors: {
      primary: string;
      secondary: string;
      text: string;
      background: string;
    };
    spacing: {
      sm: string;
      md: string;
      lg: string;
    };
    breakpoints: {
      mobile: string;
      tablet: string;
      desktop: string;
    };
  }
}

// styles/theme.ts
export const theme = {
  colors: {
    primary: 'var(--color-primary)',
    secondary: 'var(--color-secondary)',
    text: 'var(--color-text)',
    background: 'var(--color-background)',
  },
  spacing: {
    sm: 'var(--spacing-sm)',
    md: 'var(--spacing-md)',
    lg: 'var(--spacing-lg)',
  },
  breakpoints: {
    mobile: '480px',
    tablet: '768px',
    desktop: '1024px',
  },
};

// 使用例: components/ui/Card.tsx
'use client';

import styled from 'styled-components';

export const Card = styled.div`
  background: ${({ theme }) => theme.colors.background};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    padding: ${({ theme }) => theme.spacing.sm};
  }
`;
```

## 推奨ライブラリ

### 状態管理
- **Zustand**: 軽量で直感的な状態管理
- **React Query (TanStack Query)**: サーバー状態管理

### フォーム
- **React Hook Form**: 高パフォーマンスなフォーム管理
- **Zod**: スキーマバリデーション

### UI
- **Radix UI**: アクセシブルなプリミティブコンポーネント
- **Framer Motion**: アニメーション

### ユーティリティ
- **date-fns**: 日付操作
- **clsx**: 条件付きクラス名
