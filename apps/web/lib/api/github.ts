/**
 * GitHub API クライアント
 * 
 * サーバーサイド関数: 直接バックエンドAPIにアクセス（ISR対応）
 * クライアントサイド関数: Route Handler経由でアクセス
 */

import { GitHubRepository, PaginationInfo } from "../../components/features/GitHubRepos/types";
import { GitHubContributionCalendar } from "../../types/github";
import { apiBaseUrl } from "../constants";
import { REVALIDATE_INTERVAL_SHORT } from '../../lib/constants';

interface GitHubContributionsApiResponse {
    success: boolean;
    contributions?: GitHubContributionCalendar;
    refreshedAt?: string;
    error?: {
        code: string;
        message: string;
    };
}

interface GitHubApiResponse {
    success: boolean;
    repositories?: GitHubRepository[];
    pagination?: PaginationInfo;
    error?: {
        code: string;
        message: string;
    };
    rateLimit?: {
        limit: number;
        remaining: number;
        resetAt: string;
    };
}

export interface GitHubRepositoriesResponse {
    repositories: GitHubRepository[];
    pagination: PaginationInfo;
}

// =============================================================================
// サーバーサイド関数（直接バックエンドAPIにアクセス）
// =============================================================================

/**
 * GitHubコントリビューションカレンダーを取得（サーバーサイド用）
 * 直接バックエンドAPIにアクセスし、ISRでキャッシュ
 */
export async function fetchGitHubContributions(): Promise<GitHubContributionCalendar> {
    try {
        const response = await fetch(`${apiBaseUrl}/api/github/contributions`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            // ISR: 10分ごとに再検証
            next: { revalidate: REVALIDATE_INTERVAL_SHORT },
        });

        if (!response.ok) {
            const errorData = (await response.json().catch(() => {})) as GitHubContributionsApiResponse;
            throw new Error(
                errorData.error?.message ||
                `GitHub contributions API error: ${response.status}`,
            );
        }
        
        const result = (await response.json()) as GitHubContributionsApiResponse;

        if (!result.success || !result.contributions) {
            throw new Error('GitHub contributions API returned invalid response');
        }

        return result.contributions;
    } catch (error) {
        console.error('Failed to fetch GitHub contributions:', error);
        // エラー時は空のデータを返す（フォールバック）
        return {
            totalContributions: 0,
            weeks: [],
        };
    }
}

/**
 * GitHubリポジトリ一覧を取得（サーバーサイド用）
 * Next.js Route Handlerを経由
 */
export async function fetchGitHubRepositories(
    limit = 20,
    page = 1,
): Promise<GitHubRepositoriesResponse> {
    const defaultPagination: PaginationInfo = { page: 1, perPage: limit, hasMore: false };

    try {
        // Next.js Route Handlerを呼び出し（内部API）
        const safeLimit = Math.min(Math.max(limit, 1), 100);
        const safePage = Math.max(page, 1);
        const url = new URL(`${apiBaseUrl}/api/github/repositories`)
        url.searchParams.set('limit', String(safeLimit));
        url.searchParams.set('page', String(safePage));

        const response = await fetch(url.toString(),
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                // ISR: 10分ごとに再検証
                next: { revalidate: REVALIDATE_INTERVAL_SHORT },
            },
        );

        if (!response.ok) {
            const errorData = (await response.json().catch(() => { })) as GitHubApiResponse;
            throw new Error(
                errorData.error?.message ||
                `GitHub API error: ${response.status} ${response.statusText}`
            );
        }

        const result = (await response.json()) as GitHubApiResponse;

        if (!result.success || !result.repositories) {
            throw new Error('GitHub API returned invalid response');
        }

        return {
            repositories: result.repositories,
            pagination: result.pagination ?? defaultPagination,
        };
    } catch (error) {
        console.error('Failed to fetch GitHub repositories:', error);
        // エラー時は空配列を返す（フォールバック）
        return { repositories: [], pagination: defaultPagination };
    }
}

// =============================================================================
// クライアントサイド関数（Route Handler経由でアクセス）
// =============================================================================

/**
 * クライアントサイドでGitHubコントリビューションカレンダーを取得
 * Next.js Route Handlerを経由
 */
export async function fetchGitHubContributionsClient(): Promise<GitHubContributionCalendar> {
    try {
        const response = await fetch('/api/github/contributions', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            const errorData = (await response.json().catch(() => {})) as GitHubContributionsApiResponse;
            throw new Error(
                errorData.error?.message ||
                `GitHub contributions request failed: ${response.status}`,
            );
        }

        const result = await response.json() as GitHubContributionsApiResponse;

        if (!result.success || !result.contributions) {
            throw new Error('GitHub contributions API returned invalid response');
        }

        return result.contributions;
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Failed to fetch GitHub contributions');
    }
}

/**
 * クライアントサイドでGitHubリポジトリ一覧を取得
 * Next.js Route Handlerを経由
 */
export async function fetchGitHubRepositoriesClient(
    limit = 20,
    page = 1,
): Promise<GitHubRepositoriesResponse> {
    try {
        // Next.js Route Handlerを呼び出し（内部API）
        const url = new URL('/api/github/repositories', window.location.origin);
        url.searchParams.set('limit', String(limit));
        url.searchParams.set('page', String(page));

        const response = await fetch(
            url.toString(),
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                cache: 'no-store',
            },
        );

        if (!response.ok) {
            const errorData = (await response.json().catch(() => { })) as GitHubApiResponse;
            throw new Error(
                errorData.error?.message ||
                `GitHub API request failed: ${response.status}`,
            );
        }

        const result = (await response.json()) as GitHubApiResponse;

        if (!result.success || !result.repositories) {
            throw new Error('GitHub API returned invalid response');
        }

        return {
            repositories: result.repositories,
            pagination: result.pagination ?? { page, perPage: limit, hasMore: false },
        };
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Failed to fetch GitHub repositories');
    }
}

/**
 * クライアントサイドでGitHubコントリビューションをリフレッシュ
 * キャッシュをクリアして最新データを取得
 */
export async function refreshGitHubContributions(): Promise<GitHubContributionCalendar> {
    try {
        const response = await fetch('/api/github/contributions/refresh', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            const errorData = (await response.json().catch(() => {})) as GitHubContributionsApiResponse;
            throw new Error(
                errorData.error?.message ||
                `GitHub contributions refresh failed: ${response.status}`,
            );
        }

        const result = await response.json() as GitHubContributionsApiResponse;

        if (!result.success || !result.contributions) {
            throw new Error('GitHub contributions refresh API returned invalid response');
        }

        return result.contributions;
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Failed to refresh GitHub contributions');
    }
}
