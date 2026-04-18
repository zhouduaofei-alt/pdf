import { useEffect } from 'react'
import { bootstrapLanguageOnStartup } from '../i18n/bootstrapLanguage'

/**
 * 语言启动器：
 * - 放在布局根部执行一次，确保首屏尽快应用「手动覆盖语言」或「IP 推断语言」。
 * - 不在此处渲染 UI；语言切换由 `LanguageSwitcher` 负责。
 */
export function LanguageBootstrap() {
  useEffect(() => {
    void bootstrapLanguageOnStartup()
  }, [])

  return null
}
