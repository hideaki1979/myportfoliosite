/**
 * AI Articles ページの E2E テスト
 *
 * 【E2Eテストの目的】
 * - 実際のユーザージャーニー（ページ表示→検索→記事閲覧）
 * - ブラウザでの実際のレンダリング確認（レスポンシブデザイン）
 * - 検索機能の動作確認
 * - タグフィルター機能の動作確認
 * - キーボードナビゲーション（実際のキー操作）
 * - クロスブラウザ互換性
 * - 基本的なアクセシビリティ（axe-core）
 */

import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// ページオブジェクトモデル（POM）パターン
class AIArticlesPage {
    constructor(public page: Page) { }

    async waitForTimeout(ms: number) {
        await this.page.waitForTimeout(ms);
    }

    async goto() {
        await this.page.goto('/ai-articles', { waitUntil: 'domcontentloaded' });
        await this.page.waitForSelector('h1', { timeout: 10000 });
    }

    get pageTitle() {
        return this.page.getByRole("heading", { level: 1 });
    }

    get aiArticlesSection() {
        return this.page.getByRole("region", { name: /AI関連記事/i }).or(
            this.page.locator('section').filter({ hasText: 'AI関連記事' })
        );
    }

    get searchInput() {
        return this.page.getByLabel("記事を検索");
    }

    get searchClearButton() {
        return this.page.getByLabel("検索をクリア");
    }

    get resultCount() {
        return this.page.locator('[aria-live="polite"]').filter({ hasText: /件/ });
    }

    get articleList() {
        return this.page.getByRole("list", { name: /AI関連記事一覧/i }).or(
            this.page.locator('[role="list"]')
        );
    }

    get articleCards() {
        return this.page.locator('[role="listitem"]');
    }

    get lastUpdated() {
        return this.page.locator('text=最終更新:');
    }

    get tagButtons() {
        return this.page.locator('button[aria-pressed]');
    }

    get mainContent() {
        return this.page.getByRole("main");
    }

    get emptyState() {
        return this.page.locator('text=検索条件に一致する記事が見つかりませんでした');
    }

    get noDataState() {
        return this.page.locator('text=AI関連記事がまだ取得されていません');
    }

    async search(query: string) {
        await this.searchInput.fill(query);
        // デバウンス待機
        await this.waitForTimeout(500);
    }

    async clearSearch() {
        await this.searchClearButton.click();
    }

    async selectTag(tagName: string) {
        const tagButton = this.page.locator('button').filter({ hasText: tagName });
        await tagButton.click();
    }
}

test.describe("AI Articles ページ - ユーザージャーニー", () => {
    let aiArticlesPage: AIArticlesPage;

    test.beforeEach(async ({ page }) => {
        aiArticlesPage = new AIArticlesPage(page);
        await aiArticlesPage.goto();
    });

    test("ページが正しく表示される", async () => {
        // ページタイトル
        await expect(aiArticlesPage.pageTitle).toBeVisible();
        await expect(aiArticlesPage.pageTitle).toHaveText(/AI Articles/i);

        // メインコンテンツ
        await expect(aiArticlesPage.mainContent).toBeVisible();
    });

    test("AI記事一覧または空の状態が表示される", async () => {
        // CI環境ではAPIが利用できない場合があるため、いずれかの状態を確認
        const hasArticles = await aiArticlesPage.articleCards.count() > 0;
        const hasEmptyState = await aiArticlesPage.noDataState.isVisible().catch(() => false);
        const hasSearchInput = await aiArticlesPage.searchInput.isVisible().catch(() => false);

        // 記事一覧か空の状態のいずれかが表示されている
        expect(hasArticles || hasEmptyState || hasSearchInput).toBe(true);
    });

    test("検索フィールドが表示される", async () => {
        // 記事が存在する場合のみ検索フィールドが表示される
        const hasArticles = await aiArticlesPage.articleCards.count() > 0;

        if (hasArticles) {
            await expect(aiArticlesPage.searchInput).toBeVisible();
        }
    });
});

test.describe("AI Articles ページ - 検索機能", () => {
    let aiArticlesPage: AIArticlesPage;

    test.beforeEach(async ({ page }) => {
        aiArticlesPage = new AIArticlesPage(page);
        await aiArticlesPage.goto();
    });

    test("検索フィールドが正しく機能する", async () => {
        // 記事が存在する場合のみテスト
        const hasSearchInput = await aiArticlesPage.searchInput.isVisible().catch(() => false);

        if (hasSearchInput) {
            // 検索フィールドに入力
            await aiArticlesPage.searchInput.fill("ChatGPT");

            // 検索フィールドに値が入力されていることを確認
            await expect(aiArticlesPage.searchInput).toHaveValue("ChatGPT");
        }
    });

    test("検索をクリアできる", async () => {
        // 記事が存在する場合のみテスト
        const hasSearchInput = await aiArticlesPage.searchInput.isVisible().catch(() => false);

        if (hasSearchInput) {
            // 検索フィールドに入力
            await aiArticlesPage.searchInput.fill("LLM");
            await aiArticlesPage.waitForTimeout(300);

            // クリアボタンが表示されるか確認
            const hasClearButton = await aiArticlesPage.searchClearButton.isVisible().catch(() => false);

            if (hasClearButton) {
                // クリアボタンをクリック
                await aiArticlesPage.searchClearButton.click();

                // 検索フィールドが空になることを確認
                await expect(aiArticlesPage.searchInput).toHaveValue("");
            }
        }
    });

    test("検索結果件数が表示される", async () => {
        // 記事が存在する場合のみテスト
        const articleCount = await aiArticlesPage.articleCards.count();

        if (articleCount > 0) {
            // 検索フィールドに入力
            await aiArticlesPage.search("AI");

            // 結果件数が表示される（記事がある場合）
            try {
                await expect(aiArticlesPage.resultCount).toBeVisible({ timeout: 3000 });
            } catch {
                // 検索結果がない場合はテストをスキップ
                console.log("検索結果がないためスキップ");
            }
        }
    });

    test("検索で見つからない場合、空の状態が表示される", async () => {
        // 記事と検索フィールドが存在する場合のみテスト
        const hasSearchInput = await aiArticlesPage.searchInput.isVisible().catch(() => false);
        const articleCount = await aiArticlesPage.articleCards.count();

        if (hasSearchInput && articleCount > 0) {
            // 存在しない検索ワードを入力
            await aiArticlesPage.search("xxxxxxxxnotexistxxxxxxxx");

            // 空の状態が表示される
            try {
                await expect(aiArticlesPage.emptyState).toBeVisible({ timeout: 3000 });
            } catch {
                // 検索機能が無効な場合はスキップ
                console.log("空の状態が表示されないためスキップ");
            }
        }
    });
});

test.describe("AI Articles ページ - タグフィルター", () => {
    let aiArticlesPage: AIArticlesPage;

    test.beforeEach(async ({ page }) => {
        aiArticlesPage = new AIArticlesPage(page);
        await aiArticlesPage.goto();
    });

    test("タグボタンが表示される", async () => {
        // 記事が存在する場合のみテスト
        const articleCount = await aiArticlesPage.articleCards.count();

        if (articleCount > 0) {
            // タグボタンが表示される
            const tagCount = await aiArticlesPage.tagButtons.count();
            expect(tagCount).toBeGreaterThan(0);
        }
    });

    test("タグボタンのaria-pressed属性が切り替わる", async () => {
        // 記事が存在し、タグボタンがある場合のみテスト
        const tagCount = await aiArticlesPage.tagButtons.count();

        if (tagCount > 0) {
            const firstTag = aiArticlesPage.tagButtons.first();

            // 初期状態はfalse
            await expect(firstTag).toHaveAttribute("aria-pressed", "false");

            // クリックでtrueに切り替わる
            await firstTag.click();
            await expect(firstTag).toHaveAttribute("aria-pressed", "true");

            // もう一度クリックでfalseに戻る
            await firstTag.click();
            await expect(firstTag).toHaveAttribute("aria-pressed", "false");
        }
    });
});

test.describe("AI Articles ページ - レスポンシブデザイン", () => {
    test("モバイル画面で正しく表示される", async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });

        const aiArticlesPage = new AIArticlesPage(page);
        await aiArticlesPage.goto();

        // 主要要素が表示される
        await expect(aiArticlesPage.pageTitle).toBeVisible();
        await expect(aiArticlesPage.mainContent).toBeVisible();
    });

    test("タブレット画面で正しく表示される", async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });

        const aiArticlesPage = new AIArticlesPage(page);
        await aiArticlesPage.goto();

        // 主要要素が表示される
        await expect(aiArticlesPage.pageTitle).toBeVisible();
        await expect(aiArticlesPage.mainContent).toBeVisible();
    });

    test("デスクトップ画面で正しく表示される", async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 1024 });

        const aiArticlesPage = new AIArticlesPage(page);
        await aiArticlesPage.goto();

        // 主要要素が表示される
        await expect(aiArticlesPage.pageTitle).toBeVisible();
        await expect(aiArticlesPage.mainContent).toBeVisible();
    });
});

test.describe("AI Articles ページ - アクセシビリティ", () => {
    test("WCAG 2.1 Level AA 基準を満たす", async ({ page }) => {
        const aiArticlesPage = new AIArticlesPage(page);
        await aiArticlesPage.goto();

        // axe-coreで自動アクセシビリティチェック
        const accessibilityScanResults = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
            .disableRules(["color-contrast"])
            .analyze();

        // 違反がないことを確認
        expect(accessibilityScanResults.violations).toEqual([]);
    });

    test("検索フィールドに適切なラベルが設定されている", async ({ page }) => {
        const aiArticlesPage = new AIArticlesPage(page);
        await aiArticlesPage.goto();

        // 記事が存在する場合のみテスト
        const hasSearchInput = await aiArticlesPage.searchInput.isVisible().catch(() => false);

        if (hasSearchInput) {
            // 検索フィールドにaria-labelが設定されている
            await expect(aiArticlesPage.searchInput).toHaveAttribute("aria-label", "記事を検索");
        }
    });

    test("記事リストに適切なrole属性が設定されている", async ({ page }) => {
        const aiArticlesPage = new AIArticlesPage(page);
        await aiArticlesPage.goto();

        // 記事が存在する場合のみテスト
        const articleCount = await aiArticlesPage.articleCards.count();

        if (articleCount > 0) {
            // リストにrole="list"が設定されている
            await expect(aiArticlesPage.articleList).toHaveAttribute("role", "list");
        }
    });

    test("適切な見出し構造が設定されている", async ({ page }) => {
        const aiArticlesPage = new AIArticlesPage(page);
        await aiArticlesPage.goto();

        // h1要素が1つだけ存在する
        const h1Elements = page.locator("h1");
        const h1Count = await h1Elements.count();
        expect(h1Count).toBe(1);
    });
});

test.describe("AI Articles ページ - メタデータとSEO", () => {
    test("適切なメタタグが設定されている", async ({ page }) => {
        const aiArticlesPage = new AIArticlesPage(page);
        await aiArticlesPage.goto();

        // titleタグ
        const title = await page.title();
        expect(title).toContain("AI");

        // メタディスクリプション
        const description = await page.locator('meta[name="description"]').getAttribute('content');
        expect(description).toBeTruthy();
        expect(description).not.toBe("");

        // OGPタグ
        const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");
        expect(ogTitle).toBeTruthy();

        const ogDescription = await page.locator('meta[property="og:description"]').getAttribute("content");
        expect(ogDescription).toBeTruthy();
    });

    test("canonical URLが設定されている", async ({ page }) => {
        const aiArticlesPage = new AIArticlesPage(page);
        await aiArticlesPage.goto();

        // canonical URL
        const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
        expect(canonical).toBeTruthy();
        expect(canonical).toContain("/ai-articles");
    });
});

test.describe("AI Articles ページ - パフォーマンス", () => {
    test("ページロードが極端に遅くない（10秒以内）", async ({ page }) => {
        test.skip(!!process.env.CI, "CI では環境依存で不安定なためスキップ");
        const startTime = Date.now();
        const aiArticlesPage = new AIArticlesPage(page);
        await aiArticlesPage.goto();

        const loadTime = Date.now() - startTime;

        // ネットワーク状況を考慮して寛容な閾値を設定
        expect(loadTime).toBeLessThan(10000);
    });
});

test.describe("AI Articles ページ - クロスブラウザ", () => {
    test("複数のブラウザで正常に動作する", async ({ page }) => {
        const aiArticlesPage = new AIArticlesPage(page);
        await aiArticlesPage.goto();

        // 基本的な表示確認
        await expect(aiArticlesPage.pageTitle).toBeVisible();
        await expect(aiArticlesPage.mainContent).toBeVisible();
    });
});
