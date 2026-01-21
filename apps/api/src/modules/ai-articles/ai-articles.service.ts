import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { FileStorageService } from './storage/file-storage.service';
import {
  AIArticleDto,
  AIArticlesStorage,
  AI_RELATED_TAGS,
  QiitaArticleApiResponse,
} from './dto/ai-article.dto';
import { CacheService } from '../cache/cache.service';

const QIITA_API_BASE_URL = 'https://qiita.com/api/v2';
const API_TIMEOUT = 10_000;
const MAX_RETRIES = 3;
const ARTICLES_PER_TAG = 20;
const MAX_TOTAL_ARTICLES = 100;

// キャッシュ設定
const CACHE_KEY = 'ai-articles';
const CACHE_TTL = 3600; // 1時間

@Injectable()
export class AIArticlesService {
  private readonly qiitaToken: string;

  constructor(
    private readonly config: ConfigService,
    private readonly logger: Logger,
    private readonly fileStorage: FileStorageService,
    private readonly cacheService: CacheService,
  ) {
    this.qiitaToken = this.config.get<string>('QIITA_TOKEN', '');
  }

  /**
   * AI関連記事を取得する（キャッシュ→ファイル→APIの順）
   */
  getArticles(): AIArticlesStorage {
    // 1. メモリキャッシュから取得
    const cached = this.cacheService.get<AIArticlesStorage>(CACHE_KEY);
    if (cached) {
      this.logger.debug('AI articles served from memory cache');
      return cached;
    }

    // 2. ファイルストレージから取得
    const stored = this.fileStorage.read();
    if (stored) {
      // メモリキャッシュに保存
      this.cacheService.set(CACHE_KEY, stored, CACHE_TTL);
      this.logger.debug('AI articles served from file storage');
      return stored;
    }

    // 3. データがない場合は空のレスポンスを返す
    this.logger.warn('No AI articles data available');
    return {
      lastUpdated: '',
      articles: [],
      tags: [],
    };
  }

  /**
   * 利用可能なタグ一覧を取得
   */
  getTags(): string[] {
    const data = this.getArticles();
    return data.tags;
  }

  /**
   * AI関連記事をQiita APIから取得してストレージに保存
   */
  async fetchAndSaveArticles(): Promise<AIArticlesStorage> {
    this.logger.log('Starting AI articles batch fetch...');

    const allArticles: AIArticleDto[] = [];
    const seenIds = new Set<string>();
    const foundTags = new Set<string>();

    // 各タグごとに記事を取得
    for (const tag of AI_RELATED_TAGS) {
      try {
        this.logger.debug(`Fetching articles for tag: ${tag}`);
        const articles = await this.fetchArticlesByTag(tag);

        for (const article of articles) {
          // 重複チェック
          if (seenIds.has(article.id)) {
            continue;
          }

          seenIds.add(article.id);
          allArticles.push(article);

          // タグを収集
          for (const t of article.tags) {
            foundTags.add(t.name);
          }
        }

        // API負荷軽減のため少し待機
        await this.sleep(200);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn(
          `Failed to fetch articles for tag ${tag}: ${errorMessage}`,
        );
        // 1つのタグで失敗しても継続
      }
    }

    // 記事をいいね数でソート
    allArticles.sort((a, b) => b.likesCount - a.likesCount);

    // 上位N件に制限
    const limitedArticles = allArticles.slice(0, MAX_TOTAL_ARTICLES);

    const storage: AIArticlesStorage = {
      lastUpdated: new Date().toISOString(),
      articles: limitedArticles,
      tags: Array.from(foundTags).sort(),
    };

    // ファイルに保存
    const saved = this.fileStorage.write(storage);
    if (!saved) {
      this.logger.error('Failed to save AI articles to file');
    }

    // メモリキャッシュを更新
    this.cacheService.set(CACHE_KEY, storage, CACHE_TTL);

    this.logger.log(
      `AI articles batch fetch completed: ${limitedArticles.length} articles saved`,
    );

    return storage;
  }

  /**
   * 特定タグの記事を取得
   */
  private async fetchArticlesByTag(tag: string): Promise<AIArticleDto[]> {
    const encodedTag = encodeURIComponent(tag);
    const path = `/tags/${encodedTag}/items?page=1&per_page=${ARTICLES_PER_TAG}`;

    const response = await this.request<QiitaArticleApiResponse[]>(path);

    return response.map((article) => this.mapArticle(article));
  }

  /**
   * Qiita APIリクエスト
   */
  private async request<T>(path: string): Promise<T> {
    const url = `${QIITA_API_BASE_URL}${path}`;
    let lastError: unknown;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(this.qiitaToken
              ? { Authorization: `Bearer ${this.qiitaToken}` }
              : {}),
          },
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (res.ok) {
          return (await res.json()) as T;
        }

        // レート制限エラー
        if (res.status === 429 || res.status === 403) {
          const resetHeader = res.headers.get('rate-reset');
          this.logger.warn(
            `Qiita API rate limit hit. Reset: ${resetHeader ?? 'unknown'}`,
          );

          if (attempt < MAX_RETRIES) {
            const waitMs = this.getBackoffMs(attempt);
            this.logger.warn(
              `Retrying in ${waitMs}ms (attempt ${attempt + 1})`,
            );
            await this.sleep(waitMs);
            continue;
          }
        }

        // その他のエラー
        if ([502, 503, 504].includes(res.status) && attempt < MAX_RETRIES) {
          const waitMs = this.getBackoffMs(attempt);
          this.logger.warn(
            `Qiita API temporary error ${res.status}. Retrying in ${waitMs}ms`,
          );
          await this.sleep(waitMs);
          continue;
        }

        throw new ServiceUnavailableException(
          `Qiita API error: ${res.status} ${res.statusText}`,
        );
      } catch (err) {
        clearTimeout(timeout);
        lastError = err;

        if (err instanceof ServiceUnavailableException) {
          throw err;
        }

        // ネットワークエラー時はリトライ
        if (attempt < MAX_RETRIES) {
          const waitMs = this.getBackoffMs(attempt);
          this.logger.warn(`Request failed. Retrying in ${waitMs}ms`);
          await this.sleep(waitMs);
          continue;
        }
      }
    }

    this.logger.error(
      `Request failed after ${MAX_RETRIES + 1} attempts`,
      lastError as Error,
    );
    throw new ServiceUnavailableException('Qiita API is currently unavailable');
  }

  /**
   * APIレスポンスをDTOにマッピング
   */
  private mapArticle(article: QiitaArticleApiResponse): AIArticleDto {
    return {
      id: article.id,
      title: article.title,
      url: article.url,
      likesCount: article.likes_count,
      stocksCount: article.stocks_count,
      createdAt: article.created_at,
      tags: article.tags.map((tag) => ({
        name: tag.name,
        versions: tag.versions,
      })),
      author: {
        id: article.user.id,
        name: article.user.name,
        profileImageUrl: article.user.profile_image_url,
      },
      fetchedAt: new Date().toISOString(),
    };
  }

  /**
   * 指数バックオフ計算
   */
  private getBackoffMs(attempt: number): number {
    const base = 1000 * Math.pow(2, attempt);
    const jitter = Math.floor(Math.random() * 500);
    return base + jitter;
  }

  /**
   * スリープ
   */
  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}
