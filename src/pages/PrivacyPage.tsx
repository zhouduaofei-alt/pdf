import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

function dateLocaleForUiLanguage(lang: string): string {
  if (lang.startsWith('zh')) return 'zh-CN'
  if (lang === 'ja') return 'ja-JP'
  if (lang === 'ko') return 'ko-KR'
  if (lang === 'de') return 'de-DE'
  if (lang === 'fr') return 'fr-FR'
  if (lang === 'es') return 'es-ES'
  return 'en-US'
}

/**
 * 隐私说明：
 * - 文案走 i18n：`privacy.*`。
 * - 日期格式随当前界面语言变化（仅展示层，不改变条款含义）。
 */
export function PrivacyPage() {
  const { t, i18n } = useTranslation()

  const updated = useMemo(() => {
    const loc = dateLocaleForUiLanguage(i18n.language)
    return new Date().toLocaleDateString(loc)
  }, [i18n.language])

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-ink-0">{t('privacy.title')}</h1>
        <p className="text-sm text-ink-2">{t('privacy.updated', { date: updated })}</p>
      </header>

      <section className="space-y-3 rounded-card border border-surface-2/80 bg-surface-1 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-ink-0">{t('privacy.s1t')}</h2>
        <p className="text-sm leading-relaxed text-ink-2">{t('privacy.s1b')}</p>
      </section>

      <section className="space-y-3 rounded-card border border-surface-2/80 bg-surface-1 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-ink-0">{t('privacy.s2t')}</h2>
        <p className="text-sm leading-relaxed text-ink-2">{t('privacy.s2b')}</p>
      </section>

      <section className="space-y-3 rounded-card border border-surface-2/80 bg-surface-1 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-ink-0">{t('privacy.s3t')}</h2>
        <p className="text-sm leading-relaxed text-ink-2">{t('privacy.s3b')}</p>
      </section>

      <section className="space-y-3 rounded-card border border-surface-2/80 bg-surface-1 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-ink-0">{t('privacy.s4t')}</h2>
        <p className="text-sm leading-relaxed text-ink-2">{t('privacy.s4b')}</p>
      </section>
    </div>
  )
}
