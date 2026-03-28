/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Native addon: do not bundle into webpack (API route loads .node binary at runtime)
  experimental: {
    serverComponentsExternalPackages: ['@napi-rs/canvas'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('@napi-rs/canvas');
    }
    return config;
  },
  async redirects() {
    return [
      { source: '/search', destination: '/voters', permanent: false },
      { source: '/imports', destination: '/admin', permanent: false },
      { source: '/services', destination: '/admin', permanent: false },
      { source: '/upload', destination: '/voters', permanent: false },
      { source: '/signup', destination: '/admin', permanent: false },
    ];
  },
};

module.exports = nextConfig;
