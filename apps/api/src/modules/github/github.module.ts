import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GithubService } from './github.service';
import { GithubController } from './github.controller';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';

@Module({
  imports: [ConfigModule],
  controllers: [GithubController],
  providers: [GithubService, ApiKeyGuard],
  exports: [GithubService],
})
export class GithubModule {}
