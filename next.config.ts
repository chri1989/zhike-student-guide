import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  outputFileTracingExcludes: {'/*':['./work/**/*','./.env*','./.dev.vars*']},
};

export default nextConfig;
