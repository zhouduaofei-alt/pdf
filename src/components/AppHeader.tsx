import { useTranslation } from 'react-i18next'
import { Link, NavLink } from 'react-router-dom'
import { cn } from '../lib/cn'
import { LanguageSwitcher } from './LanguageSwitcher'

const navItems = [
  { to: '/', key: 'home' as const, end: true },
  { to: '/tools/pdf-merge', key: 'pdfMerge' as const, end: false },
  { to: '/tools/image-compress', key: 'imageCompress' as const, end: false },
  { to: '/tools/pdf-to-word', key: 'pdfToWord' as const, end: false },
  { to: '/tools/word-to-pdf', key: 'wordToPdf' as const, end: false },
  { to: '/tools/pdf-to-image', key: 'pdfToImage' as const, end: false },
  { to: '/tools/image-to-pdf', key: 'imageToPdf' as const, end: false },
  { to: '/privacy', key: 'privacy' as const, end: false },
] as const

/**
 * 顶栏：Logo + 主导航 + 语言切换。
 * - 导航文案来自 i18n：`nav.*`。
 * - 小屏幕下允许横向滚动，避免换行破坏布局。
 */
export function AppHeader() {
  const { t } = useTranslation()

  return (
    <header className="sticky top-0 z-40 border-b border-surface-2/70 bg-surface-1/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 lg:px-8">
        <Link to="/" className="group flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-sm font-bold text-white shadow-glow transition group-hover:-translate-y-0.5">
            PM
          </span>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-ink-0">{t('brand.title')}</div>
            <div className="text-xs text-ink-2">{t('brand.subtitle')}</div>
          </div>
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          <nav className="flex items-center gap-1 overflow-x-auto text-sm [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'whitespace-nowrap rounded-full px-3 py-1.5 font-medium transition',
                    isActive
                      ? 'bg-accent-soft text-accent shadow-sm'
                      : 'text-ink-2 hover:bg-surface-2/60 hover:text-ink-0',
                  )
                }
              >
                {t(`nav.${item.key}`)}
              </NavLink>
            ))}
          </nav>

          <div className="shrink-0">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  )
}
