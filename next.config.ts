import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // In local dev, proxy /api/* to the Go server. On Vercel, vercel.json handles this.
    const apiUrl =
      process.env.API_URL ??
      (process.env.NODE_ENV === "development"
        ? "http://localhost:8080"
        : undefined);

    if (apiUrl) {
      return [
        {
          source: "/api/:path*",
          destination: `${apiUrl}/api/:path*`,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
