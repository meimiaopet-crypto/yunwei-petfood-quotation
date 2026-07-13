/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectReact = path.resolve(__dirname, 'node_modules/react');
const projectReactDom = path.resolve(__dirname, 'node_modules/react-dom');
const projectScheduler = path.resolve(__dirname, 'node_modules/scheduler');

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
  // 在 server 端把 react/react-dom/scheduler 解析强制指向项目 node_modules 的 React 18。
  // Next 15 内置的 react-builtin 是 React 19，element 标记 ($typeof) 与
  // @react-pdf/renderer 4.x 的 reconciler-23 写死的 React 18 symbol 列表不兼容，
  // 抛 Minified React error #31。@react-pdf 在 server runtime 跑 PDF route 时
  // require('react') 拿到的是 react-builtin，于是崩。
  // 风险：Next 15 自身也用项目 React 18，但 18.3.1 是 Next 15 peerDep 支持的版本，
  // 不影响页面渲染（前端 client component 走 Next 内置 React 19 即可）。
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    if (isServer) {
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
