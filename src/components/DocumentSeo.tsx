import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'

/**
 * 运行时 SEO（补充「伪静态」HTML 之外的体验）：
 * - 当用户切换语言时，同步更新 `document.title` 与 `meta[name=description]`。
 * - 说明：搜索引擎若执行 JS，可抓取到与界面语言一致的摘要；若不执行 JS，则主要依赖构建期生成的静态 `index.html`。
 */
export function DocumentSeo() {
  const { t, i18n } = useTranslation()
  const { pathname } = useLocation()

  const seo = buildRuntimeSeo(pathname, t)

  useEffect(() => {
    document.title = seo.title
    upsertMetaName('description', truncate(seo.description, 220))
    upsertMetaName('keywords', truncate(seo.keywords, 512))
  }, [pathname, i18n.language, seo.title, seo.description, seo.keywords])

  return null
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return `${text.slice(0, max - 1)}…`
}

function upsertMetaName(name: string, content: string): void {
  let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function buildRuntimeSeo(
  pathname: string,
  t: (key: string) => string,
): { title: string; description: string; keywords: string } {
  const brand = t('brand.title')
  const brandKw = t('brand.seoKeywords')

  if (pathname === '/') {
    return {
      title: `${t('home.title')} · ${brand}`,
      description: t('home.subtitle'),
      keywords: t('home.seoKeywords'),
    }
  }
  if (pathname === '/privacy') {
    return {
      title: `${t('privacy.title')} · ${brand}`,
      description: t('privacy.s1b'),
      keywords: t('privacy.seoKeywords'),
    }
  }
  if (pathname === '/tools/pdf-merge') {
    return {
      title: `${t('pdfMerge.title')} · ${brand}`,
      description: t('pdfMerge.desc'),
      keywords: t('pdfMerge.seoKeywords'),
    }
  }
  if (pathname === '/tools/image-compress') {
    return {
      title: `${t('imageCompress.title')} · ${brand}`,
      description: t('imageCompress.desc'),
      keywords: t('imageCompress.seoKeywords'),
    }
  }
  if (pathname === '/tools/pdf-to-word') {
    return {
      title: `${t('pdfToWord.title')} · ${brand}`,
      description: t('pdfToWord.desc'),
      keywords: t('pdfToWord.seoKeywords'),
    }
  }
  if (pathname === '/tools/word-to-pdf') {
    return {
      title: `${t('wordToPdf.title')} · ${brand}`,
      description: t('wordToPdf.desc'),
      keywords: t('wordToPdf.seoKeywords'),
    }
  }
  if (pathname === '/tools/pdf-to-image') {
    return {
      title: `${t('pdfToImage.title')} · ${brand}`,
      description: t('pdfToImage.desc'),
      keywords: t('pdfToImage.seoKeywords'),
    }
  }
  if (pathname === '/tools/image-to-pdf') {
    return {
      title: `${t('imageToPdf.title')} · ${brand}`,
      description: t('imageToPdf.desc'),
      keywords: t('imageToPdf.seoKeywords'),
    }
  }

  return { title: brand, description: t('home.subtitle'), keywords: brandKw }
}
