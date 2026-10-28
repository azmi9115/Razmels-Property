import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Upload Excel manager ops di halaman Update dari Excel (file ±300 KB, beri ruang)
    serverActions: { bodySizeLimit: "12mb" },
  },
};

export default nextConfig;
