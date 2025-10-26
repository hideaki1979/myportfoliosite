/**
 * GitHubリポジトリ関連の型定義
 */

export interface GitHubRepository {
    id: string;
    name: string;
    description: string | null;
    url: string;
    starCount: number;
    forkCount: number;
    primaryLanguage: string | null;
    updatedAt: string;
}

export interface LanguageStats {
    name: string;
    color: string;
    percentage: number;
    count: number;
}

export interface GitHubProfile {
    username: string;
    displayName: string;
    avatarUrl: string;
    profileUrl: string;
    bio: string;
}

export type SortBy = 'stars' | 'updated';
export type SortOrder = 'asc' | 'desc';

export interface GitHubReposProps {
    initialData?: GitHubRepository[];
    profile?: GitHubProfile;
    showProfile?: boolean;
    showLanguageBar?: boolean;
    showTechTags?: boolean;
    limit?: number;
    isLoading?: boolean;
}

