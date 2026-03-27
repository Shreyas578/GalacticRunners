/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: false,
  images: {
    unoptimized: true,
  },
  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Fix for Phaser.js and other Node.js modules
    if (!isServer) {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            net: false,
            tls: false,
            crypto: false,
            stream: false,
            url: false,
            zlib: false,
            http: false,
            https: false,
            assert: false,
            os: false,
            path: false,
            canvas: false,
        }
    }
    return config
  },
  experimental: {
    // Ensuring fallback for any experimental features
  },
  // Silence Turbopack warning as we use Webpack for Phaser fallbacks
  turbopack: {},
}

export default nextConfig
