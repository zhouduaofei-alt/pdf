import { PDFDocument } from 'pdf-lib'

/**
 * 将用户选择的多个 PDF 按**选择顺序**合并为一个 PDF 文件。
 *
 * 隐私与安全：
 * - 仅使用浏览器内存中的 `ArrayBuffer` / `Uint8Array`。
 * - 不调用自建 API，不把文件上传到第三方（除非你另行引入网络库）。
 *
 * 边界情况：
 * - 受密码保护或损坏的 PDF 可能 `load` 失败，错误会向上抛出，由 UI 层提示用户。
 *
 * @param files 由 `<input type="file" multiple>` 或拖放得到的 `File[]`
 * @returns `pdf-lib` 生成的 PDF 字节，可直接用于下载
 */
export async function mergePdfFiles(files: File[]): Promise<Uint8Array> {
  if (files.length === 0) {
    // 文案由 UI 层通过 i18n 映射，库层只抛出稳定错误码，避免在工具函数里写死某种自然语言。
    throw new Error('PMS_ERR_EMPTY_PDF_LIST')
  }

  // 新建空白文档，作为合并结果容器
  const merged = await PDFDocument.create()

  // 顺序遍历：保证合并顺序与用户选择顺序一致
  for (const file of files) {
    const raw = new Uint8Array(await file.arrayBuffer())
    const doc = await PDFDocument.load(raw, { ignoreEncryption: false })
    const indices = doc.getPageIndices()
    const pages = await merged.copyPages(doc, indices)
    pages.forEach((page) => merged.addPage(page))
  }

  return merged.save()
}
