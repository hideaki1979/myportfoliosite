'use client'

import styled from "styled-components";
import { ContributionDay, GitHubContributionCalendar } from "./index";
import { useMemo, useState } from "react";

interface ContributionChartProps {
    data: GitHubContributionCalendar;
}

const LEGEND_ITEMS = [
    { color: '#ebedf0', title: 'コントリビューションなし' },
    { color: '#9be9a8', title: '1-3件のコントリビューション' },
    { color: '#40c463', title: '4-6件のコントリビューション' },
    { color: '#30a14e', title: '7-9件のコントリビューション' },
    { color: '#216e39', title: '10件以上のコントリビューション' },
]

// Styled Components
const Container = styled.div`
    width: 100%;
    padding: ${({ theme }) => `${theme.spacing.lg}px`};
    background-color: ${({ theme }) => theme.colors.surface};
    border-radius: 8px;
    border: 1px solid ${({ theme }) => theme.colors.border};
`;

const Header = styled.div`
    margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const Title = styled.h3`
    font-size: ${({ theme }) => `${theme.typography.headings.h3}px`};
    font-weight: 700;
    color: ${({ theme }) => theme.colors.text.primary};
    margin-bottom: ${({ theme }) => `${theme.spacing.xs}px`};
`;

const Stats = styled.p`
    font-size: ${({ theme }) => `${theme.typography.small}px`};
    color: ${({ theme }) => theme.colors.text.secondary};

    strong {
        font-weight: 600;
        color: ${({ theme }) => theme.colors.text.primary};
    }
`;

const ChartWrapper = styled.div`
    display: flex;
    gap: ${({ theme }) => `${theme.spacing.sm}px`};
    overflow-x: auto;
    margin-bottom: ${({ theme }) => `${theme.spacing.md}px`};

    /* スクロールバーのスタイリング */
    &::-webkit-scrollbar {
        height: 8px;
    }

    &::-webkit-scrollbar-track {
        background: ${({ theme }) => theme.colors.background.primary};
        border-radius: 8px;
    }

    &::-webkit-scrollbar-thumb {
        background: ${({ theme }) => theme.colors.border};
        border-radius: 8px;

        &:hover {
            background: ${({ theme }) => theme.colors.text.secondary};
        }
    }
`;

const WeekdayLabels = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    padding-top: 24px;
    min-width: 32px;
`;

const WeekdayLabel = styled.span`
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.secondary};
    height: 12px;
    line-height: 12px;
    text-align: right;
    padding-left: ${({ theme }) => `${theme.spacing.xs}px`};
`;

const GraphContainer = styled.div`
    flex: 1;
    min-width: 0;
`;

const MonthLabels = styled.div`
    display: flex;
    height: 20px;
    margin-bottom: ${({ theme }) => `${theme.spacing.xs}px`};
    position: relative;
`;

const MonthLabel = styled.span<{ $offset: number }>`
    position: absolute;
    left: ${({ $offset }) => $offset * 16}px;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.secondary};
    white-space: nowrap;
`;

const Grid = styled.div`
    display: flex;
    gap: 4px;
    flex-wrap: nowrap;
`;

const Week = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const DayCell = styled.div<{ $color: string }>`
    width: 12px;
    height: 12px;
    background-color: ${({ $color }) => $color};
    border-radius: 4px;
    cursor: pointer;
    transition: transform 0.1s ease;

    &:hover,
    &:focus {
        transform: scale(1.2);
        outline: 2px solid ${({ theme }) => theme.colors.primary};
        outline-offset: 1px;
    }

    &:focus {
        outline-style: solid;
    }
`;

const Tooltip = styled.div`
    position: fixed;
    transform: translateX(-50%) translateY(-100%);
    pointer-events: none;
    z-index: 1000;
`;

const TooltipContent = styled.div`
    background-color: rgba(0, 0, 0, 0.9);
    color: #fff;
    padding: ${({ theme }) => `${theme.spacing.xs}px ${theme.spacing.sm}px`};
    border-radius: 8px;
    font-size: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    white-space: nowrap;
`;

const TooltipDate = styled.div`
    font-weight: 600;
    margin-bottom: 4px;
`;

const TooltipCount = styled.div`
    font-size: 12px;
`;

const Legend = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: ${({ theme }) => `${theme.spacing.xs}px`};
    margin-top: ${({ theme }) => `${theme.spacing.md}px`};
`;

const LegendText = styled.span`
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.secondary};
`;

const LegendScale = styled.div`
    display: flex;
    gap: 4px;
`;

const LegendCell = styled.div<{ $color: string }>`
    width: 12px;
    height: 12px;
    background-color: ${({ $color }) => $color};
    border-radius: 4px;
`;

/**
 * GitHubスタイルのコントリビューションチャート（ヒートマップ）
 * 過去1年間のコントリビューション履歴を可視化
 */
export default function ContributionChart({ data }: ContributionChartProps) {
    const [hoveredDay, setHoveredDay] = useState<ContributionDay | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

    const handleMouseEnter = (
        day: ContributionDay,
        event: React.MouseEvent<HTMLDivElement>
    ) => {
        setHoveredDay(day);
        const rect = event.currentTarget.getBoundingClientRect();
        setTooltipPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
        });
    };

    const handleMouseLeave = () => {
        setHoveredDay(null);
    };

    // 月のラベルを生成
    const monthLabels = useMemo(() => {
        const labels: Array<{ month: string, offset: number }> = [];
        let currentMonth = '';

        data.weeks.forEach((week, weekIndex) => {
            const firstDay = week.contributionDays[0];
            if (!firstDay) return;

            const date = new Date(firstDay.date);
            const monthName = date.toLocaleDateString('ja-JP', { month: 'short' });

            if (monthName !== currentMonth) {
                const lastLabel = labels[labels.length - 1];
                // 前のラベルから最低2週間（約26px）離れている場合のみ表示
                if (!lastLabel || weekIndex - lastLabel.offset >= 2) {
                    currentMonth = monthName;
                    labels.push({ month: monthName, offset: weekIndex });
                }
            }
        });

        return labels;
    }, [data.weeks]);


    // 曜日のラベル
    const weekDayLabels = ['月', '水', '金'];

    return (
        <Container>
            <Header>
                <Title>年間コントリビューション</Title>
                <Stats>
                    過去1年間で<strong>{data.totalContributions.toLocaleString()}</strong>件のコントリビューション
                </Stats>
            </Header>

            <ChartWrapper>
                <WeekdayLabels>
                    {weekDayLabels.map((label, index) => (
                        <WeekdayLabel key={index}>
                            {label}
                        </WeekdayLabel>
                    ))}
                </WeekdayLabels>

                <GraphContainer>
                    <MonthLabels>
                        {monthLabels.map((label, index) => (
                            <MonthLabel key={index} $offset={label.offset}>
                                {label.month}
                            </MonthLabel>
                        ))}
                    </MonthLabels>

                    <Grid role="grid" aria-label="GitHub コントリビューション グリッド">
                        {data.weeks.map((week, weekIndex) => (
                            <Week key={weekIndex} role="row">
                                {week.contributionDays.map((day, dayIndex) => (
                                    <DayCell
                                        key={`${weekIndex}-${dayIndex}`}
                                        $color={day.color}
                                        onMouseEnter={(e) => handleMouseEnter(day, e)}
                                        onMouseLeave={handleMouseLeave}
                                        role="gridcell"
                                        aria-label={`${day.date}: ${day.contributionCount} contributions`}
                                        tabIndex={0}
                                    />
                                ))}
                            </Week>
                        ))}
                    </Grid>
                </GraphContainer>
            </ChartWrapper>

            {hoveredDay && (
                <Tooltip
                    style={{
                        left: `${tooltipPosition.x}px`,
                        top: `${tooltipPosition.y}px`
                    }}
                >
                    <TooltipContent>
                        <TooltipDate>
                            {new Date(hoveredDay.date).toLocaleDateString('ja-JP', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </TooltipDate>
                        <TooltipCount>
                            {hoveredDay.contributionCount} contributions
                        </TooltipCount>
                    </TooltipContent>
                </Tooltip>
            )}

            <Legend role="img" aria-label="コントリビューション数の凡例">
                <LegendText>少ない</LegendText>
                <LegendScale>
                    {LEGEND_ITEMS.map(item => (
                        <LegendCell key={item.color} $color={item.color} title={item.title} />
                    ))}
                </LegendScale>
                <LegendText>多い</LegendText>
            </Legend>
        </Container>
    )
}
