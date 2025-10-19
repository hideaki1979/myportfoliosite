# QiitaArticles コンポーネント

Qiita記事を表示するためのコンポーネント群です。

## 構成

### QiitaArticles (メインコンポーネント)

Qiita記事一覧を表示するメインコンテナコンポーネント。

**Props:**

- `initialData?: QiitaArticle[]` - サーバーサイドで取得した記事データ
- `profile?: QiitaProfile` - Qiitaプロフィール情報
- `showProfile?: boolean` - プロフィールを表示するか（デフォルト: true）
- `limit?: number` - 表示する記事数の制限

**使用例:**

```tsx
import QiitaArticles from "@/components/features/QiitaArticles";
import { QIITA_PROFILE } from "@/lib/data/qiita-profile";

<QiitaArticles
  initialData={articles}
  profile={QIITA_PROFILE}
  showProfile={true}
  limit={10}
/>;
```

### QiitaProfile

Qiitaユーザーのプロフィール情報を表示するコンポーネント。

**Props:**

- `profile: QiitaProfile` - プロフィール情報

### ArticleCard

個別のQiita記事を表示するカードコンポーネント。

**Props:**

- `article: QiitaArticle` - 記事データ

**機能:**

- 記事タイトル、タグ、投稿日時を表示
- 記事へのリンク（新しいタブで開く）
- Qiitaアイコンの表示
- ホバー時のスタイル変更

## データ型

### QiitaArticle

```typescript
interface QiitaArticle {
  id: string;
  title: string;
  url: string;
  likesCount: number;
  stocksCount: number;
  createdAt: string;
  tags: QiitaTag[];
}
```

### QiitaTag

```typescript
interface QiitaTag {
  name: string;
  versions: string[];
}
```

### QiitaProfile

```typescript
interface QiitaProfile {
  username: string;
  displayName: string;
  profileUrl: string;
  description: string;
  avatarUrl: string;
}
```

## API クライアント

### fetchQiitaArticles (サーバーサイド)

```typescript
import { fetchQiitaArticles } from "@/lib/api/qiita";

const articles = await fetchQiitaArticles(10);
```

- Next.jsのキャッシュ機能で15分間キャッシュ
- バックエンドAPI経由でQiita記事を取得

### fetchQiitaArticlesClient (クライアントサイド)

```typescript
import { fetchQiitaArticlesClient } from "@/lib/api/qiita";

const articles = await fetchQiitaArticlesClient(10);
```

- キャッシュなしでリアルタイムデータを取得

## スタイリング

- Styled Componentsを使用
- Figmaデザインに基づいたレイアウト
- レスポンシブ対応
- アクセシビリティ対応（ARIA属性、キーボードナビゲーション）

## アクセシビリティ

- `role="list"` と `aria-label` でリスト構造を明示
- リンクに適切な `aria-label` を設定
- 新しいタブで開くリンクには `rel="noopener noreferrer"` を設定
- `time` 要素に `dateTime` 属性を設定

## 要件対応

- ✅ 要件2.4: Qiita APIから最新10件の記事を取得
- ✅ 要件2.5: 記事タイトル、投稿日、タグ情報の表示
- ✅ 要件2.10: 記事へのリンク（新しいタブで開く）
- ✅ 要件6.3: Next.jsキャッシュ機能で15分間キャッシュ
