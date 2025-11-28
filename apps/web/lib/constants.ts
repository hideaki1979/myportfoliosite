export const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NODE_ENV === 'development' ? "http://localhost:3000" : "https://myportfoliosite-web.vercel.app");

/**
 * バックエンドAPI URL（サーバーサイド専用）
 * サーバーコンポーネント・Route Handlerからのみアクセス可能
 */
export const apiBaseUrl = process.env.API_URL || 'http://localhost:3100';

export const TYPING_SPEED_MS = 100;
export const ANIMATION_DELAY = 150;
export const REVALIDATE_INTERVAL_SHORT = 600; // 10分
export const REVALIDATE_INTERVAL_LONG = 3600; // 1時間
