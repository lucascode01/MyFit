/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [
    'https://soothing-purpose-production.up.railway.app',
    'https://myfitt.up.railway.app',
    'http://myfitt.up.railway.app',
  ],
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '8000', pathname: '/media/**' },
      { protocol: 'https', hostname: '**', pathname: '/**' },
    ],
  },
};

module.exports = nextConfig;
