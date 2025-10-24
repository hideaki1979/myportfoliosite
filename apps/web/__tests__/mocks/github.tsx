import { GitHubRepository } from "../../components/features/GitHubRepos";

export const mockRepositories: GitHubRepository[] = [
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
        updatedAt: '2024-01-03T00:00:00Z',
    },
];

/**
 * GitHubReposコンポーネントのモック実装
 * 各プロパティがテストIDとして表示されるシンプルな実装
 */
export const MockGitHubRepos = ({ initialData, showProfile, showLanguageBar, showTechTags, limit }: {
    initialData: GitHubRepository[];
    profile?: unknown;
    showProfile?: boolean;
    showLanguageBar?: boolean;
    showTechTags?: boolean;
    limit?: number;
}) => (
    <div data-testid="github-repos">
        <span data-testid="repos-count">{initialData?.length || 0}</span>
        <span data-testid="github-profile-visible">{showProfile ? 'yes' : 'no'}</span>
        <span data-testid="language-bar-visible">{showLanguageBar ? 'yes' : 'no'}</span>
        <span data-testid="tech-tags-visible">{showTechTags ? 'yes' : 'no'}</span>
        {limit !== undefined && <span data-testid="repos-limit">{limit}</span>}
    </div>
);
