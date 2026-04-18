import { Slot } from '@radix-ui/react-slot'
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

/**
 * 按钮变体：用于首页卡片、表单主操作等不同层级。
 * - `primary`：主行动点（高对比）。
 * - `secondary`：次级操作（描边）。
 * - `ghost`：低强调（导航、返回）。
 */
type Variant = 'primary' | 'secondary' | 'ghost'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** 为 true 时渲染子元素并合并 props（Radix Slot），用于 `asChild` 把样式套在 `Link` 上 */
  asChild?: boolean
  variant?: Variant
}

const variantClass: Record<Variant, string> = {
  primary:
    'bg-accent text-white shadow-glow hover:brightness-110 active:translate-y-px disabled:opacity-50 disabled:pointer-events-none',
  secondary:
    'bg-surface-1 text-ink-0 ring-1 ring-surface-2 hover:ring-accent/30 hover:bg-accent-soft/40',
  ghost: 'text-ink-1 hover:text-ink-0 hover:bg-surface-2/60',
}

/**
 * 统一按钮：圆角、焦点环、过渡动画，符合「大气 + 微动感」交互。
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { asChild, className, variant = 'primary', type = 'button', ...props },
  ref,
) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      ref={ref as never}
      type={asChild ? undefined : type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-pill px-5 py-2.5 text-sm font-medium transition will-change-transform',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0',
        variantClass[variant],
        className,
      )}
      {...props}
    />
  )
})
