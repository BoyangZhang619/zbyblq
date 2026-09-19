/**
 * Floyd–Steinberg 误差扩散抖动
 *
 * 从 public/Floyd–Steinberg/js/main.js 提取，与 DOM 解耦：输入输出均为
 * ImageData 与普通数值，可独立测试。这是 docs/02-fusion-architecture.md §3
 * 所述 Stage 2 的产物。
 *
 * 算法未改动，以下均逐值照搬：
 * - 调色板：黑白固定两项；限定色模式把 0..255 均分为 n 档灰阶（n 夹在 2..16）
 * - 最近色：线性空间亮度差平方
 * - 扩散核：右 7/16、左下 3/16、下 5/16、右下 1/16
 * - 误差在**派发时**逐邻居 clamp 到 0..255（非浮点累积），透明像素不参与
 */

import { ref, computed } from 'vue'
import { clamp } from '@/shared/utils/canvas'

/** 抖动模式：纯黑白，或限定灰阶色板 */
export type DitherMode = 'bw' | 'palette'

/** 限定色模式提供的色板档位，顺序与旧实现的下拉框一致 */
export const PALETTE_COLOR_OPTIONS = [2, 4, 8, 16] as const
export type PaletteColorCount = (typeof PALETTE_COLOR_OPTIONS)[number]

export const DEFAULT_MODE: DitherMode = 'bw'
export const DEFAULT_COLORS: PaletteColorCount = 4
export const DEFAULT_STRENGTH_PERCENT = 100

/** 强度滑块的量程，单位为百分比 */
export const STRENGTH_MIN = 0
export const STRENGTH_MAX = 100

/** 输出画布上限，与旧实现的 maxOutW / maxOutH 一致 */
export const MAX_OUT_WIDTH = 1600
export const MAX_OUT_HEIGHT = 900

/** 调色板的一项，各通道 0..255 */
export type Rgb = readonly [number, number, number]

/* ============================================
   颜色计算
   ============================================ */

/** sRGB 分量（0..255）转线性空间 */
export function srgbToLinear(channel: number): number {
  const c = channel / 255
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

/** 感知亮度：线性空间按 Rec.709 权重加权 */
export function luminance(r: number, g: number, b: number): number {
  const R = srgbToLinear(r)
  const G = srgbToLinear(g)
  const B = srgbToLinear(b)
  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}

/**
 * 构造调色板
 *
 * - `bw`：纯黑与纯白
 * - `palette`：把 0..255 均分为 n 档灰阶，n 夹在 2..16
 */
export function buildPalette(mode: DitherMode, colors: number): Rgb[] {
  if (mode === 'bw') {
    return [
      [0, 0, 0],
      [255, 255, 255],
    ]
  }

  const n = clamp(colors | 0, 2, 16)
  const palette: Rgb[] = []
  for (let i = 0; i < n; i++) {
    const v = Math.round((i / (n - 1)) * 255)
    palette.push([v, v, v])
  }
  return palette
}

/**
 * 取调色板中与给定颜色最接近的一项
 *
 * 距离在线性空间以亮度差的平方衡量——对灰阶调色板即「色阶最接近」。
 */
export function nearestInPalette(
  r: number,
  g: number,
  b: number,
  palette: readonly Rgb[],
): Rgb {
  const l = luminance(r, g, b)
  let best = palette[0]
  let bestDistance = Infinity

  for (const candidate of palette) {
    const candidateL = luminance(candidate[0], candidate[1], candidate[2])
    const distance = (l - candidateL) * (l - candidateL)
    if (distance < bestDistance) {
      bestDistance = distance
      best = candidate
    }
  }

  return best
}

/* ============================================
   误差扩散
   ============================================ */

/**
 * 对 ImageData 就地执行 Floyd–Steinberg 抖动
 *
 * @param imageData 待处理的像素，原地修改并返回
 * @param palette 目标调色板
 * @param strength 扩散强度 0..1。0 即纯量化，不扩散误差
 */
export function floydSteinberg(
  imageData: ImageData,
  palette: readonly Rgb[],
  strength: number,
): ImageData {
  const w = imageData.width
  const h = imageData.height
  const data = imageData.data
  const s = clamp(strength, 0, 1)

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4

      if (data[idx + 3] === 0) continue // 透明像素不参与

      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]

      const [nr, ng, nb] = nearestInPalette(r, g, b, palette)

      const er = (r - nr) * s
      const eg = (g - ng) * s
      const eb = (b - nb) * s

      data[idx] = nr
      data[idx + 1] = ng
      data[idx + 2] = nb

      // 7/16 → (x+1, y)
      // 3/16 → (x-1, y+1)
      // 5/16 → (x,   y+1)
      // 1/16 → (x+1, y+1)
      const addError = (nx: number, ny: number, weight: number): void => {
        if (nx < 0 || nx >= w || ny < 0 || ny >= h) return
        const nidx = (ny * w + nx) * 4
        if (data[nidx + 3] === 0) return
        data[nidx] = clamp(data[nidx] + er * weight, 0, 255)
        data[nidx + 1] = clamp(data[nidx + 1] + eg * weight, 0, 255)
        data[nidx + 2] = clamp(data[nidx + 2] + eb * weight, 0, 255)
      }

      addError(x + 1, y, 7 / 16)
      addError(x - 1, y + 1, 3 / 16)
      addError(x, y + 1, 5 / 16)
      addError(x + 1, y + 1, 1 / 16)
    }
  }

  return imageData
}

/** 抖动的参数 */
export interface DitherOptions {
  mode: DitherMode
  /** 色板档位，仅在 `palette` 模式下生效 */
  colors: number
  /** 扩散强度 0..1 */
  strength: number
}

/** 按当前参数处理像素 */
export function ditherImageData(imageData: ImageData, options: DitherOptions): ImageData {
  return floydSteinberg(imageData, buildPalette(options.mode, options.colors), options.strength)
}

/* ============================================
   画布尺寸
   ============================================ */

/**
 * 把尺寸限制在给定上限内（保持比例）
 *
 * 旧实现的 fitToNiceCanvas：缩放比取 min(1, maxW/w, maxH/h)，
 * 结果至少 1px。原图小于上限时不做放大。
 */
export function fitToNiceCanvas(
  width: number,
  height: number,
  maxWidth: number = MAX_OUT_WIDTH,
  maxHeight: number = MAX_OUT_HEIGHT,
): { width: number; height: number; scale: number } {
  const scale = Math.min(1, maxWidth / width, maxHeight / height)
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
    scale,
  }
}

/* ============================================
   组合式状态
   ============================================ */

export function useDither() {
  const mode = ref<DitherMode>(DEFAULT_MODE)
  const colors = ref<PaletteColorCount>(DEFAULT_COLORS)

  /** 强度滑块的读数，0..100 */
  const strengthSlider = ref(DEFAULT_STRENGTH_PERCENT)

  /**
   * 生效的强度百分比
   *
   * 逐值照搬旧实现的 `Number(v) || 100`：滑块读数 0 是 falsy，
   * 会被替换成 100，因此滑块的 0 位实际等于满强度。这是旧实现的
   * 缺陷，按 docs/09-tool-page-spec.md §9 保留行为，不在此处修正。
   */
  const strengthPercent = computed(
    () => strengthSlider.value || DEFAULT_STRENGTH_PERCENT,
  )

  /** 交给算法的强度，0..1 */
  const strength = computed(() => clamp(strengthPercent.value / 100, 0, 1))

  function reset(): void {
    mode.value = DEFAULT_MODE
    colors.value = DEFAULT_COLORS
    strengthSlider.value = DEFAULT_STRENGTH_PERCENT
  }

  return { mode, colors, strengthSlider, strengthPercent, strength, reset }
}
