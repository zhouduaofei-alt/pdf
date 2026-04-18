/**
 * 将多个 class 片段合并为一个字符串，并自动忽略 `false / undefined / null`。
 * 用于在组件中拼接 Tailwind 工具类，避免手写 `${a} ${b}` 时出现多余空格。
 */
export function cn(...parts: Array<string | false | undefined | null>): string {
  return parts.filter(Boolean).join(' ')
}
