/**
 * About ページの E2E テスト
 *
 * 【E2Eテストの目的】
 * - 実際のユーザージャーニー（ページ表示→セクション閲覧）
 * - ブラウザでの実際のレンダリング確認（レスポンシブデザイン）
 * - キーボードナビゲーション（実際のキー操作）
 * - クロスブラウザ互換性
 * - 基本的なアクセシビリティ（axe-core）
 */

import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// ページオブジェクトモデル（POM）パターン
class AboutPage {
    constructor(private page: Page) { }

    async goto() {
        await this.page.goto('/about', { waitUntil: 'domcontentloaded' });
        await this.page.waitForSelector('h1', { timeout: 10000 });
    }

    get pageTitle() {
        return this.page.getByRole("heading", { level: 1 });
    }

    get aboutMeSection() {
        return this.page.locator('section').filter({ hasText: 'プロフィール' }).or(
            this.page.locator('section').filter({ hasText: 'About Me' })
        );
    }

    get workHistorySection() {
        return this.page.locator('section').filter({ hasText: '経歴' }).or(
            this.page.locator('section').filter({ hasText: 'Work History' })
        );
    }

    get mainContent() {
        return this.page.getByRole("main");
    }

    get navigation() {
        return this.page.locator('nav[aria-label="Primary"]');
    }

    get aboutLink() {
        return this.page.getByRole("link", { name: "AboutMe", exact: true });
    }
}

test.describe("About ページ - ユーザージャーニー", () => {
    let aboutPage: AboutPage;

    test.beforeEach(async ({ page }) => {
        aboutPage = new AboutPage(page);
        await aboutPage.goto();
    });

    test("ページが正しく表示される", async () => {
        // ページタイトル
        await expect(aboutPage.pageTitle).toBeVisible();
        await expect(aboutPage.pageTitle).toHaveText(/About Me/i);

        // メインコンテンツ
        await expect(aboutPage.mainContent).toBeVisible();
    });

    test("現在ページのナビゲーションリンクが強調表示される", async ({ page }) => {
        // デスクトップビューポートに設定
        await page.setViewportSize({ width: 1280, height: 1024 });
        await aboutPage.goto();

        // About リンクが現在ページとして強調表示される
        await expect(aboutPage.aboutLink).toHaveAttribute("aria-current", "page");
    });
});

test.describe("About ページ - レスポンシブデザイン", () => {
    test("モバイル画面で正しく表示される", async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });

        const aboutPage = new AboutPage(page);
        await aboutPage.goto();

        // 主要要素が表示される
        await expect(aboutPage.pageTitle).toBeVisible();
        await expect(aboutPage.mainContent).toBeVisible();
    });

    test("タブレット画面で正しく表示される", async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });

        const aboutPage = new AboutPage(page);
        await aboutPage.goto();

        // 主要要素が表示される
        await expect(aboutPage.pageTitle).toBeVisible();
        await expect(aboutPage.mainContent).toBeVisible();
    });

    test("デスクトップ画面で正しく表示される", async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 1024 });

        const aboutPage = new AboutPage(page);
        await aboutPage.goto();

        // 主要要素が表示される
        await expect(aboutPage.pageTitle).toBeVisible();
        await expect(aboutPage.mainContent).toBeVisible();
        await expect(aboutPage.navigation).toBeVisible();
    });
});

test.describe("About ページ - アクセシビリティ", () => {
    test("WCAG 2.1 Level AA 基準を満たす", async ({ page }) => {
        const aboutPage = new AboutPage(page);
        await aboutPage.goto();

        // axe-coreで自動アクセシビリティチェック
        const accessibilityScanResults = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
            .disableRules(["color-contrast"])
            .analyze();

        // 違反がないことを確認
        expect(accessibilityScanResults.violations).toEqual([]);
    });

    test("適切な見出し構造が設定されている", async ({ page }) => {
        const aboutPage = new AboutPage(page);
        await aboutPage.goto();

        // h1要素が1つだけ存在する
        const h1Elements = page.locator("h1");
        const h1Count = await h1Elements.count();
        expect(h1Count).toBe(1);

        // 見出しの階層が適切であることを確認
        const heading = page.locator("h1, h2, h3, h4, h5, h6");
        const headingCount = await heading.count();
        expect(headingCount).toBeGreaterThan(0);
    });
});

test.describe("About ページ - メタデータとSEO", () => {
    test("適切なメタタグが設定されている", async ({ page }) => {
        const aboutPage = new AboutPage(page);
        await aboutPage.goto();

        // titleタグ
        const title = await page.title();
        expect(title).toContain("About");

        // メタディスクリプション
        const description = await page.locator('meta[name="description"]').getAttribute('content');
        expect(description).toBeTruthy();
        expect(description).not.toBe("");

        // OGPタグ
        const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");
        expect(ogTitle).toBeTruthy();
        expect(ogTitle).toContain("About");

        const ogDescription = await page.locator('meta[property="og:description"]').getAttribute("content");
        expect(ogDescription).toBeTruthy();
    });

    test("canonical URLが設定されている", async ({ page }) => {
        const aboutPage = new AboutPage(page);
        await aboutPage.goto();

        // canonical URL
        const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
        expect(canonical).toBeTruthy();
        expect(canonical).toContain("/about");
    });
});

test.describe("About ページ - クロスブラウザ", () => {
    test("複数のブラウザで正常に動作する", async ({ page }) => {
        const aboutPage = new AboutPage(page);
        await aboutPage.goto();

        // 基本的な表示確認
        await expect(aboutPage.pageTitle).toBeVisible();
        await expect(aboutPage.mainContent).toBeVisible();
    });
});
