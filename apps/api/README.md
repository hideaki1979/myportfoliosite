# Portfolio API

NestJSベースのポートフォリオサイト用バックエンドAPIです。

## 環境変数

以下の環境変数を設定してください：

```bash
# Node環境
NODE_ENV=development  # development | test | production

# サーバー設定
PORT=3100

# GitHub API設定
GITHUB_TOKEN=        # GitHubパーソナルアクセストークン（オプション）
GITHUB_USERNAME=     # GitHubユーザー名（必須）

# Qiita API設定
QIITA_TOKEN=         # Qiitaアクセストークン（オプション）
QIITA_USER_ID=       # QiitaユーザーID（必須）
```

## セットアップ

```bash
# 依存関係のインストール
pnpm install

# 開発サーバーの起動
pnpm dev

# ビルド
pnpm build

# 本番サーバーの起動
pnpm start:prod
```

## テスト

```bash
# ユニットテスト
pnpm test

# E2Eテスト
pnpm test:e2e

# テストカバレッジ
pnpm test:cov
```

## API エンドポイント

### GitHub API

- `GET /api/github/repositories?limit=20` - GitHubリポジトリ一覧取得
- `GET /api/github/rate-limit` - GitHubレート制限情報取得

### Qiita API

- `GET /api/qiita/articles?limit=10` - Qiita記事一覧取得
- `GET /api/qiita/rate-limit` - Qiitaレート制限情報取得

### ヘルスチェック

- `GET /api/health` - サービスのヘルスチェック

### メトリクス

- `GET /api/metrics` - APIメトリクス情報取得

## 機能

### キャッシュ戦略

- GitHub/Qiita APIのレスポンスを15分間キャッシュ
- エラー時は1時間のstaleキャッシュからフォールバック
- レート制限情報もキャッシュして管理

### エラーハンドリング

- グローバル例外フィルターで統一されたエラーレスポンス
- レート制限エラーの適切な処理
- タイムアウトとリトライ機能

### ログ

- Pinoを使用した構造化ログ
- リクエスト/レスポンスのロギング
- エラートレースの記録

## アーキテクチャ

```text
src/
├── common/           # 共通機能（フィルター、インターセプター等）
├── modules/
│   ├── cache/       # キャッシュサービス
│   ├── github/      # GitHub API連携
│   ├── qiita/       # Qiita API連携
│   ├── health/      # ヘルスチェック
│   └── metrics/     # メトリクス収集
├── constants/       # 定数定義
└── main.ts         # アプリケーションエントリーポイント
```
