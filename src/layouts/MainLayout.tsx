import { AnimatePresence, motion } from 'framer-motion'
import { Outlet, useLocation } from 'react-router-dom'
import { AppFooter } from '../components/AppFooter'
import { AppHeader } from '../components/AppHeader'
import { DocumentSeo } from '../components/DocumentSeo'
import { LanguageBootstrap } from '../components/LanguageBootstrap'

/**
 * 站点主布局：
 * - `AppHeader`：全局导航与品牌区（sticky，滚动时仍可见，便于工具站快速跳转）。
 * - `Outlet`：子路由页面渲染位置。
 * - `AnimatePresence` + `motion.div`：路由切换时的轻量过渡（opacity + 位移），增强「灵动感」。
 *
 * 注意：`AnimatePresence` 需要 `key={location.pathname}` 才能识别不同页面并播放 exit 动画。
 */
export function MainLayout() {
  const location = useLocation()

  return (
    <div className="flex min-h-dvh flex-col bg-surface-0 text-ink-1">
      <LanguageBootstrap />
      <DocumentSeo />
      <AppHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <AppFooter />
    </div>
  )
}
