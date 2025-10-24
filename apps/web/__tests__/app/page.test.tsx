import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from '../../app/page';
import { fetchGitHubRepositories } from '../../lib/api/github';
import { mockRepositories } from '../mocks/github';
import { GitHubReposProps } from '../../components/features/GitHubRepos';
import { fetchQiitaArticles, fetchQiitaProfile } from '../../lib/api/qiita';
import { QiitaArticlesProps } from '../../components/features/QiitaArticles';
import { mockQiitaArticles, mockQiitaProfile } from '../mocks/qiita';

// Githubモジュールのモック
vi.mock('../../lib/api/github', () => ({
    fetchGitHubRepositories: vi.fn(),
}));

// Qiitaモジュールのモック
vi.mock('../../lib/api/qiita', () => ({
    fetchQiitaArticles: vi.fn(),
    fetchQiitaProfile: vi.fn(),
}));

// Heroコンポーネントのモック
vi.mock('../../components/sections/Hero', () => ({
    default: () => <div data-testid="hero-section">Hero Section</div>,
}));

// GitHubReposコンポーネントのモック
vi.mock('../../components/features/GitHubRepos', () => ({
    default: ({ initialData = [], showProfile, showLanguageBar, showTechTags, limit }: GitHubReposProps) => (
        <div data-testid="github-repos">
            <div data-testid="github-profile-visible">{showProfile ? 'yes' : 'no'}</div>
            <div data-testid="language-bar-visible">{showLanguageBar ? 'yes' : 'no'}</div>
            <div data-testid="tech-tags-visible">{showTechTags ? 'yes' : 'no'}</div>
            {limit !== undefined && <div data-testid="repos-limit">{limit}</div>}
            <div data-testid="repos-count">{initialData.length}</div>
        </div>
    ),
}));

// QiitaArticlesコンポーネントのモック
vi.mock('../../components/features/QiitaArticles', () => ({
    default: ({ initialData = [], profile, showProfile, limit }: QiitaArticlesProps) => (
        <div data-testid="qiita-articles">
            <div data-testid="articles-count">{initialData.length}</div>
            <div data-testid="qiita-profile-visible">{showProfile ? 'yes' : 'no'}</div>
            {profile && <div data-testid="profile-name">{profile.name}</div>}
            {limit !== undefined && <div data-testid="articles-limit">{limit}</div>}
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
        vi.mocked(fetchQiitaArticles).mockResolvedValue(mockQiitaArticles);
        vi.mocked(fetchQiitaProfile).mockResolvedValue(mockQiitaProfile);

        const page = await Home();
        render(page);

        const heading = screen.getByRole('heading', { name: '■GitHub' });
        expect(heading).toBeInTheDocument();
    });

    it('Qiitaセクションのタイトルが表示されること', async () => {
        vi.mocked(fetchGitHubRepositories).mockResolvedValue(mockRepositories);
        vi.mocked(fetchQiitaArticles).mockResolvedValue(mockQiitaArticles);
        vi.mocked(fetchQiitaProfile).mockResolvedValue(mockQiitaProfile);

        const page = await Home();
        render(page);

        const heading = screen.getByRole('heading', { name: '■Qiita' });
        expect(heading).toBeInTheDocument();
    });

    it('GitHubリポジトリが正常に取得され、GitHubReposコンポーネントに渡されること', async () => {
        vi.mocked(fetchGitHubRepositories).mockResolvedValue(mockRepositories);

        const page = await Home();
        render(page);

        const githubRepos = screen.getByTestId('github-repos');
        expect(githubRepos).toBeInTheDocument();

        // GitHubReposコンポーネントのpropsの確認
        expect(screen.getByTestId('github-profile-visible')).toHaveTextContent('yes');
        expect(screen.getByTestId('language-bar-visible')).toHaveTextContent('yes');
        expect(screen.getByTestId('tech-tags-visible')).toHaveTextContent('yes');
        expect(screen.getByTestId('repos-limit')).toHaveTextContent('6');
    });

    it('Qiita記事が正常に取得され、QiitaArticlesコンポーネントに渡されること', async () => {
        vi.mocked(fetchGitHubRepositories).mockResolvedValue(mockRepositories);
        vi.mocked(fetchQiitaArticles).mockResolvedValue(mockQiitaArticles);
        vi.mocked(fetchQiitaProfile).mockResolvedValue(mockQiitaProfile);

        const page = await Home();
        render(page);

        const qiitaArticles = screen.getByTestId('qiita-articles');
        expect(qiitaArticles).toBeInTheDocument();

        // QiitaArticlesコンポーネントのpropsの確認
        expect(screen.getByTestId('articles-count')).toHaveTextContent('3');
        expect(screen.getByTestId('qiita-profile-visible')).toHaveTextContent('yes');
        expect(screen.getByTestId('profile-name')).toHaveTextContent('Test User');
        expect(screen.getByTestId('articles-limit')).toHaveTextContent('6');
    });

    it('fetchGitHubRepositoriesが正しいパラメータで呼ばれること', async () => {
        vi.mocked(fetchGitHubRepositories).mockResolvedValue(mockRepositories);
        vi.mocked(fetchQiitaArticles).mockResolvedValue(mockQiitaArticles);
        vi.mocked(fetchQiitaProfile).mockResolvedValue(mockQiitaProfile);

        await Home();

        expect(fetchGitHubRepositories).toHaveBeenCalledTimes(1);
        expect(fetchGitHubRepositories).toHaveBeenCalledWith(20);
    });

    it('fetchQiitaArticlesとfetchQiitaProfileが正しいパラメータで呼ばれること', async () => {
        vi.mocked(fetchGitHubRepositories).mockResolvedValue(mockRepositories);
        vi.mocked(fetchQiitaArticles).mockResolvedValue(mockQiitaArticles);
        vi.mocked(fetchQiitaProfile).mockResolvedValue(mockQiitaProfile);

        await Home();

        expect(fetchQiitaArticles).toHaveBeenCalledTimes(1);
        expect(fetchQiitaArticles).toHaveBeenCalledWith(10);
        expect(fetchQiitaProfile).toHaveBeenCalledTimes(1);
    });

    it('APIエラー時でもページが正常にレンダリングされること', async () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        vi.mocked(fetchGitHubRepositories).mockRejectedValue(new Error('API Error'));
        vi.mocked(fetchQiitaArticles).mockRejectedValue(new Error('Qiita API Error'));

        const page = await Home();
        render(page);

        // エラーがコンソールに出力されること
        expect(consoleErrorSpy).toHaveBeenCalled();

        // Heroセクションは表示すること
        expect(screen.getByTestId('hero-section')).toBeInTheDocument();

        // GitHubReposコンポーネントは空配列で表示されること
        expect(screen.getByTestId('github-repos')).toBeInTheDocument();
        expect(screen.getByTestId('repos-count')).toHaveTextContent('0');

        // QiitaArticlesコンポーネントは空配列で表示されること
        expect(screen.getByTestId('qiita-articles')).toBeInTheDocument();
        expect(screen.getByTestId('articles-count')).toHaveTextContent('0');

        consoleErrorSpy.mockRestore();
    });

    it('リポジトリが0件の場合でも正常にレンダリングされること', async () => {
        vi.mocked(fetchGitHubRepositories).mockResolvedValue([]);
        vi.mocked(fetchQiitaArticles).mockResolvedValue([]);
        vi.mocked(fetchQiitaProfile).mockResolvedValue(mockQiitaProfile);

        const page = await Home();
        render(page);

        expect(screen.getByTestId('github-repos')).toBeInTheDocument();
        expect(screen.getByTestId('repos-count')).toHaveTextContent('0');

        expect(screen.getByTestId('qiita-articles')).toBeInTheDocument();
        expect(screen.getByTestId('articles-count')).toHaveTextContent('0');
    });

    it('ページの構造が正しいこと（maxWidth、padding）', async () => {
        vi.mocked(fetchGitHubRepositories).mockResolvedValue(mockRepositories);
        vi.mocked(fetchQiitaArticles).mockResolvedValue([]);
        vi.mocked(fetchQiitaProfile).mockResolvedValue(mockQiitaProfile);


        const page = await Home();
        const { container } = render(page);

        const mainDiv = container.firstChild as HTMLElement;
        expect(mainDiv).toHaveStyle({
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '24px 16px',
        });
    });

    it('GitHubセクションとQiitaセクションのマージンが正しいこと', async () => {
        vi.mocked(fetchGitHubRepositories).mockResolvedValue(mockRepositories);
        vi.mocked(fetchQiitaArticles).mockResolvedValue([]);
        vi.mocked(fetchQiitaProfile).mockResolvedValue(mockQiitaProfile);

        const page = await Home();
        const { container } = render(page);

        const section = container.querySelectorAll('section');
        for (let i = 0; i < section.length - 1; i++) {
            expect(section[i]).toHaveStyle({
                marginTop: '64px',
            });
        }
    });
});
