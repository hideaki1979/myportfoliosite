import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { GithubService } from './github.service';
import type { GitHubRateLimitInfo } from './github.service';
import { DEFAULT_REPOSITORY_LIMIT } from '../../constants/constants';
import { GithubContributionsRefreshGuard } from './guards/github-contributions-refresh.guard';

@Controller('api/github')
export class GithubController {
  constructor(private readonly github: GithubService) {}

  @Get('repositories')
  async getRepositories(
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : NaN;
    const safeLimit =
      Number.isFinite(parsedLimit) && parsedLimit > 0
        ? parsedLimit
        : DEFAULT_REPOSITORY_LIMIT;

    const parsedPage = page ? parseInt(page, 10) : 1;
    const safePage =
      Number.isFinite(parsedPage) && parsedPage >= 1 ? parsedPage : 1;

    const result = await this.github.getUserPublicRepositories(
      safeLimit,
      safePage,
    );
    const rateLimit: GitHubRateLimitInfo | null =
      this.github.getRateLimitInfo();

    return {
      success: true,
      repositories: result.repositories,
      pagination: result.pagination,
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
    const rateLimit = this.github.getRateLimitInfo();

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

  @Get('contributions')
  async getContributions() {
    const contributions = await this.github.getContributionCalendar();
    return {
      success: true,
      contributions,
    };
  }

  /**
   * コントリビューションキャッシュをクリアして最新データを取得
   * POST /api/github/contributions/refresh
   */
  @Post('contributions/refresh')
  @UseGuards(GithubContributionsRefreshGuard)
  async refreshContributions() {
    const contributions = await this.github.refreshContributionCalendar();
    return {
      success: true,
      contributions,
      refreshedAt: new Date().toISOString(),
    };
  }
}
