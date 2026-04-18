import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/**
 * Vite 构建配置：
 * - `react()`：启用 React Fast Refresh 与 JSX 转换。
 * - `tailwindcss()`：Tailwind v4 官方 Vite 插件，从 CSS 的 `@import "tailwindcss"` 生成原子类。
 * 产物为纯静态资源，可直接上传到 Cloudflare Pages（Direct Upload）。
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  /**
   * 开发服务器：
   * - 显式绑定 `127.0.0.1`：在部分 Windows 环境下可规避 `localhost` 走 IPv6/代理导致的“打不开”。
   * - `strictPort: false`：5173 被占用时自动换端口（请以终端输出为准）。
   */
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: false,
  },
})
