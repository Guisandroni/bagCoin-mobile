import "@bagcoin/env/web";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactCompiler: true,
  transpilePackages: ["shiki"],
  serverExternalPackages: ["libsql", "@libsql/client"],
};

export default nextConfig;
