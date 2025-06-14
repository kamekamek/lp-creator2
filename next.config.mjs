/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      allowedForwardedHosts: ['localhost:3001'],
    },
  },
};

export default nextConfig;
