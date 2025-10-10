import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';

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

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

@Injectable()
export class GithubService {
  private readonly githubApiBaseUrl = 'https://api.github.com';
  private readonly githubToken: string;
  private readonly githubUsername: string;

  constructor(
    private readonly config: ConfigService,
    private readonly logger: Logger,
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
    const path = `/users/${encodeURIComponent(this.githubUsername)}/repos?per_page=${perPage}&sort=updated&direction=desc`;

    const repos = await this.request<GitHubRepositoryApiResponse[]>(
      path,
      'GET',
      undefined,
      {
        timeoutMs: 8_000,
        retries: 2,
      },
    );

    return repos.map((r) => this.mapRepository(r));
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
  ): Promise<T> {
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
          return (await res.json()) as T;
        }

        // レート制限/一時エラーはリトライ対象
        if ([429, 502, 503, 504].includes(res.status) && attempt < maxRetries) {
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
