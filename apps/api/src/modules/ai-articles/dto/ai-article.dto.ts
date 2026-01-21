/**
 * AI記事のDTO定義
 */

export interface AIArticleDto {
  id: string;
  title: string;
  url: string;
  likesCount: number;
  stocksCount: number;
  createdAt: string;
  tags: AIArticleTagDto[];
  author: AIArticleAuthorDto;
  fetchedAt: string;
}

export interface AIArticleTagDto {
  name: string;
  versions: string[];
}

export interface AIArticleAuthorDto {
  id: string;
  name: string;
  profileImageUrl: string;
}

/**
 * Qiita APIレスポンス型
 */
export interface QiitaArticleApiResponse {
  id: string;
  title: string;
  url: string;
  likes_count: number;
  stocks_count: number;
  created_at: string;
  tags: Array<{
    name: string;
    versions: string[];
  }>;
  user: {
    id: string;
    name: string;
    profile_image_url: string;
  };
}

/**
 * 保存データの形式
 */
export interface AIArticlesStorage {
  lastUpdated: string;
  articles: AIArticleDto[];
  tags: string[];
}

/**
 * API レスポンス型
 */
export interface AIArticlesResponse {
  success: boolean;
  articles: AIArticleDto[];
  lastUpdated: string;
  total: number;
}

export interface AIArticlesTagsResponse {
  success: boolean;
  tags: string[];
}

/**
 * 対象タグ一覧
 */
export const AI_RELATED_TAGS = [
  'AI',
  '機械学習',
  'MachineLearning',
  'ChatGPT',
  'LLM',
  '生成AI',
  'GenerativeAI',
  'OpenAI',
  'Claude',
  'GPT',
  'Gemini',
  'DeepLearning',
  'NLP',
  '自然言語処理',
  'Transformer',
  'Diffusion',
  'StableDiffusion',
] as const;
