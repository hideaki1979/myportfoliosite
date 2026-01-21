import { Controller, Get, Post, Query } from '@nestjs/common';
import { AIArticlesService } from './ai-articles.service';
import type {
  AIArticlesResponse,
  AIArticlesTagsResponse,
} from './dto/ai-article.dto';

@Controller('api/ai-articles')
export class AIArticlesController {
  constructor(private readonly aiArticlesService: AIArticlesService) {}

  /**
   * AI関連記事一覧を取得
   * GET /api/ai-articles
   */
  @Get()
  getArticles(
    @Query('tag') tag?: string,
    @Query('limit') limit?: string,
  ): AIArticlesResponse {
    const data = this.aiArticlesService.getArticles();

    let articles = data.articles;

    // タグでフィルタリング
    if (tag) {
      const tagLower = tag.toLowerCase();
      articles = articles.filter((article) =>
        article.tags.some((t) => t.name.toLowerCase() === tagLower),
      );
    }

    // 件数制限
    if (limit) {
      const numLimit = parseInt(limit, 10);
      if (!isNaN(numLimit) && numLimit > 0) {
        articles = articles.slice(0, numLimit);
      }
    }

    return {
      success: true,
      articles,
      lastUpdated: data.lastUpdated,
      total: articles.length,
    };
  }

  /**
   * 利用可能なタグ一覧を取得
   * GET /api/ai-articles/tags
   */
  @Get('tags')
  getTags(): AIArticlesTagsResponse {
    const tags = this.aiArticlesService.getTags();
    return {
      success: true,
      tags,
    };
  }

  /**
   * 手動で記事を更新（管理用）
   * POST /api/ai-articles/refresh
   */
  @Post('refresh')
  async refresh(): Promise<AIArticlesResponse> {
    const data = await this.aiArticlesService.fetchAndSaveArticles();
    return {
      success: true,
      articles: data.articles,
      lastUpdated: data.lastUpdated,
      total: data.articles.length,
    };
  }
}
