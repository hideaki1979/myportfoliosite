import { render, screen } from "@testing-library/react";
import ArticlePage from "../../../app/article/page";
import { QiitaArticlesProps } from "../../../components/features/QiitaArticles";
import { fetchQiitaArticles, fetchQiitaProfile } from "../../../lib/api/qiita";
import { mockQiitaArticles, mockQiitaProfile } from "../../mocks/qiita";

// モジュールのモック
vi.mock('../../../lib/api/qiita', () => ({
    fetchQiitaArticles: vi.fn(),
    fetchQiitaProfile: vi.fn(),
}));

// QiitaArticlesコンポーネントのモック
vi.mock('../../../components/features/QiitaArticles', () => ({
    default: ({ initialData = [], profile, showProfile, limit }: QiitaArticlesProps) => (
        <div data-testid="qiita-articles">
            <div data-testid="profile-visible">{showProfile ? 'yes' : 'no'}</div>
            <div data-testid="articles-count">{initialData.length}</div>
            {profile && <div data-testid="profile-name">{profile.name}</div>}
            {limit !== undefined && <div data-testid="articles-limit">{limit}</div>}
        </div>
    ),
    SkeletonLoader: ({ count, showProfile }: { count?: number; showProfile?: boolean }) => (
        <div data-testid="qiita-skeleton-loader">
            <div data-testid="skeleton-count">{count}</div>
            <div data-testid="skeleton-profile">{showProfile ? 'yes' : 'no'}</div>
        </div>
    ),
}));

describe('Article Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('ページタイトルが正しく表示されること', async () => {
        vi.mocked(fetchQiitaArticles).mockResolvedValue(mockQiitaArticles);
        vi.mocked(fetchQiitaProfile).mockResolvedValue(mockQiitaProfile);

        const page = await ArticlePage();
        render(page);

        const heading = screen.getByRole('heading', { name: '■Article' });
        expect(heading).toBeInTheDocument();
    });

    it('ページの説明文が正しく表示されること', async () => {
        vi.mocked(fetchQiitaArticles).mockResolvedValue(mockQiitaArticles);
        vi.mocked(fetchQiitaProfile).mockResolvedValue(mockQiitaProfile);

        const page = await ArticlePage();
        render(page);

        const description = screen.getByText('Qiitaに記載した記事です。');
        expect(description).toBeInTheDocument();
    });

    // Note: Suspense境界内のサーバーコンポーネントに移動したため、
    // ユニットテストでは基本構造のみを確認します。実際のデータ取得はE2Eテストで検証します。

    it('ページの構造が正しいこと（PageContainer）', async () => {
        vi.mocked(fetchQiitaArticles).mockResolvedValue(mockQiitaArticles);
        vi.mocked(fetchQiitaProfile).mockResolvedValue(mockQiitaProfile);

        const page = await ArticlePage();
        const { container } = render(page);

        const mainDiv = container.firstChild as HTMLElement;
        expect(mainDiv).toHaveStyle({
            maxWidth: '1248px',
            margin: '0 auto',
            padding: '24px 16px',
        });
    });

    it('タイトルと説明文が正しいHTML構造で表示されること', async () => {
        vi.mocked(fetchQiitaArticles).mockResolvedValue(mockQiitaArticles);
        vi.mocked(fetchQiitaProfile).mockResolvedValue(mockQiitaProfile);

        const page = await ArticlePage();
        render(page);

        const heading = screen.getByRole('heading', { name: '■Article' });
        expect(heading.tagName).toBe('H1');

        const description = screen.getByText('Qiitaに記載した記事です。');
        expect(description.tagName).toBe('P');
    });

    it('QiitaArticlesコンポーネントにlimit propが渡されていないこと（全件表示）', async () => {
        vi.mocked(fetchQiitaArticles).mockResolvedValue(mockQiitaArticles);
        vi.mocked(fetchQiitaProfile).mockResolvedValue(mockQiitaProfile);

        const page = await ArticlePage();
        render(page);

        // limitが設定されていないことを確認（全件表示）
        expect(screen.queryByTestId('articles-limit')).not.toBeInTheDocument();
    });

    it('Qiitaアイコンとセクション見出しが正しく表示されること', async () => {
        vi.mocked(fetchQiitaArticles).mockResolvedValue(mockQiitaArticles);
        vi.mocked(fetchQiitaProfile).mockResolvedValue(mockQiitaProfile);

        const page = await ArticlePage();
        render(page);

        const heading = screen.getByRole('heading', { name: /Qiita/i });
        expect(heading).toBeInTheDocument();
    });
});
