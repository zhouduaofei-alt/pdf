import { create } from 'zustand'

/**
 * 轻量全局偏好（示例）：图片压缩默认质量。
 *
 * 为什么用 zustand：
 * - 工具站后续往往会出现「多处组件读写同一偏好」的场景（例如设置页 + 工具页）。
 * - zustand 比 Redux 更轻，且不会强迫你拆分大量样板代码。
 *
 * 若你希望用户刷新后仍记住设置，可再接入 `zustand/middleware` 的 `persist` 写入 `localStorage`。
 */
type PreferenceState = {
  /** 0~1，对应 `browser-image-compression` 的 `initialQuality` */
  imageQuality: number
  setImageQuality: (value: number) => void
}

export const usePreferenceStore = create<PreferenceState>((set) => ({
  imageQuality: 0.82,
  setImageQuality: (value) => set({ imageQuality: value }),
}))
