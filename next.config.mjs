/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow accessing the dev server from other devices on your LAN
  // (e.g. http://10.79.99.138:3000) without the cross-origin warning.
  allowedDevOrigins: ["10.79.99.138"],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
