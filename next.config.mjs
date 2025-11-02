/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',  // enable standalone SSR output
  images: {
    domains: ['avatars.githubusercontent.com'],
  },
};

export default nextConfig;
