import { Metadata } from "next";
import { createBreadcrumbStructuredData, StructuredData } from "../../lib/structured-data";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mirrorman-portfolio.vercel.app'

const breadcrumbData = createBreadcrumbStructuredData({
    items: [
        { name: "ホーム", url: baseUrl },
        { name: "Contact", url: `${baseUrl}/contact` },
    ],
})

export const metadata: Metadata = {
    title: "Contact",
    description: "お仕事のご相談、技術的な質問、お問い合わせはこちらからお気軽にご連絡ください。フロントエンド・バックエンド開発に関するご相談をお待ちしています。",
    openGraph: {
        title: "Contact | Mirrorman Portfolio",
        description: "お仕事のご相談、技術的な質問、お問い合わせはこちらからお気軽にご連絡ください。フロントエンド・バックエンド開発に関するご相談をお待ちしています。",
        url: "/contact",
        type: "website",
        images: [
            {
                url: "/og-contact.jpg",
                width: 1200,
                height: 630,
                alt: "Contact - Mirrorman Portfolio",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        images: ["/og-contact.jpg"],
    },
    alternates: {
        canonical: "/contact",
    },
};

export default function ContactPage() {
    return (
        <>
            <StructuredData data={breadcrumbData} />
            <main style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
                <h1>Contact</h1>
                <p>このページは Contact のプレースホルダーです。フォームは後で実装します。</p>
            </main>
        </>
    )
}