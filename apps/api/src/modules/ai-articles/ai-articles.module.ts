import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AIArticlesController } from './ai-articles.controller';
import { AIArticlesService } from './ai-articles.service';
import { AIArticlesScheduler } from './ai-articles.scheduler';
import { FileStorageService } from './storage/file-storage.service';
import { CacheModule } from '../cache/cache.module';
import { AIArticlesRefreshGuard } from './guards/ai-articles-refresh.guard';

@Module({
  imports: [ConfigModule, CacheModule],
  controllers: [AIArticlesController],
  providers: [
    AIArticlesService,
    AIArticlesScheduler,
    FileStorageService,
    AIArticlesRefreshGuard,
  ],
  exports: [AIArticlesService],
})
export class AIArticlesModule {}
