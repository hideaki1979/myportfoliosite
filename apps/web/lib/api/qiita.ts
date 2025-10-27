import { baseUrl } from "../constants";

/**
 * Qiita API クライアント
 * バックエンドAPIを経由してQiita記事を取得する
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

/**
 * Qiita記事を取得（サーバーサイド）
 * Next.jsのキャッシュ機能で15分間キャッシュ
 */
export async function fetchQiitaArticles(
    limit = 10,
): Promise<QiitaArticle[]> {
    try {
        // Next.js Route Handlerを呼び出し（内部API）
        const url = `${baseUrl}/api/qiita/articles?limit=${limit}`;

        const response = await fetch(
            url,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                // サーバーサイドでは自動的にキャッシュされる
                cache: 'force-cache',
                next: { revalidate: 900 },   // 15分間キャッシュ
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
 * Qiita記事を取得(将来のクライアントサイド使用を想定)
 * 
 * 現状: サーバーサイドで実行(no-storeキャッシュ戦略)
 * 将来: ユーザーの明示的な更新アクション(ボタンクリック等)で使用予定
 * 
 * @note クライアントコンポーネントから使用する際は、
 *       環境変数をNEXT_PUBLIC_API_URLに変更する必要があります
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

/**
 * Qiitaプロフィール情報を取得（サーバーサイド）
 * Next.jsのキャッシュ機能で1時間キャッシュ
 */
export async function fetchQiitaProfile(): Promise<QiitaUser | null> {
    try {
        const url = `${baseUrl}/api/qiita/profile`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            // サーバーサイドでは自動的にキャッシュされる
            cache: 'force-cache',
            next: {
                revalidate: 3600,   // 1時間キャッシュ
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
