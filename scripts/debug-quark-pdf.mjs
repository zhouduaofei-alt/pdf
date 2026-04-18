/**
 * 一次性诊断脚本：分析 Quark 自带欢迎页 PDF 的文本层 / 操作列表 / 渲染是否可用。
 * 运行：node scripts/debug-quark-pdf.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pdfPath =
  process.argv[2] ||
  'C:/Users/Administrator/AppData/Local/Programs/Quark/6.7.0.800/Resources/pdf_welcome_page/欢迎使用夸克超级PDF.pdf'

if (!fs.existsSync(pdfPath)) {
  console.error('File not found:', pdfPath)
  process.exit(1)
}

const workerPath = path.join(__dirname, '../node_modules/pdfjs-dist/build/pdf.worker.mjs')
pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href

const wasmDir = path.join(__dirname, '../public/pdfjs-wasm/')
const wasmUrl = fs.existsSync(path.join(wasmDir, 'openjpeg_nowasm_fallback.js'))
  ? pathToFileURL(wasmDir).href
  : null
console.log('wasmUrl', wasmUrl)

const data = new Uint8Array(fs.readFileSync(pdfPath))
const loadingTask = pdfjs.getDocument({
  data,
  ...(wasmUrl ? { wasmUrl, useWasm: false } : {}),
  disableFontFace: true,
  useSystemFonts: true,
})
const pdf = await loadingTask.promise

console.log('numPages', pdf.numPages)
const meta = await pdf.getMetadata().catch(() => null)
console.log('metadata', meta?.info ?? null)

for (let i = 1; i <= pdf.numPages; i++) {
  const page = await pdf.getPage(i)
  const vp = page.getViewport({ scale: 1 })
  console.log('\n--- page', i, 'size', vp.width, 'x', vp.height, 'rotate', page.rotate)

  const tc = await page.getTextContent({ includeMarkedContent: false })
  const tc2 = await page.getTextContent({ includeMarkedContent: true })
  const withStr = (t) => t.items.filter((x) => 'str' in x && x.str && String(x.str).trim()).length
  console.log('text items (no MC)', tc.items.length, 'with str', withStr(tc))
  console.log('text items (MC)', tc2.items.length, 'with str', withStr(tc2))

  const op = await page.getOperatorList()
  const fn = op.fnArray
  let imgOps = 0
  for (let j = 0; j < fn.length; j++) {
    if (fn[j] === 85 || fn[j] === 86 || fn[j] === 87) imgOps++
  }
  console.log('operatorList length', fn.length, 'paint-ish ops', imgOps)

  let resolvedImg = 0
  for (const [id, obj] of page.objs) {
    if (obj && typeof obj === 'object' && ('bitmap' in obj || ('width' in obj && 'data' in obj))) resolvedImg++
  }
  console.log('objs iterator image-like', resolvedImg)

  page.cleanup?.()
}

console.log('\ndone')
