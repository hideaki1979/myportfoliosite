import { Suspense } from "react";
import { Section } from "../layouts/PageLayout";
import { SectionHeading } from "../ui/Typography";
import QiitaArticles, { QiitaArticle, SkeletonLoader } from "../features/QiitaArticles";
import { fetchQiitaArticles, fetchQiitaProfile } from "../../lib/api/qiita";

interface QiitaSectionProps {
    showProfile?: boolean;
    limit?: number;
}

async function QiitaArticlesData({
    showProfile = true,
    limit = 6,
}: QiitaSectionProps) {
    let articles: QiitaArticle[] = [];
    let profile = null;

    try {
        [articles, profile] = await Promise.all([
            fetchQiitaArticles(10),
            fetchQiitaProfile(),
        ]);
    } catch (error) {
        console.error("Failed to fetch Articles Profile data:", error);
        // エラー時は空配列で表示（ErrorDisplayは次のステップで実装）
    }

    return (
        <QiitaArticles
            initialData={articles}
            profile={profile ?? undefined}
            showProfile={showProfile}
            limit={limit}
        />
    );
}

function QiitaArticlesLoading({
    showProfile = true,
    limit = 6,
}: QiitaSectionProps) {
    return (
        <SkeletonLoader
            count={limit}
            showProfile={showProfile}
        />
    );
}

export default function QiitaSection(props: QiitaSectionProps) {
    return (
        <Section $marginTop={64}>
            <SectionHeading>■Qiita</SectionHeading>
            <Suspense fallback={<QiitaArticlesLoading {...props} />}>
                <QiitaArticlesData {...props} />
            </Suspense>
        </Section>
    );
}
