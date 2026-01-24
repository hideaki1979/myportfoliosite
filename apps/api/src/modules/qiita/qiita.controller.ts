import { Controller, Get, Query } from '@nestjs/common';
import { QiitaService } from './qiita.service';
import { DEFAULT_ARTICLE_LIMIT } from '../../constants/constants';
import { QiitaArticlesQueryDto } from './dto/qiita-articles.query.dto';

@Controller('api/qiita')
export class QiitaController {
  constructor(private readonly qiita: QiitaService) {}

  @Get('articles')
  async getArticles(@Query() query: QiitaArticlesQueryDto) {
    const safeLimit = query.limit ?? DEFAULT_ARTICLE_LIMIT;
    const articles = await this.qiita.getUserArticles(safeLimit);
    const rateLimit = this.qiita.getRateLimitInfo();
    return {
      success: true,
      articles,
      ...(rateLimit && {
        rateLimit: this.formatRateLimit(rateLimit),
      }),
    };
  }

  @Get('profile')
  async getProfile() {
    const profile = await this.qiita.getUserInfo();

    if (!profile) {
      return {
        success: false,
        profile: null,
        message: 'User profile not available',
      };
    }

    return {
      success: true,
      profile,
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
      rateLimit: this.formatRateLimit(rateLimit),
    };
  }

  /**
   * レート制限情報をフォーマットする
   * @param rateLimit - Qiitaサービスから取得したレート制限情報
   * @returns フォーマット済みのレート制限情報
   */
  private formatRateLimit(rateLimit: {
    limit: number;
    remaining: number;
    resetAt: number;
  }) {
    return {
      limit: rateLimit.limit,
      remaining: rateLimit.remaining,
      resetAt: new Date(rateLimit.resetAt * 1000).toISOString(),
    };
  }
}
