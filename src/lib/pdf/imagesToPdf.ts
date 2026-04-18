import { PDFDocument } from 'pdf-lib'

/**
 * 将多张图片按顺序各生成一页 PDF（纯浏览器端，`pdf-lib`）。
 * 非常见格式会先通过 `canvas` 转 PNG 再嵌入。
 */
export async function convertImageFilesToPdfBytes(files: File[]): Promise<Uint8Array> {
  if (files.length === 0) {
    throw new Error('PMS_ERR_EMPTY_IMAGE_LIST')
  }

  const pdf = await PDFDocument.create()

  for (const file of files) {
    const raw = new Uint8Array(await file.arrayBuffer())
    const name = file.name.toLowerCase()
    const mime = (file.type || '').toLowerCase()

    let embedded
    if (mime === 'image/png' || name.endsWith('.png')) {
      embedded = await pdf.embedPng(raw)
    } else if (mime === 'image/jpeg' || mime === 'image/jpg' || name.endsWith('.jpg') || name.endsWith('.jpeg')) {
      embedded = await pdf.embedJpg(raw)
    } else {
      const bmp = await createImageBitmap(file)
      const canvas = document.createElement('canvas')
      canvas.width = bmp.width
      canvas.height = bmp.height
      const ctx = canvas.getContext('2d', { alpha: true })
      if (!ctx) {
        bmp.close?.()
        throw new Error('PMS_ERR_NO_CANVAS_2D')
      }
      ctx.drawImage(bmp, 0, 0)
      bmp.close?.()

      const pngBlob = await new Promise<Blob | null>((r) => canvas.toBlob((b) => r(b), 'image/png'))
      if (!pngBlob) {
        throw new Error('PMS_ERR_IMAGE_DECODE')
      }
      const pngBytes = new Uint8Array(await pngBlob.arrayBuffer())
      embedded = await pdf.embedPng(pngBytes)
    }

    const { width, height } = embedded.scale(1)
    const page = pdf.addPage([width, height])
    page.drawImage(embedded, { x: 0, y: 0, width, height })
  }

  return pdf.save()
}
