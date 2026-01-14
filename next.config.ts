import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**', // Permite qualquer caminho dentro do Cloudinary
      },
    ],
  },

  reactStrictMode: true,
  // Isso ajuda a ignorar erros de build de tipos durante o desenvolvimento
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;