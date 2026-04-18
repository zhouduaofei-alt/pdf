/**
 * 深度合并翻译对象：
 * - 以 `en` 作为「全量兜底」语言，其它语言只需提供少量覆盖（例如导航与按钮）。
 * - 这样可以在不复制长篇隐私文案的情况下，快速支持多语言界面。
 *
 * 注意：该函数假设对象结构为「纯 JSON 形态」（无函数/无 Date），与本项目的 i18n 资源一致。
 */
export function deepMergeTranslations<T extends Record<string, unknown>>(base: T, patch: Record<string, unknown>): T {
  const out: Record<string, unknown> = { ...base }

  for (const [key, value] of Object.entries(patch)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const prev = out[key]
      const prevObj =
        typeof prev === 'object' && prev !== null && !Array.isArray(prev) ? (prev as Record<string, unknown>) : {}
      out[key] = deepMergeTranslations(prevObj, value as Record<string, unknown>)
    } else {
      out[key] = value
    }
  }

  return out as T
}
