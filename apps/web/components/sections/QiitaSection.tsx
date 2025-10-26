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
    let error: Error | null = null;

    try {
        [articles, profile] = await Promise.all([
            fetchQiitaArticles(limit),
            fetchQiitaProfile(),
        ]);
    } catch (err) {
        console.error("Failed to fetch Articles Profile data:", err);
        error = err instanceof Error ? err : new Error('Qiita記事の取得に失敗しました');
    }

    return (
        <QiitaArticles
            initialData={articles}
            profile={profile ?? undefined}
            showProfile={showProfile}
            limit={limit}
            error={error}
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
