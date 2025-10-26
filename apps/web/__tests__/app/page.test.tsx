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

// GitHubSectionコンポーネントのモック
vi.mock('../../components/sections/GitHubSection', () => ({
    default: ({ showProfile, showLanguageBar, showTechTags, limit }: { showProfile?: boolean; showLanguageBar?: boolean; showTechTags?: boolean; limit?: number }) => (
        <div data-testid="github-section">
            <h2>■GitHub</h2>
            <div data-testid="github-repos">
                <div data-testid="github-profile-visible">{showProfile ? 'yes' : 'no'}</div>
                <div data-testid="language-bar-visible">{showLanguageBar ? 'yes' : 'no'}</div>
                <div data-testid="tech-tags-visible">{showTechTags ? 'yes' : 'no'}</div>
                {limit !== undefined && <div data-testid="repos-limit">{limit}</div>}
            </div>
        </div>
    ),
}));

// QiitaSectionコンポーネントのモック
vi.mock('../../components/sections/QiitaSection', () => ({
    default: ({ showProfile, limit }: { showProfile?: boolean; limit?: number }) => (
        <div data-testid="qiita-section">
            <h2>■Qiita</h2>
            <div data-testid="qiita-articles">
                <div data-testid="qiita-profile-visible">{showProfile ? 'yes' : 'no'}</div>
                {limit !== undefined && <div data-testid="articles-limit">{limit}</div>}
            </div>
        </div>
    ),
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
    SkeletonLoader: ({ count, showProfile, showBar }: { count?: number; showProfile?: boolean; showBar?: boolean }) => (
        <div data-testid="github-skeleton-loader">
            <div data-testid="skeleton-count">{count}</div>
            <div data-testid="skeleton-profile">{showProfile ? 'yes' : 'no'}</div>
            <div data-testid="skeleton-bar">{showBar ? 'yes' : 'no'}</div>
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
    SkeletonLoader: ({ count, showProfile }: { count?: number; showProfile?: boolean }) => (
        <div data-testid="qiita-skeleton-loader">
            <div data-testid="skeleton-count">{count}</div>
            <div data-testid="skeleton-profile">{showProfile ? 'yes' : 'no'}</div>
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
