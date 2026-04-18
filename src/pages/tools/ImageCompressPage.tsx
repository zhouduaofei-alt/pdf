import imageCompression from 'browser-image-compression'
import { useId, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { PageIntro } from '../../components/PageIntro'
import { Button } from '../../components/ui/Button'
import { triggerDownload } from '../../lib/download'
import { usePreferenceStore } from '../../stores/preferenceStore'

/**
 * 图片压缩工具页：
 * - 使用 `browser-image-compression` 在浏览器端压缩图片，可选 Web Worker 避免主线程卡顿。
 * - 默认质量来自 `usePreferenceStore`，用于演示 zustand 在「跨组件共享偏好」时的最小用法。
 */
export function ImageCompressPage() {
  const { t } = useTranslation()
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  const imageQuality = usePreferenceStore((s) => s.imageQuality)
  const setImageQuality = usePreferenceStore((s) => s.setImageQuality)

  const [source, setSource] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultMeta, setResultMeta] = useState<{ name: string; size: number } | null>(null)

  /** 人类可读的文件大小 */
  const sourceSizeLabel = useMemo(() => {
    if (!source) return t('common.emDash')
    return formatBytes(source.size, t('common.bytes0'))
  }, [source, t])

  function onPickImage(e: ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0]
    e.target.value = ''
    setError(null)
    setResultMeta(null)

    if (!picked) return
    if (!picked.type.startsWith('image/')) {
      setError(t('imageCompress.errNotImage'))
      return
    }

    // 释放上一轮 object URL，避免内存泄漏
    if (previewUrl) URL.revokeObjectURL(previewUrl)

    setSource(picked)
    setPreviewUrl(URL.createObjectURL(picked))
  }

  /**
   * 执行压缩：
   * - `useWebWorker: true`：把重计算放到 Worker（若环境不支持会回退，具体以库行为为准）。
   * - `initialQuality`：越小体积越小，但伪影更明显；这里用滑块让用户权衡。
   */
  async function onCompress() {
    setError(null)
    setResultMeta(null)
    if (!source) {
      setError(t('imageCompress.errPick'))
      return
    }

    setBusy(true)
    try {
      const compressed = await imageCompression(source, {
        maxSizeMB: 256,
        maxWidthOrHeight: 4096,
        useWebWorker: true,
        initialQuality: imageQuality,
      })

      const buf = await compressed.arrayBuffer()
      triggerDownload(buf, compressed.type || 'application/octet-stream', buildDownloadName(source.name))
      setResultMeta({ name: compressed.name, size: compressed.size })
    } catch (err) {
      const message = err instanceof Error ? err.message : t('imageCompress.errCompress')
      setError(message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageIntro title={t('imageCompress.title')} description={t('imageCompress.desc')} />

      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <section className="rounded-card border border-surface-2/80 bg-surface-1 p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-ink-0">{t('imageCompress.selectTitle')}</h2>
              <p className="mt-1 text-sm text-ink-2">{t('imageCompress.selectHelp')}</p>
            </div>
            <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()}>
              {t('common.selectFile')}
            </Button>
          </div>

          <input
            id={inputId}
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPickImage}
          />

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="overflow-hidden rounded-2xl border border-surface-2/80 bg-surface-0">
              {previewUrl ? (
                <img src={previewUrl} alt={t('imageCompress.previewAlt')} className="max-h-[360px] w-full object-contain" />
              ) : (
                <div className="grid min-h-[240px] place-items-center px-6 text-center text-sm text-ink-2">
                  {t('imageCompress.noPreview')}
                </div>
              )}
            </div>

            <div className="space-y-5">
              <div className="rounded-2xl border border-surface-2/80 bg-surface-0 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-ink-0">{t('imageCompress.quality')}</p>
                  <p className="text-xs tabular-nums text-ink-2">{imageQuality.toFixed(2)}</p>
                </div>
                <input
                  type="range"
                  min={0.45}
                  max={0.95}
                  step={0.01}
                  value={imageQuality}
                  onChange={(e) => setImageQuality(Number(e.target.value))}
                  className="mt-4 w-full accent-accent"
                />
                <p className="mt-2 text-xs leading-relaxed text-ink-2">{t('imageCompress.qualityHelp')}</p>
              </div>

              <div className="rounded-2xl border border-surface-2/80 bg-surface-0 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-ink-2">{t('imageCompress.originalSize')}</span>
                  <span className="font-medium text-ink-0">{sourceSizeLabel}</span>
                </div>
                {resultMeta ? (
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-ink-2">{t('imageCompress.outputSize')}</span>
                    <span className="font-medium text-ink-0">{formatBytes(resultMeta.size, t('common.bytes0'))}</span>
                  </div>
                ) : null}
              </div>

              {error ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
                  {error}
                </p>
              ) : null}

              <Button type="button" className="w-full" disabled={busy || !source} onClick={() => void onCompress()}>
                {busy ? t('imageCompress.compressing') : t('imageCompress.compressDownload')}
              </Button>
            </div>
          </div>
        </section>

        <aside className="rounded-card border border-surface-2/80 bg-surface-1 p-6 text-sm leading-relaxed text-ink-2 shadow-sm">
          <h2 className="text-lg font-semibold text-ink-0">{t('imageCompress.noteTitle')}</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5">
            <li>{t('imageCompress.note1')}</li>
            <li>{t('imageCompress.note2')}</li>
            <li>{t('imageCompress.note3')}</li>
          </ul>
        </aside>
      </div>
    </div>
  )
}

function formatBytes(bytes: number, zeroLabel: string): string {
  if (bytes === 0) return zeroLabel
  const mb = bytes / (1024 * 1024)
  if (mb >= 1) return `${mb.toFixed(2)} MB`
  const kb = bytes / 1024
  return `${kb.toFixed(1)} KB`
}

/**
 * 生成下载文件名：尽量保留原扩展名，前缀标注 compressed。
 * 说明：不同浏览器对下载文件名的 Unicode 支持略有差异，这里保持简单实现。
 */
function buildDownloadName(original: string): string {
  const dot = original.lastIndexOf('.')
  const base = dot > 0 ? original.slice(0, dot) : original
  const ext = dot > 0 ? original.slice(dot) : ''
  return `${base}-compressed${ext || '.bin'}`
}
