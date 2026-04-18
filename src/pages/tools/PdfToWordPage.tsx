import { useId, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { PageIntro } from '../../components/PageIntro'
import { Button } from '../../components/ui/Button'
import { triggerDownloadBlob } from '../../lib/download'
import { convertPdfFileToDocxBlob } from '../../lib/pdf/pdfToDocx'

/**
 * PDF → Word（.docx）
 *
 * 能力边界：
 * - 正文来自文本层抽取（可编辑）；嵌入图来自绘制指令中的位图对象（非整页截图）。
 * - 扫描件可能几乎无字；复杂版式/表格/图文穿插位置不保证与 PDF 完全一致。
 */
export function PdfToWordPage() {
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
    const ok = next.type === 'application/pdf' || next.name.toLowerCase().endsWith('.pdf')
    if (!ok) {
      setError(t('pdfToWord.errPickPdf'))
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
      setError(t('pdfToWord.errPickPdf'))
      return
    }

    setBusy(true)
    try {
      const blob = await convertPdfFileToDocxBlob(file)
      const base = file.name.replace(/\.pdf$/i, '')
      triggerDownloadBlob(blob, `${base}.docx`)
    } catch {
      setError(t('pdfToWord.errFailed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageIntro title={t('pdfToWord.title')} description={t('pdfToWord.desc')} />

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-card border border-surface-2/80 bg-surface-1 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-ink-0">{t('pdfToWord.selectTitle')}</h2>
              <p className="mt-1 text-sm text-ink-2">{t('pdfToWord.selectHelp')}</p>
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
              <p className="text-sm font-medium text-ink-0">{t('pdfToWord.dropTitle')}</p>
              <p className="text-xs text-ink-2">{t('pdfToWord.dropHelp')}</p>
            </div>
          </div>

          {error ? (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
              {error}
            </p>
          ) : null}
        </section>

        <aside className="space-y-4 rounded-card border border-surface-2/80 bg-surface-1 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-ink-0">{t('pdfToWord.noteTitle')}</h2>
          </div>

          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-2">
            <li>{t('pdfToWord.note1')}</li>
            <li>{t('pdfToWord.note2')}</li>
          </ul>

          <div className="pt-2">
            <Button type="button" className="w-full" disabled={busy || !file} onClick={() => void onConvert()}>
              {busy ? t('pdfToWord.converting') : t('common.convertDownload')}
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
