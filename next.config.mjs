/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: { bodySizeLimit: '10mb' },
    // 强制让 @react-pdf/renderer 用项目 node_modules 的 React 18，
    // 避免被解析到 Next 15 内置的 React 19（react-builtin）。
    // React 19 的 element 标记与 @react-pdf/renderer 4.x 的 reconciler-23 不兼容
    // （Minified React error #31）。
    serverComponentsExternalPackages: ['@react-pdf/renderer'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.supabase.in' },
    ],
  },
  // @react-pdf/renderer 在 Vercel Edge 不可用，PDF 路由固定 Node runtime
  webpack: (config) => {
    config.resolve.alias = { ...config.resolve.alias, canvas: false };
    return config;
  },
};

export default nextConfig;
