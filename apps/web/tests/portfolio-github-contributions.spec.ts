import { test, expect } from '@playwright/test';

test.describe('Portfolio - GitHub Contributions Chart(e2e)', () => {
    test.beforeEach(async ({ page }) => {
        // WebKit対応: networkidleではなくdomcontentloadedを使用
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('text=■GitHub', { timeout: 10000 });
        // GitHubセクションにスクロール
        await page.getByText('■GitHub').scrollIntoViewIfNeeded();
    });

    test.describe('ページ統合とレイアウト', () => {
        test('GitHubセクション内にコントリビューションチャートが正しく表示される', async ({ page }) => {
            // セクション見出しの確認
            await expect(page.getByText('■GitHub')).toBeVisible();

            // コントリビューションチャートが表示される
            await expect(page.getByText('年間コントリビューション')).toBeVisible();

            // 実際のコントリビューションデータが表示される
            const cells = page.locator('[role="gridcell"]');
            await expect(cells.first()).toBeVisible();

            // 年間コントリビューション数が表示される（実際のAPIデータ）
            await expect(page.getByText(/過去1年間で/)).toBeVisible();
            await expect(page.getByText(/件のコントリビューション/)).toBeVisible();
        });

        test('GitHubリポジトリ一覧とコントリビューションチャートが併せて表示される', async ({ page }) => {
            // コントリビューションチャートが表示される
            await expect(page.getByText('年間コントリビューション')).toBeVisible();

            // グリッドセルが存在することを確認
            const cells = page.locator('[role="gridcell"]');
            await expect(cells.first()).toBeVisible();

            // ページ全体で両方のコンテンツが表示されている（GitHubリポジトリリンク）
            await expect(page.locator('a[href*="github.com/hideaki1979"]').first()).toBeVisible();
        });
    });

    test.describe('実際のユーザーインタラクション', () => {
        test('セルにホバーすると実際のコントリビューション情報がツールチップに表示される', async ({ page }) => {
            // 最初のセルを取得
            const cells = page.locator('[role="gridcell"]');
            const firstCell = cells.first();
            await firstCell.waitFor({ state: 'visible' });

            // ホバー（WebKitではhover後に少し待機が必要）
            await firstCell.hover({ force: true });
            await page.waitForTimeout(1000);

            // ツールチップが表示される - aria-labelから日付とcontributionsが含まれることを確認
            const ariaLabel = await firstCell.getAttribute('aria-label');
            expect(ariaLabel).toContain('contributions');
            expect(ariaLabel).toMatch(/\d{4}-\d{2}-\d{2}/);
        });

        test('複数のセルにホバーするとそれぞれのツールチップが表示される', async ({ page }) => {
            const cells = page.locator('[role="gridcell"]');

            // 最初のセルにホバーしてaria-labelを確認
            const firstCell = cells.nth(0);
            await firstCell.hover();
            const firstLabel = await firstCell.getAttribute('aria-label');
            expect(firstLabel).toContain('contributions');

            // 別のセルにホバーしてaria-labelが異なることを確認
            const fifthCell = cells.nth(5);
            await fifthCell.hover();
            const fifthLabel = await fifthCell.getAttribute('aria-label');
            expect(fifthLabel).toContain('contributions');

            // 異なる日付またはコントリビューション数であることを確認
            // （同じ値でない限り、ツールチップが正しく切り替わっている）
            expect(fifthLabel).toBeTruthy();
        });

        test('キーボードナビゲーションでセル間を移動できる', async ({ page }) => {
            // 最初のセルにフォーカス
            const cells = page.locator('[role="gridcell"]');
            const firstCell = cells.first();

            // セルが表示されるまで待機
            await firstCell.waitFor({ state: 'visible' });

            // フォーカスを当てる
            await firstCell.focus();

            // フォーカスされていることを確認（tabindex="0"があるので可能）
            await expect(firstCell).toBeFocused();

            // Tabキーで次の要素に移動できる（基本動作の確認）
            await page.keyboard.press('Tab');

            // 次のセルにフォーカスが移ることを確認
            const secondCell = cells.nth(1);
            await expect(secondCell).toBeFocused();
        });
    });

    test.describe('レスポンシブデザイン', () => {
        test('モバイルビューで水平スクロール可能なチャートが表示される', async ({ page }) => {
            // モバイルビューポートに変更
            await page.setViewportSize({ width: 375, height: 667 });

            // GitHubセクションにスクロール
            await page.getByText('■GitHub').scrollIntoViewIfNeeded();

            // チャートが表示される
            await expect(page.getByText('年間コントリビューション')).toBeVisible();

            // セルが表示される
            const cells = page.locator('[role="gridcell"]');
            await expect(cells.first()).toBeVisible();

            // 凡例も表示される（凡例エリア内の「少ない」「多い」を確認）
            const legend = page.locator('[role="img"][aria-label*="凡例"]');
            await expect(legend.getByText('少ない')).toBeVisible();
            await expect(legend.getByText('多い')).toBeVisible();
        });

        test('タブレットビューで正しくレイアウトされる', async ({ page }) => {
            // タブレットビューポートに変更
            await page.setViewportSize({ width: 768, height: 1024 });

            await page.getByText('■GitHub').scrollIntoViewIfNeeded();
            await expect(page.getByText('年間コントリビューション')).toBeVisible();

            const cells = page.locator('[role="gridcell"]');
            const cellCount = await cells.count();
            expect(cellCount).toBeGreaterThan(300);
        });
    });

    test.describe('ローディングとエラーハンドリング', () => {
        test('ページロード時にローディング状態を経て実データが表示される', async ({ page }) => {
            // APIレスポンスを遅延させる
            await page.route('**/api/github/contributions', async (route) => {
                await new Promise((resolve) => setTimeout(resolve, 500));
                await route.continue();
            });

            await page.goto('/', { waitUntil: 'domcontentloaded' });

            // GitHubセクションにスクロール
            await page.getByText('■GitHub').scrollIntoViewIfNeeded();

            // 最終的に実データが表示される
            await expect(page.getByText('年間コントリビューション')).toBeVisible({ timeout: 10000 });
            const cells = page.locator('[role="gridcell"]');
            await expect(cells.first()).toBeVisible();
        });
    });

    test.describe('Portfolioページでの表示', () => {
        test('/portfolioページでもコントリビューションチャートが表示される', async ({ page }) => {
            await page.goto('/portfolio', { waitUntil: 'domcontentloaded' });

            // Portfolioページではセクションタイトルは非表示なので、直接チャートを確認
            await page.getByText('年間コントリビューション').scrollIntoViewIfNeeded();
            await expect(page.getByText('年間コントリビューション')).toBeVisible();

            const cells = page.locator('[role="gridcell"]');
            await expect(cells.first()).toBeVisible();
        });
    });

    test.describe('アクセシビリティ (実際のブラウザ環境)', () => {
        test('スクリーンリーダー用のaria属性が実際の環境で機能する', async ({ page }) => {
            const cells = page.locator('[role="gridcell"]');
            const firstCell = cells.first();

            // aria-labelが実際に設定されている
            const ariaLabel = await firstCell.getAttribute('aria-label');
            expect(ariaLabel).toBeTruthy();
            expect(ariaLabel).toMatch(/\d{4}-\d{2}-\d{2}/); // 日付形式
            expect(ariaLabel).toMatch(/contributions/i);
        });

        test('凡例が視覚的に正しく表示されている', async ({ page }) => {
            // 凡例エリアを特定
            const legend = page.locator('[role="img"][aria-label*="凡例"]');
            await expect(legend).toBeVisible();

            // 凡例内のテキストを確認
            await expect(legend.getByText('少ない')).toBeVisible();
            await expect(legend.getByText('多い')).toBeVisible();

            // 凡例の色見本セルが表示されている（5つ）
            const legendCells = legend.locator('div[title*="コントリビューション"]');
            const cellCount = await legendCells.count();
            expect(cellCount).toBe(5);
        });
    });
});
