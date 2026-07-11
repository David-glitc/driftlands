/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@driftlands/shared"],
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["@react-three/drei"],
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), "pino-pretty", "encoding"];
    return config;
  },
};

module.exports = nextConfig;
