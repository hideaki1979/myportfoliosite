"use client"

import { useServerInsertedHTML } from "next/navigation";
import React, { useState } from "react"
import { ServerStyleSheet, StyleSheetManager } from "styled-components";

/**
 * styled-components の SSR Registry
 * Next.js App Router でスタイルを適切に注入するために必要
 */
export default function StyledComponentsRegistry({
    children,
}: {
    children: React.ReactNode;
}) {
    // クライアント側でのみ一度だけ ServerStyleSheet を初期化
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