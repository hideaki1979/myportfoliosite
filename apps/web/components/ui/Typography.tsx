"use client"

import styled from "styled-components"

/**
 * ページタイトル（中央揃え、大きめ）
 */
export const PageTitle = styled.h1`
    font-family: "Noto Sans JP", sans-serif;
    font-weight: 700;
    font-size: 28px;
    text-align: center;
    margin-bottom: 8px;
`;

/**
 * セクション見出し（左揃え）
 */
export const SectionHeading = styled.h2<{$withIcon?: boolean}>`
    font-family: "Noto Sans JP", sans-serif;
    font-weight: 700;
    font-size: 28px;
    margin-bottom: 24px;
    display: ${(props) => (props.$withIcon ? "flex" : "block")};
    align-items: ${(props) => (props.$withIcon ? "center" : "initial")};
    gap: ${(props) => (props.$withIcon ? "12px" : "0")};
`;

/**
 * ページ説明文（中央揃え）
 */
export const PageDescription = styled.p`
    text-align: center;
    margin-bottom: 48px;
    font-family: "Noto Sans JP", sans-serif;
    font-size: 16px;
    line-height: 1.6;
`;

/**
 * ページサブタイトル（中央揃え、太字）
 */
export const PageSubtitle = styled.p`
  text-align: center;
  margin-bottom: 48px;
  font-family: "Noto Sans JP", sans-serif;
  font-size: 28px;
  font-weight: 700;
`;
