import type { NextConfig } from "next";

// GitHub Pages 项目站点部署在 https://<user>.github.io/<repo>/。
// CI 通过 NEXT_PUBLIC_BASE_PATH 注入 "/<repo>"（见 .github/workflows/deploy.yml）；
// 本地开发与直接构建时该变量为空，因此保持无前缀（localhost:3000 正常访问）。
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath,
  assetPrefix: basePath || undefined,
  images: {
    // 静态导出需 unoptimized；子路径部署下图片前缀在组件里用 withBasePath 手动补（见 src/lib/basePath.ts）。
    unoptimized: true,
  },
  /* config options here */
};

export default nextConfig;
