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

        console.log("✓ ページが正しく表示されました");
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

        console.log("✓ ソート機能が正常に動作しました");
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

        console.log("✓ リポジトリリンクが正しく設定されています");
    });

    test("Moreリンクが正しく動作する", async () => {
        await expect(portfolioPage.moreLink).toBeVisible();

        const href = await portfolioPage.moreLink.getAttribute("href");
        expect(href).toContain("github.com");

        const target = await portfolioPage.moreLink.getAttribute("target");
        expect(target).toBe("_blank");

        console.log("✓ Moreリンクが正しく動作します");
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

        console.log("✓ モバイル画面で正しく表示されます");
    });

    test("タブレット画面で正しく表示される", async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });

        const portfolioPage = new PortfolioPage(page);
        await portfolioPage.goto();

        await expect(portfolioPage.pageTitle).toBeVisible();
        await expect(portfolioPage.repositoryCards.first()).toBeVisible();

        console.log("✓ タブレット画面で正しく表示されます");
    });

    test("デスクトップ画面で正しく表示される", async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });

        const portfolioPage = new PortfolioPage(page);
        await portfolioPage.goto();

        await expect(portfolioPage.pageTitle).toBeVisible();
        await expect(portfolioPage.repositoryCards.first()).toBeVisible();

        const count = await portfolioPage.repositoryCards.count();
        expect(count).toBeGreaterThan(0);

        console.log(`✓ デスクトップ画面で${count}件のリポジトリが表示されます`);
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
            await page.waitForTimeout(500);
            const activeElementText = await page.evaluate(() => {
                const activeEl = document.activeElement;
                return activeEl?.textContent || '';
            });
            expect(activeElementText).toContain("更新日順");
        } else {
            // chromium/firefox: toBeFocused() で確認
            await expect(portfolioPage.updatedSortButton).toBeFocused();
        }

        console.log("✓ Tabキーでフォーカスが移動します");
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

        // Enterキーでボタンを押下し、状態更新を待つ
        await page.keyboard.press("Enter");
        await page.waitForTimeout(300);

        // ボタンの状態が切り替わったことを確認
        await expect(portfolioPage.updatedSortButton).toHaveAttribute("aria-pressed", "true");
        await expect(portfolioPage.starsSortButton).toHaveAttribute("aria-pressed", "false");

        console.log("✓ Enterキーでソートボタンを操作できます");
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

        console.log(
            `✓ アクセシビリティチェック完了: ${accessibilityScanResults.passes.length}件のチェックに合格`
        );
    });
});

test.describe("Portfolio ページ - パフォーマンス", () => {
    test("ページロードが3秒以内に完了する", async ({ page }) => {
        const startTime = Date.now();

        const portfolioPage = new PortfolioPage(page);
        await portfolioPage.goto();

        const loadTime = Date.now() - startTime;

        console.log(`✓ ページロード時間: ${loadTime}ms`);
        expect(loadTime).toBeLessThan(3000);
    });

    test("ソート切り替えが1秒以内に完了する", async ({ page }) => {
        const portfolioPage = new PortfolioPage(page);
        await portfolioPage.goto();

        const startTime = Date.now();
        await portfolioPage.updatedSortButton.click();
        await portfolioPage.repositoryList.waitFor({ state: "visible" });
        const sortTime = Date.now() - startTime;

        console.log(`✓ ソート切り替え時間: ${sortTime}ms`);
        expect(sortTime).toBeLessThan(1000);
    });
});

test.describe("Portfolio ページ - クロスブラウザ", () => {
    test("複数のブラウザで正常に動作する", async ({ page, browserName }) => {
        const portfolioPage = new PortfolioPage(page);
        await portfolioPage.goto();

        // 基本的な表示確認
        await expect(portfolioPage.pageTitle).toBeVisible();
        await expect(portfolioPage.repositoryCards.first()).toBeVisible();
        await expect(portfolioPage.starsSortButton).toBeVisible();

        // ソート機能の動作確認
        await portfolioPage.updatedSortButton.click();
        await expect(portfolioPage.updatedSortButton).toHaveAttribute("aria-pressed", "true");

        console.log(`✓ ${browserName}で正常に動作しました`);
    });
});
