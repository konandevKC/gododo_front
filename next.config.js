/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pour le déploiement sur serveur Node.js, utilisez 'standalone'
  // Pour un build statique, utilisez 'export'
  // output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
      {
        protocol: 'https',
        hostname: 'apimonbeaupays.loyerpay.ci',
        pathname: '/storage/**',
      },
      {
        protocol: 'https',
        hostname: 'monbeaupays.loyerpay.ci',
        pathname: '/api/storage/**',
      },
      {
        protocol: 'https',
        hostname: 'monbeaupays.loyerpay.ci',
        pathname: '/storage/**',
      },
      // Configuration pour le développement local
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/storage/**',
      },
    ],
  },
}

module.exports = nextConfig

