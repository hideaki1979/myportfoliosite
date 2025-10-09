import type { RequestHandler } from 'express';
import helmet, { type HelmetOptions } from 'helmet';

// Helmet による標準的なセキュリティヘッダー設定
// API用途のため CSP は控えめに設定（必要に応じて拡張する）
export const securityMiddleware: RequestHandler = helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      'default-src': ["'self'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'object-src': ["'none'"],
      'base-url': ["'self'"],
      // 必要なら iframe 埋め込み制御:
      'frame-ancestors': ["'self'"],
    },
  },
  // API では referrer を落とすことが多い
  referrerPolicy: { policy: 'no-referrer' },
  // COEP が不要/問題になる場合は false（必要なら true へ）
  crossOriginEmbedderPolicy: false,
});
