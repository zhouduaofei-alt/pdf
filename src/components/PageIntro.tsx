import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

type PageIntroProps = {
  /** 页面主标题（H1） */
  title: string
  /** 副标题/说明文案 */
  description: string
  /** 可选：右侧或下方补充区域（例如徽章、提示） */
  children?: ReactNode
}

/**
 * 工具页统一的「标题区」组件：
 * - 控制字号阶梯与最大宽度，让页面看起来更「大气」、可读性更好。
 * - 使用轻量 `motion` 入场，避免与 `MainLayout` 的路由过渡冲突（此处只做细微 stagger）。
 */
export function PageIntro({ title, description, children }: PageIntroProps) {
  return (
    <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl space-y-3">
        <motion.h1
          className="text-balance text-3xl font-semibold tracking-tight text-ink-0 sm:text-4xl"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.04 }}
        >
          {title}
        </motion.h1>
        <motion.p
          className="text-pretty text-base leading-relaxed text-ink-2 sm:text-lg"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
        >
          {description}
        </motion.p>
      </div>
      {children ? <div className="shrink-0">{children}</div> : null}
    </div>
  )
}
