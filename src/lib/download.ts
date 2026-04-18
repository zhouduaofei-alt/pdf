/**
 * 在浏览器中触发「下载二进制文件」。
 *
 * 实现说明：
 * - 使用 `Blob` + `URL.createObjectURL` 生成本地临时 URL，不经过服务器。
 * - 下载后必须 `revokeObjectURL`，否则长时间批量处理可能造成内存压力。
 *
 * @param data 文件二进制内容
 * @param mime MIME 类型，影响操作系统对文件的识别
 * @param filename 保存时的默认文件名
 */
export function triggerDownload(data: BlobPart | Uint8Array, mime: string, filename: string): void {
  /**
   * TypeScript 对 `Uint8Array` 的泛型参数（`ArrayBuffer` vs `ArrayBufferLike`）较严格，
   * 但运行时 `Blob` 构造函数接受 `Uint8Array`。这里使用断言，避免无意义的整份拷贝导致内存翻倍。
   */
  const blob = new Blob([data as BlobPart], { type: mime })
  triggerDownloadBlob(blob, filename)
}

/**
 * 直接下载 `Blob`（例如 `jsPDF.output('blob')` 或 `Packer.toBlob` 的结果）。
 * 与 `triggerDownload` 复用同一套 URL 清理逻辑，避免各处重复样板代码。
 */
export function triggerDownloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  anchor.click()
  URL.revokeObjectURL(url)
}
