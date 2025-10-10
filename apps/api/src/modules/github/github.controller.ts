import { Controller, Get, Query } from '@nestjs/common';
import { GithubService } from './github.service';
import { DEFAULT_REPOSITORY_LIMIT } from 'src/constants/constants';

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
    return { success: true, repositories };
  }
}
