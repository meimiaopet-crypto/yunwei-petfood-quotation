/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: { bodySizeLimit: '10mb' },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.supabase.in' },
    ],
  },
  // 关键：
  // 把 @react-pdf/renderer 标记为外部包，让 Vercel 用 require() 而不是 bundle。
  // 这样 @react-pdf 内部 require('react') 会走它自己 node_modules 里的解析，
  // 不被 Next.js 替换为 react-builtin（React 19）。
  // 由于 @react-pdf 4.x 的 reconciler 写死 React 18 element symbol，
  // 与 React 19 不兼容，所以必须用 require 而不是 bundled ESM。
  serverExternalPackages: ['@react-pdf/renderer'],
  webpack: (config) => {
    config.resolve.alias = { ...config.resolve.alias, canvas: false };
    return config;
  },
};

export default nextConfig;
