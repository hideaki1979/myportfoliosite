import { Controller, Get, Query } from '@nestjs/common';
import { GithubService } from './github.service';

@Controller('api/github')
export class GithubController {
  constructor(private readonly github: GithubService) {}

  @Get('repositories')
  async getRepositories(@Query('limit') limit?: string) {
    const parsed = Number(limit);
    const safeLimit = Number.isFinite(parsed) ? parsed : 20;
    const repositories = await this.github.getUserPublicRepositories(safeLimit);
    return { success: true, repositories };
  }
}
