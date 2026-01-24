import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GithubService } from './github.service';
import { GithubController } from './github.controller';
import { GithubContributionsRefreshGuard } from './guards/github-contributions-refresh.guard';

@Module({
  imports: [ConfigModule],
  controllers: [GithubController],
  providers: [GithubService, GithubContributionsRefreshGuard],
  exports: [GithubService],
})
export class GithubModule {}
