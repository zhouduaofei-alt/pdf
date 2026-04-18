import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { I18nextProvider } from 'react-i18next'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import i18n from './i18n/config'
import './index.css'

/**
 * 应用入口：
 * - `StrictMode`：开发环境下帮助发现副作用与不安全的生命周期写法。
 * - `BrowserRouter`：使用 HTML5 History API（`/tools/...` 这种路径）。
 *   部署到 Cloudflare Pages 时需在 `public/_redirects` 配置 SPA 回退，否则刷新子路由会 404。
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </I18nextProvider>
  </StrictMode>,
)
