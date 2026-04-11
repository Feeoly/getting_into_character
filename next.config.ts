import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@huggingface/transformers"],
  /** 生成 `.next/standalone`，供 Docker / 阿里云 SAE 等容器部署 */
  output: "standalone",
};

export default nextConfig;

