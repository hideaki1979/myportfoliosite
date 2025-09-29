'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styled, { css } from "styled-components";

type NavItem = {
    url: string;
    label: string;
};

const NAV_ITEMS: NavItem[] = [
    { url: "/", label: "Home" },
    { url: "/about", label: "AboutMe" },
    { url: "/portfolio", label: "Portfolio" },
    { url: "/article", label: "Article" },
    { url: "/contact", label: "Contact" },
];

export function Header() {
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const wasOpenRef = useRef(false);
    const [focusables, setFocusables] = useState<HTMLElement[]>([]);
    const pathname = usePathname();

    // メニューを開いたときに本文のスクロールをロックする
    useEffect(() => {
        if (!isOpen) return;

        const original = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = original;
        }
    }, [isOpen]);

    // escキーで終了
    useEffect(() => {
        if (!isOpen) return;

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        }

        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [isOpen]);

    // 開いたときに最初のリンクにフォーカス + パネル内の単純なフォーカス トラップ
    useEffect(() => {
        if (!isOpen) return;
        const panel = panelRef.current;
        if (!panel) return;
        const nodes = panel.querySelectorAll<HTMLElement>(
            'a, button, [tabindex]:not([tabindex="-1"])'
        );
        setFocusables(Array.from(nodes).filter((el) => !el.hasAttribute("disabled")));
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            focusables[0]?.focus();
        } else if (wasOpenRef.current) {
            triggerRef.current?.focus();
        }
        wasOpenRef.current = isOpen;
    }, [isOpen, focusables]);

    useEffect(() => {
        if (!isOpen) return;
        const handleTab = (e: KeyboardEvent) => {
            if (e.key !== "Tab") return;
            const elements = focusables;
            if (elements.length === 0) return;
            const first = elements[0];
            const last = elements[elements.length - 1];
            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault();
                    last?.focus();
                }
            } else {
                if (document.activeElement === last) {
                    e.preventDefault();
                    first?.focus();
                }
            }
        };
        window.addEventListener("keydown", handleTab);
        return () => window.removeEventListener("keydown", handleTab);
    }, [isOpen, focusables])

    return (
        <SiteHeader>
            <HeaderInner>
                <Brand href="/">Mirrorman Portfolio Site</Brand>

                <DesktopNav aria-label="Primary">
                    <NavList>
                        {NAV_ITEMS.map((item) => (
                            <li key={item.url}>
                                <StyledLink
                                    href={item.url}
                                    aria-current={pathname === item.url ? "page" : undefined}
                                >
                                    {item.label}
                                </StyledLink>
                            </li>
                        ))}
                    </NavList>
                </DesktopNav>

                <MenuButton
                    aria-label="メニュー"
                    aria-expanded={isOpen}
                    aria-controls="primary-navigation"
                    onClick={() => setIsOpen((v) => !v)}
                    ref={triggerRef}
                >
                    <Bar $top aria-hidden="true" />
                    <Bar $middle aria-hidden="true" />
                    <Bar $bottom aria-hidden="true" />
                </MenuButton>
            </HeaderInner>
            <MobileOverlay $open={isOpen} onClick={() => setIsOpen(false)} />
            <MobilePanel
                id="primary-navigation"
                aria-hidden={!isOpen}
                $open={isOpen}
                ref={panelRef}
            >
                <MobileList>
                    {NAV_ITEMS.map((item) => (
                        <li key={item.url}>
                            <StyledLink
                                href={item.url}
                                aria-current={pathname === item.url ? "page" : undefined}
                                onClick={() => setIsOpen(false)}
                            >
                                {item.label}
                            </StyledLink>
                        </li>
                    ))}
                </MobileList>
            </MobilePanel>
        </SiteHeader>
    )
}

const SiteHeader = styled.header`
    position: sticky;
    top: 0;
    z-index: 50;
    width: 100%;
    background: ${({ theme }) => theme.colors.background};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const HeaderInner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
  padding: 12px 16px;
`;

const Brand = styled(Link)`
    font-weight: 700;
    color: ${({ theme }) => theme.colors.text};
`;

const DesktopNav = styled.nav`
    display: none;
    @media (min-width: ${({ theme }) => theme.breakpoints.md}px) {
        display: block;
    } 
`

const NavList = styled.ul`
    display: flex;
    align-items: center;
    gap: 24px;
    margin: 0;
    padding: 0;
    list-style: none;
`

const StyledLink = styled(Link)`
    color: ${({ theme }) => theme.colors.text};
    &:hover {
        color: ${({ theme }) => theme.colors.primary};
    }
    &[aria-current="page"] {
        color: ${({ theme }) => theme.colors.primary};
        font-weight: 700;
    }
`;

const MenuButton = styled.button`
    position: relative;
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    border: 1px solid ${({ theme }) => theme.colors.border};
    background: ${({ theme }) => theme.colors.background};
    border-radius: 8px;
    @media (min-width: ${({ theme }) => theme.breakpoints.md}px) {
        display: none;
    }
`;

const Bar = styled.span<{ $top?: boolean; $middle?: boolean; $bottom?: boolean }>`
    position: absolute;
    width: 24px;
    height: 2px;
    background: ${({ theme }) => theme.colors.text};
    ${({ $top }) =>
        $top &&
        css`
            transform: translateY(-6px);
        `}
    ${({ $middle }) =>
        $middle &&
        css`
            opacity: 0.9;
        `}
    ${({ $bottom }) =>
        $bottom &&
        css`
            transform: translateY(6px);
        `}
`;

const MobileOverlay = styled.div<{ $open: boolean }>`
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;
    z-index: 40;
    ${({ $open }) =>
        $open &&
        css`
            opacity: 1;
            pointer-events: auto;
        `}
    @media (min-width: ${({ theme }) => theme.breakpoints.md}px) {
        display: none;
    }
`;

const MobilePanel = styled.div<{ $open: boolean }>`
    position: fixed;
    top: 0;
    right: 0;
    width: min(80vw, 320px);
    height: 100dvh;
    background: ${({ theme }) => theme.colors.background};
    border-left: 1px solid ${({ theme }) => theme.colors.border};
    box-shadow: -8px 0 24px rgba(0, 0, 0, 0.12);
    transform: translateX(100%);
    transition: transform 0.3s ease;
    z-index: 50;
    padding: 24px 16px;
    ${({ $open }) =>
        $open &&
        css`
            transform: translateX(0);
        `}
    @media (min-width: ${({ theme }) => theme.breakpoints.md}px) {
        display: none;
    }
`

const MobileList = styled.ul`
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin: 0;
    padding: 0;
    list-style: none;
`