import { zipSync } from 'fflate'
import { buildPdfjsDocumentParams, ensurePdfjsWorkerReady, pdfjs } from './pdfjsWorker'

export type PdfToImagesFormat = 'png' | 'jpeg'

export type PdfToImagesOptions = {
  /** 相对「scale=1 的 PDF 用户单位」的渲染倍率，越大越清晰、越占内存 */
  scale?: number
  format?: PdfToImagesFormat
  /** JPEG 质量 0–1，仅 `format === 'jpeg'` 时生效 */
  jpegQuality?: number
}

/**
 * 将 PDF 每一页渲染为位图并打包为 ZIP（纯浏览器端）。
 * 与「PDF→Word」不同：这里刻意栅格化页面，用于分享缩略图或设计稿导出等场景。
 */
export async function convertPdfFileToImagesZip(file: File, options: PdfToImagesOptions = {}): Promise<Blob> {
  await ensurePdfjsWorkerReady()

  const scale = options.scale ?? 2
  const format = options.format ?? 'png'
  const jpegQuality = options.jpegQuality ?? 0.9

  const data = new Uint8Array(await file.arrayBuffer())
  const pdf = await pdfjs.getDocument(await buildPdfjsDocumentParams({ data })).promise

  const files: Record<string, Uint8Array> = {}

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const base = page.getViewport({ scale: 1 })
    const s = Math.min(scale, 3200 / Math.max(base.width, base.height))
    const viewport = page.getViewport({ scale: s })

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) {
      throw new Error('PMS_ERR_NO_CANVAS_2D')
    }

    canvas.width = Math.max(1, Math.floor(viewport.width))
    canvas.height = Math.max(1, Math.floor(viewport.height))
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const renderTask = page.render({ canvas, viewport })
    await renderTask.promise
    page.cleanup?.()

    const ext = format === 'jpeg' ? 'jpg' : 'png'
    const name = `page-${String(i).padStart(3, '0')}.${ext}`
    files[name] = await canvasToRasterBytes(canvas, format, jpegQuality)

    canvas.width = 0
    canvas.height = 0
  }

  const zipped = zipSync(files)
  const zipBytes = new Uint8Array(zipped.length)
  zipBytes.set(zipped)
  return new Blob([zipBytes], { type: 'application/zip' })
}

function canvasToRasterBytes(canvas: HTMLCanvasElement, format: PdfToImagesFormat, jpegQuality: number): Promise<Uint8Array> {
  const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png'
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('PMS_ERR_IMAGE_EXPORT'))
          return
        }
        void blob.arrayBuffer().then((buf) => resolve(new Uint8Array(buf)))
      },
      mime,
      format === 'jpeg' ? jpegQuality : undefined,
    )
  })
}
