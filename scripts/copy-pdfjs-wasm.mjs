/**
 * 将 pdf.js 的 OpenJPEG「无 wasm」回退脚本复制到 `public/pdfjs-wasm/`，供 `getDocument({ wasmUrl })` 使用。
 * JPEG2000（JPX）页面依赖该脚本解码（如 iLovePDF / 部分工具导出的欢迎页）。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = path.join(root, 'node_modules', 'pdfjs-dist', 'wasm', 'openjpeg_nowasm_fallback.js')
const destDir = path.join(root, 'public', 'pdfjs-wasm')
const dest = path.join(destDir, 'openjpeg_nowasm_fallback.js')

if (!fs.existsSync(src)) {
  console.warn('[copy-pdfjs-wasm] skip: source missing', src)
  process.exit(0)
}
fs.mkdirSync(destDir, { recursive: true })
fs.copyFileSync(src, dest)
console.log('[copy-pdfjs-wasm] copied to', dest)
