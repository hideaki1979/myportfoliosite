import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AIArticlesService } from './ai-articles.service';
import type {
  AIArticlesResponse,
  AIArticlesTagsResponse,
} from './dto/ai-article.dto';
import { AIArticlesRefreshGuard } from './guards/ai-articles-refresh.guard';

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
    const numLimit = limit ? parseInt(limit, 10) : undefined;
    const { articles, lastUpdated } = this.aiArticlesService.findArticles({
      tag,
      limit: numLimit && !isNaN(numLimit) ? numLimit : undefined,
    });

    return {
      success: true,
      articles,
      lastUpdated,
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
  @UseGuards(AIArticlesRefreshGuard)
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
