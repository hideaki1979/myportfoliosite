/** @type {import('next').NextConfig} */
// APIのベースURLを環境変数から取得
const apiDomain = process.env.API_URL || 'http://localhost:3100';

const nextConfig = {
    // Vercel向けの最適化
    transpilePackages: ['@repo/ui'],
    compiler: {
        styledComponents: true,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'github.com'
            },
        ],
    },
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=()',
                    },
                    {
                        key: 'Content-Security-Policy',
                        value: [
                            "default-src 'self'",
                            "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // 開発環境用
                            "style-src 'self' 'unsafe-inline'",  // 開発環境用
                            "img-src 'self' data: https:",
                            "font-src 'self' data:",
                            `connect-src 'self' ${apiDomain}`, // 特定のAPIドメインのみ許可
                            "frame-ancestors 'none'",
                            "base-uri 'self'",
                            "form-action 'self'",
                        ].join('; '),
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=63072000; includeSubDomains; preload',
                    },
                ],
            },
        ];
    },
    async redirects() {
        return [
            { source: '/home', destination: '/', permanent: true }
        ]
    },
};

export default nextConfig;
