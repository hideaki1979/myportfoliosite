"use client"

import { useServerInsertedHTML } from "next/navigation";
import React, { useState } from "react"
import { ServerStyleSheet, StyleSheetManager } from "styled-components";

/**
 * styled-components の SSR Registry
 * Next.js App Router でスタイルを適切に注入するために必要
 */
interface StyleComponentsRegistryProps {
    children: React.ReactNode;
};

export default function StyledComponentsRegistry({
    children,
}: StyleComponentsRegistryProps) {
    // ServerStyleSheet を初期化（サーバー側のSSR時とクライアント側で各一度）
    const [styledComponentsStyleSheet] = useState(() => new ServerStyleSheet());

    useServerInsertedHTML(() => {
        const styles = styledComponentsStyleSheet.getStyleElement();
        styledComponentsStyleSheet.instance.clearTag();
        return <>{styles}</>;
    });

    if (typeof window !== 'undefined') return <>{children}</>;

    return (
        <StyleSheetManager sheet={styledComponentsStyleSheet.instance}>
            {children}
        </StyleSheetManager>
    )
}