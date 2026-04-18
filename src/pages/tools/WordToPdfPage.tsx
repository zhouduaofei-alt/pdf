import { useId, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { PageIntro } from '../../components/PageIntro'
import { Button } from '../../components/ui/Button'
import { triggerDownloadBlob } from '../../lib/download'
import { convertDocxFileToPdfBlob } from '../../lib/word/docxToPdfRaster'

/**
 * Word（.docx）→ PDF
 *
 * 能力边界：
 * - 使用 mammoth + html2canvas + jsPDF 的栅格化链路，更像“打印成 PDF”。
 * - 超长文档可能更慢；极端情况下浏览器内存压力更大。
 */
export function WordToPdfPage() {
  const { t } = useTranslation()
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function validateAndSet(next: File | null) {
    setError(null)
    if (!next) {
      setFile(null)
      return
    }
    if (!next.name.toLowerCase().endsWith('.docx')) {
      setError(t('wordToPdf.errDocxOnly'))
      setFile(null)
      return
    }
    setFile(next)
  }

  function onPick(e: ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0] ?? null
    e.target.value = ''
    validateAndSet(picked)
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    const picked = e.dataTransfer.files?.[0] ?? null
    validateAndSet(picked)
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault()
  }

  async function onConvert() {
    setError(null)
    if (!file) {
      setError(t('wordToPdf.errPickDocx'))
      return
    }

    setBusy(true)
    try {
      const blob = await convertDocxFileToPdfBlob(file)
      const base = file.name.replace(/\.docx$/i, '')
      triggerDownloadBlob(blob, `${base}.pdf`)
    } catch (err) {
      if (err instanceof Error && err.message === 'DOCX_ONLY') {
        setError(t('wordToPdf.errDocxOnly'))
      } else {
        setError(t('wordToPdf.errFailed'))
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageIntro title={t('wordToPdf.title')} description={t('wordToPdf.desc')} />

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-card border border-surface-2/80 bg-surface-1 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-ink-0">{t('wordToPdf.selectTitle')}</h2>
              <p className="mt-1 text-sm text-ink-2">{t('wordToPdf.selectHelp')}</p>
            </div>
            <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()}>
              {t('common.selectFile')}
            </Button>
          </div>

          <input
            id={inputId}
            ref={inputRef}
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={onPick}
          />

          <div
            className="mt-6 grid min-h-[180px] place-items-center rounded-2xl border border-dashed border-surface-2 bg-surface-0/60 px-4 py-10 text-center transition hover:border-accent/35 hover:bg-accent-soft/20"
            onDrop={onDrop}
            onDragOver={onDragOver}
            role="presentation"
          >
            <div className="space-y-2">
              <p className="text-sm font-medium text-ink-0">{t('wordToPdf.dropTitle')}</p>
              <p className="text-xs text-ink-2">{t('wordToPdf.dropHelp')}</p>
            </div>
          </div>

          {error ? (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
              {error}
            </p>
          ) : null}
        </section>

        <aside className="space-y-4 rounded-card border border-surface-2/80 bg-surface-1 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-ink-0">{t('wordToPdf.noteTitle')}</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-2">
            <li>{t('wordToPdf.note1')}</li>
            <li>{t('wordToPdf.note2')}</li>
            <li>{t('wordToPdf.note3')}</li>
          </ul>

          <div className="pt-2">
            <Button type="button" className="w-full" disabled={busy || !file} onClick={() => void onConvert()}>
              {busy ? t('wordToPdf.converting') : t('common.convertDownload')}
            </Button>
            {file ? (
              <p className="mt-3 truncate text-xs text-ink-2" title={file.name}>
                {file.name}
              </p>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  )
}
