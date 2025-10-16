# E2E テスト（Playwright）

Portfolio ページの GitHub リポジトリ表示コンポーネントの E2E テストです。

## 📋 テストファイル

### `portfolio-github-repos.spec.ts`

**真のE2Eテスト（ユーザージャーニー）のみを実装**

実際のユーザー操作とブラウザ固有の挙動をテストします：

- ✅ **ユーザージャーニー**: ページ表示 → ソート操作 → リンククリック
- ✅ **レスポンシブデザイン**: モバイル/タブレット/デスクトップでの実際の表示
- ✅ **キーボードナビゲーション**: Tab/Enterキーの実際の操作
- ✅ **アクセシビリティ**: axe-coreによる自動チェック（WCAG 2.1 Level AA）
- ✅ **パフォーマンス**: 実際のページロード時間とインタラクション速度
- ✅ **クロスブラウザ**: Chromium/Firefox/Webkitでの動作確認

## 🎯 テスト戦略

### テストピラミッド

```
       /\
      /E2E\         ← 20% Playwright（ユーザージャーニー）
     /------\
    /Integration\   ← 30% Vitest（APIクライアント）
   /------------\
  / Unit Tests  \  ← 50% Vitest（コンポーネント・ロジック）
 /---------------\
```

### 役割分担

**Playwright（E2E）で実施:**

- 実際のユーザー操作フロー
- ブラウザでの実際のレンダリング
- クロスブラウザ互換性
- パフォーマンス測定

**Vitest（ユニット・インテグレーション）で実施:**

- コンポーネント単体のロジック
- APIクライアントのエラーハンドリング
- データ変換・ソートロジック
- 細かいARIA属性の確認
- エッジケース・エラーケース

## 🚀 テストの実行

### 前提条件

```bash
# 依存関係のインストール
pnpm install

# Playwrightブラウザのインストール
pnpm exec playwright install --with-deps
```

### 実行コマンド

```bash
# すべてのテストを実行
pnpm e2e

# UIモードで実行（推奨）
pnpm e2e:ui

# 特定のブラウザで実行
pnpm exec playwright test --project=chromium

# デバッグモードで実行
pnpm exec playwright test --debug

# テストレポートを表示
pnpm e2e:report
```

## 📈 テストカバレッジ

| カテゴリ             | テストケース数 | カバレッジ  |
| -------------------- | -------------- | ----------- |
| ユーザージャーニー   | 4              | ✅ 100%     |
| レスポンシブデザイン | 3              | ✅ 100%     |
| キーボード操作       | 2              | ✅ 100%     |
| アクセシビリティ     | 1              | ✅ 100%     |
| パフォーマンス       | 2              | ✅ 100%     |
| クロスブラウザ       | 1              | ✅ 100%     |
| **合計**             | **13**         | **✅ 100%** |

## 🎓 ベストプラクティス

### 1. ページオブジェクトモデル（POM）

```typescript
class PortfolioPage {
  constructor(private page: Page) {}

  get starsSortButton() {
    return this.page.getByRole("button", { name: "スター数順" });
  }
}
```

### 2. アクセシビリティに基づいたセレクタ

優先順位:

1. `getByRole()` - ARIAロール（推奨）
2. `getByLabel()` - フォームラベル
3. `getByText()` - 表示テキスト
4. `getByTestId()` - テストID（最終手段）

### 3. 適切な待機

```typescript
// ページロード完了を待機
await page.waitForLoadState("networkidle");

// 要素の表示を待機
await expect(element).toBeVisible();
```

### 4. ユーザー目線のテスト

実際のユーザーが行う操作をシミュレート:

- クリック、入力、スクロール
- キーボード操作（Tab、Enter）
- レスポンシブデザインの確認

## 🐛 トラブルシューティング

### テストがタイムアウトする

```bash
# タイムアウト時間を延長
pnpm exec playwright test --timeout=60000
```

### ブラウザが起動しない

```bash
# ブラウザを再インストール
pnpm exec playwright install --with-deps
```

### CI環境でのみ失敗する

CI環境では以下の設定を確認:

- ヘッドレスモード: `true`
- リトライ設定: `retries: 2`
- ワーカー数: `workers: 1`

## 📚 参考資料

- [Playwright公式ドキュメント](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [axe-core](https://github.com/dequelabs/axe-core)
- [WCAG 2.1ガイドライン](https://www.w3.org/WAI/WCAG21/quickref/)

## 💡 今後の改善項目

- [ ] ビジュアルリグレッションテスト（スクリーンショット比較）
- [ ] Lighthouse CI統合によるパフォーマンステスト強化
- [ ] テストデータのフィクスチャ管理

---

**作成日:** 2025-10-15  
**最終更新:** 2025-10-15  
**テストフレームワーク:** Playwright v1.55.0
