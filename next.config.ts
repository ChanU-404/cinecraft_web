import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdf-parse'],
  reactStrictMode: false,
  turbopack: {}, // 🔑 이 한 줄이 핵심
};

export default nextConfig;
