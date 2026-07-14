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
  // 把 @react-pdf/renderer 标记为外部包，避免 Next 打包它导致的解析问题。
  // 注：项目已统一到 React 19，@react-pdf/reconciler 会按 React.version 选择
  // reconciler-33（React 19），与 Next 15 内置 react-builtin 产出的
  // react.transitional.element 符号一致，不再触发 Minified React error #31。
  serverExternalPackages: ['@react-pdf/renderer'],
  // 确保本地字体文件被打包进 Vercel serverless function，
  // 否则生产环境 process.cwd()/assets/fonts 下找不到字体文件。
  outputFileTracingIncludes: {
    '/api/quotations/**': ['./assets/fonts/**'],
  },
  webpack: (config) => {
    config.resolve.alias = { ...config.resolve.alias, canvas: false };
    return config;
  },
};

export default nextConfig;
