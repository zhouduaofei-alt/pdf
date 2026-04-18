import { useId, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { PageIntro } from '../../components/PageIntro'
import { Button } from '../../components/ui/Button'
import { triggerDownload } from '../../lib/download'
import { mergePdfFiles } from '../../lib/pdf/mergePdfs'

/**
 * PDF 合并工具页：
 * - 通过 `<input type="file" />` 与拖放区域收集 `File[]`。
 * - 点击合并后调用 `mergePdfFiles`，并用 `triggerDownload` 触发浏览器下载。
 * - 全程无服务端：适合作为「隐私优先」产品的第一个落地工具。
 */
export function PdfMergePage() {
  const { t } = useTranslation()
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  /** 用户选择的 PDF 列表（顺序即合并顺序） */
  const [files, setFiles] = useState<File[]>([])
  /** 处理中状态：用于禁用按钮，避免重复点击 */
  const [busy, setBusy] = useState(false)
  /** 最近一次错误信息（展示在页面上，避免只用 `alert`） */
  const [error, setError] = useState<string | null>(null)

  /** 用于展示体积合计（仅 UI 提示，不参与业务逻辑） */
  const totalSizeLabel = useMemo(() => {
    const bytes = files.reduce((sum, f) => sum + f.size, 0)
    if (bytes === 0) return t('common.bytes0')
    const mb = bytes / (1024 * 1024)
    if (mb >= 1) return `${mb.toFixed(2)} MB`
    const kb = bytes / 1024
    return `${kb.toFixed(1)} KB`
  }, [files, t])

  /**
   * 将用户新选择的文件追加到列表。
   * 这里过滤 `type === application/pdf`，避免用户误选其它格式导致 `pdf-lib` 抛错。
   */
  function appendPdfList(next: FileList | File[]) {
    const list = Array.from(next)
    const pdfs = list.filter((f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'))
    if (pdfs.length !== list.length) {
      setError(t('pdfMerge.errIgnoreNonPdf'))
    } else {
      setError(null)
    }
    setFiles((prev) => [...prev, ...pdfs])
  }

  function onPickFiles(e: ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files
    if (!picked || picked.length === 0) return
    appendPdfList(picked)
    // 允许用户重复选择同名文件：清空 input value
    e.target.value = ''
  }

  /** 拖放进入：必须 `preventDefault`，否则浏览器会打开文件离开页面 */
  function onDrop(e: DragEvent) {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      appendPdfList(e.dataTransfer.files)
    }
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault()
  }

  function removeAt(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  function move(index: number, direction: -1 | 1) {
    setFiles((prev) => {
      const next = [...prev]
      const j = index + direction
      if (j < 0 || j >= next.length) return prev
      const tmp = next[index]!
      next[index] = next[j]!
      next[j] = tmp
      return next
    })
  }

  async function onMerge() {
    setError(null)
    if (files.length === 0) {
      setError(t('pdfMerge.errPickOne'))
      return
    }

    setBusy(true)
    try {
      const bytes = await mergePdfFiles(files)
      triggerDownload(bytes, 'application/pdf', `merged-${Date.now()}.pdf`)
    } catch (err) {
      if (err instanceof Error && err.message === 'PMS_ERR_EMPTY_PDF_LIST') {
        setError(t('pdfMerge.errEmptyCode'))
      } else {
        const message = err instanceof Error ? err.message : t('pdfMerge.errMerge')
        setError(message)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageIntro title={t('pdfMerge.title')} description={t('pdfMerge.desc')} />

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-card border border-surface-2/80 bg-surface-1 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-ink-0">{t('pdfMerge.selectTitle')}</h2>
              <p className="mt-1 text-sm text-ink-2">{t('pdfMerge.selectHelp')}</p>
            </div>
            <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()}>
              {t('common.choosePdf')}
            </Button>
          </div>

          <input
            id={inputId}
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            multiple
            className="hidden"
            onChange={onPickFiles}
          />

          <div
            className="mt-6 grid min-h-[180px] place-items-center rounded-2xl border border-dashed border-surface-2 bg-surface-0/60 px-4 py-10 text-center transition hover:border-accent/35 hover:bg-accent-soft/20"
            onDrop={onDrop}
            onDragOver={onDragOver}
            role="presentation"
          >
            <div className="space-y-2">
              <p className="text-sm font-medium text-ink-0">{t('pdfMerge.dropTitle')}</p>
              <p className="text-xs text-ink-2">{t('pdfMerge.dropHelp')}</p>
            </div>
          </div>

          {error ? (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
              {error}
            </p>
          ) : null}
        </section>

        <aside className="space-y-4 rounded-card border border-surface-2/80 bg-surface-1 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink-0">{t('pdfMerge.queue')}</h2>
            <p className="text-xs text-ink-2">{t('common.total', { size: totalSizeLabel })}</p>
          </div>

          {files.length === 0 ? (
            <p className="text-sm text-ink-2">{t('pdfMerge.queueEmpty')}</p>
          ) : (
            <ol className="space-y-3">
              {files.map((file, index) => (
                <li
                  key={`${file.name}-${file.size}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-surface-2/80 bg-surface-0 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-0">{file.name}</p>
                    <p className="text-xs text-ink-2">{t('common.segment', { index: index + 1 })}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button type="button" variant="ghost" className="px-2 py-1 text-xs" onClick={() => move(index, -1)}>
                      {t('common.moveUp')}
                    </Button>
                    <Button type="button" variant="ghost" className="px-2 py-1 text-xs" onClick={() => move(index, 1)}>
                      {t('common.moveDown')}
                    </Button>
                    <Button type="button" variant="ghost" className="px-2 py-1 text-xs" onClick={() => removeAt(index)}>
                      {t('common.remove')}
                    </Button>
                  </div>
                </li>
              ))}
            </ol>
          )}

          <div className="pt-2">
            <Button type="button" className="w-full" disabled={busy || files.length === 0} onClick={() => void onMerge()}>
              {busy ? t('pdfMerge.merging') : t('pdfMerge.mergeBtn')}
            </Button>
            <p className="mt-3 text-xs leading-relaxed text-ink-2">{t('pdfMerge.tip')}</p>
          </div>
        </aside>
      </div>
    </div>
  )
}
