import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: ["preview-chat-05cc2e0b-fc19-40f6-884d-f1b793f8fefd.space-z.ai"],
};

export default nextConfig;
