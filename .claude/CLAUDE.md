# myportfoliosite - Claude Code 設定

## プロジェクト概要

個人ポートフォリオサイトのモノレポプロジェクト。

### 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | Next.js 15.5.9, React 19, styled-components |
| バックエンド | NestJS 11.0.1, Prisma, PostgreSQL |
| 共通 | TypeScript 5.9.2, pnpm, Turborepo |
| テスト | Vitest (web), Jest (api), Playwright (E2E) |
| CI/CD | GitHub Actions, Docker |

### ディレクトリ構成

```
myportfoliosite/
├── apps/
│   ├── web/                    # Next.js フロントエンド
│   │   ├── app/                # App Router
│   │   ├── components/
│   │   │   ├── features/       # 機能コンポーネント
│   │   │   ├── sections/       # ページセクション
│   │   │   ├── ui/             # 共通UIコンポーネント
│   │   │   ├── layouts/        # レイアウトコンポーネント
│   │   │   ├── navigation/     # ナビゲーションコンポーネント
│   │   │   └── hooks/          # カスタムフック
│   │   ├── lib/                # ユーティリティ・APIクライアント
│   │   └── styles/             # グローバルスタイル
│   │
│   └── api/                    # NestJS バックエンド
│       └── src/
│           ├── modules/        # 機能モジュール
│           ├── common/         # 共通機能（Guard, Filter等）
│           └── constants/      # 定数定義
│
└── packages/
    ├── shared-types/           # 共有型定義
    ├── ui/                     # 共有UIコンポーネント
    ├── eslint-config/          # ESLint設定
    └── typescript-config/      # TypeScript設定
```

## コマンドリファレンス

```bash
# 開発
pnpm dev                    # 全アプリ開発サーバー起動
pnpm --filter web dev       # webのみ開発サーバー
pnpm --filter api dev       # apiのみ開発サーバー

# ビルド
pnpm build                  # 全アプリビルド
pnpm --filter web build     # webのみビルド
pnpm --filter api build     # apiのみビルド

# テスト
pnpm test                   # 全テスト実行
pnpm --filter web test      # webテスト（Vitest）
pnpm --filter api test      # apiテスト（Jest）

# 型チェック・Lint
pnpm check-types            # 型チェック
pnpm lint                   # Lint実行

# データベース（api）
pnpm --filter api prisma:generate   # Prismaクライアント生成
pnpm --filter api prisma:migrate    # マイグレーション実行
```

## ルールとスキル

### プロジェクトルール
- @rules/shared-rules.md - モノレポ共通ルール（Import規則、型安全性、コーディングスタイル）
- @rules/web-rules.md - Next.js固有ルール（Server/Client Components、ISR、API統合）
- @rules/api-rules.md - NestJS固有ルール（モジュール構成、キャッシング、Guard/Decorator）

### サブエージェントスキル
- @skills/nextjs-patterns.md - Next.js開発パターン（コンポーネント作成、データフェッチ）
- @skills/nestjs-patterns.md - NestJS開発パターン（モジュール作成、キャッシング戦略）

## 重要な規約

### Import優先順位
1. `@repo/shared-types` - 共有型定義を最優先
2. `@repo/ui` - 共有UIコンポーネント
3. ローカルモジュール

### 型安全性
- `any`型は禁止、`unknown`を使用
- 戻り値の型は明示的に指定
- Zodによる実行時バリデーション推奨

### Git Commit
Conventional Commits形式を使用:
```
<type>(<scope>): <description>

feat(web): 新しいコンポーネントを追加
fix(api): キャッシュの不整合を修正
docs: READMEを更新
```

## 環境変数

### Web (.env)
- `NEXT_PUBLIC_API_URL` - APIベースURL
- `API_KEY` - 内部API認証キー

### API (.env)
- `DATABASE_URL` - PostgreSQL接続文字列
- `API_KEY` - 認証用APIキー
- `REDIS_URL` - Redis接続URL（キャッシュ用）
