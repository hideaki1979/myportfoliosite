import { Controller, Get, Query } from '@nestjs/common';
import { QiitaService } from './qiita.service';
import { DEFAULT_ARTICLE_LIMIT } from 'src/constants/constants';

@Controller('api/qiita')
export class QiitaController {
  constructor(private readonly qiita: QiitaService) {}

  @Get('articles')
  async getArticles(@Query('limit') limit?: string) {
    const parsed = limit ? parseInt(limit, 10) : NaN;
    const safeLimit = Number.isFinite(parsed) ? parsed : DEFAULT_ARTICLE_LIMIT;
    const articles = await this.qiita.getUserArticles(safeLimit);
    const rateLimit = this.qiita.getRateLimitInfo();
    return {
      success: true,
      articles,
      ...(rateLimit && {
        rateLimit: {
          limit: rateLimit.limit,
          remaining: rateLimit.remaining,
          resetAt: new Date(rateLimit.resetAt * 1000).toISOString(),
        },
      }),
    };
  }

  @Get('rate-limit')
  getRateLimit() {
    const rateLimit = this.qiita.getRateLimitInfo();

    if (!rateLimit) {
      return {
        success: true,
        rateLimit: null,
        message: 'Rate limit information not available',
      };
    }

    return {
      success: true,
      rateLimit: {
        limit: rateLimit.limit,
        remaining: rateLimit.remaining,
        resetAt: new Date(rateLimit.resetAt * 1000).toISOString(),
      },
    };
  }
}
