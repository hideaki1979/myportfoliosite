"use client"

import styled from "styled-components"

/**
 * ページ全体のコンテナ
 */
export const PageContainer = styled.div`
    max-width: 1248px;
    margin: 0 auto;
    padding: 24px 16px;
`;

/**
 * ホームページ用の広めのコンテナ
 */
export const WidePageContainer = styled.div`
    max-width: 1280px;
    margin: 0 auto;
    padding: 24px 16px;
`;

/**
 * セクション用コンテナ
 */
export const Section = styled.section<{$marginTop?: number}>`
    margin-top: ${(props) => props.$marginTop ?? 0}px;
`;
