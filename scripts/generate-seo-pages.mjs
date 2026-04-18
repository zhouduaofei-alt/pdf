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
 * `keywords`：写入 `<meta name="keywords">`，便于部分搜索引擎与站内检索；请与各路由业务词保持一致。
 */
const SEO_PAGES = [
  {
    path: '/',
    /** 相对 dist 的输出目录：[] 表示根目录的 `index.html` */
    outDir: [],
    title: '隐私媒体套件｜PDF合并 PDF转Word 图片压缩 本地在线工具',
    description:
      '隐私优先的 PDF 与图片工具站：支持 PDF 合并、PDF 转 Word（docx）、Word 转 PDF、PDF 转 PNG/JPEG、图片转 PDF、图片压缩等，文件在浏览器本地处理不上传服务器，适合 Cloudflare Pages 静态部署与百度搜索「在线 PDF 工具」类需求。',
    keywords:
      'PDF工具,在线PDF,PDF合并,PDF转Word,Word转PDF,PDF转图片,图片转PDF,图片压缩,JPG压缩,PNG压缩,本地处理,隐私,免费,浏览器工具,docx,Privacy Media Suite',
  },
  {
    path: '/privacy',
    outDir: ['privacy'],
    title: '隐私政策与说明｜本地处理 第三方请求 合规',
    description:
      '说明本站工具默认本地处理文件、不上传内容；披露字体 CDN、可选广告/统计、开源依赖及 IP 推断语言等第三方请求，便于隐私合规与搜索引擎理解站点性质。',
    keywords: '隐私政策,隐私说明,本地处理,数据安全,第三方服务,Cookie,IP定位,开源许可,合规声明',
  },
  {
    path: '/tools/pdf-merge',
    outDir: ['tools', 'pdf-merge'],
    title: 'PDF合并在线｜多个PDF合成一个 本地不上传',
    description:
      '免费在线 PDF 合并：在浏览器本地将多个 PDF 按顺序合成一个文件，支持拖拽与排序，不上传服务器；适合合同、论文、发票等批量合并场景。',
    keywords: 'PDF合并,合并PDF,多个PDF合成,PDF拼接,在线合并,本地合并,不上传,pdf-lib,拖拽排序',
  },
  {
    path: '/tools/image-compress',
    outDir: ['tools', 'image-compress'],
    title: '图片压缩在线｜JPG PNG 缩小体积 本地处理',
    description:
      '在线压缩 JPG、PNG、WebP 等常见图片，降低体积便于微信/邮件发送；压缩在浏览器本地完成，支持 Web Worker，默认不上传原图。',
    keywords: '图片压缩,在线压缩,JPEG压缩,PNG压缩,webp,缩小图片,本地压缩,图片瘦身,附件变小',
  },
  {
    path: '/tools/pdf-to-word',
    outDir: ['tools', 'pdf-to-word'],
    title: 'PDF转Word在线｜可编辑docx 提取文字与嵌入图',
    description:
      '把 PDF 转成可编辑 Word（docx）：抽取文本层段落并尽量导出文档内嵌图；扫描件、JPX/JPEG2000 页面依赖本地 OpenJPEG 脚本。复杂排版与表格可能需人工微调，适合「PDF 转可编辑」搜索意图。',
    keywords:
      'PDF转Word,PDF转docx,在线PDF转Word,提取文字,可编辑Word,扫描件,JPX,JPEG2000,OpenJPEG,本地转换,pdf.js',
  },
  {
    path: '/tools/word-to-pdf',
    outDir: ['tools', 'word-to-pdf'],
    title: 'Word转PDF在线｜docx转PDF 栅格化导出',
    description:
      '将 Word（docx）转为便于分享的 PDF：采用栅格化分页方案，类似打印为 PDF；适合轻量文档快速导出，复杂排版可能出现细微差异。',
    keywords: 'Word转PDF,docx转PDF,在线Word转PDF,文档转PDF,打印为PDF,栅格化PDF,本地转换',
  },
  {
    path: '/tools/pdf-to-image',
    outDir: ['tools', 'pdf-to-image'],
    title: 'PDF转图片在线｜逐页PNG JPEG 打包ZIP下载',
    description:
      '将 PDF 每一页渲染为高分辨率 PNG 或 JPEG，并打包 ZIP 一键下载；适合预览图、归档截图、设计稿导出，与「图片转 PDF」可搭配使用。',
    keywords: 'PDF转图片,PDF转PNG,PDF转JPG,PDF逐页导出,缩略图,ZIP,pdf.js,本地导出',
  },
  {
    path: '/tools/image-to-pdf',
    outDir: ['tools', 'image-to-pdf'],
    title: '图片转PDF在线｜多张照片合并为一个PDF',
    description:
      '把多张 JPG、PNG 等图片按顺序合并为多页 PDF，每图一页；在本地用 pdf-lib 生成，可调整顺序，适合相册、报销票据、截图合集整理。',
    keywords: '图片转PDF,JPG转PDF,PNG转PDF,多图合并PDF,照片PDF,相册PDF,pdf-lib,本地',
  },
]

function escapeAttr(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;')
}

function truncateSeo(text, max) {
  const s = String(text)
  if (s.length <= max) return s
  return `${s.slice(0, max - 1)}…`
}

function applySeoToHtml(templateHtml, { title, description, keywords, canonicalUrl }) {
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

  /** 避免与源模板 `index.html` 里已有 keywords 重复插入 */
  html = html.replace(/<meta[^>]*\bname="keywords"[^>]*\/?>\s*/gi, '')

  const extraHead = []

  if (keywords) {
    extraHead.push(`    <meta name="keywords" content="${escapeAttr(keywords)}" />`)
  }

  extraHead.push(`    <meta name="twitter:card" content="summary" />`)
  extraHead.push(`    <meta name="twitter:title" content="${escapeAttr(title)}" />`)
  extraHead.push(`    <meta name="twitter:description" content="${escapeAttr(truncateSeo(description, 200))}" />`)

  if (canonicalUrl) {
    extraHead.push(`    <link rel="canonical" href="${escapeAttr(canonicalUrl)}" />`)
    extraHead.push(`    <meta property="og:type" content="website" />`)
    extraHead.push(`    <meta property="og:title" content="${escapeAttr(title)}" />`)
    extraHead.push(`    <meta property="og:description" content="${escapeAttr(truncateSeo(description, 300))}" />`)
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
      keywords: page.keywords,
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
