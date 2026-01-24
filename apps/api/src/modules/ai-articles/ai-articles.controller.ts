import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AIArticlesService } from './ai-articles.service';
import type {
  AIArticlesResponse,
  AIArticlesTagsResponse,
} from './dto/ai-article.dto';
import { AIArticlesQueryDto } from './dto/ai-articles.query.dto';
import { ApiKeyProtected } from '../../common/decorators/api-key-protected.decorator';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';

@Controller('api/ai-articles')
export class AIArticlesController {
  constructor(private readonly aiArticlesService: AIArticlesService) {}

  /**
   * AI関連記事一覧を取得
   * GET /api/ai-articles
   */
  @Get()
  getArticles(@Query() query: AIArticlesQueryDto): AIArticlesResponse {
    const { articles, lastUpdated } = this.aiArticlesService.findArticles({
      tag: query.tag,
      limit: query.limit,
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
  @ApiKeyProtected(
    'AI_ARTICLES_REFRESH_API_KEY',
    'AI articles refresh API key is not configured.',
  )
  @UseGuards(ApiKeyGuard)
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
