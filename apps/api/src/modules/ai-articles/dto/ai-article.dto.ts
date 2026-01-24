/**
 * AI記事のDTO定義
 */

import { z } from 'zod';

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
 * 記事検索オプション
 */
export interface FindArticlesOptions {
  tag?: string;
  limit?: number;
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

export const AIArticleTagSchema = z.object({
  name: z.string(),
  versions: z.array(z.string()),
});

export const AIArticleAuthorSchema = z.object({
  id: z.string(),
  name: z.string(),
  profileImageUrl: z.string(),
});

export const AIArticleSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  likesCount: z.number(),
  stocksCount: z.number(),
  createdAt: z.string(),
  tags: z.array(AIArticleTagSchema),
  author: AIArticleAuthorSchema,
  fetchedAt: z.string(),
});

export const AIArticlesStorageSchema = z.object({
  lastUpdated: z.string(),
  articles: z.array(AIArticleSchema),
  tags: z.array(z.string()),
});

export type AIArticlesStorageInput = z.input<typeof AIArticlesStorageSchema>;

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
