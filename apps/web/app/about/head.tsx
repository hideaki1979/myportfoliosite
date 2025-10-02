import { baseUrl } from "../../lib/constants"
import { createBreadcrumbStructuredData, createPersonStructuredData } from "../../lib/structured-data"

export default function Head() {
    const personData = createPersonStructuredData({
        name: "Mirrorman",
        jobTitle: "フルスタックエンジニア",
        description:
            "フルスタックエンジニアを目指す46歳おじさん。React、Next.js、TypeScriptを中心としたWebアプリケーション開発に取り組んでいます。",
        url: `${baseUrl}/about`,
        image: `${baseUrl}/og-about.jpg`,
        sameAs: [
            "https://github.com/hideaki1979",
            "https://qiita.com/H_Kagami_Gs",
        ],
    });

    const breadcrumbData = createBreadcrumbStructuredData({
        items: [
            { name: "ホーム", url: baseUrl },
            { name: "About Me", url: `${baseUrl}/about` },
        ],
    });

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(personData) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
            />
        </>
    )
}