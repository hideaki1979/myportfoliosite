/**
 * GitHub API クライアント
 * Next.js Route Handlersを経由してバックエンドAPIにアクセス
 */

import { GitHubRepository } from "../../components/features/GitHubRepos/types";
import { baseUrl } from "../constants";

/**
 * GitHub コントリビューションカレンダーの型定義
 */
export interface ContributionDay {
    date: string; // ISO 8601形式 (YYYY-MM-DD)
    contributionCount: number;
    color: string; // GitHub の色レベル
}

export interface ContributionWeek {
    contributionDays: ContributionDay[];
}

export interface GitHubContributionCalendar {
    totalContributions: number;
    weeks: ContributionWeek[];
}

interface GitHubContributionsApiResponse {
    success: boolean;
    contributions?: GitHubContributionCalendar;
    error?: {
        code: string;
        message: string;
    };
}

interface GitHubApiResponse {
    success: boolean;
    repositories?: GitHubRepository[];
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

/**
 * GitHubコントリビューションカレンダーを取得（サーバーサイド用）
 * Next.js Route Handlerを経由
 */
export async function fetchGitHubContributions(): Promise<GitHubContributionCalendar> {
    try {
        const response = await fetch(`${baseUrl}/api/github/contributions`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            // サーバーサイドでは自動的にキャッシュされる
            cache: 'force-cache',
            next: {revalidate: 900},
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
 * GitHubリポジトリ一覧を取得（サーバーサイド用）
 * Next.js Route Handlerを経由
 */
export async function fetchGitHubRepositories(
    limit = 20,
): Promise<GitHubRepository[]> {

    try {
        // Next.js Route Handlerを呼び出し（内部API）
        const response = await fetch(
            `${baseUrl}/api/github/repositories?limit=${limit}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                // サーバーサイドでは自動的にキャッシュされる
                cache: 'force-cache',
                next: { revalidate: 900 },
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

        return result.repositories;
    } catch (error) {
        console.error('Failed to fetch GitHub repositories:', error);
        // エラー時は空配列を返す（フォールバック）
        return [];
    }
}

/**
 * クライアントサイドでGitHubリポジトリ一覧を取得
 * Next.js Route Handlerを経由
 */
export async function fetchGitHubRepositoriesClient(
    limit = 20,
): Promise<GitHubRepository[]> {
    try {
        // Next.js Route Handlerを呼び出し（内部API）
        const response = await fetch(
            `/api/github/repositories?limit=${limit}`,
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

        return result.repositories;
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Failed to fetch GitHub repositories');
    }
}
