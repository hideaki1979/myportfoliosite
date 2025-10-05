'use client'

import styled, { keyframes } from "styled-components";

type WorkHistoryItem = {
    id: number;
    company: string;
    role: string;
    period: string;
    description: string;
}

const WORK_HISTORY: WorkHistoryItem[] = [
    {
        id: 1,
        company: '某中小SIer（SES）',
        role: 'システムエンジニア',
        period: '2000/04 - 2011/06',
        description:
            '要件定義〜保守・運用まで幅広く担当。言語はCOBOLをメインにVBやJavaを経験。'
    },
    {
        id: 2,
        company: '某中小SIer（SES）',
        role: 'システムエンジニア',
        period: '2011/10 - 2024/09',
        description:
            '要件定義〜保守・運用まで幅広く担当。言語はCOBOLとJavaに経験。'
    },
];

export default function WorkHistory() {
    return (
        <Section aria-labelledby="work-history-heading">
            <Inner>
                <Header>
                    <Title id="work-history-heading">職務経歴</Title>
                    <Subtitle>システムエンジニアとしての経歴を紹介します。</Subtitle>
                </Header>

                <Timeline role="list">
                    {WORK_HISTORY.map((item) => (
                        <TimelineItem key={item.id}>
                            <Bullet aria-hidden="true" />
                            <Content>
                                <ItemHeader>
                                    <Company>{item.company}</Company>
                                    <Period dateTime={item.period.replace(/\s—\s/g, "/").replace(/\s/g, "")}>{item.period}</Period>
                                </ItemHeader>
                                <Role>{item.role}</Role>
                                <Description>{item.description}</Description>
                            </Content>
                        </TimelineItem>
                    ))}
                </Timeline>
            </Inner>
        </Section>
    );
}

const fadeIn = keyframes`
    from {opacity: 0; transform: translateY(4px);}
    to {opacity: 1; transform: translateY(0);}
`;

const Section = styled.section`
    background: ${({ theme }) => theme.colors.background};
    border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const Inner = styled.div`
    max-width: 1024px;
    margin: 0 auto;
    padding: 40px 16px;
    display: grid;
    gap: 24px;

    @media (min-width: ${({ theme }) => theme.breakpoints.md}px) {
        padding: 56px 16px;
        gap: 32px
    }
`;

const Header = styled.div`
    display: grid;
    gap: 8px;
`;

const Title = styled.h2`
    font-size: ${({ theme }) => theme.typography.headings.h2}px;
    line-height: 1.5;
    color: ${({ theme }) => theme.colors.text};
`;

const Subtitle = styled.p`
    color: ${({ theme }) => theme.colors.subText};
`;

const Timeline = styled.ol`
    position: relative;
    margin: 0;
    padding: 0;
    list-style: none;
    &:before {
        content: "";
        position: absolute;
        top: 0;
        bottom: 0;
        left: 12px;
        width: 2px;
        background: ${({ theme }) => theme.colors.border};
    }
`;

const TimelineItem = styled.li`
    position: relative;
    display: grid;
    grid-template-columns: 40px 1fr;
    gap: 16px;
    padding: 8px 0 24px 0;
    animation: ${fadeIn} 0.5s ease both;
`;

const Bullet = styled.span`
    position: absolute;
    top: 8px;
    left: 4px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.primary};
    border: 2px solid ${({ theme }) => theme.colors.onPrimary};
`;

const Content = styled.div`
    display: grid;
    gap: 8px;
    grid-column: 2;
`;

const ItemHeader = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 8px 12px;
`;

const Company = styled.span`
    font-weight: bold;
    color: ${({ theme }) => theme.colors.text};
`;

const Period = styled.time`
    color: ${({ theme }) => theme.colors.subText};
    font-size: ${({ theme }) => theme.typography.small}px;
`;

const Role = styled.span`
    color: ${({ theme }) => theme.colors.subText};
`;

const Description = styled.p`
    color: ${({ theme }) => theme.colors.text};
`;
