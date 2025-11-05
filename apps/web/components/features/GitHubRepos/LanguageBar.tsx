'use client'

import styled from "styled-components"
import { LanguageStats } from "./types";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const BarContainer = styled.div`
  display: flex;
  height: 12px;
  border-radius: 6px;
  overflow: hidden;
  width: 100%;
`;

const BarSegment = styled.div<{ $color: string, $width: number }>`
  background-color: ${(props) => props.$color};
  width: ${(props) => props.$width}%;
  transition: width 0.3s ease;
`;

const LegendContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const LegendDot = styled.div<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${(props) => props.$color};
  flex-shrink: 0;
`;

const LegendText = styled.span`
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 1.1;
  color: ${({theme}) => theme.colors.onPrimary}; /* WCAG 2 AA基準の4.5:1コントラスト比を満たす色（#c7c7c7から変更） */
  white-space: nowrap;
`;

interface LanguageBarProps {
    stats: LanguageStats[];
    showLegend?: boolean;
}

export default function LanguageBar({
    stats,
    showLegend = true,
}: LanguageBarProps) {
    if (stats.length === 0) {
        return null;
    }

    return (
        <Container>
            <BarContainer role="img" aria-label="言語統計バー">
                {stats.map((stat) => (
                    <BarSegment
                        key={stat.name}
                        $color={stat.color}
                        $width={stat.percentage}
                        title={`${stat.name}: ${stat.percentage}%`}
                    />
                ))}
            </BarContainer>
            {showLegend && (
                <LegendContainer>
                    {stats.map((stat) => (
                        <LegendItem key={stat.name}>
                            <LegendDot $color={stat.color} />
                            <LegendText>
                                {stat.name}. {stat.percentage}%
                            </LegendText>
                        </LegendItem>
                    ))}
                </LegendContainer>
            )}
        </Container>
    );
}

