//@ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Proxy /api/* to the FastAPI backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://backend:8000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
