import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Logger } from 'nestjs-pino';
import { AIArticlesService } from './ai-articles.service';
import z from 'zod';
import { AIArticleAuthorSchema } from './dto/ai-article.dto';

export const AIArticleTagSchema = z.object({
  name: z.string(),
  versions: z.array(z.string()),
});

export const AIArticleAuthorDto = z.object({
  id: z.string(),
  name: z.string(),
  profileImageUrl: z.string(),
});

export const AIArticleSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  likesCount: z.number(),
  stocksCount: z.number(),
  createdAt: z.string(),
  tags: z.array(AIArticleTagSchema),
  author: AIArticleAuthorSchema,
  fetchedAt: z.string(),
});

export const AIArticlesStorageSchema = z.object({
  lastUpdated: z.string(),
  articles: z.array(AIArticleSchema),
  tags: z.array(z.string()),
});

/**
 * AI記事バッチ取得スケジューラー
 *
 * 毎日AM3:00 (JST) = 18:00 (UTC) にAI関連記事を取得
 */
@Injectable()
export class AIArticlesScheduler implements OnModuleInit {
  constructor(
    private readonly logger: Logger,
    private readonly aiArticlesService: AIArticlesService,
  ) {}

  /**
   * 毎日18:00 UTC (= 03:00 JST) に実行
   */
  @Cron('0 18 * * *', {
    name: 'ai-articles-fetch',
    timeZone: 'UTC',
  })
  async handleCron(): Promise<void> {
    this.logger.log('Starting scheduled AI articles fetch job...');

    try {
      const result = await this.aiArticlesService.fetchAndSaveArticles();
      this.logger.log(
        `Scheduled AI articles fetch completed: ${result.articles.length} articles`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Scheduled AI articles fetch failed: ${errorMessage}`,
        errorStack,
      );
    }
  }

  /**
   * アプリケーション起動時に初回データ取得（データがない場合のみ）
   */
  onModuleInit(): void {
    const INITIAL_FETCH_DELAY_MS = 5000;
    // 少し遅延させてから初回チェック。他のモジュールの初期化を待つため。
    setTimeout(() => {
      void this.checkAndFetchIfNeeded();
    }, INITIAL_FETCH_DELAY_MS);
  }

  /**
   * データがない場合は初回取得を実行
   */
  private async checkAndFetchIfNeeded(): Promise<void> {
    try {
      const data = this.aiArticlesService.getArticles();

      if (data.articles.length === 0) {
        this.logger.log('No AI articles data found. Starting initial fetch...');
        await this.aiArticlesService.fetchAndSaveArticles();
      } else {
        this.logger.log(
          `AI articles data already exists: ${data.articles.length} articles`,
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Initial AI articles check failed: ${errorMessage}`);
    }
  }
}
