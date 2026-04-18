import * as pdfjs from 'pdfjs-dist'
import { version as PDFJS_DIST_VERSION } from 'pdfjs-dist'
// Vite：以 URL 方式引入 worker，避免打包后主线程找不到 worker 入口。
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

declare global {
  var pdfjsWorker: { WorkerMessageHandler: unknown } | undefined
}

let configured = false
let readyPromise: Promise<void> | null = null
let openjpegPreloadDone = false

/**
 * 与 `JpxImage` 使用**完全相同**的说明符预加载 `openjpeg_nowasm_fallback.js`，让浏览器模块图在首次 JPX 解码前就就绪。
 * 部分环境下「首次 decode 时才 import」会与 Loopback 伪 Worker 竞态或偶发失败，导致整页白画布。
 */
async function preloadOpenjpegNowasmOnce(): Promise<void> {
  if (openjpegPreloadDone || typeof window === 'undefined') return
  const wasmUrl = await resolvePdfjsWasmUrl()
  if (!wasmUrl) return
  const href = new URL('openjpeg_nowasm_fallback.js', wasmUrl).href
  try {
    await import(/* @vite-ignore */ href)
    openjpegPreloadDone = true
  } catch (e) {
    console.warn(
      '[pdfjs] OpenJPEG（JPEG2000）回退脚本预加载失败；无文本层的 JPX 页面可能无法栅格化。请使用 http(s) 访问并确保已部署 public/pdfjs-wasm/openjpeg_nowasm_fallback.js。',
      e,
    )
  }
}

/**
 * 初始化 pdf.js，并**预先把 worker 入口以动态 import 加载到主线程**（设置 `globalThis.pdfjsWorker`）。
 *
 * 背景：JPEG2000（JPX）解码会在实现里对 `wasmUrl + openjpeg_nowasm_fallback.js` 做 `import()`。
 * 在真正的 `new Worker()` 里，该动态 import 在部分环境（含 Vite 打包的 module worker）会失败，
 * 导致整页渲染白画布、Word 导出为空。pdf.js 若发现 `globalThis.pdfjsWorker.WorkerMessageHandler`
 * 已存在，会走 **Loopback 伪 Worker**（逻辑仍在 worker 代码里跑，但 `import()` 发生在主线程），JPX 才能稳定解码。
 *
 * 代价：首次转换前会多加载一份 worker 体积的脚本到主线程；对本地小工具可接受。
 */
export async function ensurePdfjsWorkerReady(): Promise<void> {
  if (readyPromise) return readyPromise

  readyPromise = (async () => {
    if (!configured) {
      pdfjs.GlobalWorkerOptions.workerSrc = workerSrc
      configured = true
    }
    if (globalThis.pdfjsWorker?.WorkerMessageHandler) {
      await preloadOpenjpegNowasmOnce()
      return
    }
    const mod = (await import(/* @vite-ignore */ workerSrc)) as { WorkerMessageHandler?: unknown }
    // worker 入口尾部会通过副作用设置 `globalThis.pdfjsWorker`；若打包器未保留该副作用，则用命名导出兜底。
    if (!globalThis.pdfjsWorker?.WorkerMessageHandler && mod.WorkerMessageHandler != null) {
      globalThis.pdfjsWorker = { WorkerMessageHandler: mod.WorkerMessageHandler }
    }
    if (!globalThis.pdfjsWorker?.WorkerMessageHandler) {
      console.error('[pdfjs] 无法注册 WorkerMessageHandler，JPEG2000（JPX）解码可能失败。')
    }
    await preloadOpenjpegNowasmOnce()
  })()

  return readyPromise
}

function normalizeWasmBase(url: string): string {
  const t = url.trim()
  return t.endsWith('/') ? t : `${t}/`
}

function sameOriginWasmBase(): string {
  const base = import.meta.env.BASE_URL ?? '/'
  const prefix = base.endsWith('/') ? base : `${base}/`
  return new URL(`${prefix}pdfjs-wasm/`, window.location.href).href
}

function cdnWasmBase(): string {
  return `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_DIST_VERSION}/wasm/`
}

async function wasmFallbackReachable(baseUrl: string): Promise<boolean> {
  const url = new URL('openjpeg_nowasm_fallback.js', baseUrl).href
  try {
    const head = await fetch(url, { method: 'HEAD', mode: 'cors', cache: 'force-cache' })
    if (head.ok) return true
  } catch {
    /* 部分环境不支持 HEAD */
  }
  try {
    const get = await fetch(url, { method: 'GET', mode: 'cors', cache: 'force-cache' })
    return get.ok
  } catch {
    return false
  }
}

/**
 * 解析 `getDocument` 所需的 `wasmUrl`（必须以 `/` 结尾）。
 * 顺序：环境变量 → 同源 `public/pdfjs-wasm/` → jsDelivr 同版本目录。
 */
export async function resolvePdfjsWasmUrl(): Promise<string> {
  if (typeof window === 'undefined') return ''

  const envUrl = (import.meta.env as { VITE_PDFJS_WASM_URL?: string }).VITE_PDFJS_WASM_URL?.trim()
  if (envUrl) {
    return normalizeWasmBase(envUrl)
  }

  const local = sameOriginWasmBase()
  if (await wasmFallbackReachable(local)) {
    return local
  }

  return normalizeWasmBase(cdnWasmBase())
}

export async function buildPdfjsDocumentParams<const T extends Record<string, unknown>>(
  params: T,
): Promise<T & { wasmUrl?: string; useWasm?: boolean }> {
  const wasmUrl = await resolvePdfjsWasmUrl()
  if (!wasmUrl) return params
  return { ...params, wasmUrl, useWasm: false }
}

export { pdfjs }
