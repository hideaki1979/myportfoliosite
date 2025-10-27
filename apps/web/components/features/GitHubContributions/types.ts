/**
 * GitHub コントリビューション関連の型定義
 */

export interface ContributionDay {
    date: string; // ISO 8601形式 (YYYY-MM-DD)
    contributionCount: number;
    color: string; // GitHub の色レベル
}

export interface ContributionWeek {
    contributionDays: ContributionDay[];
}

export interface GitHubContributionCalendar {
    totalContributions: number;
    weeks: ContributionWeek[];
}
