"use client"

import styled from "styled-components";
import { ContactForm } from "../features/ContactForm";

const StyledSection = styled.section`
    width: 100%;
    padding: 4rem 2rem;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    @media (max-width: ${({ theme }) => theme.breakpoints.tablet}px) {
      padding: 2rem 1.5rem;
    }
`;

const SectionHeader = styled.div`
    text-align: center;
    margin-bottom: 3rem;
`;

const SectionTitle = styled.h1`
    font-size: 2.5rem;
    font-weight: 700;
    color: #757575; /* WCAG 2 AA基準の3:1コントラスト比を満たす色（theme.colors.text.tertiary #999から変更） */
    margin-bottom: 1rem;

    &::before {
      content: "■";
      margin-right: 1rem;
    }

    @media (max-width: ${({ theme }) => theme.breakpoints.tablet}px) {
      font-size: 2rem;
    }
`;

const SectionSubtitle = styled.p`
  font-size: 1.5rem;
  color: ${({ theme }) => theme.colors.text.secondary};
`;

interface ContactSectionProps {
  recaptchaSiteKey: string;
}

export function ContactSection({ recaptchaSiteKey }: ContactSectionProps) {
  return (
    <StyledSection>
      <SectionHeader>
        <SectionTitle>Contact</SectionTitle>
        <SectionSubtitle>お仕事依頼はこちらまで</SectionSubtitle>
      </SectionHeader>
      <ContactForm recaptchaSiteKey={recaptchaSiteKey} />
    </StyledSection>
  );
}