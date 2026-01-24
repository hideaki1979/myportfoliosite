import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { GithubService } from './github.service';
import type {
  GitHubRateLimitInfo,
  GitHubRepositoryDto,
} from './github.service';
import { DEFAULT_REPOSITORY_LIMIT } from '../../constants/constants';
import { ApiKeyProtected } from '../../common/decorators/api-key-protected.decorator';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { GithubRepositoriesQueryDto } from './dto/github-repositories.query.dto';

type RepositoryPagination = {
  page: number;
  perPage: number;
  hasMore: boolean;
};

type GithubRepositoriesResult = {
  repositories: GitHubRepositoryDto[];
  pagination: RepositoryPagination;
};

type GitHubRepositoriesResponse = {
  success: true;
  repositories: GitHubRepositoryDto[];
  pagination: RepositoryPagination;
  rateLimit?: {
    limit: number;
    remaining: number;
    resetAt: string;
  };
};

@Controller('api/github')
export class GithubController {
  constructor(private readonly github: GithubService) {}

  @Get('repositories')
  async getRepositories(
    @Query() query: GithubRepositoriesQueryDto,
  ): Promise<GitHubRepositoriesResponse> {
    const safeLimit = query.limit ?? DEFAULT_REPOSITORY_LIMIT;
    const safePage = query.page ?? 1;

    const result = (await this.github.getUserPublicRepositories(
      safeLimit,
      safePage,
    )) as GithubRepositoriesResult;
    const rateLimit: GitHubRateLimitInfo | null =
      this.github.getRateLimitInfo();

    const response: GitHubRepositoriesResponse = {
      success: true,
      repositories: result.repositories,
      pagination: result.pagination,
    };

    if (rateLimit) {
      response.rateLimit = {
        limit: rateLimit.limit,
        remaining: rateLimit.remaining,
        resetAt: new Date(rateLimit.resetAt * 1000).toISOString(),
      };
    }

    return response;
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
  @ApiKeyProtected(
    'GITHUB_CONTRIBUTIONS_REFRESH_API_KEY',
    'GitHub contributions refresh API key is not configured.',
  )
  @UseGuards(ApiKeyGuard)
  async refreshContributions() {
    const contributions = await this.github.refreshContributionCalendar();
    return {
      success: true,
      contributions,
      refreshedAt: new Date().toISOString(),
    };
  }
}
