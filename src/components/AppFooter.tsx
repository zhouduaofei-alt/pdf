import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

/**
 * 页脚：合规入口与简短声明（i18n：`footer.*`）。
 */
export function AppFooter() {
  const { t } = useTranslation()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-surface-2/80 bg-surface-1/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-ink-2 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p className="max-w-2xl leading-relaxed">
          {t('footer.textBefore')}{' '}
          <Link className="font-medium text-accent underline-offset-4 hover:underline" to="/privacy">
            {t('footer.privacyLink')}
          </Link>
          {t('footer.textAfter')}
        </p>
        <p className="text-xs text-ink-2/80">{t('footer.copyright', { year })}</p>
      </div>
    </footer>
  )
}
