import { countryCodeToLanguage } from './countryToLanguage'
import type { SupportedLanguage } from './supportedLanguages'

type IpWhoPayload = {
  success?: boolean
  country_code?: string
}

type GeoJsCountryPayload = {
  country?: string
}

/**
 * 通过第三方接口推断用户所在国家/地区，从而选择界面语言。
 *
 * 重要说明（建议在隐私政策中披露）：
 * - 这是**额外的网络请求**，会访问 `ipwho.is` 与（兜底）`get.geojs.io`。
 * - 请求可能携带 IP 等网络元数据，并由对应服务商处理；**不包含**用户选择的本地文件内容。
 * - 若两个来源都失败，则返回 `null`：调用方应将界面语言回退为中文（产品需求）。
 */
export async function detectLanguageFromIp(signal?: AbortSignal): Promise<SupportedLanguage | null> {
  const ipWho = await tryIpWho(signal)
  if (ipWho) return ipWho

  const geoJs = await tryGeoJs(signal)
  if (geoJs) return geoJs

  return null
}

async function tryIpWho(signal?: AbortSignal): Promise<SupportedLanguage | null> {
  try {
    const res = await fetch('https://ipwho.is/', { method: 'GET', cache: 'no-store', signal })
    if (!res.ok) return null
    const data = (await res.json()) as IpWhoPayload
    if (data.success === false) return null
    return countryCodeToLanguage(data.country_code)
  } catch {
    return null
  }
}

async function tryGeoJs(signal?: AbortSignal): Promise<SupportedLanguage | null> {
  try {
    const res = await fetch('https://get.geojs.io/v1/ip/country.json', { method: 'GET', cache: 'no-store', signal })
    if (!res.ok) return null
    const data = (await res.json()) as GeoJsCountryPayload
    return countryCodeToLanguage(data.country)
  } catch {
    return null
  }
}
