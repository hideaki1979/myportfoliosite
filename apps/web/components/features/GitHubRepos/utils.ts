/**
 * GitHubリポジトリ関連のユーティリティ関数
 */
import type { GitHubRepository, LanguageStats, SortBy } from "./types";

/**
 * リポジトリをソートする
 */
export function sortRepositories(
    repositories: GitHubRepository[],
    sortBy: SortBy,
): GitHubRepository[] {
    return [...repositories].sort((a, b) => {
        if (sortBy === 'stars') {
            return b.starCount - a.starCount;
        }
        // updated
        return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
    });
}

/**
 * 言語統計を計算する
 */
export function calculateLanguageStats(
    repositories: GitHubRepository[]
): LanguageStats[] {
    const languageCount = new Map<string, number>();

    repositories.forEach((repo) => {
        if (repo.primaryLanguage) {
            const count = languageCount.get(repo.primaryLanguage) || 0;
            languageCount.set(repo.primaryLanguage, count + 1);
        }
    });

    const totalRepos = repositories.length;
    const stats: LanguageStats[] = Array.from(languageCount.entries())
        .map(([name, count]) => ({
            name,
            color: getLanguageColor(name),
            percentage: Math.round((count / totalRepos) * 100),
            count,
        }))
        .sort((a, b) => b.count - a.count);

    return stats;
}

/**
 * 言語の色を取得する（GitHub標準色）
 */
export function getLanguageColor(language: string): string {
    const colors: Record<string, string> = {
        TypeScript: '#3178c6',
        JavaScript: '#f1e05a',
        Python: '#3572A5',
        Java: '#b07219',
        Go: '#00ADD8',
        Rust: '#dea584',
        Ruby: '#701516',
        PHP: '#4F5D95',
        Swift: '#F05138',
        Kotlin: '#A97BFF',
        'C++': '#f34b7d',
        C: '#555555',
        'C#': '#178600',
        HTML: '#e34c26',
        CSS: '#563d7c',
        Shell: '#89e051',
        Dart: '#00B4AB',
        Vue: '#41b883',
        Svelte: '#ff3e00',
    };

    return colors[language] || '#858585';
}

/**
 * 相対時間を日本語で取得する
 */
export function getRelativeTime(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();

    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffYears > 0) {
        return `${diffYears}年前`;
    }
    if (diffMonths > 0) {
        return `${diffMonths}ヶ月前`;
    }
    if (diffWeeks > 0) {
        return `${diffWeeks}週間前`;
    }
    if (diffDays > 0) {
        return `${diffDays}日前`;
    }
    if (diffHours > 0) {
        return `${diffHours}時間前`;
    }
    if (diffMinutes > 0) {
        return `${diffMinutes}分前`;
    }
    return 'たった今';
}

/**
 * 技術タグの一覧を取得する
 */
export function extractTechTags(
    repositories: GitHubRepository[],
): string[] {
    const tags = new Set<string>();

    repositories.forEach((repo) => {
        if (repo.primaryLanguage) {
            tags.add(repo.primaryLanguage);
        }
    });

    return Array.from(tags).sort();
}

/**
 * 数値をフォーマットする（1000 -> 1k）
 */
export function formatNumber(num: number): string {
    if (num >= 1000000) {
        return `${(num / 1000000).toFixed(1)}m`;
    }
    if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
}

