/** @type {import('next').NextConfig} */
const nextConfig = {
  // ⚠️ 生产环境应该修复这些错误后移除以下配置
  // TODO: 修复所有 TypeScript 和 ESLint 错误
  eslint: {
    ignoreDuringBuilds: true, // ⚠️ 临时忽略，应该修复
  },
  typescript: {
    ignoreBuildErrors: true, // ⚠️ 临时忽略，应该修复
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },
};

export default nextConfig;
