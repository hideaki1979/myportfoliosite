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
    articles: QiitaArticle[];
    rateLimit?: QiitaRateLimit;
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

interface QiitaProfileApiResponse {
    success: boolean;
    profile: QiitaUser | null;
    message?: string;
}

/**
 * Qiita記事を取得（サーバーサイド）
 * Next.jsのキャッシュ機能で15分間キャッシュ
 */
export async function fetchQiitaArticles(
    limit = 10,
): Promise<QiitaArticle[]> {
    try {
        const url = `${process.env.API_URL}/api/qiita/articles?limit=${limit}`;

        const response = await fetch(url, {
            next: {
                revalidate: 900,    // 15分間キャッシュ
            },
        });

        if (!response.ok) {
            throw new Error(
                `Qiita API error: ${response.status} ${response.statusText}`,
            );
        }

        const data: QiitaApiResponse = await response.json();

        if (!data.success) {
            throw new Error('Qiita API returned unsuccessful response');
        }

        return data.articles;
    } catch (error) {
        console.error('Failed to fetch Qiita articles:', error);
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
        const url = `${process.env.API_URL}/api/qiita/articles?limit=${limit}`;

        const response = await fetch(url, {
            cache: 'no-store',
        });

        if (!response.ok) {
            throw new Error(
                `Qiita API error: ${response.status} ${response.statusText}`,
            );
        }

        const data: QiitaApiResponse = await response.json();

        if (!data.success) {
            throw new Error('Qiita API returned unsuccessful response');
        }

        return data.articles;
    } catch (error) {
        console.error('Failed to fetch Qiita articles:', error);
        throw error;
    }
}

/**
 * Qiitaプロフィール情報を取得（サーバーサイド）
 * Next.jsのキャッシュ機能で1時間キャッシュ
 */
export async function fetchQiitaProfile(): Promise<QiitaUser | null> {
    try {
        const url = `${process.env.API_URL}/api/qiita/profile`;

        const response = await fetch(url, {
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

        const data: QiitaProfileApiResponse = await response.json();

        if (!data.success || !data.profile) {
            console.error('Qiita profile not available:', data.message);
            return null;
        }

        return data.profile;
    } catch (error) {
        console.error('Failed to fetch Qiita profile:', error);
        return null;
    }
}
