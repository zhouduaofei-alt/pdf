import type { SupportedLanguage } from './supportedLanguages'

/**
 * 将 ISO 3166-1 alpha-2 国家/地区码映射到站点支持的语言。
 *
 * 设计取舍：
 * - 站点未提供葡萄牙语/意大利语等独立资源时，优先映射到 `en`（覆盖面更广），避免强行回退到中文造成误解。
 * - 仅当「IP 地理识别接口失败」时，才按产品需求回退到中文（见 `detectLanguageFromIp` 的调用方）。
 */
export function countryCodeToLanguage(countryCode?: string | null): SupportedLanguage | null {
  if (!countryCode) return null
  const c = countryCode.trim().toUpperCase()
  if (c.length !== 2) return null

  const map: Record<string, SupportedLanguage> = {
    // 中文地区
    CN: 'zh',
    TW: 'zh',
    HK: 'zh',
    MO: 'zh',

    // 东亚
    JP: 'ja',
    KR: 'ko',

    // 德语区
    DE: 'de',
    AT: 'de',
    LI: 'de',
    // 瑞士多语言：这里不做精细拆分，统一落到英文以避免误判。
    CH: 'en',

    // 法语区（简化映射）
    FR: 'fr',
    BE: 'fr',
    MC: 'fr',

    // 西语区（简化映射）
    ES: 'es',
    MX: 'es',
    AR: 'es',
    CO: 'es',
    CL: 'es',
    PE: 'es',

    // 英语为主或不单独提供本地化时，统一落到英文资源
    US: 'en',
    GB: 'en',
    AU: 'en',
    CA: 'en',
    NZ: 'en',
    IE: 'en',
    SG: 'en',
    IN: 'en',
    MY: 'en',
    PH: 'en',
    ZA: 'en',
    NG: 'en',
    KE: 'en',
    GH: 'en',
    NL: 'en',
    SE: 'en',
    NO: 'en',
    FI: 'en',
    DK: 'en',
    IS: 'en',
    EE: 'en',
    LV: 'en',
    LT: 'en',
    PL: 'en',
    CZ: 'en',
    SK: 'en',
    HU: 'en',
    RO: 'en',
    BG: 'en',
    HR: 'en',
    SI: 'en',
    RS: 'en',
    UA: 'en',
    GR: 'en',
    CY: 'en',
    MT: 'en',
    IT: 'en',
    PT: 'en',
    BR: 'en',
    RU: 'en',
    TR: 'en',
    IL: 'en',
    AE: 'en',
    SA: 'en',
    EG: 'en',
    TH: 'en',
    VN: 'en',
    ID: 'en',
    BD: 'en',
    PK: 'en',
  }

  return map[c] ?? 'en'
}
