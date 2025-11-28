import { apiBaseUrl } from "../constants";
import { REVALIDATE_INTERVAL_SHORT } from '../../lib/constants';
import { REVALIDATE_INTERVAL_LONG } from '../../lib/constants';



/**
 * Qiita API クライアント
 * 
 * サーバーサイド関数: 直接バックエンドAPIにアクセス（ISR対応）
 * クライアントサイド関数: Route Handler経由でアクセス
 */
export interface QiitaArticle {
    id: string;
    title: string;
    url: string;
    likesCount: number;
    stocksCount: number;
    createdAt: string;
    tags: QiitaTag[];
}

export interface QiitaTag {
    name: string;
    versions: string[];
}

export interface QiitaRateLimit {
    limit: number;
    remaining: number;
    resetAt: string;
}

interface QiitaApiResponse {
    success: boolean;
    articles?: QiitaArticle[];
    profile?: QiitaUser;
    rateLimit?: QiitaRateLimit;
    error?: {
        code: string;
        message: string;
    };
}

export interface QiitaUser {
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

// =============================================================================
// サーバーサイド関数（直接バックエンドAPIにアクセス）
// =============================================================================

/**
 * Qiita記事を取得（サーバーサイド用）
 * 直接バックエンドAPIにアクセスし、ISRでキャッシュ
 */
export async function fetchQiitaArticles(
    limit = 10,
): Promise<QiitaArticle[]> {
    try {
        const safeLimit = Math.min(Math.max(limit, 1), 100);
        const url = new URL(`${apiBaseUrl}/api/qiita/articles`);
        url.searchParams.set('limit', String(safeLimit));
        const response = await fetch(
            url.toString(),
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                // ISR: 10分ごとに再検証
                next: { revalidate: REVALIDATE_INTERVAL_SHORT },
            });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({})) as QiitaApiResponse;
            const errorMessage = errorData.error?.message ||
                `Qiita API error: ${response.status} ${response.statusText}`;
            throw new Error(errorMessage);
        }

        const result: QiitaApiResponse = await response.json();

        if (!result.success || !result.articles) {
            const errorMessage = 'Qiita API returned unsuccessful response';
            console.error(errorMessage);
            throw new Error(errorMessage);
        }

        return result.articles;
    } catch (error) {
        console.error('Failed to fetch Qiita articles:', error);
        // エラー時は空配列を返す（フォールバック）
        return [];
    }
}

/**
 * Qiitaプロフィール情報を取得（サーバーサイド）
 * Next.jsのキャッシュ機能で1時間キャッシュ
 */
export async function fetchQiitaProfile(): Promise<QiitaUser | null> {
    try {
        const url = `${apiBaseUrl}/api/qiita/profile`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            // ISR: 1時間ごとに再検証（プロフィールは頻繁に変わらないため）
            next: {
                revalidate: REVALIDATE_INTERVAL_LONG,
            },
        });

        if (!response.ok) {
            console.error(
                `Qiita API error: ${response.status} ${response.statusText}`,
            );
            return null;
        }

        const data: QiitaApiResponse = await response.json();

        if (!data.success || !data.profile) {
            console.error('Qiita profile not available:');
            return null;
        }

        return data.profile;
    } catch (error) {
        console.error('Failed to fetch Qiita profile:', error);
        return null;
    }
}

// =============================================================================
// クライアントサイド関数（Route Handler経由でアクセス）
// =============================================================================

/**
 * クライアントサイドでQiita記事を取得
 * Next.js Route Handler経由でアクセス
 * 
 * @note 将来的にユーザーの明示的な更新アクション（ボタンクリック等）で使用予定
 */
export async function fetchQiitaArticlesClient(
    limit = 10,
): Promise<QiitaArticle[]> {
    try {
        // Next.js Route Handlerを呼び出し（内部API）
        const url = `/api/qiita/articles?limit=${limit}`;

        const response = await fetch(
            url,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                cache: 'no-store',
            },
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({})) as QiitaApiResponse;
            throw new Error(
                errorData.error?.message ||
                `Qiita API request failed: ${response.status}`,
            );
        }

        const data: QiitaApiResponse = await response.json();

        if (!data.success || !data.articles) {
            throw new Error('Qiita API returned unsuccessful response');
        }

        return data.articles;
    } catch (error) {
        console.error('Failed to fetch Qiita articles:', error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Failed to fetch Qiita articles');
    }
}
