import mammoth from 'mammoth'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

/**
 * 将 `.docx` 转为「可下载的 PDF」。
 *
 * 实现路径（浏览器端常见折中方案）：
 * 1) `mammoth` 将 docx 转为 HTML（尽量保留标题/列表等结构，但不保证与 Word 100% 一致）。
 * 2) `html2canvas` 将 HTML 栅格化为位图（因此本质是**像素型 PDF**，文字不可选中）。
 * 3) `jsPDF` 将位图按 A4 分页拼进 PDF。
 *
 * 限制说明（必须在产品文案里提示）：
 * - 超长文档可能生成很高的画布，极端情况下会导致内存压力或浏览器卡顿。
 * - 复杂排版、公式、嵌入对象等可能表现异常。
 * - 该流程依赖字体已在页面中加载（本站已在 `index.html` 引入 Noto Sans SC），以提升中文渲染成功率。
 */
export async function convertDocxFileToPdfBlob(file: File): Promise<Blob> {
  if (!file.name.toLowerCase().endsWith('.docx')) {
    throw new Error('DOCX_ONLY')
  }

  const arrayBuffer = await file.arrayBuffer()
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer })

  const sandbox = document.createElement('div')
  sandbox.setAttribute('data-pms-docx-html', 'true')
  sandbox.style.position = 'fixed'
  sandbox.style.left = '-12000px'
  sandbox.style.top = '0'
  sandbox.style.width = '794px'
  sandbox.style.boxSizing = 'border-box'
  sandbox.style.padding = '32px'
  sandbox.style.background = '#ffffff'
  sandbox.style.color = '#0f172a'
  sandbox.style.fontFamily = window.getComputedStyle(document.body).fontFamily
  sandbox.style.fontSize = '15px'
  sandbox.style.lineHeight = '1.65'
  sandbox.style.wordBreak = 'break-word'
  sandbox.innerHTML = html

  document.body.appendChild(sandbox)

  try {
    // 等待 WebFont 与布局稳定，减少 html2canvas 截到「空白字」的概率
    await document.fonts.ready
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))

    const canvas = await html2canvas(sandbox, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    })

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
    rasterizeCanvasOntoPdf(pdf, canvas)
    return pdf.output('blob')
  } finally {
    sandbox.remove()
  }
}

/**
 * 将「可能非常长」的画布按 A4 高度分页裁切绘制。
 * 该算法是社区里常用的 html2canvas + jsPDF 分页套路：通过负向偏移重复绘制同一张长图。
 */
function rasterizeCanvasOntoPdf(pdf: jsPDF, canvas: HTMLCanvasElement): void {
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 10
  const usableWidth = pageWidth - margin * 2
  const usableHeight = pageHeight - margin * 2

  const imgData = canvas.toDataURL('image/png')

  const imgWidth = usableWidth
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  let heightLeft = imgHeight
  let position = margin

  pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
  heightLeft -= usableHeight

  while (heightLeft > 0) {
    position = heightLeft - imgHeight
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', margin, margin + position, imgWidth, imgHeight)
    heightLeft -= usableHeight
  }
}
