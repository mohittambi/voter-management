/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
