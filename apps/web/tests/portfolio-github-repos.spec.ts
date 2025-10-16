import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Portfolio ページの GitHub リポジトリ表示コンポーネントの E2E テスト
 * 
 * 【E2Eテストの目的】
 * - 実際のユーザージャーニー（ページ表示→ソート操作→リンククリック）
 * - ブラウザでの実際のレンダリング確認（レスポンシブデザイン）
 * - キーボードナビゲーション（実際のキー操作）
 * - クロスブラウザ互換性
 * - 基本的なアクセシビリティ（axe-core）
 * - パフォーマンス（実際のロード時間）
 * 
 * 【Vitestでカバーすべき内容】
 * - コンポーネント単体のロジック
 * - APIクライアントのエラーハンドリング
 * - データ変換・ソートロジック
 * - 細かいARIA属性の確認
 */

// ページオブジェクトモデル（POM）パターン
class PortfolioPage {
    constructor(private page: Page) { }

    async goto() {
        await this.page.goto("/portfolio");
        await this.page.waitForLoadState("networkidle");
    }

    get pageTitle() {
        return this.page.getByRole("heading", { level: 1 });
    }

    get starsSortButton() {
        return this.page.getByRole("button", { name: "スター数順" });
    }

    get updatedSortButton() {
        return this.page.getByRole("button", { name: "更新日順" });
    }

    get repositoryList() {
        return this.page.getByRole("list", { name: "リポジトリ一覧" });
    }

    get repositoryCards() {
        // リポジトリ一覧の中の listitem だけを取得
        return this.repositoryList.getByRole("listitem");
    }

    get moreLink() {
        return this.page.getByRole("link", { name: /More/i });
    }
}

test.describe("Portfolio ページ - ユーザージャーニー", () => {
    let portfolioPage: PortfolioPage;

    test.beforeEach(async ({ page }) => {
        portfolioPage = new PortfolioPage(page);
        await portfolioPage.goto();
    });

    test("ページが正しく表示される", async () => {
        // ページタイトル
        await expect(portfolioPage.pageTitle).toBeVisible();
        await expect(portfolioPage.pageTitle).toHaveText(/Portfolio/i);

        // リポジトリ一覧
        await expect(portfolioPage.repositoryList).toBeVisible();
        await expect(portfolioPage.repositoryCards.first()).toBeVisible();

        // ソートボタン
        await expect(portfolioPage.starsSortButton).toBeVisible();
        await expect(portfolioPage.updatedSortButton).toBeVisible();
    });

    test("ソート機能が動作する", async () => {
        // デフォルトはスター数順
        await expect(portfolioPage.starsSortButton).toHaveAttribute("aria-pressed", "true");

        // 更新日順に切り替え
        await portfolioPage.updatedSortButton.click();
        await portfolioPage.repositoryList.waitFor({ state: "visible" });

        // ボタンの状態が切り替わる
        await expect(portfolioPage.updatedSortButton).toHaveAttribute("aria-pressed", "true");
        await expect(portfolioPage.starsSortButton).toHaveAttribute("aria-pressed", "false");

        // スター数順に戻す
        await portfolioPage.starsSortButton.click();
        await portfolioPage.repositoryList.waitFor({ state: "visible" });

        await expect(portfolioPage.starsSortButton).toHaveAttribute("aria-pressed", "true");
    });

    test("リポジトリリンクが正しく設定されている", async () => {
        const firstCard = portfolioPage.repositoryCards.first();
        const titleLink = firstCard.getByRole("link").first();

        // リンクが表示される
        await expect(titleLink).toBeVisible();

        // GitHubのURL
        const href = await titleLink.getAttribute("href");
        expect(href).toContain("github.com");

        // 新しいタブで開く
        const target = await titleLink.getAttribute("target");
        expect(target).toBe("_blank");

        // セキュリティ属性
        const rel = await titleLink.getAttribute("rel");
        expect(rel).toContain("noopener");
        expect(rel).toContain("noreferrer");
    });

    test("Moreリンクが正しく動作する", async () => {
        await expect(portfolioPage.moreLink).toBeVisible();

        const href = await portfolioPage.moreLink.getAttribute("href");
        expect(href).toContain("github.com");

        const target = await portfolioPage.moreLink.getAttribute("target");
        expect(target).toBe("_blank");
    });
});

test.describe("Portfolio ページ - レスポンシブデザイン", () => {
    test("モバイル画面で正しく表示される", async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });

        const portfolioPage = new PortfolioPage(page);
        await portfolioPage.goto();

        // 主要要素が表示される
        await expect(portfolioPage.pageTitle).toBeVisible();
        await expect(portfolioPage.repositoryCards.first()).toBeVisible();
        await expect(portfolioPage.starsSortButton).toBeVisible();
    });

    test("タブレット画面で正しく表示される", async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });

        const portfolioPage = new PortfolioPage(page);
        await portfolioPage.goto();

        await expect(portfolioPage.pageTitle).toBeVisible();
        await expect(portfolioPage.repositoryCards.first()).toBeVisible();
    });

    test("デスクトップ画面で正しく表示される", async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });

        const portfolioPage = new PortfolioPage(page);
        await portfolioPage.goto();

        await expect(portfolioPage.pageTitle).toBeVisible();
        await expect(portfolioPage.repositoryCards.first()).toBeVisible();

        const count = await portfolioPage.repositoryCards.count();
        expect(count).toBeGreaterThan(0);
    });
});

test.describe("Portfolio ページ - キーボードナビゲーション", () => {
    test("Tabキーでフォーカスが移動する", async ({ page, browserName }) => {
        const portfolioPage = new PortfolioPage(page);
        await portfolioPage.goto();

        // ソートボタンにフォーカス
        await portfolioPage.starsSortButton.focus();

        // フォーカスが当たっていることを確認
        await expect(portfolioPage.starsSortButton).toBeFocused();

        // Tabキーでフォーカス移動
        await page.keyboard.press("Tab");

        // webkit は toBeFocused() が正しく動作しないため、別の方法で確認
        if (browserName === "webkit") {
            // document.activeElement で直接確認
            await expect
                .poll(
                    async () => {
                        return await page.evaluate(() => {
                            const activeEl = document.activeElement;
                            return activeEl?.textContent || '';
                        });
                    },
                    {
                        message: "フォーカスが更新日順ボタンに移動することを期待",
                        timeout: 2000,
                    }
                )
                .toContain("更新日順");
        } else {
            // chromium/firefox: toBeFocused() で確認
            await expect(portfolioPage.updatedSortButton).toBeFocused();
        }
    });

    test("Enterキーでソートボタンを操作できる", async ({ page }) => {
        const portfolioPage = new PortfolioPage(page);
        await portfolioPage.goto();

        // 更新日順ボタンにフォーカス
        await portfolioPage.updatedSortButton.focus();
        await expect(portfolioPage.updatedSortButton).toBeFocused();

        // 初期状態を確認（スター数順がアクティブ）
        await expect(portfolioPage.starsSortButton).toHaveAttribute("aria-pressed", "true");
        await expect(portfolioPage.updatedSortButton).toHaveAttribute("aria-pressed", "false");

        // Enterキーでボタンを押下
        await page.keyboard.press("Enter");

        // ボタンの状態が切り替わったことを確認（自動リトライ付き）
        await expect(portfolioPage.updatedSortButton).toHaveAttribute("aria-pressed", "true");
        await expect(portfolioPage.starsSortButton).toHaveAttribute("aria-pressed", "false");
    });
});

test.describe("Portfolio ページ - アクセシビリティ", () => {
    test("WCAG 2.1 Level AA 基準を満たす", async ({ page }) => {
        const portfolioPage = new PortfolioPage(page);
        await portfolioPage.goto();

        // axe-coreで自動アクセシビリティチェック
        const accessibilityScanResults = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
            .analyze();

        // 違反がないことを確認
        expect(accessibilityScanResults.violations).toEqual([]);
    });
});

test.describe("Portfolio ページ - パフォーマンス", () => {
    // NOTE: パフォーマンステストは環境依存が大きいため、寛容な閾値を設定
    // 厳密なパフォーマンス測定は Lighthouse など専用ツールで実施すること
    // ここでは「極端に遅くないか」の基本的なスモークテストとして機能させる
    test("ページロードが極端に遅くない（10秒以内）", async ({ page }) => {
        test.skip(!!process.env.CI, "CI では環境依存で不安定なためスキップ");
        const startTime = Date.now();

        const portfolioPage = new PortfolioPage(page);
        await portfolioPage.goto();

        const loadTime = Date.now() - startTime;

        // CI環境やネットワーク状況を考慮して寛容な閾値を設定
        expect(loadTime).toBeLessThan(10000);
    });

    test("ソート切り替えが極端に遅くない（3秒以内）", async ({ page }) => {
        test.skip(!!process.env.CI, "CI では性能計測をスキップ");
        const portfolioPage = new PortfolioPage(page);
        await portfolioPage.goto();

        const startTime = Date.now();
        await portfolioPage.updatedSortButton.click();
        await portfolioPage.repositoryList.waitFor({ state: "visible" });
        const sortTime = Date.now() - startTime;

         // CI環境やブラウザの処理速度を考慮して寛容な閾値を設定
        expect(sortTime).toBeLessThan(3000);
    });
});

test.describe("Portfolio ページ - クロスブラウザ", () => {
    test("複数のブラウザで正常に動作する", async ({ page }) => {
        const portfolioPage = new PortfolioPage(page);
        await portfolioPage.goto();

        // 基本的な表示確認
        await expect(portfolioPage.pageTitle).toBeVisible();
        await expect(portfolioPage.repositoryCards.first()).toBeVisible();
        await expect(portfolioPage.starsSortButton).toBeVisible();

        // ソート機能の動作確認
        await portfolioPage.updatedSortButton.click();
        await expect(portfolioPage.updatedSortButton).toHaveAttribute("aria-pressed", "true");
    });
});
