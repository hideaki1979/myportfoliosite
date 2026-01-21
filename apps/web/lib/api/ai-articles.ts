import { apiBaseUrl } from '../constants';
import { REVALIDATE_INTERVAL_SHORT } from '../constants';

/**
 * AI記事のDTO型定義
 */
export interface AIArticle {
  id: string;
  title: string;
  url: string;
  likesCount: number;
  stocksCount: number;
  createdAt: string;
  tags: AIArticleTag[];
  author: AIArticleAuthor;
  fetchedAt: string;
}

export interface AIArticleTag {
  name: string;
  versions: string[];
}

export interface AIArticleAuthor {
  id: string;
  name: string;
  profileImageUrl: string;
}

interface AIArticlesApiResponse {
  success: boolean;
  articles: AIArticle[];
  lastUpdated: string;
  total: number;
}

interface AIArticlesTagsResponse {
  success: boolean;
  tags: string[];
}

/**
 * AI関連記事を取得（サーバーサイド用）
 * 直接バックエンドAPIにアクセスし、ISRでキャッシュ
 */
export async function fetchAIArticles(
  options?: {
    tag?: string;
    limit?: number;
  }
): Promise<{ articles: AIArticle[]; lastUpdated: string }> {
  try {
    const url = new URL(`${apiBaseUrl}/api/ai-articles`);
    
    if (options?.tag) {
      url.searchParams.set('tag', options.tag);
    }
    if (options?.limit) {
      url.searchParams.set('limit', String(options.limit));
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // ISR: 10分ごとに再検証
      next: { revalidate: REVALIDATE_INTERVAL_SHORT },
    });

    if (!response.ok) {
      console.error(`AI Articles API error: ${response.status} ${response.statusText}`);
      return { articles: [], lastUpdated: '' };
    }

    const data: AIArticlesApiResponse = await response.json();

    if (!data.success) {
      console.error('AI Articles API returned unsuccessful response');
      return { articles: [], lastUpdated: '' };
    }

    return {
      articles: data.articles,
      lastUpdated: data.lastUpdated,
    };
  } catch (error) {
    console.error('Failed to fetch AI articles:', error);
    return { articles: [], lastUpdated: '' };
  }
}

/**
 * AI記事のタグ一覧を取得（サーバーサイド用）
 */
export async function fetchAIArticleTags(): Promise<string[]> {
  try {
    const url = `${apiBaseUrl}/api/ai-articles/tags`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: REVALIDATE_INTERVAL_SHORT },
    });

    if (!response.ok) {
      console.error(`AI Articles Tags API error: ${response.status}`);
      return [];
    }

    const data: AIArticlesTagsResponse = await response.json();

    if (!data.success) {
      return [];
    }

    return data.tags;
  } catch (error) {
    console.error('Failed to fetch AI article tags:', error);
    return [];
  }
}
