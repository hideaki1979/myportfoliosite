"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useRef, useState } from "react";
import styled, { css } from "styled-components";
import { useModalAccessibility } from "../hooks/useModalAccessibility";

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
  const pathname = usePathname();

  useModalAccessibility({
    isOpen,
    panelRef: panelRef as unknown as React.RefObject<HTMLElement | null>,
    triggerRef: triggerRef as unknown as React.RefObject<HTMLElement | null>,
    onClose: () => setIsOpen(false),
  });

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
          type="button"
          aria-label="メニュー"
          aria-expanded={isOpen}
          aria-controls="primary-navigation"
          onClick={() => setIsOpen((v) => !v)}
          ref={triggerRef}
        >
          <Bar $top $open={isOpen} aria-hidden="true" />
          <Bar $middle $open={isOpen} aria-hidden="true" />
          <Bar $bottom $open={isOpen} aria-hidden="true" />
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
  );
}

const SiteHeader = styled.header`
  position: sticky;
  top: 0;
  z-index: 50;
  width: 100%;
  background: ${({ theme }) => theme.colors.background.primary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const HeaderInner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: ${({ theme }) => theme.breakpoints.wide}px;
  margin: 0 auto;
  padding: 12px 16px;
`;

const Brand = styled(Link)`
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text.primary};
`;

const DesktopNav = styled.nav`
  display: none;
  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}px) {
    display: block;
  }
`;

const NavList = styled.ul`
  display: flex;
  align-items: center;
  gap: 24px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

const StyledLink = styled(Link)`
  color: ${({ theme }) => theme.colors.text.primary};
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
  background: ${({ theme }) => theme.colors.background.primary};
  border-radius: 8px;
  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}px) {
    display: none;
  }
`;

const Bar = styled.span<{
  $open: boolean;
  $top?: boolean;
  $middle?: boolean;
  $bottom?: boolean;
}>`
  position: absolute;
  width: 24px;
  height: 2px;
  background: ${({ theme }) => theme.colors.text.primary};
  ${({ $top, $open }) =>
    $top &&
    css`
      transform: ${$open
        ? "translateY(0px) rotate(45deg)"
        : "translateY(-6px)"};
    `}
  ${({ $middle, $open }) =>
    $middle &&
    css`
      opacity: ${$open ? "0" : "0.9"};
    `}
    ${({ $bottom, $open }) =>
    $bottom &&
    css`
      transform: ${$open
        ? "translateY(0px) rotate(-45deg)"
        : "translateY(6px)"};
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
  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}px) {
    display: none;
  }
`;

const MobilePanel = styled.div<{ $open: boolean }>`
  position: fixed;
  top: 0;
  right: 0;
  width: min(80vw, 320px);
  height: 100dvh;
  background: ${({ theme }) => theme.colors.background.primary};
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
  @media (min-width: ${({ theme }) => theme.breakpoints.tablet}px) {
    display: none;
  }
`;

const MobileList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 0;
  padding: 0;
  list-style: none;
`;
