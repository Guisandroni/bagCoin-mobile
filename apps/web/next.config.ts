import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  cacheComponents: true,

  // Bundle optimization (bundling.md)
  transpilePackages: [
    "@base-ui/react",
    "recharts",
    "framer-motion",
  ],
  serverExternalPackages: [],
};

export default nextConfig;
