import { useId, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { PageIntro } from '../../components/PageIntro'
import { Button } from '../../components/ui/Button'
import { triggerDownloadBlob } from '../../lib/download'
import { convertPdfFileToImagesZip, type PdfToImagesFormat } from '../../lib/pdf/pdfToImages'

export function PdfToImagePage() {
  const { t } = useTranslation()
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [format, setFormat] = useState<PdfToImagesFormat>('png')
  const [scale, setScale] = useState(2)
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
      setError(t('pdfToImage.errPickPdf'))
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
      setError(t('pdfToImage.errPickPdf'))
      return
    }

    setBusy(true)
    try {
      const blob = await convertPdfFileToImagesZip(file, { format, scale, jpegQuality: 0.9 })
      const base = file.name.replace(/\.pdf$/i, '')
      triggerDownloadBlob(blob, `${base}-pages.zip`)
    } catch {
      setError(t('pdfToImage.errFailed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageIntro title={t('pdfToImage.title')} description={t('pdfToImage.desc')} />

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-card border border-surface-2/80 bg-surface-1 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-ink-0">{t('pdfToImage.selectTitle')}</h2>
              <p className="mt-1 text-sm text-ink-2">{t('pdfToImage.selectHelp')}</p>
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
            className="mt-6 grid min-h-[160px] place-items-center rounded-2xl border border-dashed border-surface-2 bg-surface-0/60 px-4 py-10 text-center transition hover:border-accent/35 hover:bg-accent-soft/20"
            onDrop={onDrop}
            onDragOver={onDragOver}
            role="presentation"
          >
            <div className="space-y-2">
              <p className="text-sm font-medium text-ink-0">{t('pdfToImage.dropTitle')}</p>
              <p className="text-xs text-ink-2">{t('pdfToImage.dropHelp')}</p>
            </div>
          </div>

          <div className="mt-6 space-y-4 rounded-xl border border-surface-2/60 bg-surface-0/50 p-4">
            <div>
              <p className="text-sm font-medium text-ink-0">{t('pdfToImage.formatLabel')}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-sm">
                <label className="inline-flex cursor-pointer items-center gap-2 text-ink-2">
                  <input
                    type="radio"
                    name="p2i-fmt"
                    checked={format === 'png'}
                    onChange={() => setFormat('png')}
                  />
                  PNG
                </label>
                <label className="inline-flex cursor-pointer items-center gap-2 text-ink-2">
                  <input
                    type="radio"
                    name="p2i-fmt"
                    checked={format === 'jpeg'}
                    onChange={() => setFormat('jpeg')}
                  />
                  JPEG
                </label>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-ink-0" htmlFor="p2i-scale">
                {t('pdfToImage.scaleLabel', { scale })}
              </label>
              <input
                id="p2i-scale"
                type="range"
                min={1}
                max={4}
                step={0.25}
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="mt-2 w-full accent-accent"
              />
            </div>
          </div>

          {error ? (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
              {error}
            </p>
          ) : null}
        </section>

        <aside className="space-y-4 rounded-card border border-surface-2/80 bg-surface-1 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-ink-0">{t('pdfToImage.noteTitle')}</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-2">
            <li>{t('pdfToImage.note1')}</li>
            <li>{t('pdfToImage.note2')}</li>
          </ul>
          <div className="pt-2">
            <Button type="button" className="w-full" disabled={busy || !file} onClick={() => void onConvert()}>
              {busy ? t('pdfToImage.converting') : t('common.convertDownload')}
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
