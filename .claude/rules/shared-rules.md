# モノレポ共通ルール

## Import規則

### 優先順位
```typescript
// 1. 外部ライブラリ
import { z } from 'zod';

// 2. 共有パッケージ（@repo/）
import type { Article, ApiResponse } from '@repo/shared-types';
import { Button } from '@repo/ui';

// 3. ローカルモジュール（相対パス）
import { formatDate } from './utils';
```

### 禁止パターン
```typescript
// ❌ 禁止: 別アプリへの直接参照
import { something } from '../../api/src/modules';

// ✅ 正解: shared-typesを経由
import type { Something } from '@repo/shared-types';
```

## 型安全性

### any型の禁止
```typescript
// ❌ 禁止
function processData(data: any): any {
  return data.value;
}

// ✅ 正解: unknown + 型ガード
function processData(data: unknown): string {
  if (isValidData(data)) {
    return data.value;
  }
  throw new Error('Invalid data');
}

function isValidData(data: unknown): data is { value: string } {
  return typeof data === 'object' && data !== null && 'value' in data;
}
```

### 戻り値の型明示
```typescript
// ❌ 禁止: 型推論に依存
async function fetchArticles() {
  const res = await fetch('/api/articles');
  return res.json();
}

// ✅ 正解: 明示的な型指定
async function fetchArticles(): Promise<ApiResponse<Article[]>> {
  const res = await fetch('/api/articles');
  return res.json() as Promise<ApiResponse<Article[]>>;
}
```

### Zodバリデーション
```typescript
import { z } from 'zod';

// スキーマ定義
const ArticleSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  content: z.string(),
  publishedAt: z.string().datetime(),
});

// 型の導出
type Article = z.infer<typeof ArticleSchema>;

// 実行時バリデーション
function parseArticle(data: unknown): Article {
  return ArticleSchema.parse(data);
}
```

## コーディングスタイル

### 命名規則
| 種類 | 規則 | 例 |
|------|------|-----|
| コンポーネント | PascalCase | `ArticleCard`, `SearchForm` |
| 関数・変数 | camelCase | `fetchArticles`, `isLoading` |
| 定数 | UPPER_SNAKE_CASE | `API_BASE_URL`, `MAX_RETRY` |
| 型・インターフェース | PascalCase | `Article`, `ApiResponse<T>` |
| ファイル名（コンポーネント） | PascalCase | `ArticleCard.tsx` |
| ファイル名（その他） | kebab-case | `api-client.ts` |

### 関数スタイル
```typescript
// コンポーネント: 関数宣言
export function ArticleCard({ article }: ArticleCardProps) {
  return <div>{article.title}</div>;
}

// ユーティリティ: アロー関数
export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('ja-JP');
};

// 非同期関数: async/await
export async function fetchData<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.json();
}
```

## テスト規約

### ファイル配置
```
# ユニットテスト（コロケーション）
components/
  ArticleCard.tsx
  ArticleCard.test.tsx    # Vitestテスト

# E2Eテスト
tests/
  e2e/
    search.spec.ts        # Playwrightテスト
```

### テスト命名
```typescript
describe('ArticleCard', () => {
  it('should render article title', () => {
    // ...
  });

  it('should display published date in Japanese format', () => {
    // ...
  });

  describe('when article has no thumbnail', () => {
    it('should show placeholder image', () => {
      // ...
    });
  });
});
```

## Git Commit規約

### Conventional Commits形式
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Type一覧
| Type | 説明 |
|------|------|
| `feat` | 新機能追加 |
| `fix` | バグ修正 |
| `docs` | ドキュメントのみの変更 |
| `style` | コードの意味に影響しない変更（空白、フォーマット等） |
| `refactor` | バグ修正でも機能追加でもないコード変更 |
| `perf` | パフォーマンス改善 |
| `test` | テストの追加・修正 |
| `chore` | ビルドプロセスやツールの変更 |

### Scope例
- `web` - フロントエンド関連
- `api` - バックエンド関連
- `shared-types` - 共有型定義
- `deps` - 依存関係の更新

### 例
```
feat(web): 記事検索機能を追加

- 検索フォームコンポーネントを実装
- 検索結果のページネーションを追加
- ISRキャッシュを10分に設定

Closes #123
```

## エラーハンドリング

### カスタムエラークラス
```typescript
// 共通エラー基底クラス
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

// 具体的なエラー
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource}が見つかりません`, 'NOT_FOUND', 404);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}
```

### try-catchパターン
```typescript
// ❌ 禁止: エラーを握りつぶす
try {
  await riskyOperation();
} catch {
  // 何もしない
}

// ✅ 正解: 適切なハンドリング
try {
  await riskyOperation();
} catch (error) {
  if (error instanceof NotFoundError) {
    // 特定のエラーに対する処理
    return null;
  }
  // 予期しないエラーは再スロー
  throw error;
}
```
