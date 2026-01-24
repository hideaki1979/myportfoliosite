import { AIArticle, AIArticleTag, AIArticleAuthor } from '../../../lib/api/ai-articles';

/**
 * AIArticles コンポーネントの型定義
 */
export type { AIArticle, AIArticleTag, AIArticleAuthor };

export interface AIArticlesProps {
  initialData?: AIArticle[];
  lastUpdated?: string;
  enableSearch?: boolean;
}

export interface AIArticleCardProps {
  article: AIArticle;
}
