export const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL || 
  (process.env.NODE_ENV === 'development' ? "http://localhost:3000" : "https://myportfoliosite-web.vercel.app");
export const TYPING_SPEED_MS = 100;
export const ANIMATION_DELAY = 150;
