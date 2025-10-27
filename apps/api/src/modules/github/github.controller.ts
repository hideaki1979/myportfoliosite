import { Controller, Get, Query } from '@nestjs/common';
import { GithubService } from './github.service';
import { DEFAULT_REPOSITORY_LIMIT } from '../../constants/constants';

@Controller('api/github')
export class GithubController {
  constructor(private readonly github: GithubService) {}

  @Get('repositories')
  async getRepositories(@Query('limit') limit?: string) {
    const parsed = limit ? parseInt(limit, 10) : NaN;
    const safeLimit = Number.isFinite(parsed)
      ? parsed
      : DEFAULT_REPOSITORY_LIMIT;
    const repositories = await this.github.getUserPublicRepositories(safeLimit);
    const rateLimit = this.github.getRateLimitInfo();
    return {
      success: true,
      repositories,
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
}
