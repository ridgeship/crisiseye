import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    qualities: [100, 75],
  },
  async redirects() {
    return [
      {
        source: '/responderdashboard',
        destination: '/responder',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
