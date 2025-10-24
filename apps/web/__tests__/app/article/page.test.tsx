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

    it('Qiita記事が正常に取得され、QiitaArticlesコンポーネントに渡されること', async () => {
        vi.mocked(fetchQiitaArticles).mockResolvedValue(mockQiitaArticles);
        vi.mocked(fetchQiitaProfile).mockResolvedValue(mockQiitaProfile);

        const page = await ArticlePage();
        render(page);

        const qiitaArticles = screen.getByTestId('qiita-articles');
        expect(qiitaArticles).toBeInTheDocument();

        // 記事数の確認
        const articlesCount = screen.getByTestId('articles-count');
        expect(articlesCount).toHaveTextContent('3');

        // プロフィール名の確認
        const profileName = screen.getByTestId('profile-name');
        expect(profileName).toHaveTextContent('Test User');

        // QiitaArticlesコンポーネントのpropsの確認
        expect(screen.getByTestId('profile-visible')).toHaveTextContent('yes');
    });

    it('fetchQiitaArticlesとfetchQiitaProfileが正しいパラメータで呼ばれること', async () => {
        vi.mocked(fetchQiitaArticles).mockResolvedValue(mockQiitaArticles);
        vi.mocked(fetchQiitaProfile).mockResolvedValue(mockQiitaProfile);

        await ArticlePage();

        expect(fetchQiitaArticles).toHaveBeenCalledTimes(1);
        expect(fetchQiitaArticles).toHaveBeenCalledWith(10);
        expect(fetchQiitaProfile).toHaveBeenCalledTimes(1);
    });

    it('APIエラー時でもページが正常にレンダリングされること', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        vi.mocked(fetchQiitaArticles).mockRejectedValue(new Error('API Error'));
        vi.mocked(fetchQiitaProfile).mockRejectedValue(new Error('API Error'));

        const page = await ArticlePage();
        render(page);

        // エラーがコンソールに出力されること
        expect(consoleErrorSpy).toHaveBeenCalled();

        // ページタイトルは表示されること
        expect(screen.getByRole('heading', { name: '■Article' })).toBeInTheDocument();

        // QiitaArticlesコンポーネントは空配列で表示されること
        expect(screen.getByTestId('qiita-articles')).toBeInTheDocument();
        expect(screen.getByTestId('articles-count')).toHaveTextContent('0');

        consoleErrorSpy.mockRestore();
    });

    it('記事が0件の場合でも正常にレンダリングされること', async () => {
        vi.mocked(fetchQiitaArticles).mockResolvedValue([]);
        vi.mocked(fetchQiitaProfile).mockResolvedValue(mockQiitaProfile);

        const page = await ArticlePage();
        render(page);

        expect(screen.getByTestId('qiita-articles')).toBeInTheDocument();
        expect(screen.getByTestId('articles-count')).toHaveTextContent('0');
    });

    it('プロフィールがnullの場合でも正常にレンダリングされること', async () => {
        vi.mocked(fetchQiitaArticles).mockResolvedValue(mockQiitaArticles);
        vi.mocked(fetchQiitaProfile).mockResolvedValue(null);

        const page = await ArticlePage();
        render(page);

        expect(screen.getByTestId('qiita-articles')).toBeInTheDocument();
        expect(screen.getByTestId('articles-count')).toHaveTextContent('3');

        // プロフィール名は表示されない
        expect(screen.queryByTestId('profile-name')).not.toBeInTheDocument();
    });

    it('ページの構造が正しいこと（PageContainer）', async () => {
        vi.mocked(fetchQiitaArticles).mockResolvedValue(mockQiitaArticles);
        vi.mocked(fetchQiitaProfile).mockResolvedValue(mockQiitaProfile);

        const page = await ArticlePage();
        const { container } = render(page);

        // PageContainerのスタイル確認
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
        const { container } = render(page);

        // タイトルがh1要素として存在すること
        const heading = screen.getByRole('heading', { name: '■Article', level: 1 });
        expect(heading).toBeInTheDocument();

        // 説明文がp要素として存在すること
        const description = container.querySelector('p') as HTMLElement;
        expect(description).toBeInTheDocument();
        expect(description).toHaveTextContent('Qiitaに記載した記事です。');
    });

    it('QiitaArticlesコンポーネントにlimit propが渡されていないこと（全件表示）', async () => {
        vi.mocked(fetchQiitaArticles).mockResolvedValue(mockQiitaArticles);
        vi.mocked(fetchQiitaProfile).mockResolvedValue(mockQiitaProfile);

        const page = await ArticlePage();
        render(page);

        // limitが指定されていない場合、articles-limitのテストIDは存在しない
        const limitElement = screen.queryByTestId('articles-limit');
        expect(limitElement).not.toBeInTheDocument();
    });

    it('Qiitaアイコンとセクション見出しが正しく表示されること', async () => {
        vi.mocked(fetchQiitaArticles).mockResolvedValue(mockQiitaArticles);
        vi.mocked(fetchQiitaProfile).mockResolvedValue(mockQiitaProfile);

        const page = await ArticlePage();
        const { container } = render(page);

        // Qiitaセクションの見出しが表示されること
        const sectionHeading = screen.getByText('Qiita');
        expect(sectionHeading).toBeInTheDocument();

        // SVGアイコンが存在すること
        const svgIcon = container.querySelector('svg');
        expect(svgIcon).toBeInTheDocument();
    });
});
