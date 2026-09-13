import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Vehicle photos live in Supabase Storage (public bucket, see
    // supabase/migrations/0002_vehicle_images_storage.sql).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
