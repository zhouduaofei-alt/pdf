/**
 * 构建后 SEO「伪静态」生成器（纯 Node，无浏览器依赖）
 *
 * 背景：
 * - 纯 SPA 往往只产出单个 `dist/index.html`，搜索引擎抓取时看到的标题/描述相同，不利于排名。
 * - 这里在 `vite build` 之后，为每个主要路由复制一份 **真实的静态 HTML 文件**（同一份 JS/CSS 资源引用），
 *   但 `<title>` / `<meta name="description">` / `canonical` / OpenGraph 随路由变化。
 *
 * 部署效果（以 Cloudflare Pages 为例）：
 * - `/tools/pdf-merge` 会命中 `dist/tools/pdf-merge/index.html`（静态文件），更像「伪静态/多页面」结构。
 * - 页面仍由 React 接管交互；首屏 SEO 信息在 HTML 里即可被爬虫读取（不依赖 JS 执行与否）。
 *
 * 配置：
 * - 环境变量 `SITE_URL`：例如 `https://example.com`（不要尾斜杠）。用于生成 canonical 与 sitemap。
 * - 未设置时：仍会生成多路由 `index.html`，但不会写入 canonical / sitemap（避免错误域名）。
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const distDir = path.join(repoRoot, 'dist')

/**
 * 与 `src/App.tsx` 路由保持一致：新增页面时记得同步更新此表。
 * 文案默认偏中文 SEO（你也可以改成双语或从 CMS 生成）。
 */
const SEO_PAGES = [
  {
    path: '/',
    /** 相对 dist 的输出目录：[] 表示根目录的 `index.html` */
    outDir: [],
    title: '隐私媒体套件｜PDF / 图片 / Word 本地处理工具',
    description:
      '隐私优先：PDF 合并、图片压缩、PDF 转 Word、Word 转 PDF、PDF 转图片、图片转 PDF 等工具在浏览器本地处理，默认不上传服务器。适合静态托管与 Cloudflare Pages。',
  },
  {
    path: '/privacy',
    outDir: ['privacy'],
    title: '隐私说明｜隐私媒体套件',
    description: '说明本地处理范围、第三方网络请求（字体/广告/统计）、开源依赖与 IP 推断语言等合规信息。',
  },
  {
    path: '/tools/pdf-merge',
    outDir: ['tools', 'pdf-merge'],
    title: 'PDF 合并｜在线本地合并多个 PDF',
    description: '在浏览器本地按顺序合并多个 PDF，不上传服务器。支持拖拽排序与下载合并结果。',
  },
  {
    path: '/tools/image-compress',
    outDir: ['tools', 'image-compress'],
    title: '图片压缩｜在线本地压缩图片体积',
    description: '在浏览器本地压缩常见图片格式，支持 Web Worker。适合减小附件体积与加快分享。',
  },
  {
    path: '/tools/pdf-to-word',
    outDir: ['tools', 'pdf-to-word'],
    title: 'PDF 转 Word（.docx）｜抽取可编辑文本并尽量附带嵌入图',
    description:
      '在浏览器本地从 PDF 文本层生成可编辑 Word；并尝试从绘制指令抽取嵌入位图。复杂版式无法保证与 PDF 完全一致；扫描件可能几乎无字。',
  },
  {
    path: '/tools/word-to-pdf',
    outDir: ['tools', 'word-to-pdf'],
    title: 'Word 转 PDF（.docx）｜本地栅格化导出 PDF',
    description: '将 .docx 转为可分享 PDF（栅格化方案）。更适合轻量文档；超长文档可能更耗时。',
  },
  {
    path: '/tools/pdf-to-image',
    outDir: ['tools', 'pdf-to-image'],
    title: 'PDF 转图片｜逐页导出 PNG/JPEG 并打包 ZIP',
    description:
      '在浏览器本地用 pdf.js 渲染每一页为位图，可选择 PNG 或 JPEG，并打包为 ZIP 下载。适合缩略图导出与分享；非可编辑文本方案。',
  },
  {
    path: '/tools/image-to-pdf',
    outDir: ['tools', 'image-to-pdf'],
    title: '图片转 PDF｜多图按顺序合并为 PDF',
    description:
      '在浏览器本地将多张图片按列表顺序各生成一页 PDF（pdf-lib）。支持常见图片格式；可调整顺序后导出。',
  },
]

function escapeAttr(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;')
}

function applySeoToHtml(templateHtml, { title, description, canonicalUrl }) {
  let html = templateHtml

  html = html.replace(/<title>[\s\S]*?<\/title>/m, `<title>${escapeAttr(title)}</title>`)

  /**
   * 只替换 `name="description"` 这一段：
   * - 不能用「从任意 `<meta` 开始」的非贪婪匹配，否则可能从 `<meta charset>` 一路吞到 description，导致 charset 等标签被误删。
   */
  const multilineDesc = /<meta\s*\n\s*name="description"\s*\n\s*content="[^"]*"\s*\n\s*\/>/m
  const singleLineDesc = /<meta[^>]*name="description"[^>]*\/>/

  if (multilineDesc.test(html)) {
    html = html.replace(
      multilineDesc,
      `<meta\n      name="description"\n      content="${escapeAttr(description)}"\n    />`,
    )
  } else {
    html = html.replace(singleLineDesc, `<meta name="description" content="${escapeAttr(description)}" />`)
  }

  const extraHead = []

  if (canonicalUrl) {
    extraHead.push(`    <link rel="canonical" href="${escapeAttr(canonicalUrl)}" />`)
    extraHead.push(`    <meta property="og:type" content="website" />`)
    extraHead.push(`    <meta property="og:title" content="${escapeAttr(title)}" />`)
    extraHead.push(`    <meta property="og:description" content="${escapeAttr(description)}" />`)
    extraHead.push(`    <meta property="og:url" content="${escapeAttr(canonicalUrl)}" />`)
  }

  if (extraHead.length > 0) {
    html = html.replace(/<\/head>/m, `${extraHead.join('\n')}\n  </head>`)
  }

  return html
}

function writeUtf8(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content, 'utf8')
}

function buildSitemapXml(siteUrl, urls) {
  const items = urls
    .map((u) => {
      const loc = `${siteUrl}${u === '/' ? '/' : u}`
      return `  <url>\n    <loc>${escapeAttr(loc)}</loc>\n  </url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n` + `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</urlset>\n`
}

function buildRobotsTxt(siteUrl) {
  if (!siteUrl) {
    return [`User-agent: *`, `Allow: /`, ``].join('\n')
  }

  return [`User-agent: *`, `Allow: /`, ``, `Sitemap: ${siteUrl}/sitemap.xml`, ``].join('\n')
}

function main() {
  const templatePath = path.join(distDir, 'index.html')
  if (!fs.existsSync(templatePath)) {
    console.error('[seo] 找不到 dist/index.html：请先执行 vite build。')
    process.exit(1)
  }

  const siteUrlRaw = (process.env.SITE_URL || '').trim().replace(/\/+$/, '')
  const siteUrl = siteUrlRaw.length > 0 ? siteUrlRaw : ''

  if (!siteUrl) {
    console.warn('[seo] 未设置 SITE_URL：将跳过 canonical / sitemap / robots 的 Sitemap 行（仍会为路由生成独立 index.html）。')
  }

  const templateHtml = fs.readFileSync(templatePath, 'utf8')

  for (const page of SEO_PAGES) {
    const canonicalUrl = siteUrl ? (page.path === '/' ? `${siteUrl}/` : `${siteUrl}${page.path}`) : ''
    const html = applySeoToHtml(templateHtml, {
      title: page.title,
      description: page.description,
      canonicalUrl,
    })

    const outFile = path.join(distDir, ...page.outDir, 'index.html')
    writeUtf8(outFile, html)
    console.log(`[seo] wrote: /${path.relative(distDir, outFile).replaceAll('\\', '/')}`)
  }

  if (siteUrl) {
    const urls = SEO_PAGES.map((p) => p.path)
    writeUtf8(path.join(distDir, 'sitemap.xml'), buildSitemapXml(siteUrl, urls))
    writeUtf8(path.join(distDir, 'robots.txt'), buildRobotsTxt(siteUrl))
    console.log('[seo] wrote: /sitemap.xml')
    console.log('[seo] wrote: /robots.txt')
  } else {
    writeUtf8(path.join(distDir, 'robots.txt'), buildRobotsTxt(''))
    console.log('[seo] wrote: /robots.txt（无 Sitemap 行）')
  }
}

main()
