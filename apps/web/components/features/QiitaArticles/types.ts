import { QiitaArticle, QiitaTag, QiitaUser } from "../../../lib/api/qiita";

/**
 * Qiita記事表示コンポーネントの型定義
 */
export type { QiitaArticle, QiitaTag };

export interface QiitaArticlesProps {
    initialData?: QiitaArticle[];
    profile?: QiitaUser;
    showProfile?: boolean;
    limit?: number;
    isLoading?: boolean;
    error?: { message: string } | null;
}
