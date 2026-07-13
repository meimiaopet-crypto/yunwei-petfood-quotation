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
  // 1) 把 @react-pdf/renderer 标记为外部包，Vercel 会用 require() 加载它（不进 bundle）
  // 2) 同时通过 webpack alias 把它的 React 解析强制指向 node_modules 里的 React 18
  //    避免 Next 15 内置的 react-builtin（React 19）覆盖 @react-pdf 的依赖，
  //    引发 Minified React error #31。
  // 3) 同理 react-dom、scheduler 也走项目版本
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    if (isServer) {
      // 在 Node 端，把 @react-pdf 的 react 解析到项目里的 React 18
      const path = require('path');
      const projectReact = path.resolve(__dirname, 'node_modules/react');
      const projectReactDom = path.resolve(__dirname, 'node_modules/react-dom');
      const projectScheduler = path.resolve(__dirname, 'node_modules/scheduler');
      config.resolve.alias = {
        ...config.resolve.alias,
        react: projectReact,
        'react-dom': projectReactDom,
        scheduler: projectScheduler,
      };
    }
    return config;
  },
};

export default nextConfig;
