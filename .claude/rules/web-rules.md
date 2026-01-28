# Next.js (Web) 固有ルール

## Server/Client Components

### 使い分けの基準

| 条件 | Component Type | 理由 |
|------|----------------|------|
| データフェッチが必要 | Server | サーバーで直接DB/APIアクセス |
| SEOが重要 | Server | メタデータをサーバーで生成 |
| イベントハンドラが必要 | Client | onClick等はクライアントのみ |
| useState/useEffectを使用 | Client | Reactフックはクライアントのみ |
| ブラウザAPIを使用 | Client | window, localStorage等 |

### パターン

```tsx
// Server Component（デフォルト）
// app/articles/page.tsx
import { getArticles } from '@/lib/api/server';

export default async function ArticlesPage() {
  const articles = await getArticles();
  
  return (
    <main>
      <h1>記事一覧</h1>
      <ArticleList articles={articles} />
    </main>
  );
}

// Client Component
// components/features/SearchForm.tsx
'use client';

import { useState } from 'react';

export function SearchForm({ onSearch }: SearchFormProps) {
  const [query, setQuery] = useState('');
  
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      onSearch(query);
    }}>
      <input 
        value={query} 
        onChange={(e) => setQuery(e.target.value)} 
      />
    </form>
  );
}
```

## ディレクトリ構成

### components/の役割

```
components/
├── features/       # 機能単位のコンポーネント（検索、フィルター等）
│   ├── SearchForm.tsx
│   └── SearchResults.tsx
│
├── sections/       # ページセクション単位
│   ├── HeroSection.tsx
│   └── ArticleSection.tsx
│
├── ui/             # 汎用UIコンポーネント
│   ├── Button.tsx
│   └── Card.tsx
│
├── layouts/        # レイアウトコンポーネント
│   └── MainLayout.tsx
│
├── navigation/     # ナビゲーション関連
│   └── Header.tsx
│
└── hooks/          # カスタムフック
    └── useSearch.ts
```

### 配置ルール
- `features/`: ビジネスロジックを含むコンポーネント
- `sections/`: ページの視覚的セクション
- `ui/`: ロジックを持たない純粋なUIコンポーネント

## ISR（Incremental Static Regeneration）

### 基本設定
```typescript
// app/articles/page.tsx

// 10分間キャッシュを保持
export const revalidate = 600;

export default async function ArticlesPage() {
  const articles = await getArticles();
  return <ArticleList articles={articles} />;
}
```

### 動的ルートでのISR
```typescript
// app/articles/[slug]/page.tsx

export const revalidate = 600;

export async function generateStaticParams() {
  const articles = await getAllArticleSlugs();
  return articles.map((slug) => ({ slug }));
}

export default async function ArticlePage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  return <ArticleDetail article={article} />;
}
```

### キャッシュ時間の目安
| コンテンツタイプ | revalidate | 理由 |
|-----------------|------------|------|
| 記事一覧 | 600 (10分) | 頻繁な更新は不要 |
| 記事詳細 | 3600 (1時間) | 公開後は変更少ない |
| プロフィール | 86400 (24時間) | ほぼ静的 |

## API Clientパターン

### サーバー用クライアント
```typescript
// lib/api/server.ts
import type { ApiResponse, Article } from '@repo/shared-types';

const API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;

export async function getArticles(): Promise<Article[]> {
  const res = await fetch(`${API_URL}/articles`, {
    headers: {
      'x-api-key': API_KEY!,
    },
    next: { revalidate: 600 },
  });

  if (!res.ok) {
    throw new Error(`API Error: ${res.status}`);
  }

  const data: ApiResponse<Article[]> = await res.json();
  return data.data;
}
```

### クライアント用クライアント
```typescript
// lib/api/client.ts
'use client';

import type { ApiResponse, Article } from '@repo/shared-types';

export async function searchArticles(
  query: string
): Promise<Article[]> {
  const res = await fetch(`/api/articles/search?q=${encodeURIComponent(query)}`);
  
  if (!res.ok) {
    throw new Error('Search failed');
  }
  
  const data: ApiResponse<Article[]> = await res.json();
  return data.data;
}
```

## Route Handlerパターン

### バックエンドプロキシ
```typescript
// app/api/articles/search/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.API_URL;
const API_KEY = process.env.API_KEY;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json(
      { error: '検索キーワードを入力してください' },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(
      `${API_URL}/articles/search?q=${encodeURIComponent(query)}`,
      {
        headers: {
          'x-api-key': API_KEY!,
        },
      }
    );

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: '検索中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
```

## Custom Hooksパターン

### 状態管理フック
```typescript
// components/hooks/useSearch.ts
'use client';

import { useState, useCallback } from 'react';
import type { Article } from '@repo/shared-types';
import { searchArticles } from '@/lib/api/client';

interface UseSearchResult {
  results: Article[];
  isLoading: boolean;
  error: string | null;
  search: (query: string) => Promise<void>;
  reset: () => void;
}

export function useSearch(): UseSearchResult {
  const [results, setResults] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await searchArticles(query);
      setResults(data);
    } catch (err) {
      setError('検索中にエラーが発生しました');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return { results, isLoading, error, search, reset };
}
```

## styled-componentsパターン

### CSS Variables統合
```typescript
// styles/theme.ts
export const cssVariables = `
  :root {
    --color-primary: #0070f3;
    --color-secondary: #1a1a2e;
    --color-text: #333333;
    --color-background: #ffffff;
    --font-size-sm: 0.875rem;
    --font-size-md: 1rem;
    --font-size-lg: 1.25rem;
    --spacing-sm: 0.5rem;
    --spacing-md: 1rem;
    --spacing-lg: 2rem;
  }
`;

// components/ui/Button.tsx
'use client';

import styled from 'styled-components';

export const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-md);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;

  ${({ variant = 'primary' }) =>
    variant === 'primary'
      ? `
        background: var(--color-primary);
        color: white;
        border: none;
      `
      : `
        background: transparent;
        color: var(--color-primary);
        border: 1px solid var(--color-primary);
      `}

  &:hover {
    opacity: 0.8;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
```

## テスト設定

### Vitest（ユニットテスト）
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

### Playwright（E2Eテスト）
```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```
