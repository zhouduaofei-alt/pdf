import { AlignmentType, Document, ImageRun, Packer, Paragraph, TextRun } from 'docx'
import { ImageKind, OPS, Util } from 'pdfjs-dist'
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'
import { buildPdfjsDocumentParams, ensurePdfjsWorkerReady, pdfjs } from './pdfjsWorker'

type PageTextContent = Awaited<ReturnType<PDFPageProxy['getTextContent']>>
type PageTextItem = Extract<PageTextContent['items'][number], { str: string }>
type PageOperatorList = Awaited<ReturnType<PDFPageProxy['getOperatorList']>>

/** 正文默认字体：显式指定 eastAsia，避免部分 WPS/Word 环境中文显示为空白 */
const BODY_FONT = {
  ascii: 'Calibri',
  eastAsia: 'Microsoft YaHei',
  hAnsi: 'Calibri',
} as const

/**
 * 将 PDF 转为可编辑 `.docx`（纯浏览器端）。
 *
 * 做法概览：
 * - **正文文字**：`getTextContent({ includeMarkedContent: true })` 抽取文本层，按坐标聚类为「行」→ Word 段落。
 * - **嵌入图片**：`getOperatorList()` 后遍历绘制指令抽取位图 → `ImageRun`。
 * - **无文本层**：先尝试整页 `render`（在 `getOperatorList` 之前执行，避免部分 PDF 上「先 opList 后 render」得到空白画布），再与指令抽图合并。
 * - **可选图层（OCG）**：整页渲染时传入 `getOptionalContentConfig({ intent: 'any' })`，减少「图层默认隐藏」导致的白页。
 * - **JPEG2000（JPX）**：部分工具导出的页为 JPX 位图，必须在 `getDocument` 中配置 `wasmUrl`（见 `buildPdfjsDocumentParams`）；同源 `public/pdfjs-wasm/` 不可用时回退 CDN，否则解码失败会得到白页。
 */
export async function convertPdfFileToDocxBlob(file: File): Promise<Blob> {
  await ensurePdfjsWorkerReady()

  const data = new Uint8Array(await file.arrayBuffer())
  const pdf = await pdfjs.getDocument(await buildPdfjsDocumentParams({ data })).promise

  const children: Paragraph[] = []

  for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex++) {
    const page = await pdf.getPage(pageIndex)
    const viewport = page.getViewport({ scale: 1 })

    const textContent = await page.getTextContent({ includeMarkedContent: true })
    const textParas = paragraphsFromTextContent(textContent, viewport)

    /**
     * 无文本时：在 `getOperatorList` 之前先做整页栅格化。
     * 部分生成器产出的 PDF 在「先拉 operator list 再 render」时，整页 canvas 会为空白；
     * 先 render 可稳定得到与浏览器预览一致的位图。
     */
    let preRasterFullPage: Paragraph | null = null
    if (textParas.length === 0) {
      preRasterFullPage = await paragraphFromFullPageRaster(page, pdf)
    }

    const opList = await page.getOperatorList()
    const imageParas = await paragraphsFromPaintedImages(page, opList)

    children.push(
      new Paragraph({
        pageBreakBefore: pageIndex > 1,
        spacing: { before: pageIndex > 1 ? 240 : 0, after: 120 },
        children: [new TextRun({ text: `— ${pageIndex} / ${pdf.numPages} —`, bold: true, font: { ...BODY_FONT } })],
      }),
    )

    if (textParas.length > 0) {
      children.push(...textParas)
      if (imageParas.length > 0) {
        children.push(
          new Paragraph({
            spacing: { before: 200, after: 80 },
            children: [
              new TextRun({
                text: '以下为从本页绘制指令中抽取的嵌入图像（顺序大致为绘制顺序；不保证与原文完全重叠）。',
                italics: true,
                font: { ...BODY_FONT },
              }),
            ],
          }),
        )
        children.push(...imageParas)
      }
    } else {
      let rasterParas = imageParas.length > 0 ? imageParas : preRasterFullPage ? [preRasterFullPage] : []
      if (rasterParas.length === 0) {
        const fp = await paragraphFromFullPageRaster(page, pdf)
        rasterParas = fp ? [fp] : []
      }
      if (rasterParas.length > 0) {
        children.push(...rasterParas)
      } else {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: '（本页既无文本层也无法导出图像，请检查文件是否损坏。）',
                italics: true,
                font: { ...BODY_FONT },
              }),
            ],
            spacing: { after: 120 },
          }),
        )
      }
    }

    page.cleanup?.()
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  })

  return Packer.toBlob(doc)
}

function isCanvasMostlyBlank(canvas: HTMLCanvasElement, threshold = 0.992): boolean {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return true
  const w = canvas.width
  const h = canvas.height
  if (w < 2 || h < 2) return false
  const stepX = Math.max(1, Math.floor(w / 28))
  const stepY = Math.max(1, Math.floor(h / 28))
  let total = 0
  let nearWhite = 0
  for (let y = 0; y < h; y += stepY) {
    for (let x = 0; x < w; x += stepX) {
      total++
      const d = ctx.getImageData(x, y, 1, 1).data
      if (d[0]! >= 252 && d[1]! >= 252 && d[2]! >= 252) nearWhite++
    }
  }
  return total > 0 && nearWhite / total >= threshold
}

async function paragraphFromFullPageRaster(page: PDFPageProxy, pdf: PDFDocumentProxy): Promise<Paragraph | null> {
  const baseViewport = page.getViewport({ scale: 1 })
  const scale = Math.min(3, 2000 / Math.max(baseViewport.width, baseViewport.height))
  const viewport = page.getViewport({ scale })

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) return null

  canvas.width = Math.max(1, Math.floor(viewport.width))
  canvas.height = Math.max(1, Math.floor(viewport.height))
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  let optionalContentConfigPromise: ReturnType<PDFDocumentProxy['getOptionalContentConfig']> | undefined
  try {
    optionalContentConfigPromise = pdf.getOptionalContentConfig({ intent: 'any' })
  } catch {
    optionalContentConfigPromise = undefined
  }

  const runRender = async (withOptionalContent: boolean) => {
    const renderTask = page.render({
      canvas,
      viewport,
      ...(withOptionalContent && optionalContentConfigPromise ? { optionalContentConfigPromise } : {}),
    })
    await renderTask.promise
  }

  const whiteFill = () => {
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  try {
    await runRender(true)
  } catch (e) {
    whiteFill()
    try {
      await runRender(false)
    } catch (e2) {
      console.warn('[pdfToDocx] 整页栅格化 render 失败（常见于 JPEG2000 解码或画布限制）', e2 ?? e)
      return null
    }
  }

  if (isCanvasMostlyBlank(canvas)) {
    whiteFill()
    try {
      await runRender(false)
    } catch (e) {
      console.warn('[pdfToDocx] 去除可选图层后整页 render 仍失败', e)
      return null
    }
  }

  if (isCanvasMostlyBlank(canvas)) {
    console.warn(
      '[pdfToDocx] 整页栅格化结果几乎全白，视为解码失败（无文本层的 JPX 页面需能加载 public/pdfjs-wasm/openjpeg_nowasm_fallback.js）。',
    )
    return null
  }

  const w = canvas.width
  const h = canvas.height
  const data = await canvasToPngUint8Array(canvas)
  canvas.width = 0
  canvas.height = 0

  return pngToImageParagraph({ data, w, h })
}

function paragraphsFromTextContent(textContent: PageTextContent, viewport: { transform: number[] }): Paragraph[] {
  const items = textContent.items.filter(
    (it): it is PageTextItem => 'str' in it && typeof it.str === 'string' && it.str.replace(/\u00ad/g, '').trim().length > 0,
  )

  type Frag = { x: number; y: number; str: string; h: number }
  const frags: Frag[] = []

  for (const item of items) {
    const tm = Util.transform(viewport.transform, item.transform)
    const x = tm[4] as number
    const y = tm[5] as number
    const h = Math.max(Math.abs(item.height), 4)
    frags.push({ x, y, str: item.str, h })
  }

  if (frags.length === 0) return []

  frags.sort((a, b) => (Math.abs(b.y - a.y) < 1e-4 ? a.x - b.x : b.y - a.y))

  const lines: Frag[][] = []
  let cur: Frag[] = []
  let anchorY: number | null = null

  const lineThreshold = (base: Frag) => Math.max(base.h * 0.65, 3)

  for (const f of frags) {
    if (cur.length === 0) {
      cur.push(f)
      anchorY = f.y
      continue
    }
    const th = lineThreshold(cur[0]!)
    if (anchorY !== null && Math.abs(f.y - anchorY) <= th) {
      cur.push(f)
      anchorY = (anchorY * (cur.length - 1) + f.y) / cur.length
    } else {
      lines.push(cur)
      cur = [f]
      anchorY = f.y
    }
  }
  if (cur.length) lines.push(cur)

  for (const line of lines) {
    line.sort((a, b) => a.x - b.x)
  }

  const paras: Paragraph[] = []
  for (const line of lines) {
    const merged = line.map((l) => l.str).join('').trimEnd()
    if (!merged.trim()) continue
    paras.push(
      new Paragraph({
        children: [new TextRun({ text: merged, font: { ...BODY_FONT } })],
        spacing: { after: 60 },
      }),
    )
  }
  return paras
}

type ImgLike = {
  width?: number
  height?: number
  kind?: number
  data?: Uint8ClampedArray | Uint8Array
  bitmap?: ImageBitmap
}

async function paragraphsFromPaintedImages(page: PDFPageProxy, opList: PageOperatorList): Promise<Paragraph[]> {
  const out: Paragraph[] = []
  const { fnArray, argsArray } = opList

  for (let i = 0; i < fnArray.length; i++) {
    const fn = fnArray[i]!
    const args = argsArray[i]

    try {
      if (fn === OPS.paintImageXObject || fn === OPS.paintImageXObjectRepeat) {
        const objId = args?.[0]
        if (typeof objId === 'string' && page.objs.has(objId)) {
          const raw = page.objs.get(objId) as ImgLike
          const packed = await imgLikeToPng(raw)
          if (packed) out.push(pngToImageParagraph(packed))
        }
      } else if (fn === OPS.paintInlineImageXObject) {
        const packed = await imgLikeToPng(args?.[0] as ImgLike)
        if (packed) out.push(pngToImageParagraph(packed))
      } else if (fn === OPS.paintInlineImageXObjectGroup) {
        const packed = await imgLikeToPng(args?.[0] as ImgLike)
        if (packed) out.push(pngToImageParagraph(packed))
      }
    } catch {
      /* 单条指令失败时跳过，避免整份转换失败 */
    }
  }

  return out
}

type PngPack = { data: Uint8Array; w: number; h: number }

function pngToImageParagraph(packed: PngPack): Paragraph {
  const maxDisplayWidthPx = 720
  let displayW = packed.w
  let displayH = packed.h
  if (displayW > maxDisplayWidthPx) {
    const ratio = maxDisplayWidthPx / displayW
    displayW = Math.round(displayW * ratio)
    displayH = Math.round(displayH * ratio)
  }

  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [
      new ImageRun({
        type: 'png',
        data: packed.data,
        transformation: { width: displayW, height: displayH },
      }),
    ],
  })
}

async function imgLikeToPng(img: ImgLike | null | undefined): Promise<PngPack | null> {
  if (!img || typeof img !== 'object') return null

  if (img.bitmap && img.bitmap instanceof ImageBitmap) {
    const w = img.bitmap.width
    const h = img.bitmap.height
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, w)
    canvas.height = Math.max(1, h)
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return null
    ctx.drawImage(img.bitmap, 0, 0)
    const data = await canvasToPngUint8Array(canvas)
    return { data, w, h }
  }

  const width = img.width
  const height = img.height
  const kind = img.kind ?? ImageKind.RGBA_32BPP
  const rawData = img.data
  if (!width || !height || !rawData) return null

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { alpha: true })
  if (!ctx) return null

  if (kind === ImageKind.RGBA_32BPP) {
    const src =
      rawData instanceof Uint8ClampedArray
        ? rawData
        : new Uint8ClampedArray(rawData.buffer, rawData.byteOffset, rawData.byteLength)
    const need = width * height * 4
    if (src.length < need) return null
    const rgba = new Uint8ClampedArray(need)
    rgba.set(src.subarray(0, need))
    ctx.putImageData(new ImageData(rgba, width, height), 0, 0)
  } else if (kind === ImageKind.RGB_24BPP) {
    const src = rawData instanceof Uint8ClampedArray ? new Uint8Array(rawData.buffer, rawData.byteOffset, rawData.byteLength) : (rawData as Uint8Array)
    const rgba = new Uint8ClampedArray(width * height * 4)
    const n = width * height
    let si = 0
    for (let i = 0; i < n; i++) {
      const o = i * 4
      rgba[o] = src[si++]!
      rgba[o + 1] = src[si++]!
      rgba[o + 2] = src[si++]!
      rgba[o + 3] = 255
    }
    ctx.putImageData(new ImageData(rgba, width, height), 0, 0)
  } else if (kind === ImageKind.GRAYSCALE_1BPP) {
    const src = rawData as Uint8Array
    const rgba = new Uint8ClampedArray(width * height * 4)
    const dest32 = new Uint32Array(rgba.buffer)
    const rowBytes = (width + 7) >> 3
    const white = 0xffffffff
    const black = 0xff000000
    let srcPos = 0
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const byteOffset = x >> 3
        const bit = 128 >> (x & 7)
        const srcByte = src[srcPos + byteOffset]!
        dest32[y * width + x] = srcByte & bit ? white : black
      }
      srcPos += rowBytes
    }
    ctx.putImageData(new ImageData(rgba, width, height), 0, 0)
  } else {
    return null
  }

  const data = await canvasToPngUint8Array(canvas)
  return { data, w: width, h: height }
}

function canvasToPngUint8Array(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('PMS_ERR_PNG_EXPORT'))
          return
        }
        void blob.arrayBuffer().then((buf) => resolve(new Uint8Array(buf)))
      },
      'image/png',
      0.92,
    )
  })
}
