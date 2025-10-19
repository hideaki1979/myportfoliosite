import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { CacheService } from '../cache/cache.service';
import {
  API_TIMEOUT,
  DEFAULT_ARTICLE_LIMIT,
  DEFAULT_CACHE_TIME,
  DEFAULT_STALE_CACHE_TIME,
  RETRY_TIME,
} from '../../constants/constants';

interface QiitaArticleApiResponse {
  id: string;
  title: string;
  url: string;
  likes_count: number;
  stocks_count: number;
  created_at: string;
  tags: Array<{
    name: string;
    versions: string[];
  }>;
}

export interface QiitaArticleDto {
  id: string;
  title: string;
  url: string;
  likesCount: number;
  stocksCount: number;
  createdAt: string;
  tags: QiitaTagDto[];
}

export interface QiitaTagDto {
  name: string;
  versions: string[];
}

export interface QiitaRateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: number; // Unix timestamp (秒単位)
}

export interface QiitaUserDto {
  id: string;
  name: string;
  profileImageUrl: string;
  description: string;
  followersCount: number;
  followeesCount: number;
  itemsCount: number;
  websiteUrl?: string;
  organization?: string;
}

interface QiitaUserApiResponse {
  id: string;
  name: string;
  profile_image_url: string;
  description: string;
  followers_count: number;
  followees_count: number;
  items_count: number;
  website_url?: string;
  organization?: string;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface FetchResponse<T> {
  data: T;
  rateLimit?: QiitaRateLimitInfo;
}

// キャッシュ戦略の定数
const CACHE_TTL = 900; // 15分
const STALE_CACHE_TTL = 3600; // 1時間（エラー時のフォールバック用）
const CACHE_KEY_PREFIX = 'qiita:articles';

@Injectable()
export class QiitaService {
  private readonly qiitaApiBaseUrl = 'https://qiita.com/api/v2';
  private readonly qiitaToken: string;
  private readonly qiitaUserId: string;

  constructor(
    private readonly config: ConfigService,
    private readonly logger: Logger,
    private readonly cacheService: CacheService,
  ) {
    this.qiitaToken = this.config.get<string>('QIITA_TOKEN', '');
    this.qiitaUserId = this.config.get<string>('QIITA_USER_ID', '');
  }

  async getUserArticles(limit = 10): Promise<QiitaArticleDto[]> {
    if (!this.qiitaUserId) {
      this.logger.warn(
        'QIITA_USER_ID is not configured, returning empty list.',
      );
      return [];
    }

    const numericLimit = Number(limit);
    const perPageBase = Number.isFinite(numericLimit)
      ? Math.floor(numericLimit)
      : DEFAULT_ARTICLE_LIMIT;
    const perPage = Math.min(Math.max(perPageBase, 1), 100);

    const cacheKey = `${CACHE_KEY_PREFIX}:${perPage}`;
    const staleCacheKey = `${cacheKey}:stale`;

    // キャッシュから取得を試行
    const cached = this.cacheService.get<QiitaArticleDto[]>(cacheKey);

    if (cached) {
      this.logger.log(
        `Qiita articles served from cache (${cached.length} items)`,
      );
      return cached;
    }

    try {
      const path = `/users/${encodeURIComponent(this.qiitaUserId)}/items?page=1&per_page=${perPage}`;

      const response = await this.request<QiitaArticleApiResponse[]>(
        path,
        'GET',
        undefined,
        {
          timeoutMs: 8_000,
          retries: 2,
        },
      );

      const articles = response.data.map((a) => this.mapArticle(a));

      // 通常のキャッシュに保存（15分）
      this.cacheService.set(cacheKey, articles, CACHE_TTL);

      // staleキャッシュに保存（1時間、エラー時のフォールバック用）
      this.cacheService.set(staleCacheKey, articles, STALE_CACHE_TTL);

      // レート制限情報をキャッシュ
      if (response.rateLimit) {
        const ttlSeconds = Math.max(
          0,
          response.rateLimit.resetAt - Math.floor(Date.now() / 1000),
        );
        this.cacheService.set(
          'qiita:rate-limit',
          response.rateLimit,
          ttlSeconds,
        );
      }

      this.logger.log(`Fetched ${articles.length} articles from Qiita API`);

      return articles;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to fetch Qiita articles: ${errorMessage}`,
        errorStack,
      );

      // エラー時はstaleキャッシュから返却を試行
      const staleCache =
        this.cacheService.get<QiitaArticleDto[]>(staleCacheKey);

      if (staleCache) {
        this.logger.warn(
          `Qiita API error, serving stale cache (${staleCache.length} items)`,
        );
        return staleCache;
      }

      // staleキャッシュも無ければ例外をスロー
      throw new ServiceUnavailableException(
        'Qiita API is currently unavailable',
      );
    }
  }

  /**
   * Qiitaユーザー情報を取得
   */
  async getUserInfo(): Promise<QiitaUserDto | null> {
    if (!this.qiitaUserId) {
      this.logger.warn(
        'QIITA_USER_ID is not configured, cannot fetch user info.',
      );
      return null;
    }

    const cacheKey = 'qiita:user-info';
    const staleCacheKey = `${cacheKey}:stale`;

    // キャッシュから取得を試行
    const cached = this.cacheService.get<QiitaUserDto>(cacheKey);

    if (cached) {
      this.logger.log('Qiita user info served from cache');
      return cached;
    }

    try {
      const path = `/users/${encodeURIComponent(this.qiitaUserId)}`;

      const response = await this.request<QiitaUserApiResponse>(
        path,
        'GET',
        undefined,
        {
          timeoutMs: API_TIMEOUT,
          retries: RETRY_TIME,
        },
      );

      const userInfo = this.mapUser(response.data);

      // 通常のキャッシュに保存（1時間）
      this.cacheService.set(cacheKey, userInfo, DEFAULT_CACHE_TIME);

      // staleキャッシュに保存（24時間、エラー時のフォールバック用）
      this.cacheService.set(staleCacheKey, userInfo, DEFAULT_STALE_CACHE_TIME);

      this.logger.log(
        `Fetched user info for ${this.qiitaUserId} from Qiita API`,
      );

      return userInfo;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to fetch Qiita user info: ${errorMessage}`,
        errorStack,
      );

      // エラー時はstaleキャッシュから返却を試行
      const staleCache = this.cacheService.get<QiitaUserDto>(staleCacheKey);

      if (staleCache) {
        this.logger.warn('Qiita API error, serving stale user info cache');
        return staleCache;
      }

      // staleキャッシュも無ければnullを返す（プロフィール情報は必須ではないため）
      return null;
    }
  }

  /**
   * Qiita APIのレート制限情報を取得
   */
  getRateLimitInfo(): QiitaRateLimitInfo | null {
    return this.cacheService.get<QiitaRateLimitInfo>('qiita:rate-limit');
  }

  private mapArticle(article: QiitaArticleApiResponse): QiitaArticleDto {
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
    };
  }

  private async request<T>(
    path: string,
    method: HttpMethod,
    body?: unknown,
    options?: { timeoutMs?: number; retries?: number },
  ): Promise<FetchResponse<T>> {
    const timeoutMs = options?.timeoutMs ?? 8_000;
    const maxRetries = options?.retries ?? 0;

    const url = `${this.qiitaApiBaseUrl}${path}`;
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const abortTimeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...(this.qiitaToken
              ? { Authorization: `Bearer ${this.qiitaToken}` }
              : {}),
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });
        clearTimeout(abortTimeout);

        if (res.ok) {
          const data = (await res.json()) as T;
          const rateLimit = this.extractRateLimitInfo(res);

          // レート制限情報をログ出力
          if (rateLimit) {
            this.logger.debug(
              `Qiita API rate limit: ${rateLimit.remaining}/${rateLimit.limit} (resets at ${new Date(rateLimit.resetAt * 1000).toISOString()})`,
            );

            // 残りが少なくなったら警告
            if (rateLimit.remaining < 10) {
              this.logger.warn(
                `Qiita API rate limit is low: ${rateLimit.remaining} remaining`,
              );
            }
          }
          return { data, rateLimit };
        }

        // レート制限エラーの特別処理（429 または 403+remaining=0）
        const rl = this.extractRateLimitInfo(res);
        const isRateLimited =
          res.status === 429 || (res.status === 403 && rl?.remaining === 0);
        if (isRateLimited) {
          const rateLimit = rl;
          const resetTime = rateLimit
            ? new Date(rateLimit.resetAt * 1000).toISOString()
            : 'unknown';
          this.logger.warn(
            `Qiita API rate limit exceeded. Reset at: ${resetTime}`,
          );

          // キャッシュ更新
          if (rateLimit) {
            const ttlSeconds = Math.max(
              0,
              rateLimit.resetAt - Math.floor(Date.now() / 1000),
            );
            this.cacheService.set('qiita:rate-limit', rateLimit, ttlSeconds);
          }

          if (attempt < maxRetries) {
            let waitMs = this.getBackoffMs(attempt);
            if (rateLimit) {
              // リセット時刻まで待機する（+1秒のバッファ）
              const waitUntil = rateLimit.resetAt * 1000;
              waitMs = Math.max(0, waitUntil - Date.now()) + 1000;
            }
            this.logger.warn(
              `Retrying in ${waitMs}ms (attempt ${attempt + 1}/${maxRetries})`,
            );
            await this.sleep(waitMs);
            continue;
          }
        }

        // レート制限/一時エラーはリトライ対象
        if ([502, 503, 504].includes(res.status) && attempt < maxRetries) {
          const backoffMs = this.getBackoffMs(attempt);
          this.logger.warn(
            `Qiita API temporary error ${res.status}. retry in ${backoffMs}ms (attempt ${attempt + 1}/${maxRetries})`,
          );
          await this.sleep(backoffMs);
          continue;
        }

        const errorBody = await this.safeReadText(res);
        this.logger.error(
          `Qiita API error: ${res.status} ${res.statusText} - ${errorBody}`,
        );
        throw new ServiceUnavailableException('Qiita API error');
      } catch (err) {
        clearTimeout(abortTimeout);
        lastError = err;

        if (err instanceof ServiceUnavailableException) {
          throw err;
        }

        // AbortError/ネットワークエラー時はリトライ
        if (attempt < maxRetries) {
          const backoffMs = this.getBackoffMs(attempt);
          this.logger.warn(
            `Qiita request failed. retry in ${backoffMs}ms (attempt ${attempt + 1}/${maxRetries})`,
          );
          await this.sleep(backoffMs);
          continue;
        }
      }
    }

    this.logger.error(
      `Qiita request failed after ${maxRetries + 1} attempts`,
      lastError as Error,
    );
    throw new ServiceUnavailableException('Qiita API is currently unavailable');
  }

  private mapUser(user: QiitaUserApiResponse): QiitaUserDto {
    return {
      id: user.id,
      name: user.name,
      profileImageUrl: user.profile_image_url,
      description: user.description,
      followersCount: user.followers_count,
      followeesCount: user.followees_count,
      itemsCount: user.items_count,
      websiteUrl: user.website_url,
      organization: user.organization,
    };
  }

  /**
   * Qiitaレスポンスヘッダーからレート制限情報を抽出
   */
  private extractRateLimitInfo(res: Response): QiitaRateLimitInfo | undefined {
    const limit = res.headers.get('rate-limit');
    const remaining = res.headers.get('rate-remaining');
    const reset = res.headers.get('rate-reset');

    if (!limit || !remaining || !reset) {
      return undefined;
    }

    const parsedLimit = parseInt(limit, 10);
    const parsedRemaining = parseInt(remaining, 10);
    const parsedReset = parseInt(reset, 10);

    if (isNaN(parsedLimit) || isNaN(parsedRemaining) || isNaN(parsedReset)) {
      this.logger.warn(
        `Invalid rate limit headers: limit=${limit}, remaining=${remaining}, reset=${reset}`,
      );
      return undefined;
    }

    return {
      limit: parsedLimit,
      remaining: parsedRemaining,
      resetAt: parsedReset,
    };
  }

  private getBackoffMs(attempt: number): number {
    // 400ms, 800ms, 1600ms ... (+ jitter)
    const base = 400 * Math.pow(2, attempt);
    const jitter = Math.floor(Math.random() * 200);
    return base + jitter;
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async safeReadText(res: Response): Promise<string> {
    try {
      return await res.text();
    } catch {
      return '';
    }
  }
}
