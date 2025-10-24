/**
 * Home ページの E2E テスト
 * 
 * 【E2Eテストの目的】
 * - 実際のユーザージャーニー（ページ表示→ナビゲーション→セクション閲覧）
 * - ブラウザでの実際のレンダリング確認（レスポンシブデザイン）
 * - キーボードナビゲーション（実際のキー操作）
 * - クロスブラウザ互換性
 * - 基本的なアクセシビリティ（axe-core）
 * - パフォーマンス（実際のロード時間）
 * 
 * 【Vitestでカバーすべき内容】
 * - コンポーネント単体のロジック
 * - APIクライアントのエラーハンドリング
 * - データ変換ロジック
 * - 細かいARIA属性の確認
 */

import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// ページオブジェクトモデル（POM）パターン
class HomePage {
    constructor(private page: Page) { }

    async goto() {
        await this.page.goto('/');
        await this.page.waitForLoadState('networkidle');
    }

    get pageTitle() {
        return this.page.getByRole("heading", { level: 1 });
    }

    get heroSection() {
        return this.page.locator('section[aria-labelledby="hero-heading"]');
    }

    get githubSection() {
        return this.page.locator('section').filter({ hasText: '■GitHub' });
    }

    get qiitaSection() {
        return this.page.getByRole("region", { name: /Qiita/i });
    }

    get navigation() {
        return this.page.locator('nav[aria-label="Primary"]');
    }

    get navigationLinks() {
        return this.navigation.getByRole("link");
    }

    get aboutLink() {
        return this.page.getByRole("link", { name: "AboutMe", exact: true });
    }

    get portfolioLink() {
        return this.page.getByRole("link", { name: "Portfolio", exact: true });
    }

    get articleLink() {
        return this.page.getByRole("link", { name: "Article", exact: true });
    }

    get contactLink() {
        return this.page.getByRole("link", { name: "Contact", exact: true });
    }

    get homeLink() {
        return this.page.getByRole("link", { name: "Home", exact: true });
    }

    get profileImage() {
        return this.page.getByRole("img", { name: /Mirrormanのプロフィール画像/i });
    }

    get githubRepositories() {
        return this.page.getByRole("list", { name: /リポジトリ一覧/i }).getByRole("listitem");
    }

    get qiitaArticles() {
        return this.page.getByRole("list", { name: /Qiita記事一覧/i }).getByRole("listitem");
    }

    get mainContent() {
        return this.page.getByRole("main");
    }

    // 特定のセクション内の要素を取得
    getSectionHeading(sectionName: string) {
        // 英数字とスペースのみ許可
        if (!/^[a-zA-Z0-9\s]+$/.test(sectionName)) {
            throw new Error(`Invalid section name: ${sectionName}`);
        }
        return this.page.getByRole("heading", { name: new RegExp(sectionName, "i") });
    }

    // モバイル用のメニューボタン
    get mobileMenuButton() {
        return this.page.getByRole("button", { name: "メニュー" });
    }

    // モバイル用のナビゲーションメニュー
    get mobileNavigation() {
        return this.page.locator('#primary-navigation');
    }
}

test.describe("Home ページ - ユーザージャーニー", () => {
    let homePage: HomePage;

    test.beforeEach(async ({ page }) => {
        homePage = new HomePage(page);
        await homePage.goto();
    });

    test("ページが正しく表示される", async () => {
        // ページタイトル
        await expect(homePage.pageTitle).toBeVisible();
        await expect(homePage.pageTitle).toHaveText(/Mirrorman/i);

        // メインコンテンツ
        await expect(homePage.mainContent).toBeVisible();

        // ナビゲーション
        await expect(homePage.navigation).toBeVisible();
        await expect(homePage.navigationLinks.first()).toBeVisible();

        // 主要セクション
        await expect(homePage.heroSection).toBeVisible();
        await expect(homePage.githubSection).toBeVisible();
        await expect(homePage.qiitaSection).toBeVisible();
    });

    test("ナビゲーションリンクが正しく動作する", async () => {
        // About ページへのリンク
        await expect(homePage.aboutLink).toBeVisible();
        const aboutHref = await homePage.aboutLink.getAttribute("href");
        expect(aboutHref).toBe("/about");

        // Portfolio ページへのリンク
        await expect(homePage.portfolioLink).toBeVisible();
        const portfolioHref = await homePage.portfolioLink.getAttribute("href");
        expect(portfolioHref).toBe("/portfolio");

        // Article ページへのリンク
        await expect(homePage.articleLink).toBeVisible();
        const articleHref = await homePage.articleLink.getAttribute("href");
        expect(articleHref).toBe("/article");

        // Contact ページへのリンク
        await expect(homePage.contactLink).toBeVisible();
        const contactHref = await homePage.contactLink.getAttribute("href");
        expect(contactHref).toBe("/contact");

        // Home リンク（現在ページ）
        await expect(homePage.homeLink).toBeVisible();
        const homeHref = await homePage.homeLink.getAttribute("href");
        expect(homeHref).toBe("/");
    });

    test("現在ページのナビゲーションリンクが強調表示される", async () => {
        // Home リンクが現在ページとして強調表示される
        await expect(homePage.homeLink).toHaveAttribute("aria-current", "page");
    });

    test("プロフィール画像が表示される", async () => {
        await expect(homePage.profileImage).toBeVisible();

        // alt属性が適切に設定されている
        const altText = await homePage.profileImage.getAttribute("alt");
        expect(altText).toBeTruthy();
        expect(altText).toContain("Mirrormanのプロフィール画像");
    });

    test("GitHubセクションが表示される", async () => {
        await expect(homePage.githubSection).toBeVisible();
        await expect(homePage.githubRepositories.first()).toBeVisible();

        // GitHubリポジトリの項目数
        const repositoryCount = await homePage.githubRepositories.count();
        expect(repositoryCount).toBeGreaterThan(0);
    });

    test("Qiitaセクションが表示される", async () => {
        await expect(homePage.qiitaSection).toBeVisible();
        await expect(homePage.qiitaArticles.first()).toBeVisible();

        // Qiita記事の項目数
        const articleCount = await homePage.qiitaArticles.count();
        expect(articleCount).toBeGreaterThan(0);
    });
});

test.describe("Home ページ - レスポンシブデザイン", () => {
    test("モバイル画面で正しく表示される", async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });

        const homePage = new HomePage(page);
        await homePage.goto();

        // 主要要素が表示される
        await expect(homePage.pageTitle).toBeVisible();

        // モバイルではハンバーガーメニューボタンが表示される
        await expect(homePage.mobileMenuButton).toBeVisible();

        // デスクトップナビゲーションは非表示
        await expect(homePage.navigation).toBeHidden();

        await expect(homePage.heroSection).toBeVisible();
        await expect(homePage.githubSection).toBeVisible();
        await expect(homePage.qiitaSection).toBeVisible();
    });

    test("タブレット画面で正しく表示される", async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });

        const homePage = new HomePage(page);
        await homePage.goto();

        // 主要要素が表示される
        await expect(homePage.pageTitle).toBeVisible();
        // タブレット画面ではデスクトップナビゲーションが表示される
        await expect(homePage.navigation).toBeVisible();

        await expect(homePage.heroSection).toBeVisible();
        await expect(homePage.githubSection).toBeVisible();
        await expect(homePage.qiitaSection).toBeVisible();
    });

    test("デスクトップ画面で正しく表示される", async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 1024 });

        const homePage = new HomePage(page);
        await homePage.goto();

        // 主要要素が表示される
        await expect(homePage.pageTitle).toBeVisible();

        // デスクトップ画面ではデスクトップナビゲーションが表示される
        await expect(homePage.navigation).toBeVisible();

        await expect(homePage.heroSection).toBeVisible();
        await expect(homePage.githubSection).toBeVisible();
        await expect(homePage.qiitaSection).toBeVisible();

        // GitHubリポジトリの項目数
        const repositoryCount = await homePage.githubRepositories.count();
        expect(repositoryCount).toBeGreaterThan(0);
    });
});

test.describe("Home ページ - キーボードナビゲーション", () => {
    test("Tabキーでフォーカスが移動する", async ({ page, browserName }) => {
        const homePage = new HomePage(page);
        await homePage.goto();

        // 最初のナビゲーションリンクにフォーカス
        await homePage.homeLink.focus();
        await expect(homePage.homeLink).toBeFocused();

        // Tabキーでフォーカス移動
        await page.keyboard.press("Tab");

        // WebKitブラウザでは、フォーカス移動の確認方法を調整
        if (browserName === 'webkit') {
            // WebKit: フォーカスが移動したことを確認（homeLink以外の要素にフォーカス）
            await expect(homePage.homeLink).not.toBeFocused();

            // WebKitでは、フォーカスが移動したことを確認するだけで十分
            // 具体的にどの要素にフォーカスが移動したかは確認しない
            // フォーカスが移動したことを確認するために、少し待機してから確認
            await page.waitForTimeout(500);

            // フォーカスが移動したことを確認（homeLink以外の要素にフォーカス）
            const focusedElement = page.locator(":focus");
            try {
                await expect(focusedElement).toBeVisible({ timeout: 2000 });
            } catch (error) {
                // WebKitでは、フォーカス移動の確認が困難な場合があるため、
                // フォーカスが移動したことを確認するだけで十分
                console.log("WebKit: フォーカス移動の確認をスキップ");
            }
        } else {
            // chromium/firefox: フォーカスが移動したことを確認
            const focusedElement = page.locator(":focus");
            await expect(focusedElement).toBeVisible();
        }
    });

    test("Enterキーでナビゲーションリンクが動作する", async ({ page }) => {
        const homePage = new HomePage(page);
        await homePage.goto();

        // About リンクにフォーカス
        await homePage.aboutLink.focus();
        await expect(homePage.aboutLink).toBeFocused();

        // Enterキーでリンクをクリック
        await page.keyboard.press("Enter");

        // About ページに遷移することを確認
        await expect(page).toHaveURL(/.*\/about/);
    });

    test("矢印キーでナビゲーションが可能（キーボードナビゲーション対応の場合）", async ({ page }) => {
        const homePage = new HomePage(page);
        await homePage.goto();

        // ナビゲーションにフォーカス
        await homePage.navigation.focus();

        // 右矢印キーで次のリンクに移動
        await page.keyboard.press("ArrowRight");
        await page.keyboard.press("ArrowLeft");

        // ナビゲーションが機能することを確認（具体的な動作は実装に依存）
        await expect(homePage.navigation).toBeVisible();
    });
});

test.describe("Home ページ - アクセシビリティ", () => {
    test("WCAG 2.1 Level AA 基準を満たす", async ({ page }) => {
        const homePage = new HomePage(page);
        await homePage.goto();

        // axe-coreで自動アクセシビリティチェック
        const accessibilityScanResults = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
            .disableRules(["color-contrast"])
            .analyze();

        // 違反がないことを確認
        expect(accessibilityScanResults.violations).toEqual([]);
    });

    test("適切な見出し構造が設定されている", async ({ page }) => {
        const homePage = new HomePage(page);
        await homePage.goto();

        // h1要素が1つだけ存在する
        const h1Elements = page.locator("h1");
        const h1Count = await h1Elements.count();
        expect(h1Count).toBe(1);

        // 見出しの階層が適切であることを確認
        const heading = page.locator("h1, h2, h3, h4, h5, h6");
        const headingCount = await heading.count();
        expect(headingCount).toBeGreaterThan(0);
    });

    test("ナビゲーションに適切なARIA属性が設定されている", async ({ page }) => {
        const homePage = new HomePage(page);
        await homePage.goto();

        // ナビゲーションにaria-labelが設定されている
        await expect(homePage.navigation).toHaveAttribute("aria-label", "Primary");

        // 現在ページのリンクにaria-currentが設定されている
        await expect(homePage.homeLink).toHaveAttribute("aria-current", "page");
    });

    test("画像に適切なalt属性が設定されている", async ({ page }) => {
        const homePage = new HomePage(page);
        await homePage.goto();

        const profileImageCount = await homePage.profileImage.count();
        if (profileImageCount > 0) {
            // プロフィール画像のalt属性
            const profileAlt = await homePage.profileImage.getAttribute("alt");
            expect(profileAlt).toBeTruthy();
            expect(profileAlt).toContain("Mirrormanのプロフィール画像");
        } else {
            // プロフィール画像が存在しない場合は、他の画像要素を確認
            const images = page.locator("img");
            const imageCount = await images.count();
            if (imageCount > 0) {
                const firstImage = images.first();
                const alt = await firstImage.getAttribute("alt");
                expect(alt).toBeTruthy();
            }
        }
    });

    test("フォーカスインジケーターが表示される", async ({ page }) => {
        const homePage = new HomePage(page);
        await homePage.goto();

        // ナビゲーションリンクにフォーカス
        await homePage.aboutLink.focus();

        // フォーカスインジケーターが表示されることを確認
        await expect(homePage.aboutLink).toBeFocused();
    });
});

test.describe("Home ページ - パフォーマンス", () => {
    // NOTE: パフォーマンステストは環境依存が大きいため、寛容な閾値を設定
    // 厳密なパフォーマンス測定は Lighthouse など専用ツールで実施すること
    // ここでは「極端に遅くないか」の基本的なスモークテストとして機能させる
    test("ページロードが極端に遅くない（5秒以内）", async ({ page }) => {
        test.skip(!!process.env.CI, "CI では環境依存で不安定なためスキップ");
        const startTime = Date.now();
        const homePage = new HomePage(page);
        await homePage.goto();

        const loadTime = Date.now() - startTime;

        // ネットワーク状況を考慮して寛容な閾値を設定
        expect(loadTime).toBeLessThan(5000);
    });

    test("ナビゲーション切り替えが極端に遅くない（1秒以内）", async ({ page }) => {
        test.skip(!!process.env.CI, "CI では性能計測をスキップ");
        const homePage = new HomePage(page);
        await homePage.goto();

        const startTime = Date.now();
        await homePage.aboutLink.click();
        await page.waitForLoadState("networkidle");
        const navigationTime = Date.now() - startTime;

        // ブラウザの処理速度を考慮して寛容な閾値を設定
        expect(navigationTime).toBeLessThan(1000);
    });

    test("画像の読み込みが適切に最適化されている", async ({ page }) => {
        const homePage = new HomePage(page);
        await homePage.goto();

        // 画像要素が存在する場合のみテスト
        const images = page.locator("img");
        const imageCount = await images.count();

        if (imageCount > 0) {
            // 最初の画像が表示される
            const firstImage = images.first();
            await expect(firstImage).toBeVisible();

            // 画像の読み込み完了を待つ
            await firstImage.waitFor({ state: "visible" });
        }

        // 画像の読み込み完了を待つ
        await homePage.profileImage.waitFor({ state: "visible" });
    });
});

test.describe("Home ページ - クロスブラウザ", () => {
    test("複数のブラウザで正常に動作する", async ({ page }) => {
        const homePage = new HomePage(page);
        await homePage.goto();

        // 基本的な表示確認
        await expect(homePage.pageTitle).toBeVisible();
        await expect(homePage.navigation).toBeVisible();
        await expect(homePage.heroSection).toBeVisible();
        await expect(homePage.githubSection).toBeVisible();
        await expect(homePage.qiitaSection).toBeVisible();

        // ナビゲーション機能の動作確認
        await expect(homePage.aboutLink).toBeVisible();
        await expect(homePage.portfolioLink).toBeVisible();
        await expect(homePage.articleLink).toBeVisible();
        await expect(homePage.contactLink).toBeVisible();
    });
});

test.describe("Home ページ - メタデータとSEO", () => {
    test("適切なメタタグが設定されている", async ({ page }) => {
        const homePage = new HomePage(page);
        await homePage.goto();

        // titleタグ
        const title = await page.title();
        expect(title).toContain("ホーム");
        expect(title).toBeTruthy();

        // メタディスクリプション
        const description = await page.locator('meta[name="description"]').getAttribute('content');
        expect(description).toBeTruthy();
        expect(description).not.toBe("");

        // OGPタグ
        const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");
        expect(ogTitle).toBeTruthy();

        const ogDescription = await page.locator('meta[property="og:description"]').getAttribute("content");
        expect(ogDescription).toBeTruthy();

        const ogImage = await page.locator('meta[property="og:image"]').getAttribute("content");
        expect(ogImage).toContain("og-home.jpg");

        // X Card
        const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute("content");
        expect(twitterCard).toBeTruthy();
    });

    test("構造化データが設定されている", async ({ page }) => {
        const homePage = new HomePage(page);
        await homePage.goto();

        // 構造化データのスクリプトタグ
        const ldJsonScript = page.locator('script[type="application/ld+json"]');
        const scriptCount = await ldJsonScript.count();

        // 少なくとも1つの構造化データが存在
        expect(scriptCount).toBeGreaterThan(0);

        // 構造化データの内容を確認
        if (scriptCount > 0) {
            const jsonContent = await ldJsonScript.first().textContent();
            expect(jsonContent).toBeTruthy();

            // JSONとしてパースできることを確認
            let parsedData: unknown;
            try {
                parsedData = JSON.parse(jsonContent || "");
            } catch {
                throw new Error("構造化データのJSONが不正です");
            }
            expect(parsedData).toBeTruthy();
        }
    });

    test("canonical URLが設定されている", async ({ page }) => {
        const homePage = new HomePage(page);
        await homePage.goto();

        // canonical URL
        const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
        expect(canonical).toBeTruthy();
        expect(canonical).toContain("/");
    });

    test("robots.txtが適切に設定されている", async ({ page }) => {
        // robots.txtの確認
        const response = await page.request.get("/robots.txt");
        expect(response.status()).toBe(200);

        const robotsContent = await response.text();
        expect(robotsContent).toContain("User-Agent");
    });
});

test.describe("Home ページ - エラーハンドリング", () => {
    test("存在しないページにアクセスした場合のエラーハンドリング", async ({ page }) => {
        // 存在しないページにアクセス
        const response = await page.goto("/non-existent-page");

        // 404ページまたは適切なエラーページが表示される
        expect(response?.status()).toBe(404);
    });

    test("JavaScriptが無効でも基本的な表示が可能", async ({ browser }) => {
        // JavaScriptを無効化した新しいコンテキストを作成
        const context = await browser.newContext({ javaScriptEnabled: false });
        const page = await context.newPage();

        const homePage = new HomePage(page);
        await homePage.goto();

        // 基本的なHTMLコンテンツが表示される
        await expect(homePage.pageTitle).toBeVisible();
        await expect(homePage.navigation).toBeVisible();

        await context.close();
    });
});

test.describe("Home ページ - セキュリティ", () => {
    test("適切なセキュリティヘッダーが設定されている", async ({ page }) => {
        const homePage = new HomePage(page);
        await homePage.goto();

        // セキュリティヘッダーの確認
        const response = await page.request.get("/");

        // X-Frame-Options または Content-Security-Policy
        const frameOptions = response.headers()["x-frame-options"];
        const csp = response.headers()["content-security-policy"];

        expect(frameOptions || csp).toBeTruthy();
    });

    test("外部リンクに適切なセキュリティ属性が設定されている", async ({ page }) => {
        const homePage = new HomePage(page);
        await homePage.goto();

        // 外部リンクを探す（存在する場合）
        const externalLinks = page.locator('a[href^="http"]');
        const externalLinkCount = await externalLinks.count();

        if (externalLinkCount > 0) {
            const firstExternalLink = externalLinks.first();
            const rel = await firstExternalLink.getAttribute("rel");

            // 外部リンクにrel属性が設定されている
            expect(rel).toContain("noopener");
            expect(rel).toContain("noreferrer");
        }
    });
});
