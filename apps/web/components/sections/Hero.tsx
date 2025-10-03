'use client'

import Image from "next/image";
import Link from "next/link";
import styled, { keyframes } from "styled-components";

export default function Hero() {
    return (
        <Section aria-labelledby="hero-heading">
            <Inner>
                <Figure>
                    <ProfileImage
                        src="/og-image.jpg"
                        alt="Mirrormanのプロフィール画像"
                        width={200}
                        height={200}
                        priority
                    />
                </Figure>

                <Content>
                    <Title id="hero-heading">Mirrorman</Title>
                    <Subtitle>フルスタックエンジニア</Subtitle>
                    <Description>
                        React（Next.js）とTypeScriptを中心に学習・開発しています。GitHubとQiitaの情報を連携したポートフォリオを公開中です。
                    </Description>
                    <CTA href="/contact">お問い合わせ</CTA>
                </Content>
            </Inner>
        </Section>
    )
}

const fadeInUp = keyframes`
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
`;

const Section = styled.section`
    background: ${({ theme }) => theme.colors.surface};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Inner = styled.div`
    display: grid;
    grid-template-columns: 1fr;
    align-items: center;
    gap: 24px;
    max-width: 1024px;
    margin: 0 auto;
    padding: 40px 16px;
    @media (min-width: ${({ theme }) => theme.breakpoints.md}px) {
        grid-template-columns: 240px 1fr;
        gap: 32px;
        padding: 56px 16px;
    }
`;

const Figure = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
`;

const ProfileImage = styled(Image)`
    border-radius: 24px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    background: #fff;
`;

const Content = styled.div`
    display: grid;
    gap: 8px;
    animation: ${fadeInUp} 0.3s ease 0s both;
`;

const Title = styled.h1`
    font-size: ${({ theme }) => theme.typography.headings.h1}px;
    line-height: 1.25;
    color: ${({ theme }) => theme.colors.text};
`;

const Subtitle = styled.p`
    font-size: ${({ theme }) => theme.typography.headings.h3}px;
    color: ${({ theme }) => theme.colors.subText};
`;

const Description = styled.p`
    color: ${({ theme }) => theme.colors.text};
`;

const CTA = styled(Link)`
    width: fit-content;
    padding: 8px 16px;
    border-radius: 8px;
    background: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.onPrimary};
    border: 1px solid transparent;
    transition: filter 0.15s ease, transform 0.05s ease;
    will-change: filter, transform;
    &:hover {filter: brightness(1.05);}
    &:active {transform: translateY(1px);}
`;
