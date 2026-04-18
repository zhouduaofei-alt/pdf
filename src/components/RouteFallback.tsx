import { useTranslation } from 'react-i18next'

/**
 * 路由懒加载占位 UI（i18n：`routeFallback.loading`）。
 */
export function RouteFallback() {
  const { t } = useTranslation()

  return (
    <div className="mx-auto max-w-3xl animate-pulse space-y-4 py-10">
      <p className="text-sm font-medium text-ink-2">{t('routeFallback.loading')}</p>
      <div className="h-9 w-2/3 rounded-lg bg-surface-2/80" />
      <div className="h-4 w-full rounded-lg bg-surface-2/60" />
      <div className="h-4 w-5/6 rounded-lg bg-surface-2/60" />
      <div className="mt-10 h-48 rounded-card bg-surface-2/40" />
    </div>
  )
}
