import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { resources } from '../locales/i18nResources'

/**
 * i18next 初始化：
 * - `fallbackLng: 'zh'`：当某个语言资源缺 key 时，回退到中文（与「IP 失败回退中文」策略一致）。
 * - `react.useSuspense: false`：避免路由懒加载 + Suspense 与 i18n suspense 叠加导致白屏门槛变高。
 */
void i18n.use(initReactI18next).init({
  resources,
  lng: 'zh',
  fallbackLng: 'zh',
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
})

export default i18n
