import { useId, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { PageIntro } from '../../components/PageIntro'
import { Button } from '../../components/ui/Button'
import { triggerDownload } from '../../lib/download'
import { convertImageFilesToPdfBytes } from '../../lib/pdf/imagesToPdf'

export function ImageToPdfPage() {
  const { t } = useTranslation()
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalSizeLabel = useMemo(() => {
    const bytes = files.reduce((sum, f) => sum + f.size, 0)
    if (bytes === 0) return t('common.bytes0')
    const mb = bytes / (1024 * 1024)
    if (mb >= 1) return `${mb.toFixed(2)} MB`
    const kb = bytes / 1024
    return `${kb.toFixed(1)} KB`
  }, [files, t])

  function isLikelyImage(f: File): boolean {
    if (f.type.startsWith('image/')) return true
    const n = f.name.toLowerCase()
    return ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.tif', '.tiff'].some((ext) => n.endsWith(ext))
  }

  function appendImages(list: FileList | File[]) {
    const arr = Array.from(list)
    const imgs = arr.filter(isLikelyImage)
    if (imgs.length !== arr.length) {
      setError(t('imageToPdf.errIgnoreNonImage'))
    } else {
      setError(null)
    }
    setFiles((prev) => [...prev, ...imgs])
  }

  function onPick(e: ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files
    if (!picked?.length) return
    appendImages(picked)
    e.target.value = ''
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    if (e.dataTransfer.files?.length) appendImages(e.dataTransfer.files)
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

  async function onConvert() {
    setError(null)
    if (files.length === 0) {
      setError(t('imageToPdf.errPickOne'))
      return
    }

    setBusy(true)
    try {
      const bytes = await convertImageFilesToPdfBytes(files)
      triggerDownload(bytes, 'application/pdf', `images-${Date.now()}.pdf`)
    } catch (err) {
      if (err instanceof Error && err.message === 'PMS_ERR_EMPTY_IMAGE_LIST') {
        setError(t('imageToPdf.errPickOne'))
      } else {
        setError(t('imageToPdf.errFailed'))
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageIntro title={t('imageToPdf.title')} description={t('imageToPdf.desc')} />

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-card border border-surface-2/80 bg-surface-1 p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-ink-0">{t('imageToPdf.selectTitle')}</h2>
              <p className="mt-1 text-sm text-ink-2">{t('imageToPdf.selectHelp')}</p>
            </div>
            <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()}>
              {t('common.chooseImages')}
            </Button>
          </div>

          <input
            id={inputId}
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={onPick}
          />

          <div
            className="mt-6 grid min-h-[140px] place-items-center rounded-2xl border border-dashed border-surface-2 bg-surface-0/60 px-4 py-8 text-center transition hover:border-accent/35 hover:bg-accent-soft/20"
            onDrop={onDrop}
            onDragOver={onDragOver}
            role="presentation"
          >
            <div className="space-y-2">
              <p className="text-sm font-medium text-ink-0">{t('imageToPdf.dropTitle')}</p>
              <p className="text-xs text-ink-2">{t('imageToPdf.dropHelp')}</p>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between gap-3 text-sm text-ink-2">
              <span>{t('imageToPdf.queue')}</span>
              <span>{t('common.total', { size: totalSizeLabel })}</span>
            </div>
            <ul className="mt-3 divide-y divide-surface-2 rounded-xl border border-surface-2/70 bg-surface-0/40">
              {files.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-ink-2">{t('imageToPdf.queueEmpty')}</li>
              ) : (
                files.map((f, i) => (
                  <li key={`${f.name}-${i}`} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
                    <span className="min-w-0 flex-1 truncate font-medium text-ink-0" title={f.name}>
                      {f.name}
                    </span>
                    <div className="flex shrink-0 gap-1">
                      <Button type="button" variant="secondary" className="px-2 py-1 text-xs" onClick={() => move(i, -1)}>
                        {t('common.moveUp')}
                      </Button>
                      <Button type="button" variant="secondary" className="px-2 py-1 text-xs" onClick={() => move(i, 1)}>
                        {t('common.moveDown')}
                      </Button>
                      <Button type="button" variant="secondary" className="px-2 py-1 text-xs" onClick={() => removeAt(i)}>
                        {t('common.remove')}
                      </Button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>

          {error ? (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
              {error}
            </p>
          ) : null}
        </section>

        <aside className="space-y-4 rounded-card border border-surface-2/80 bg-surface-1 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-ink-0">{t('imageToPdf.noteTitle')}</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-2">
            <li>{t('imageToPdf.note1')}</li>
            <li>{t('imageToPdf.note2')}</li>
          </ul>
          <div className="pt-2">
            <Button type="button" className="w-full" disabled={busy || files.length === 0} onClick={() => void onConvert()}>
              {busy ? t('imageToPdf.converting') : t('common.convertDownload')}
            </Button>
          </div>
        </aside>
      </div>
    </div>
  )
}
