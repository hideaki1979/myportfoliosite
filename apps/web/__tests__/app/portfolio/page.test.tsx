import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from "@testing-library/react";
import PortfolioPage from "../../../app/portfolio/page";
import { fetchGitHubRepositories } from "../../../lib/api/github"
import { MockGitHubRepos, mockRepositories } from '../../mocks/github';

// モジュールのモック
vi.mock('../../../lib/api/github', () => ({
    fetchGitHubRepositories: vi.fn(),
}));

// GitHubReposコンポーネントのモック
vi.mock('../../../components/features/GitHubRepos', () => ({
    default: MockGitHubRepos,
}));

describe('Portfolio Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('ページタイトルが正しく表示されること', async () => {
        vi.mocked(fetchGitHubRepositories).mockResolvedValue(mockRepositories);

        const page = await PortfolioPage();
        render(page);

        const heading = screen.getByRole('heading', { name: '■Portfolio（Github）' });
        expect(heading).toBeInTheDocument();
    });

    it('ページの説明文が正しく表示されること', async () => {
        vi.mocked(fetchGitHubRepositories).mockResolvedValue(mockRepositories);

        const page = await PortfolioPage();
        render(page);

        const description = screen.getByText(/今まで作成した学校の課題やポートフォリオ、/);
        expect(description).toBeInTheDocument();

        const description2 = screen.getByText(/Udemyや学習のために作成したアプリとなります。/);
        expect(description2).toBeInTheDocument();
    });

    it('GitHubリポジトリが正常に取得され、GitHubReposコンポーネントに渡されること', async () => {
        vi.mocked(fetchGitHubRepositories).mockResolvedValue(mockRepositories);

        const page = await PortfolioPage();
        render(page);

        const githubRepos = screen.getByTestId('github-repos');
        expect(githubRepos).toBeInTheDocument();

        // リポジトリ数の確認
        const reposCount = screen.getByTestId('repos-count');
        expect(reposCount).toHaveTextContent('3');

        // GitHubReposコンポーネントのpropsの確認
        expect(screen.getByTestId('profile-visible')).toHaveTextContent('yes');
        expect(screen.getByTestId('language-bar-visible')).toHaveTextContent('yes');
        expect(screen.getByTestId('tech-tags-visible')).toHaveTextContent('yes');
    });

    it('fetchGitHubRepositoriesが正しいパラメータで呼ばれること', async () => {
        vi.mocked(fetchGitHubRepositories).mockResolvedValue(mockRepositories);

        await PortfolioPage();

        expect(fetchGitHubRepositories).toHaveBeenCalledTimes(1);
        expect(fetchGitHubRepositories).toHaveBeenCalledWith(20);
    });

    it('APIエラー時でもページが正常にレンダリングされること', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        vi.mocked(fetchGitHubRepositories).mockRejectedValue(new Error('API Error'));

        const page = await PortfolioPage();
        render(page);

        // エラーがコンソールに出力されること
        expect(consoleErrorSpy).toHaveBeenCalled();

        // ページタイトルは表示されること
        expect(screen.getByRole('heading', { name: '■Portfolio（Github）' })).toBeInTheDocument();

        // GitHubReposコンポーネントは空配列で表示されること
        expect(screen.getByTestId('github-repos')).toBeInTheDocument();
        expect(screen.getByTestId('repos-count')).toHaveTextContent('0');

        consoleErrorSpy.mockRestore();
    });

    it('リポジトリが0件の場合でも正常にレンダリングされること', async () => {
        vi.mocked(fetchGitHubRepositories).mockResolvedValue([]);

        const page = await PortfolioPage();
        render(page);

        expect(screen.getByTestId('github-repos')).toBeInTheDocument();
        expect(screen.getByTestId('repos-count')).toHaveTextContent('0');
    });

    it('ページの構造が正しいこと（maxWidth、padding）', async () => {
        vi.mocked(fetchGitHubRepositories).mockResolvedValue(mockRepositories);

        const page = await PortfolioPage();
        const { container } = render(page);

        const mainDiv = container.firstChild as HTMLElement;
        expect(mainDiv).toHaveStyle({
            maxWidth: '1248px',
            margin: '0 auto',
            padding: '24px 16px',
        });
    });

    it('タイトルのスタイルが正しいこと', async () => {
        vi.mocked(fetchGitHubRepositories).mockResolvedValue(mockRepositories);

        const page = await PortfolioPage();
        render(page);

        const heading = screen.getByRole('heading', { name: '■Portfolio（Github）' });
        expect(heading).toHaveStyle({
            fontFamily: 'Noto Sans JP, sans-serif',
            fontWeight: '700',
            fontSize: '28px',
            textAlign: 'center',
            marginBottom: '24px',
        });
    });

    it('説明文のスタイルが正しいこと', async () => {
        vi.mocked(fetchGitHubRepositories).mockResolvedValue(mockRepositories);

        const page = await PortfolioPage();
        const { container } = render(page);

        const description = container.querySelector('p') as HTMLElement;
        expect(description).toHaveStyle({
            textAlign: 'center',
            marginBottom: '48px',
        });
    });

    it('GitHubReposコンポーネントにlimit propが渡されていないこと（全件表示）', async () => {
        vi.mocked(fetchGitHubRepositories).mockResolvedValue(mockRepositories);

        const page = await PortfolioPage();
        render(page);

        // limitが指定されていない場合、repos-limitのテストIDは存在しない
        const limitElement = screen.queryByTestId('repos-limit');
        expect(limitElement).not.toBeInTheDocument();
    });
});
