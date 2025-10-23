import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from '../../app/page';
import { fetchGitHubRepositories } from '../../lib/api/github';
import { mockRepositories } from '../mocks/github';
import { GitHubReposProps } from '../../components/features/GitHubRepos';

// モジュールのモック
vi.mock('../../lib/api/github', () => ({
    fetchGitHubRepositories: vi.fn(),
}));

// Heroコンポーネントのモック
vi.mock('../../components/sections/Hero', () => ({
    default: () => <div data-testid="hero-section">Hero Section</div>,
}));

// GitHubReposコンポーネントのモック
vi.mock('../../components/features/GitHubRepos', () => ({
    default: ({ initialData = [], showProfile, showLanguageBar, showTechTags, limit }: GitHubReposProps) => (
        <div data-testid="github-repos">
            <div data-testid="profile-visible">{showProfile ? 'yes' : 'no'}</div>
            <div data-testid="language-bar-visible">{showLanguageBar ? 'yes' : 'no'}</div>
            <div data-testid="tech-tags-visible">{showTechTags ? 'yes' : 'no'}</div>
            {limit !== undefined && <div data-testid="repos-limit">{limit}</div>}
            <div data-testid="repos-count">{initialData.length}</div>
        </div>
    ),
}));

describe('Home Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('Heroセクションがレンダリングされること', async () => {
        vi.mocked(fetchGitHubRepositories).mockResolvedValue(mockRepositories);

        const page = await Home();
        render(page);

        const heroSection = screen.getByTestId('hero-section');
        expect(heroSection).toBeInTheDocument();
        expect(heroSection).toHaveTextContent('Hero Section');
    });

    it('GitHubセクションのタイトルが表示されること', async () => {
        vi.mocked(fetchGitHubRepositories).mockResolvedValue(mockRepositories);

        const page = await Home();
        render(page);

        const heading = screen.getByRole('heading', { name: '■GitHub' });
        expect(heading).toBeInTheDocument();
    });

    it('GitHubリポジトリが正常に取得され、GitHubReposコンポーネントに渡されること', async () => {
        vi.mocked(fetchGitHubRepositories).mockResolvedValue(mockRepositories);

        const page = await Home();
        render(page);

        const githubRepos = screen.getByTestId('github-repos');
        expect(githubRepos).toBeInTheDocument();

        // GitHubReposコンポーネントのpropsの確認
        expect(screen.getByTestId('profile-visible')).toHaveTextContent('yes');
        expect(screen.getByTestId('language-bar-visible')).toHaveTextContent('yes');
        expect(screen.getByTestId('tech-tags-visible')).toHaveTextContent('yes');
        expect(screen.getByTestId('repos-limit')).toHaveTextContent('6');
    });

    it('fetchGitHubRepositoriesが正しいパラメータで呼ばれること', async () => {
        vi.mocked(fetchGitHubRepositories).mockResolvedValue(mockRepositories);

        await Home();

        expect(fetchGitHubRepositories).toHaveBeenCalledTimes(1);
        expect(fetchGitHubRepositories).toHaveBeenCalledWith(20);
    });

    it('APIエラー時でもページが正常にレンダリングされること', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        vi.mocked(fetchGitHubRepositories).mockRejectedValue(new Error('API Error'));

        const page = await Home();
        render(page);

        // エラーがコンソールに出力されること
        expect(consoleErrorSpy).toHaveBeenCalled();

        // Heroセクションは表示すること
        expect(screen.getByTestId('hero-section')).toBeInTheDocument();

        // GitHubReposコンポーネントは空配列で表示されること
        expect(screen.getByTestId('github-repos')).toBeInTheDocument();
        expect(screen.getByTestId('repos-count')).toHaveTextContent('0');

        consoleErrorSpy.mockRestore();
    });

    it('リポジトリが0件の場合でも正常にレンダリングされること', async () => {
        vi.mocked(fetchGitHubRepositories).mockResolvedValue([]);

        const page = await Home();
        render(page);

        expect(screen.getByTestId('github-repos')).toBeInTheDocument();
        expect(screen.getByTestId('repos-count')).toHaveTextContent('0');
    });

    it('ページの構造が正しいこと（maxWidth、padding）', async () => {
        vi.mocked(fetchGitHubRepositories).mockResolvedValue(mockRepositories);

        const page = await Home();
        const { container } = render(page);

        const mainDiv = container.firstChild as HTMLElement;
        expect(mainDiv).toHaveStyle({
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '24px 16px',
        });
    });

    it('GitHubセクションのマージンが正しいこと', async () => {
        vi.mocked(fetchGitHubRepositories).mockResolvedValue(mockRepositories);

        const page = await Home();
        const { container } = render(page);

        const section = container.querySelector('section') as HTMLElement;
        expect(section).toHaveStyle({
            marginTop: '64px',
        });
    });
});

