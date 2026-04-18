import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { RouteFallback } from './components/RouteFallback'
import { MainLayout } from './layouts/MainLayout'

/**
 * 页面级懒加载：
 * - `pdf-lib` 与图片压缩库体积较大，放到独立 chunk 可在首页更快可交互。
 * - 命名导出页面通过 `then` 映射为 `default`，以符合 `React.lazy` 的类型约束。
 */
const HomePage = lazy(async () => {
  const m = await import('./pages/HomePage')
  return { default: m.HomePage }
})
const PrivacyPage = lazy(async () => {
  const m = await import('./pages/PrivacyPage')
  return { default: m.PrivacyPage }
})
const PdfMergePage = lazy(async () => {
  const m = await import('./pages/tools/PdfMergePage')
  return { default: m.PdfMergePage }
})
const ImageCompressPage = lazy(async () => {
  const m = await import('./pages/tools/ImageCompressPage')
  return { default: m.ImageCompressPage }
})
const PdfToWordPage = lazy(async () => {
  const m = await import('./pages/tools/PdfToWordPage')
  return { default: m.PdfToWordPage }
})
const WordToPdfPage = lazy(async () => {
  const m = await import('./pages/tools/WordToPdfPage')
  return { default: m.WordToPdfPage }
})
const PdfToImagePage = lazy(async () => {
  const m = await import('./pages/tools/PdfToImagePage')
  return { default: m.PdfToImagePage }
})
const ImageToPdfPage = lazy(async () => {
  const m = await import('./pages/tools/ImageToPdfPage')
  return { default: m.ImageToPdfPage }
})

/**
 * 顶层路由表：
 * - 公共布局由 `MainLayout` 包裹（顶栏、页脚、Outlet）。
 * - 工具页按功能拆分，便于后续继续增加 `/tools/...` 而不膨胀单文件。
 */
export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route
          path="/"
          element={
            <Suspense fallback={<RouteFallback />}>
              <HomePage />
            </Suspense>
          }
        />
        <Route
          path="/privacy"
          element={
            <Suspense fallback={<RouteFallback />}>
              <PrivacyPage />
            </Suspense>
          }
        />
        <Route
          path="/tools/pdf-merge"
          element={
            <Suspense fallback={<RouteFallback />}>
              <PdfMergePage />
            </Suspense>
          }
        />
        <Route
          path="/tools/image-compress"
          element={
            <Suspense fallback={<RouteFallback />}>
              <ImageCompressPage />
            </Suspense>
          }
        />
        <Route
          path="/tools/pdf-to-word"
          element={
            <Suspense fallback={<RouteFallback />}>
              <PdfToWordPage />
            </Suspense>
          }
        />
        <Route
          path="/tools/word-to-pdf"
          element={
            <Suspense fallback={<RouteFallback />}>
              <WordToPdfPage />
            </Suspense>
          }
        />
        <Route
          path="/tools/pdf-to-image"
          element={
            <Suspense fallback={<RouteFallback />}>
              <PdfToImagePage />
            </Suspense>
          }
        />
        <Route
          path="/tools/image-to-pdf"
          element={
            <Suspense fallback={<RouteFallback />}>
              <ImageToPdfPage />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  )
}
