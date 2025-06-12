/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedForwardedHosts: ['localhost:3001'],
    },
  },
};

export default nextConfig;
