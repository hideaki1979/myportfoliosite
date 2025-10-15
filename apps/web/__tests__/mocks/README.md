# テストモック

このディレクトリには、複数のテストファイルで共有されるモックデータとモックコンポーネントが含まれています。

## ファイル構成

- **`github.tsx`**: GitHubリポジトリ関連のモック
  - `mockRepositories`: テスト用のリポジトリデータ（3件）
  - `MockGitHubRepos`: GitHubReposコンポーネントのモック実装

- **`components.tsx`**: 共通UIコンポーネントのモック
  - `MockHero`: Heroコンポーネントのモック実装

## 使用例

### GitHubリポジトリのモック

```typescript
import { mockRepositories, MockGitHubRepos } from "../mocks/github";
import { vi } from "vitest";

// コンポーネントをモック化
vi.mock("../../components/features/GitHubRepos", () => ({
  default: MockGitHubRepos,
}));

// テストデータを使用
vi.mocked(fetchGitHubRepositories).mockResolvedValue(mockRepositories);
```

### Heroコンポーネントのモック

```typescript
import { MockHero } from "../mocks/components";
import { vi } from "vitest";

vi.mock("../../components/sections/Hero", () => ({
  default: MockHero,
}));
```

## 利点

- **DRY原則**: コードの重複を削減
- **一貫性**: すべてのテストで同じモックを使用
- **保守性**: モックの変更が1箇所で済む
- **再利用性**: 新しいテストでも簡単に利用可能
