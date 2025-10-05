'use client'

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";

export default function Hero() {

    const fullSubtitle = "フルスタックエンジニアへの道";
    const [typedText, setTypedText] = useState("");

    useEffect(() => {
        // Respect reduced motion preference
        const mql = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
        if (mql && mql.matches) {
            setTypedText(fullSubtitle);
            return;
        }
        let i = 0;
        const interval = window.setInterval(() => {
            i += 1;
            setTypedText(fullSubtitle.slice(0, i));
            if (i >= fullSubtitle.length) {
                window.clearInterval(interval);
            }
        }, 100);
        return () => window.clearInterval(interval);
    }, []);

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
                    <Subtitle>
                        <span aria-hidden="true">
                            {typedText}
                            {typedText.length < fullSubtitle.length ? <Carat aria-hidden="true" /> : null}
                        </span>
                        <SrOnly>{fullSubtitle}</SrOnly>
                    </Subtitle>
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
    animation: ${fadeInUp} 0.5s ease 0.3s both;
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
    transition: filter 0.5s ease, transform 0.3s ease;
    will-change: filter, transform;
    &:hover {filter: brightness(1.05);}
    &:active {transform: translateY(1px);}
`;

const blink = keyframes`
    0%, 49% {opacity: 1;}
    50%, 100% {opacity: 0;}
`;

const Carat = styled.span`
    display: inline-block;
    width: 1ch;
    margin-left: 2px;
    border-left: 2px solid ${({ theme }) => theme.colors.text};
    animation: ${blink} 1s steps(1, end) infinite;
`;

const SrOnly = styled.span`
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
`;
