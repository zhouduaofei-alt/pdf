import i18n from './config'
import { detectLanguageFromIp } from './detectLanguageFromIp'
import { htmlLangFor, isSupportedLanguage, type SupportedLanguage } from './supportedLanguages'

const OVERRIDE_KEY = 'pms_locale_override'

/**
 * 读取用户手动选择的语言（写入 localStorage）。
 * 若存在且合法，则优先于 IP 推断（更符合用户预期）。
 */
export function readLocaleOverride(): SupportedLanguage | null {
  const raw = localStorage.getItem(OVERRIDE_KEY)
  if (!raw) return null
  if (!isSupportedLanguage(raw)) return null
  return raw
}

/** 写入手动语言；传 `null` 表示清除覆盖并回到自动模式。 */
export function writeLocaleOverride(lang: SupportedLanguage | null): void {
  if (!lang) {
    localStorage.removeItem(OVERRIDE_KEY)
    return
  }
  localStorage.setItem(OVERRIDE_KEY, lang)
}

/**
 * 自动模式：根据 IP 推断语言；失败则回退中文。
 * 该函数会被首次进入站点与语言选择器的「自动(IP)」选项复用。
 */
export async function applyAutoLanguageFromIp(signal?: AbortSignal): Promise<SupportedLanguage> {
  const detected = await detectLanguageFromIp(signal)
  const lang: SupportedLanguage = detected ?? 'zh'
  await i18n.changeLanguage(lang)
  document.documentElement.lang = htmlLangFor(lang)
  return lang
}

/**
 * 应用手动语言并同步 `<html lang>`。
 */
export async function applyManualLanguage(lang: SupportedLanguage): Promise<void> {
  await i18n.changeLanguage(lang)
  document.documentElement.lang = htmlLangFor(lang)
}

/**
 * 首屏语言初始化入口：
 * - 若存在手动覆盖：直接应用。
 * - 否则：在超时时间内尝试 IP 推断；失败回退中文。
 */
export async function bootstrapLanguageOnStartup(): Promise<void> {
  const override = readLocaleOverride()
  if (override) {
    await applyManualLanguage(override)
    return
  }

  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 4500)
  try {
    await applyAutoLanguageFromIp(controller.signal)
  } finally {
    window.clearTimeout(timer)
  }
}
