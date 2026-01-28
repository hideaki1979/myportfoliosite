"use client";

import styled from "styled-components";
import { SkillChart } from "../features/SkillChart";

export default function AboutMe() {
  return (
    <Section aria-labelledby="about-me-heading">
      <Inner>
        <Header>
          <Title id="about-me-heading">自己紹介</Title>
          <Subtitle>
            2000年4月〜2024年9月まで、
            2社の中小SIer（実態はSES）の企業で20年以上勤務しておりました。
          </Subtitle>
          <Subtitle>
            中小のブラック寄りのグレー企業で案件ガチャも大凶なのもあり、
            <br />
            デスマーチ案件や音信不通になった社員の肩代わりを中心に
            <br />
            要件定義〜保守・運用を浅く広く経験しましたが、
            <br />
            これと言った強みというのが無いなと思い、
            <br />
            （COBOL5年、Javaを2年程度やっているが、、、）
            <br />
            思い立って2024年10月にG&apos;s Academy（現G&apos;s）に入学し、
            <br />
            HTML,CSS,JavaScript,PHP,Laravel,React,Swiftを学習
          </Subtitle>
          <Subtitle>
            現在は、React（Next.js）を中心にポートフォリオを作成し、
            <br />
            AI駆動開発（Cursor、Claude Code、Gemini CLIなど）を使って、
            <br />
            React（Next.js）、Go、NestJSを学習しながら、就職活動中。
          </Subtitle>
        </Header>
        <SkillChart />
      </Inner>
    </Section>
  );
}

const Section = styled.section`
  background: ${({ theme }) => theme.colors.surface};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const Inner = styled.div`
  max-width: ${({ theme }) => theme.breakpoints.desktop}px;
  margin: 0 auto;
  padding: 40px 16px;
  display: grid;
  gap: 24px;

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}px) {
    padding: 56px 16px;
    gap: 32px;
  }
`;

const Header = styled.div`
  display: grid;
  gap: 16px;
`;

const Title = styled.h2`
  font-size: ${({ theme }) => theme.typography.headings.h2}px;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.text.primary};

  &::before {
    content: "■";
    margin-right: 8px;
  }
`;

const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
`;
