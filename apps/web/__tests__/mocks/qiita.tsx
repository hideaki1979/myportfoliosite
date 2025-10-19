import { QiitaArticle, QiitaUser } from "../../lib/api/qiita";

export const mockQiitaArticles: QiitaArticle[] = [
    {
        id: "test-article-1",
        title: "Test Qiita Article 1",
        url: "https://qiita.com/user/items/test-article-1",
        likesCount: 10,
        stocksCount: 5,
        createdAt: "2024-01-01T00:00:00Z",
        tags: [
            { name: "TypeScript", versions: [] },
            { name: "React", versions: [] },
        ],
    },
    {
        id: "test-article-2",
        title: "Test Qiita Article 2",
        url: "https://qiita.com/user/items/test-article-2",
        likesCount: 20,
        stocksCount: 10,
        createdAt: "2024-01-02T00:00:00Z",
        tags: [
            { name: "JavaScript", versions: [] },
            { name: "Node.js", versions: [] },
        ],
    },
    {
        id: "test-article-3",
        title: "Test Qiita Article 3",
        url: "https://qiita.com/user/items/test-article-3",
        likesCount: 30,
        stocksCount: 15,
        createdAt: "2024-01-03T00:00:00Z",
        tags: [
            { name: "Python", versions: [] },
            { name: "Django", versions: [] },
        ],
    },
];

export const mockQiitaProfile: QiitaUser = {
    id: "test-user",
    name: "Test User",
    profileImageUrl: "https://example.com/profile.jpg",
    description: "Test user description",
    followersCount: 100,
    followeesCount: 50,
    itemsCount: 25,
    websiteUrl: "https://qiita.com/test-user",
    organization: "Test Organization",
};

/**
 * QiitaArticlesコンポーネントのモック実装
 * 各プロパティがテストIDとして表示されるシンプルな実装
 */
export const MockQiitaArticles = ({
    initialData,
    profile,
    showProfile,
    limit,
}: {
    initialData: QiitaArticle[];
    profile?: QiitaUser | null;
    showProfile?: boolean;
    limit?: number;
}) => (
    <div data-testid="qiita-articles">
        <span data-testid="articles-count">{initialData?.length || 0}</span>
        <span data-testid="profile-visible">{showProfile ? "yes" : "no"}</span>
        {profile && <span data-testid="profile-name">{profile.name}</span>}
        {limit !== undefined && <span data-testid="articles-limit">{limit}</span>}
    </div>
);
