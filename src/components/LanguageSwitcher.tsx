import { useTranslation } from 'react-i18next'
import {
  applyAutoLanguageFromIp,
  applyManualLanguage,
  readLocaleOverride,
  writeLocaleOverride,
} from '../i18n/bootstrapLanguage'
import { SUPPORTED_LANGUAGES, isSupportedLanguage, type SupportedLanguage } from '../i18n/supportedLanguages'

/**
 * 语言选择器：
 * - `auto`：清除本地覆盖并重新执行 IP 推断（仍遵循「失败回退中文」）。
 * - 其它选项：写入 `localStorage` 并立即应用，优先于后续 IP 推断。
 */
export function LanguageSwitcher() {
  const { t } = useTranslation()
  const override = readLocaleOverride()
  const selectValue: 'auto' | SupportedLanguage = override ?? 'auto'

  const langLabels: Record<SupportedLanguage, string> = {
    zh: t('lang.zh'),
    en: t('lang.en'),
    ja: t('lang.ja'),
    ko: t('lang.ko'),
    de: t('lang.de'),
    fr: t('lang.fr'),
    es: t('lang.es'),
  }

  async function onSelectChange(raw: string) {
    if (raw === 'auto') {
      writeLocaleOverride(null)
      const controller = new AbortController()
      const timer = window.setTimeout(() => controller.abort(), 4500)
      try {
        await applyAutoLanguageFromIp(controller.signal)
      } finally {
        window.clearTimeout(timer)
      }
      return
    }

    if (!isSupportedLanguage(raw)) return
    writeLocaleOverride(raw)
    await applyManualLanguage(raw)
  }

  return (
    <label className="flex items-center gap-2 text-xs text-ink-2">
      <span className="hidden sm:inline">{t('lang.label')}</span>
      <select
        className="rounded-full border border-surface-2/80 bg-surface-1 px-2 py-1 text-xs font-medium text-ink-0 shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-accent"
        value={selectValue}
        onChange={(e) => void onSelectChange(e.target.value)}
        aria-label={t('lang.label')}
      >
        <option value="auto">{t('lang.auto')}</option>
        {SUPPORTED_LANGUAGES.map((lng) => (
          <option key={lng} value={lng}>
            {langLabels[lng]}
          </option>
        ))}
      </select>
      <span className="hidden lg:inline max-w-[220px] truncate text-[11px] text-ink-2/90">{t('lang.hint')}</span>
    </label>
  )
}
