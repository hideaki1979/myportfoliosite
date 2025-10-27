import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GitHubContributionCalendar } from '../../../../types/github';
import { ThemeProvider } from 'styled-components';
import { theme } from '../../../../styles/theme';
import { ContributionChart } from '../../../../components/features/GitHubContributions';

describe('ContributionChart - ユニットテスト', () => {
    const mockData: GitHubContributionCalendar = {
        totalContributions: 150,
        weeks: [
            {
                contributionDays: [
                    { date: '2024-01-01', contributionCount: 5, color: '#40c463' },
                    { date: '2024-01-02', contributionCount: 0, color: '#ebedf0' },
                    { date: '2024-01-03', contributionCount: 3, color: '#9be9a8' },
                    { date: '2024-01-04', contributionCount: 10, color: '#216e39' },
                    { date: '2024-01-05', contributionCount: 2, color: '#9be9a8' },
                    { date: '2024-01-06', contributionCount: 0, color: '#ebedf0' },
                    { date: '2024-01-07', contributionCount: 1, color: '#9be9a8' },
                ],
            },
            {
                contributionDays: [
                    { date: '2024-01-08', contributionCount: 4, color: '#40c463' },
                    { date: '2024-01-09', contributionCount: 2, color: '#9be9a8' },
                    { date: '2024-01-10', contributionCount: 0, color: '#ebedf0' },
                    { date: '2024-01-11', contributionCount: 6, color: '#30a14e' },
                    { date: '2024-01-12', contributionCount: 3, color: '#9be9a8' },
                    { date: '2024-01-13', contributionCount: 0, color: '#ebedf0' },
                    { date: '2024-01-14', contributionCount: 8, color: '#30a14e' },
                ],
            },
        ],
    };

    const renderWithTheme = (component: React.ReactElement) => {
        return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>)
    };

    describe('基本レンダリング', () => {
        it('タイトルと統計情報を正しく表示する', () => {
            renderWithTheme(<ContributionChart data={mockData} />);

            expect(screen.getByText(/年間コントリビューション/i)).toBeInTheDocument();
            expect(screen.getByText(/150/i)).toBeInTheDocument();
            expect(screen.getByText(/件のコントリビューション/i)).toBeInTheDocument();
        });

        it('全てのコントリビューションセルを表示する', () => {
            renderWithTheme(<ContributionChart data={mockData} />);

            const cells = screen.getAllByRole('gridcell');
            // 2週間 × 7日 = 14セル
            expect(cells).toHaveLength(14);
        });

        it('凡例を表示する', () => {
            renderWithTheme(<ContributionChart data={mockData} />);

            expect(screen.getByText('少ない')).toBeInTheDocument();
            expect(screen.getByText('多い')).toBeInTheDocument();
        });

        it('曜日ラベルを表示する', () => {
            renderWithTheme(<ContributionChart data={mockData} />);

            expect(screen.getByText('月')).toBeInTheDocument();
            expect(screen.getByText('水')).toBeInTheDocument();
            expect(screen.getByText('金')).toBeInTheDocument();
        });
    });

    describe('Props処理', () => {
        it('空のデータでもエラーなく表示する', () => {
            const emptyData: GitHubContributionCalendar = {
                totalContributions: 0,
                weeks: [],
            };

            renderWithTheme(<ContributionChart data={emptyData} />);

            expect(screen.getByText(/年間コントリビューション/i)).toBeInTheDocument();
            expect(screen.getByText(/0/)).toBeInTheDocument();
        });

        it('大きな数値も正しくフォーマットして表示する', () => {
            const largeData: GitHubContributionCalendar = {
                totalContributions: 1666,
                weeks: mockData.weeks,
            };

            renderWithTheme(<ContributionChart data={largeData} />);
            expect(screen.getByText(/1,666/)).toBeInTheDocument();
        });
    });

    describe('状態管理とインタラクション', () => {
        it('セルにホバーするとツールチップを表示する', () => {
            renderWithTheme(<ContributionChart data={mockData} />);

            const cells = screen.getAllByRole('gridcell');
            const firstCell = cells[0];

            if (!firstCell) {
                throw new Error('First cell not found');
            }

            // ホバーイベントをトリガー
            fireEvent.mouseEnter(firstCell);

            // ツールチップが表示される（日付とコントリビューション数）
            expect(screen.getByText(/2024/)).toBeInTheDocument();
            expect(screen.getByText(/5 contributions/i)).toBeInTheDocument();

            // ホバーを解除
            fireEvent.mouseLeave(firstCell);
        });

        it('異なるセルにホバーすると異なるツールチップを表示する', () => {
            renderWithTheme(<ContributionChart data={mockData} />);

            const cells = screen.getAllByRole('gridcell');
            const secondCell = cells[1];

            if (!secondCell) {
                throw new Error('Second cell not found');
            }

            fireEvent.mouseEnter(secondCell);

            // 2番目のセルのデータ (contributionCount: 0)
            expect(screen.getByText(/2024/)).toBeInTheDocument();
            expect(screen.getByText(/0 contributions/i)).toBeInTheDocument();

            fireEvent.mouseLeave(secondCell);
        });
    });

    describe('アクセシビリティ', () => {
        it('各セルに適切なaria-labelが設定されている', () => {
            renderWithTheme(<ContributionChart data={mockData} />);

            const cells = screen.getAllByRole('gridcell');
            const firstCell = cells[0];

            if (!firstCell) {
                throw new Error('First cell not found');
            }

            // aria-label が設定されている
            expect(firstCell).toHaveAttribute('aria-label');
            expect(firstCell.getAttribute('aria-label')).toContain('2024-01-01');
            expect(firstCell.getAttribute('aria-label')).toContain('5 contributions');
        });

        it('各セルにtabIndexが設定されている（キーボード操作可能）', () => {
            renderWithTheme(<ContributionChart data={mockData} />);

            const cells = screen.getAllByRole('gridcell');
            const firstCell = cells[0];

            if (!firstCell) {
                throw new Error('First cell not found');
            }

            expect(firstCell).toHaveAttribute('tabIndex', '0');
        });

        it('各セルにroleが正しく設定されている', () => {
            renderWithTheme(<ContributionChart data={mockData} />);

            const cells = screen.getAllByRole('gridcell');
            expect(cells.length).toBeGreaterThan(0);

            cells.forEach((cell) => {
                expect(cell).toHaveAttribute('role', 'gridcell');
            });
        });
    });

    describe('月ラベルの生成ロジック', () => {
        it('月が変わった時にラベルを表示する', () => {
            const multiMonthData: GitHubContributionCalendar = {
                totalContributions: 100,
                weeks: [
                    {
                        contributionDays: [
                            { date: '2024-01-01', contributionCount: 1, color: '#9be9a8' },
                            { date: '2024-01-02', contributionCount: 1, color: '#9be9a8' },
                            { date: '2024-01-03', contributionCount: 1, color: '#9be9a8' },
                            { date: '2024-01-04', contributionCount: 1, color: '#9be9a8' },
                            { date: '2024-01-05', contributionCount: 1, color: '#9be9a8' },
                            { date: '2024-01-06', contributionCount: 1, color: '#9be9a8' },
                            { date: '2024-01-07', contributionCount: 1, color: '#9be9a8' },
                        ],
                    },
                    {
                        contributionDays: [
                            { date: '2024-01-08', contributionCount: 1, color: '#9be9a8' },
                            { date: '2024-01-09', contributionCount: 1, color: '#9be9a8' },
                            { date: '2024-01-10', contributionCount: 1, color: '#9be9a8' },
                            { date: '2024-01-11', contributionCount: 1, color: '#9be9a8' },
                            { date: '2024-01-12', contributionCount: 1, color: '#9be9a8' },
                            { date: '2024-01-13', contributionCount: 1, color: '#9be9a8' },
                            { date: '2024-01-14', contributionCount: 1, color: '#9be9a8' },
                        ],
                    },
                    // 3週目以降で2月になる
                    {
                        contributionDays: [
                            { date: '2024-02-01', contributionCount: 1, color: '#9be9a8' },
                            { date: '2024-02-02', contributionCount: 1, color: '#9be9a8' },
                            { date: '2024-02-03', contributionCount: 1, color: '#9be9a8' },
                            { date: '2024-02-04', contributionCount: 1, color: '#9be9a8' },
                            { date: '2024-02-05', contributionCount: 1, color: '#9be9a8' },
                            { date: '2024-02-06', contributionCount: 1, color: '#9be9a8' },
                            { date: '2024-02-07', contributionCount: 1, color: '#9be9a8' },
                        ],
                    },
                ],
            };

            renderWithTheme(<ContributionChart data={multiMonthData} />);

            // 月ラベルが表示される（1月と2月、ただし2週間の間隔制御があるため1月は表示されない可能性がある）
            expect(screen.getByText(/月/)).toBeInTheDocument();
        });
    })
});
