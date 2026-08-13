import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: ["@tilbecore/config", "@tilbecore/contracts", "@tilbecore/database-platform", "@tilbecore/observability", "@tilbecore/platform"],
  output: "standalone",
};

export default config;
