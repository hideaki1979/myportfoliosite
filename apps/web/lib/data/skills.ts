/**
 * スキルデータ定義
 * スキルチャートで表示するスキル情報を管理
 */

export type SkillLevel = 1 | 2 | 3 | 4 | 5;

export type Skill = {
  name: string;
  level: SkillLevel;
  experience?: string;
};

export type SkillCategory = {
  id: string;
  title: string;
  icon: string;
  color: string;
  skills: Skill[];
};

/** スキルレベルのラベル定義 */
export const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  1: "学習中",
  2: "基礎",
  3: "実務経験",
  4: "得意",
  5: "エキスパート",
} as const;

/** カテゴリ別スキルデータ */
export const SKILL_CATEGORIES: SkillCategory[] = [
  {
    id: "frontend",
    title: "フロントエンド",
    icon: "🎨",
    color: "#3b82f6", // blue
    skills: [
      { name: "React", level: 3, experience: "1年" },
      { name: "Next.js", level: 3, experience: "1年" },
      { name: "TypeScript", level: 3, experience: "1年" },
      { name: "HTML/CSS", level: 4, experience: "2年" },
      { name: "JavaScript", level: 3, experience: "2年" },
      { name: "styled-components", level: 3, experience: "1年" },
    ],
  },
  {
    id: "backend",
    title: "バックエンド",
    icon: "⚙️",
    color: "#10b981", // green
    skills: [
      { name: "Node.js", level: 3, experience: "1年" },
      { name: "NestJS", level: 2, experience: "半年" },
      { name: "Go", level: 1, experience: "学習中" },
      { name: "Java", level: 3, experience: "2年" },
      { name: "COBOL", level: 3, experience: "5年" },
      { name: "PHP/Laravel", level: 2, experience: "半年" },
    ],
  },
  {
    id: "database",
    title: "データベース",
    icon: "🗄️",
    color: "#f59e0b", // yellow
    skills: [
      { name: "Oracle", level: 3, experience: "3年" },
      { name: "MySQL", level: 3, experience: "1年" },
      { name: "PostgreSQL", level: 2, experience: "1年" },
      { name: "Firebase", level: 2, experience: "半年" },
    ],
  },
  {
    id: "testing",
    title: "テスト",
    icon: "🧪",
    color: "#8b5cf6", // purple
    skills: [
      { name: "Jest", level: 3, experience: "1年" },
      { name: "Testing Library", level: 3, experience: "1年" },
      { name: "Playwright", level: 2, experience: "半年" },
      { name: "Vitest", level: 2, experience: "半年" },
    ],
  },
  {
    id: "infrastructure",
    title: "インフラ・ツール",
    icon: "🛠️",
    color: "#ec4899", // pink
    skills: [
      { name: "Git/GitHub", level: 4, experience: "3年" },
      { name: "Docker", level: 2, experience: "1年" },
      { name: "AWS", level: 2, experience: "1年" },
      { name: "Vercel", level: 3, experience: "1年" },
    ],
  },
  {
    id: "ai-development",
    title: "AI駆動開発",
    icon: "🤖",
    color: "#06b6d4", // cyan
    skills: [
      { name: "GitHub Copilot", level: 4, experience: "1年" },
      { name: "Claude Code", level: 4, experience: "半年" },
      { name: "Cursor", level: 4, experience: "半年" },
      { name: "Gemini CLI", level: 3, experience: "3ヶ月" },
    ],
  },
  {
    id: "methodology",
    title: "開発手法",
    icon: "📋",
    color: "#64748b", // slate
    skills: [
      { name: "ウォーターフォール", level: 4, experience: "10年以上" },
      { name: "アジャイル/スクラム", level: 3, experience: "2年" },
      { name: "要件定義〜設計", level: 4, experience: "5年以上" },
      { name: "テスト〜運用保守", level: 4, experience: "10年以上" },
    ],
  },
];
