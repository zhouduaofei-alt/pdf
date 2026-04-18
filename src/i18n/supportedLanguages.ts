/**
 * 站点支持的语言列表（与 `src/locales/*` 的资源键保持一致）。
 * 新增语言时：先补资源文件，再把代码加入此数组与 `htmlLangFor`。
 */
export const SUPPORTED_LANGUAGES = ['zh', 'en', 'ja', 'ko', 'de', 'fr', 'es'] as const

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

export function isSupportedLanguage(value: string): value is SupportedLanguage {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value)
}

/**
 * 设置 `<html lang>`：影响无障碍、搜索引擎与部分浏览器字体回退。
 */
export function htmlLangFor(lang: SupportedLanguage): string {
  switch (lang) {
    case 'zh':
      return 'zh-CN'
    case 'en':
      return 'en'
    case 'ja':
      return 'ja'
    case 'ko':
      return 'ko'
    case 'de':
      return 'de'
    case 'fr':
      return 'fr'
    case 'es':
      return 'es'
    default:
      return 'zh-CN'
  }
}
