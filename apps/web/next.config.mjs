/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@structpaper/doc-model',
    '@structpaper/editor-core',
    '@structpaper/storage',
    '@structpaper/ingest-docx',
    '@structpaper/journal-profiles',
    '@structpaper/qc-engine',
    '@structpaper/exporters',
    '@structpaper/compiler-client',
  ],
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
};

export default nextConfig;
