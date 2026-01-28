"use client";

import styled, { keyframes } from "styled-components";
import type { Skill, SkillLevel } from "../../../lib/data/skills";
import { SKILL_LEVEL_LABELS } from "../../../lib/data/skills";

interface SkillProgressBarProps {
  skill: Skill;
  color: string;
  animationDelay?: number;
}

export function SkillProgressBar({
  skill,
  color,
  animationDelay = 0,
}: SkillProgressBarProps) {
  const percentage = (skill.level / 5) * 100;
  const levelLabel = SKILL_LEVEL_LABELS[skill.level as SkillLevel];

  return (
    <Container style={{ animationDelay: `${animationDelay}ms` }}>
      <Header>
        <SkillName>{skill.name}</SkillName>
        <LevelInfo>
          <LevelLabel>{levelLabel}</LevelLabel>
          {skill.experience && <Experience>({skill.experience})</Experience>}
        </LevelInfo>
      </Header>
      <BarContainer>
        <BarTrack
          role="progressbar"
          aria-valuenow={skill.level}
          aria-valuemin={1}
          aria-valuemax={5}
          aria-label={`${skill.name}: ${levelLabel}`}
        >
          <BarFill
            $percentage={percentage}
            $color={color}
            style={{ animationDelay: `${animationDelay + 100}ms` }}
          />
        </BarTrack>
      </BarContainer>
    </Container>
  );
}

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const fillBar = keyframes`
  from {
    width: 0;
  }
  to {
    width: var(--fill-width);
  }
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  animation: ${fadeIn} 0.4s ease both;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
`;

const SkillName = styled.span`
  font-size: ${({ theme }) => theme.typography.small}px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const LevelInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const LevelLabel = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

const Experience = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.text.tertiary};
`;

const BarContainer = styled.div`
  width: 100%;
`;

const BarTrack = styled.div`
  height: 8px;
  background: ${({ theme }) => theme.colors.background.tertiary};
  border-radius: 4px;
  overflow: hidden;
`;

const BarFill = styled.div<{ $percentage: number; $color: string }>`
  --fill-width: ${({ $percentage }) => $percentage}%;
  height: 100%;
  background: ${({ $color }) => $color};
  border-radius: 4px;
  animation: ${fillBar} 0.6s ease-out both;
  transition: background-color 0.3s ease;
`;
