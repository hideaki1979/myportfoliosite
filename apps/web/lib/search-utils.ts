/**
 * 検索ユーティリティ
 * 
 * Qiita記事のクライアントサイド検索・フィルタリング機能を提供
 */

type TagLike = { name: string };
type SearchableArticle = { title: string; tags: TagLike[] };

/**
 * 記事からユニークなタグを抽出する
 * @param articles - 記事の配列
 * @returns 出現回数でソートされたタグ名の配列
 */
export function extractUniqueTags<T extends SearchableArticle>(
  articles: T[],
): string[] {
  const tagCount = new Map<string, number>();
  
  for (const article of articles) {
    for (const tag of article.tags) {
      const name = tag.name.toLowerCase();
      tagCount.set(name, (tagCount.get(name) || 0) + 1);
    }
  }
  
  // 出現回数でソート（多い順）
  return Array.from(tagCount.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);
}

/**
 * 検索クエリに基づいて記事をフィルタリングする
 * タイトルとタグ名を検索対象とする
 * 
 * @param articles - 記事の配列
 * @param query - 検索クエリ（空文字の場合は全記事を返す）
 * @returns フィルタリングされた記事の配列
 */
export function searchArticles<T extends SearchableArticle>(
  articles: T[],
  query: string,
): T[] {
  const trimmedQuery = query.trim().toLowerCase();
  
  if (!trimmedQuery) {
    return articles;
  }
  
  // スペースで分割して複数キーワードに対応
  const keywords = trimmedQuery.split(/\s+/).filter(Boolean);
  
  return articles.filter((article) => {
    const titleLower = article.title.toLowerCase();
    const tagNames = article.tags.map((tag) => tag.name.toLowerCase());
    
    // すべてのキーワードがタイトルまたはタグに含まれるか確認
    return keywords.every((keyword) => {
      return (
        titleLower.includes(keyword) ||
        tagNames.some((tagName) => tagName.includes(keyword))
      );
    });
  });
}

/**
 * 選択されたタグに基づいて記事をフィルタリングする
 * 
 * @param articles - 記事の配列
 * @param selectedTags - 選択されたタグ名の配列（空の場合は全記事を返す）
 * @returns フィルタリングされた記事の配列
 */
export function filterByTags<T extends SearchableArticle>(
  articles: T[],
  selectedTags: string[],
): T[] {
  if (selectedTags.length === 0) {
    return articles;
  }
  
  const selectedTagsLower = selectedTags.map((tag) => tag.toLowerCase());
  
  return articles.filter((article) => {
    const articleTagNames = article.tags.map((tag) => tag.name.toLowerCase());
    
    // 選択されたタグのいずれかを含む記事を返す（OR条件）
    return selectedTagsLower.some((selectedTag) =>
      articleTagNames.includes(selectedTag)
    );
  });
}

/**
 * 検索クエリとタグフィルターを組み合わせて記事をフィルタリングする
 * 
 * @param articles - 記事の配列
 * @param query - 検索クエリ
 * @param selectedTags - 選択されたタグ名の配列
 * @returns フィルタリングされた記事の配列
 */
export function filterArticles<T extends SearchableArticle>(
  articles: T[],
  query: string,
  selectedTags: string[],
): T[] {
  let result = articles;
  
  // 検索クエリでフィルタリング
  result = searchArticles(result, query);
  
  // タグでフィルタリング
  result = filterByTags(result, selectedTags);
  
  return result;
}

/**
 * デバウンス関数
 * 
 * @param fn - 実行する関数
 * @param delay - 遅延時間（ミリ秒）
 * @returns デバウンスされた関数
 */
export function debounce<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  delay: number,
): (...args: TArgs) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: TArgs) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}
