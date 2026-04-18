import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'

/**
 * 首页：品牌主视觉 + 工具入口卡片。
 * - 文案全部走 i18n：`home.*`。
 * - 动效策略保持不变：hover 微位移 + 柔和阴影。
 */
export function HomePage() {
  const { t } = useTranslation()

  const tools = useMemo(
    () =>
      [
        { to: '/tools/pdf-merge', key: 'pdfMerge' as const },
        { to: '/tools/image-compress', key: 'imageCompress' as const },
        { to: '/tools/pdf-to-word', key: 'pdfToWord' as const },
        { to: '/tools/word-to-pdf', key: 'wordToPdf' as const },
        { to: '/tools/pdf-to-image', key: 'pdfToImage' as const },
        { to: '/tools/image-to-pdf', key: 'imageToPdf' as const },
      ] as const,
    [],
  )

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-[1.5rem] border border-surface-2/80 bg-surface-1 p-8 shadow-soft sm:p-10">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-10 h-72 w-72 rounded-full bg-indigo-300/20 blur-3xl" />

        <div className="relative space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent ring-1 ring-accent/15">
            {t('home.badge')}
          </p>
          <div className="space-y-4">
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-ink-0 sm:text-5xl">{t('home.title')}</h1>
            <p className="max-w-2xl text-pretty text-base leading-relaxed text-ink-2 sm:text-lg">{t('home.subtitle')}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild>
              <Link to="/tools/pdf-merge">{t('home.ctaPdfMerge')}</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/tools/image-compress">{t('home.ctaImage')}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-ink-0">{t('home.toolsTitle')}</h2>
            <p className="mt-1 text-sm text-ink-2">{t('home.toolsSubtitle')}</p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {tools.map((tool, index) => (
            <motion.article
              key={tool.to}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.05 * index }}
              whileHover={{ y: -4 }}
              className="group relative overflow-hidden rounded-card border border-surface-2/80 bg-surface-1 p-6 shadow-sm ring-1 ring-transparent transition will-change-transform hover:shadow-soft hover:ring-accent/15"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                    {t(`home.tools.${tool.key}.tag`)}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-ink-0">{t(`home.tools.${tool.key}.title`)}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-2">{t(`home.tools.${tool.key}.desc`)}</p>
                </div>
              </div>

              <div className="mt-6">
                <Button asChild variant="secondary" className="w-full sm:w-auto">
                  <Link to={tool.to}>{t('home.enter')}</Link>
                </Button>
              </div>
            </motion.article>
          ))}
        </div>
      </section>
    </div>
  )
}
