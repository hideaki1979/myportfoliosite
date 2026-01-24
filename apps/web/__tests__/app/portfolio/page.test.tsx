import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from "@testing-library/react";
import PortfolioPage from "../../../app/portfolio/page";
import { fetchGitHubRepositories } from "../../../lib/api/github";
import { mockRepositoriesResponse } from '../../mocks/github';
import { GitHubReposProps } from '../../../components/features/GitHubRepos';

// モジュールのモック
vi.mock('../../../lib/api/github', () => ({
    fetchGitHubRepositories: vi.fn(),
}));

// GitHubReposコンポーネントのモック
vi.mock('../../../components/features/GitHubRepos', () => ({
    default: ({ initialData = [], profile, showProfile, showLanguageBar, showTechTags, limit }: GitHubReposProps) => (
        <div data-testid="github-repos">
            <div data-testid="profile-visible">{showProfile ? 'yes' : 'no'}</div>
            <div data-testid="language-bar-visible">{showLanguageBar ? 'yes' : 'no'}</div>
            <div data-testid="tech-tags-visible">{showTechTags ? 'yes' : 'no'}</div>
            <div data-testid="repos-count">{initialData.length}</div>
            {profile && <div data-testid="profile-username">{profile.username}</div>}
            {limit !== undefined && <div data-testid="repos-limit">{limit}</div>}
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

describe('Portfolio Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('ページタイトルが正しく表示されること', async () => {
        vi.mocked(fetchGitHubRepositories).mockResolvedValue(mockRepositoriesResponse);

        const page = await PortfolioPage();
        render(page);

        const heading = screen.getByRole('heading', { name: '■Portfolio（Github）' });
        expect(heading).toBeInTheDocument();
    });

    it('ページの説明文が正しく表示されること', async () => {
        vi.mocked(fetchGitHubRepositories).mockResolvedValue(mockRepositoriesResponse);

        const page = await PortfolioPage();
        render(page);

        const description = screen.getByText(/今まで作成した学校の課題やポートフォリオ/);
        expect(description).toBeInTheDocument();

        const description2 = screen.getByText(/Udemyや学習のために作成したアプリとなります。/);
        expect(description2).toBeInTheDocument();
    });

    it('ページの構造が正しいこと（maxWidth、padding）', async () => {
        vi.mocked(fetchGitHubRepositories).mockResolvedValue(mockRepositoriesResponse);

        const page = await PortfolioPage();
        const { container } = render(page);

        const mainDiv = container.firstChild as HTMLElement;
        expect(mainDiv).toHaveStyle({
            maxWidth: '1248px',
            margin: '0 auto',
            padding: '24px 16px',
        });
    });

    it('タイトルと説明文が正しいHTML構造で表示されること', async () => {
        vi.mocked(fetchGitHubRepositories).mockResolvedValue(mockRepositoriesResponse);

        const page = await PortfolioPage();

        const { container } = render(page);

        // タイトルがh1要素として存在すること
        const heading = screen.getByRole('heading', { name: '■Portfolio（Github）', level: 1 });
        expect(heading).toBeInTheDocument();

        // 説明文がp要素として存在すること
        const description = container.querySelector('p') as HTMLElement;
        expect(description).toBeInTheDocument();
        expect(description).toHaveTextContent('今まで作成した学校の課題やポートフォリオ、')
    });
});
