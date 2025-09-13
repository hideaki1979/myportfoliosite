/** @type {import('next').NextConfig} */
const nextConfig = {
    // Vercel向けの最適化
    transpilePackages: ['@repo/ui'],
    compiler: {
        styledComponents: true,
    },
};

export default nextConfig;
