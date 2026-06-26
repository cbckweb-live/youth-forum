import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "emsfthlfptmysgzpectv.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    qualities: [25, 50, 75, 85, 95, 100],
  },
};
export default nextConfig;
