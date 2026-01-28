"use client";

import styled from "styled-components";
import { SKILL_CATEGORIES } from "../../../lib/data/skills";
import { SkillCategoryCard } from "./SkillCategoryCard";

export function SkillChart() {
  return (
    <Container>
      <Header>
        <Title>スキルセット</Title>
        <Description>
          各スキルの習熟度を5段階で表示しています。
        </Description>
      </Header>
      <Grid>
        {SKILL_CATEGORIES.map((category, index) => (
          <SkillCategoryCard
            key={category.id}
            category={category}
            categoryIndex={index}
          />
        ))}
      </Grid>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Title = styled.h3`
  font-size: ${({ theme }) => theme.typography.headings.h3}px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
`;

const Description = styled.p`
  font-size: ${({ theme }) => theme.typography.small}px;
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;

  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.desktop}px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }
`;
