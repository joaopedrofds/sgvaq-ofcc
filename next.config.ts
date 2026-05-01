import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
};

// Só aplica o PWA em produção (build)
if (process.env.NODE_ENV === 'production') {
  const withPWA = require('next-pwa')
  module.exports = withPWA({
    dest: 'public',
    register: true,
    skipWaiting: true,
  })(nextConfig)
} else {
  module.exports = nextConfig
}