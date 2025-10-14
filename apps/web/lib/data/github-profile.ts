/**
 * GitHubプロフィール情報
 * 実際のGitHub APIから取得する代わりに、静的データとして管理
 */

import { GitHubProfile } from "../../components/features/GitHubRepos/types";

export const GITHUB_PROFILE: GitHubProfile = {
    username: 'hideaki1979',
    displayName: 'hideaki1979(hideaki)',
    avatarUrl: 'https://github.com/hideaki1979.png',
    profileUrl: 'https://github.com/hideaki1979',
    bio: `当方のGithubレポジトリです。
主にプログラミングスクールで作成した課題やUdemyで受講した課題が多いです。`,
};
