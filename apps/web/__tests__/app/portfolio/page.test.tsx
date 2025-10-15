import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from "@testing-library/react";
import PortfolioPage from "../../../app/portfolio/page";
import { GitHubRepository } from "../../../components/features/GitHubRepos";
import { fetchGitHubRepositories } from "../../../lib/api/github"

// モジュールのモック
vi.mock('../../../lib/api/github', () => ({
    fetchGitHubRepositories: vi.fn(),
}));

// GitHubReposコンポーネントのモック
vi.mock('../../../components/features/GitHubRepos', () => ({
    default: ({ initialData, showProfile, showLanguageBar, showTechTags, limit }: {
        initialData: GitHubRepository[];
        profile?: unknown;
        showProfile?: boolean;
        showLanguageBar?: boolean;
        showTechTags?: boolean;
        limit?: number;
    }) => (
        <div data-testid="github-repos">
            <span data-testid="repos-count">{initialData?.length || 0}</span>
            <span data-testid="profile-visible">{showProfile ? 'yes' : 'no'}</span>
            <span data-testid="language-bar-visible">{showLanguageBar ? 'yes' : 'no'}</span>
            <span data-testid="tech-tags-visible">{showTechTags ? 'yes' : 'no'}</span>
            {limit && <span data-testid="repos-limit">{limit}</span>}
        </div>
    ),
}));

const mockRepositories: GitHubRepository[] = [
    {
        id: "1",
        name: 'test-repo-1',
        description: 'Test repository 1',
        url: 'https://github.com/user/test-repo-1',
        starCount: 10,
        forkCount: 5,
        primaryLanguage: 'TypeScript',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: "2",
        name: 'test-repo-2',
        description: 'Test repository 2',
        url: 'https://github.com/user/test-repo-2',
        starCount: 20,
        forkCount: 10,
        primaryLanguage: 'JavaScript',
        updatedAt: '2024-01-02T00:00:00Z',
    },
    {
        id: "3",
        name: 'test-repo-3',
        description: 'Test repository 3',
        url: 'https://github.com/user/test-repo-3',
        starCount: 30,
        forkCount: 12,
        primaryLanguage: 'Python',
        updatedAt: '2024-01-02T00:00:00Z',
    },
];

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

        const page = PortfolioPage();
        render(page);

        // limitが指定されていない場合、repos-limitのテストIDは存在しない
        const limitElement = screen.queryByTestId('repos-limit');
        expect(limitElement).not.toBeInTheDocument();
    });
});
