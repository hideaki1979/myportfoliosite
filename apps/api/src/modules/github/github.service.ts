import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { CacheService } from '../cache/cache.service';

interface GitHubRepositoryApiResponse {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
}

export interface GitHubRepositoryDto {
  id: string;
  name: string;
  description: string | null;
  url: string;
  starCount: number;
  forkCount: number;
  primaryLanguage: string | null;
  updatedAt: string;
}

export interface GitHubRateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: number; // Linux timestamp
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface FetchResponse<T> {
  data: T;
  rateLimit?: GitHubRateLimitInfo;
}

// キャッシュ戦略の定数
const CACHE_TTL = 900; // 15分
const STALE_CACHE_TTL = 3600; // 1時間（エラー時のフォールバック用）
const CACHE_KEY_PREFIX = 'github:repositories';

@Injectable()
export class GithubService {
  private readonly githubApiBaseUrl = 'https://api.github.com';
  private readonly githubToken: string;
  private readonly githubUsername: string;

  constructor(
    private readonly config: ConfigService,
    private readonly logger: Logger,
    private readonly cacheService: CacheService,
  ) {
    this.githubToken = this.config.get<string>('GITHUB_TOKEN', '');
    this.githubUsername = this.config.get<string>('GITHUB_USERNAME', '');
  }

  async getUserPublicRepositories(limit = 20): Promise<GitHubRepositoryDto[]> {
    if (!this.githubUsername) {
      this.logger.warn(
        'GITHUB_USERNAME is not configured, returning empty list.',
      );
      return [];
    }

    const numericLimit = Number(limit);
    const perPageBase = Number.isFinite(numericLimit)
      ? Math.floor(numericLimit)
      : 20;
    const perPage = Math.min(Math.max(perPageBase, 1), 100);

    const cacheKey = `${CACHE_KEY_PREFIX}:${perPage}`;
    const staleCacheKey = `${cacheKey}:stale`;

    // キャッシュから取得を試行
    const cached = this.cacheService.get<GitHubRepositoryDto[]>(cacheKey);
    if (cached) {
      this.logger.log(
        `GitHub repositories served from cache (${cached.length} items)`,
      );
      return cached;
    }

    try {
      const path = `/users/${encodeURIComponent(this.githubUsername)}/repos?per_page=${perPage}&sort=updated&direction=desc`;

      const response = await this.request<GitHubRepositoryApiResponse[]>(
        path,
        'GET',
        undefined,
        {
          timeoutMs: 8_000,
          retries: 2,
        },
      );

      const repositories = response.data.map((r) => this.mapRepository(r));

      // 通常のキャッシュに保存（15分）
      this.cacheService.set(cacheKey, repositories, CACHE_TTL);

      // staleキャッシュに保存（1時間、エラー時のフォールバック用）
      this.cacheService.set(staleCacheKey, repositories, STALE_CACHE_TTL);

      // レート制限情報をキャッシュ
      if (response.rateLimit) {
        const ttlSeconds = Math.max(
          0,
          response.rateLimit.resetAt - Math.floor(Date.now() / 1000),
        );
        this.cacheService.set(
          'github:rate-limit',
          response.rateLimit,
          ttlSeconds,
        );
      }

      this.logger.log(
        `Fetched ${repositories.length} repositories from GitHub API`,
      );

      return repositories;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to fetch GitHub repositories: ${errorMessage}`,
        errorStack,
      );

      // エラー時はstaleキャッシュから返却を試行
      const staleCache =
        this.cacheService.get<GitHubRepositoryDto[]>(staleCacheKey);

      if (staleCache) {
        this.logger.warn(
          `GitHub API error, serving stale cache (${staleCache.length} items)`,
        );
        return staleCache;
      }

      // staleキャッシュも無ければ例外をスロー
      throw new ServiceUnavailableException(
        'GitHub API is currently unavailable',
      );
    }
  }

  /**
   * GitHub APIのレート制限情報を取得
   */
  getRateLimitInfo(): GitHubRateLimitInfo | null {
    return this.cacheService.get<GitHubRateLimitInfo>('github:rate-limit');
  }

  private mapRepository(
    repo: GitHubRepositoryApiResponse,
  ): GitHubRepositoryDto {
    return {
      id: String(repo.id),
      name: repo.name,
      description: repo.description,
      url: repo.html_url,
      starCount: repo.stargazers_count,
      forkCount: repo.forks_count,
      primaryLanguage: repo.language,
      updatedAt: repo.updated_at,
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

    const url = `${this.githubApiBaseUrl}${path}`;
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const abortTimeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const res = await fetch(url, {
          method,
          headers: {
            Accept: 'application/vnd.github+json',
            'User-Agent': 'myportfoliosite-api',
            ...(this.githubToken
              ? { Authorization: `Bearer ${this.githubToken}` }
              : {}),
            ...(body ? { 'Content-Type': 'application/json' } : {}),
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });
        clearTimeout(abortTimeout);

        if (res.ok) {
          const data = (await res.json()) as T;
          const rateLimit = this.extraRateLimitInfo(res);

          // レート制限情報をログ出力
          if (rateLimit) {
            this.logger.debug(
              `GitHub API rate limit: ${rateLimit.remaining}/${rateLimit.limit} (resets at ${new Date(rateLimit.resetAt * 1000).toISOString()})`,
            );

            // 残りが少なくなったら警告
            if (rateLimit.remaining < 10) {
              this.logger.warn(
                `GitHub API rate limit is low: ${rateLimit.remaining} remaining`,
              );
            }
          }

          return { data, rateLimit };
        }

        // レート制限エラーの特別処理（429 または 403+remaining=0）
        const rl = this.extraRateLimitInfo(res);
        const isRateLimited =
          res.status === 429 || (res.status === 403 && rl?.remaining === 0);
        if (isRateLimited) {
          const rateLimit = rl;
          const resetTime = rateLimit
            ? new Date(rateLimit.resetAt * 1000).toISOString()
            : 'unknown';
          this.logger.warn(
            `GitHub API rate limit exceeded. Reset at: ${resetTime}`,
          );

          // キャッシュ更新
          if (rateLimit) {
            this.cacheService.set('github:rate-limit', rateLimit, 3600);
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
            `GitHub API temporary error ${res.status}. retry in ${backoffMs}ms (attempt ${attempt + 1}/${maxRetries})`,
          );
          await this.sleep(backoffMs);
          continue;
        }

        const errorBody = await this.safeReadText(res);
        this.logger.error(
          `GitHub API error: ${res.status} ${res.statusText} - ${errorBody}`,
        );
        throw new ServiceUnavailableException('GitHub API error');
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
            `GitHub request failed. retry in ${backoffMs}ms (attempt ${attempt + 1}/${maxRetries})`,
          );
          await this.sleep(backoffMs);
          continue;
        }
      }
    }

    this.logger.error(
      `GitHub request failed after ${maxRetries + 1} attempts`,
      lastError as Error,
    );
    throw new ServiceUnavailableException(
      'GitHub API is currently unavailable',
    );
  }

  /**
   * GitHubレスポンスヘッダーからレート制限情報を抽出
   */
  private extraRateLimitInfo(res: Response): GitHubRateLimitInfo | undefined {
    const limit = res.headers.get('x-ratelimit-limit');
    const remaining = res.headers.get('x-ratelimit-remaining');
    const reset = res.headers.get('x-ratelimit-reset');

    if (!limit || !remaining || !reset) {
      return undefined;
    }

    return {
      limit: parseInt(limit, 10),
      remaining: parseInt(remaining, 10),
      resetAt: parseInt(reset, 10),
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
