"use client";

import styled, { keyframes } from "styled-components";
import type { SkillCategory } from "../../../lib/data/skills";
import { SkillProgressBar } from "./SkillProgressBar";
import { ANIMATION_DELAY } from "../../../lib/constants";

interface SkillCategoryCardProps {
  category: SkillCategory;
  categoryIndex: number;
}

export function SkillCategoryCard({
  category,
  categoryIndex,
}: SkillCategoryCardProps) {
  const baseDelay = categoryIndex * ANIMATION_DELAY;

  return (
    <Card $accentColor={category.color} style={{ animationDelay: `${baseDelay}ms` }}>
      <CardHeader>
        <Icon aria-hidden="true">{category.icon}</Icon>
        <CategoryTitle>{category.title}</CategoryTitle>
      </CardHeader>
      <SkillList>
        {category.skills.map((skill, skillIndex) => (
          <SkillProgressBar
            key={skill.name}
            skill={skill}
            color={category.color}
            animationDelay={baseDelay + (skillIndex + 1) * 50}
          />
        ))}
      </SkillList>
    </Card>
  );
}

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Card = styled.article<{ $accentColor: string }>`
  background: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-left: 4px solid ${({ $accentColor }) => $accentColor};
  border-radius: 8px;
  padding: 20px;
  animation: ${fadeIn} 0.5s ease both;
  transition: box-shadow 0.2s ease, transform 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }

  @media (prefers-color-scheme: dark) {
    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
  }
`;

const CardHeader = styled.header`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Icon = styled.span`
  font-size: 24px;
  line-height: 1;
`;

const CategoryTitle = styled.h3`
  font-size: ${({ theme }) => theme.typography.body}px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
`;

const SkillList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;
