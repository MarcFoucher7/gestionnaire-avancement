import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // pour envoyer un PDF de cours au « projet magique »
    serverActions: { bodySizeLimit: "25mb" },
  },
};

export default nextConfig;
