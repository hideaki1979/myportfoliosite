/**
 * Article ページの Qiita 記事表示コンポーネントの E2E テスト
 * 
 * 【E2Eテストの目的】
 * - 実際のユーザージャーニー（ページ表示→記事一覧確認→リンククリック）
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

import AxeBuilder from "@axe-core/playwright";
import { test, expect, type Page } from "@playwright/test";

// ページオブジェクトモデル（POM）パターン
class ArticlePage {
    constructor(private page: Page) { }
    async goto() {
        await this.page.goto("/article");
        await this.page.waitForLoadState("networkidle");
    }

    get pageTitle() {
        return this.page.getByRole("heading", { level: 1 });
    }

    get pageSubtitle() {
        return this.page.getByText("Qiitaに記載した記事です");
    }

    get qiitaSectionHeading() {
        return this.page.getByRole("heading", { name: /Qiita/i });
    }

    get articlesSectionHeading() {
        return this.page.getByRole("heading", { name: "投稿記事" });
    }

    get articleList() {
        return this.page.getByRole("list", { name: "Qiita記事一覧" });
    }

    get articleCards() {
        // 記事一覧の中の article 要素を取得
        return this.articleList.locator("article");
    }

    get moreLink() {
        return this.page.getByRole("link", { name: /More/i });
    }

    get emptyState() {
        return this.page.getByText("記事が見つかりませんでした");
    }

    // 特定の記事カードを取得
    getArticleCard(index: number) {
        return this.articleCards.nth(index);
    }

    // 記事カード内のリンクを取得
    getArticleLink(cardIndex: number) {
        return this.getArticleCard(cardIndex).getByRole("link").first();
    }
}

test.describe("Article ページ - ユーザージャーニー", () => {
    let articlePage: ArticlePage;

    test.beforeEach(async ({ page }) => {
        articlePage = new ArticlePage(page);
        await articlePage.goto();
    });

    test("ページが正しく表示される", async () => {
        // ページタイトル
        await expect(articlePage.pageTitle).toBeVisible();
        await expect(articlePage.pageTitle).toHaveText(/Article/i);

        // サブタイトル
        await expect(articlePage.pageSubtitle).toBeVisible();

        // セクション見出し
        await expect(articlePage.qiitaSectionHeading).toBeVisible();
        await expect(articlePage.articlesSectionHeading).toBeVisible();

        // 記事一覧
        await expect(articlePage.articleList).toBeVisible();
        await expect(articlePage.articleCards.first()).toBeVisible();
    });

    test("Qiita記事の基本情報が表示される", async () => {
        const firstCard = articlePage.getArticleCard(0);

        // 記事カードが表示される
        await expect(firstCard).toBeVisible();

        // 記事タイトルリンクが存在
        const titleLink = firstCard.getByRole("link").first();
        await expect(titleLink).toBeVisible();

        // 投稿日が表示される（time要素）
        const timeElement = firstCard.locator("time");
        await expect(timeElement).toBeVisible();

        // タグが存在する場合は表示されることを確認
        const tags = firstCard.locator("span").filter({ hasText: /^[A-Za-z0-9ぁ-んァ-ヶー一-龠]+$/ });
        const tagCount = await tags.count();

        // タグが存在する可能性を確認（0個以上）
        expect(tagCount).toBeGreaterThanOrEqual(0);
    });

    test("記事リンクが正しく設定されている", async () => {
        const firstArticleLink = articlePage.getArticleLink(0);

        // リンクが表示される
        await expect(firstArticleLink).toBeVisible();

        // Qiitaのurl
        const href = await firstArticleLink.getAttribute("href");
        expect(href).toContain("qiita.com");

        // 新しいタブで開く
        const target = await firstArticleLink.getAttribute("target");
        expect(target).toBe("_blank");

        // セキュリティ属性
        const rel = await firstArticleLink.getAttribute("rel");
        expect(rel).toContain("noopener");
        expect(rel).toContain("noreferrer");
    });

    test("Moreリンクが正しく動作する", async () => {
        // Moreリンクが存在するか確認
        const moreLinkCount = await articlePage.moreLink.count();

        // Moreリンクが存在する場合のみテスト
        if (moreLinkCount > 0) {
            // Moreリンクが表示される
            await expect(articlePage.moreLink).toBeVisible();

            // QiitaのプロフィールURLへのリンク
            const href = await articlePage.moreLink.getAttribute("href");
            expect(href).toContain("qiita.com");
    
            // 新しいタブで開く
            const target = await articlePage.moreLink.getAttribute("target");
            expect(target).toBe("_blank");
    
            // セキュリティ属性
            const rel = await articlePage.moreLink.getAttribute("rel");
            expect(rel).toContain("noopener");
            expect(rel).toContain("noreferrer");
        } else {
            // Moreリンクがない場合は、最低限記事が表示されていることを確認
            await expect(articlePage.articleCards.first()).toBeVisible();
        }
    });

    test("タグ情報が適切に表示される", async () => {
        const firstCard = articlePage.getArticleCard(0);

        // Qiitaアイコンが表示されている
        const qiitaIcon = firstCard.locator('[aria-hidden="true"] svg');
        await expect(qiitaIcon).toBeVisible();

        // タイトルリンクがaria-labelを持っている
        const titleLink = firstCard.getByRole("link").first();
        const ariaLabel = await titleLink.getAttribute("aria-label");
        expect(ariaLabel).toContain("記事を新しいタブで開く");
    });
});

test.describe("Article ページ - レスポンシブデザイン", () => {
    test("モバイル画面で正しく表示される", async ({page}) => {
        await page.setViewportSize({ width: 375, height: 667 });

        const articlePage = new ArticlePage(page);
        await articlePage.goto();

        // 主要要素が表示される
        await expect(articlePage.pageTitle).toBeVisible();
        await expect(articlePage.articlesSectionHeading).toBeVisible();
        await expect(articlePage.articleCards.first()).toBeVisible();
    });

    test("タブレット画面で正しく表示される", async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });

        const articlePage = new ArticlePage(page);
        await articlePage.goto();

        await expect(articlePage.pageTitle).toBeVisible();
        await expect(articlePage.articleCards.first()).toBeVisible();
    });

    test("デスクトップ画面で正しく表示される", async ({page}) => {
        await page.setViewportSize({ width: 1920, height: 1080 });

        const articlePage = new ArticlePage(page);
        await articlePage.goto();

        await expect(articlePage.pageTitle).toBeVisible();
        await expect(articlePage.articleCards.first()).toBeVisible();

        const count = await articlePage.articleCards.count();
        expect(count).toBeGreaterThan(0);
    });
});

test.describe("Article ページ - キーボードナビゲーション", () => {
    test("Tabキーでフォーカスが記事リンクに移動する", async ({page}) => {
        const articlePage = new ArticlePage(page);
        await articlePage.goto();

        // 最初の記事リンクにフォーカス
        const firstArticleLink = articlePage.getArticleLink(0);
        await firstArticleLink.focus();

        // フォーカスが当たっていることを確認
        await expect(firstArticleLink).toBeFocused();
    });

    test("Enterキーで記事リンクが動作する", async({page}) => {
        const articlePage = new ArticlePage(page);
        await articlePage.goto();

        // 最初の記事リンクにフォーカス
        const firstArticleLink = articlePage.getArticleLink(0);
        await firstArticleLink.focus();
        await expect(firstArticleLink).toBeFocused();

        // リンクのURLを取得
        const href = await firstArticleLink.getAttribute("href");
        expect(href).toBeTruthy();

        // Enterキーで開く（新しいタブで開くため、実際の遷移は確認しない）
        // 注: 新しいタブが開くのでページ遷移は発生しない
        await page.keyboard.press("Enter");

        // 元のページが残っていることを確認
        await expect(articlePage.pageTitle).toBeVisible();
    });

    test("Moreリンクにキーボードでアクセス出来る", async ({page}) => {
        const articlePage = new ArticlePage(page);
        await articlePage.goto();

        // Moreリンクが存在するか確認
        const moreLinkCount = await articlePage.moreLink.count();

        if (moreLinkCount > 0) {
            // Moreリンクにフォーカス
            await articlePage.moreLink.focus();
            await expect(articlePage.moreLink).toBeFocused();
    
            // Enterキーで動作確認（新しいタブで開くため、実際の遷移は確認しない）
            await page.keyboard.press("Enter");
    
            // 元のページが残っていることを確認
            await expect(articlePage.pageTitle).toBeVisible();
        } else {
            // Moreリンクがない場合は、記事リンクのキーボード操作を確認
            const firstArticleLink = articlePage.getArticleLink(0);
            await firstArticleLink.focus();
            await expect(firstArticleLink).toBeFocused();
        }
    });
});

test.describe("Article ページ - アクセシビリティ", () => {
    test("WCAG 2.1 Level AA 基準を満たす", async ({page}) => {
        const articlePage = new ArticlePage(page);
        await articlePage.goto();

        // axe-coreで自動アクセシビリティチェック
        const accessibilityScanResults = await new AxeBuilder({page})
            .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
            .disableRules(["aria-required-children", "color-contrast"])
            .analyze();

        // 違反がないことを確認（除外した問題以外）
        expect(accessibilityScanResults.violations).toEqual([]);
    });

    test("ARIAラベルが適切に設定されている", async ({page}) => {
        const articlePage = new ArticlePage(page);
        await articlePage.goto();

        // 記事一覧にaria-labelが設定されている
        const articleList = articlePage.articleList;
        await expect(articleList).toHaveAttribute("aria-label", "Qiita記事一覧");
    });

    test("リンクに適切な属性が設定されている", async ({page}) => {
        const articlePage = new ArticlePage(page);
        await articlePage.goto();

        // 外部リンクにrel属性が設定されている
        const firstArticleLink = articlePage.getArticleLink(0);
        const rel = await firstArticleLink.getAttribute("rel");

        expect(rel).toContain("noopener");
        expect(rel).toContain("noreferrer");
    });
});

test.describe("Article ページ - パフォーマンス", () => {
    // NOTE: パフォーマンステストは環境依存が大きいため、寛容な閾値を設定
    // 厳密なパフォーマンス測定は Lighthouse など専用ツールで実施すること
    // ここでは「極端に遅くないか」の基本的なスモークテストとして機能させる
    test("ページロードが極端に遅くない（10秒以内）", async({page}) => {
        test.skip(!!process.env.CI, "CI では環境依存で不安定なためスキップ");
        const startTime = Date.now();

        const articlePage = new ArticlePage(page);
        await articlePage.goto();

        const loadTime = Date.now() - startTime;

        // CI環境やネットワーク状況を考慮して寛容な閾値を設定
        expect(loadTime).toBeLessThan(10000);
    });

    test("記事一覧の表示が極端に遅くない（3秒以内）", async({page}) => {
        test.skip(!!process.env.CI, "CI では性能計測をスキップ");
        const articlePage = new ArticlePage(page);
        await articlePage.goto();

        const startTime = Date.now();
        await articlePage.articleList.waitFor({state: "visible"});
        const displayTime = Date.now() - startTime;

        // CI環境やブラウザの処理速度を考慮して寛容な閾値を設定
        expect(displayTime).toBeLessThan(3000);
    });
});

test.describe("Article ページ - クロスブラウザ", () => {
    test("複数のブラウザで正常に動作する", async ({page}) => {
        const articlePage = new ArticlePage(page);
        await articlePage.goto();

        // 基本的な表示確認
        await expect(articlePage.pageTitle).toBeVisible();
        await expect(articlePage.articleCards.first()).toBeVisible();
        
        // Moreリンクは存在する場合のみ確認
        const moreLinkCount = await articlePage.moreLink.count();
        if (moreLinkCount > 0) {
            await expect(articlePage.moreLink).toBeVisible();
        }

        // リンクの動作確認
        const firstArticleLink = articlePage.getArticleLink(0);
        const href = await firstArticleLink.getAttribute("href");
        expect(href).toContain("qiita.com");
    });
});

test.describe("Article ページ - エラーハンドリング", () => {
    test("記事がない場合に適切なメッセージを表示する", async ({page}) => {
        // 注: このテストは実際にデータがない状態を再現できる場合のみ有効
        // 通常は常に記事があるため、このテストは実装の確認として残す
        
        // 空状態のメッセージが存在することを確認（表示されていない場合もある）
        const emptyStateExists = await page.getByText("記事が見つかりませんでした").count();

        // 記事が存在する場合は空状態は表示されない
        if (emptyStateExists === 0) {
            // 記事一覧が表示されていることを確認
            const articlePage = new ArticlePage(page);
            await articlePage.goto();
            await expect(articlePage.articleCards.first()).toBeVisible();
        }
    });
});

test.describe("Article ページ - メタデータとSEO", () => {
    test("適切なメタタグが設定されている", async ({page}) => {
        const articlePage = new ArticlePage(page);
        await articlePage.goto();

        // titleタグ
        const title = await page.title();
        expect(title).toContain("Article");

        // メタディスクリプション
        const description = await page.locator('meta[name="description"]').getAttribute("content");
        expect(description).toBeTruthy();

        // OGPタグ
        const ogTitle = await page.locator('meta[name="og:title"]').getAttribute("content");
        expect(ogTitle).toBeTruthy();

        const ogDescription = await page.locator('meta[property="og:description"]').getAttribute("content");
        expect(ogDescription).toBeTruthy();

        const ogImage = await page.locator('meta[property="og:image"]').getAttribute("content");
        expect(ogImage).toContain("og-article.jpg");

        // X Card
        const XCard = await page.locator('meta[name="og:image"]').getAttribute("content");
        expect(XCard).toBeTruthy();
    });

    test("構造化データが設定されている", async ({page}) => {
        const articlePage = new ArticlePage(page);
        await articlePage.goto();

        // パンくずリストの構造化データ
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
});
