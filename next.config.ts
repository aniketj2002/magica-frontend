import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.138"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "g.tlcdn.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/chat",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
