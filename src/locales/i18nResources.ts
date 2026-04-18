import { deepMergeTranslations } from './mergeTranslations'
import { en } from './en'
import { dePatch } from './patches/de'
import { esPatch } from './patches/es'
import { frPatch } from './patches/fr'
import { jaPatch } from './patches/ja'
import { koPatch } from './patches/ko'
import { zh } from './zh'

/**
 * i18next 资源表：
 * - `zh` / `en`：完整翻译（隐私条款等长文本齐全）。
 * - 其它语言：以 `en` 为底做深度合并，未覆盖字段自动回退英文（避免界面缺 key）。
 */
function packFromEnglish(patch: Record<string, unknown>): typeof en {
  return deepMergeTranslations(en as unknown as Record<string, unknown>, patch) as typeof en
}

export const resources = {
  zh: { translation: zh },
  en: { translation: en },
  ja: { translation: packFromEnglish(jaPatch as unknown as Record<string, unknown>) },
  ko: { translation: packFromEnglish(koPatch as unknown as Record<string, unknown>) },
  de: { translation: packFromEnglish(dePatch as unknown as Record<string, unknown>) },
  fr: { translation: packFromEnglish(frPatch as unknown as Record<string, unknown>) },
  es: { translation: packFromEnglish(esPatch as unknown as Record<string, unknown>) },
} as const
