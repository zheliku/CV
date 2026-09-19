// 子路径部署（GitHub Pages https://<user>.github.io/<repo>/）下，
// next/image 在 images.unoptimized 时不会自动为 src 拼接 basePath，导致本地图片 404。
// 统一用 withBasePath 给以 "/" 开头的本地路径补上 basePath（CI 注入的 NEXT_PUBLIC_BASE_PATH，如 "/CV"）。
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export function withBasePath(path: string): string {
    return path.startsWith('/') ? `${BASE_PATH}${path}` : path;
}
