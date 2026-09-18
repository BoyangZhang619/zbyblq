/**
 * 像素化算法
 *
 * 从 public/pixelate/js/main.js 提取，算法本身未改动，仅做了三点调整：
 * 1. 与 DOM 解耦：输入输出均为画布，不依赖任何元素 id
 * 2. 中间的临时画布改为按需创建，且随尺寸变化复用而非每次重建
 * 3. 颜色量化的 levelsMap 由对象字面量改为常量表，并补上类型
 *
 * 这是 docs/02-fusion-architecture.md §3 所述 Stage 2 的产物。
 */

import { createCanvas, resizeCanvas, clamp } from '@/shared/utils/canvas'

/** 色板选项：界面提供的三档 */
export const PALETTE_SIZES = [8, 16, 32] as const
export type PaletteSize = (typeof PALETTE_SIZES)[number]

/**
 * 色板到每通道色阶数的映射
 *
 * 注意这不是严格的全局色彩聚类（如中位切分），而是「通道分箱」近似量化——
 * 速度快，且分箱带来的色带感恰好是像素风的预期效果。
 */
const LEVELS_BY_PALETTE: Record<PaletteSize, number> = {
  8: 2,
  16: 4,
  32: 5,
}

export const BLOCK_SIZE_MIN = 2
export const BLOCK_SIZE_MAX = 80
export const BLOCK_SIZE_DEFAULT = 16

export interface PixelateOptions {
  /** 像素块边长，单位为输出画布的像素 */
  blockSize: number
  /** 是否启用色板限制 */
  quantize: boolean
  paletteSize: PaletteSize
}

/**
 * 把每个通道压到给定的色阶数
 *
 * alpha 通道保持不变。
 */
function quantizeImageData(imageData: ImageData, paletteSize: PaletteSize): ImageData {
  const levels = LEVELS_BY_PALETTE[paletteSize] ?? 4
  const step = 255 / (levels - 1)
  const data = imageData.data

  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.round(data[i] / step) * step
    data[i + 1] = Math.round(data[i + 1] / step) * step
    data[i + 2] = Math.round(data[i + 2] / step) * step
  }
  return imageData
}

/* 中间画布复用：尺寸变化时重建，否则仅清空 */
let tmp: { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null = null

/**
 * 执行像素化
 *
 * 两步缩放：先带平滑地缩小到 1/blockSize（等效于对每个块取平均），
 * 再关闭平滑地以最近邻放大回去。这样每个块得到的是该区域的平均色，
 * 比直接抽样的观感更自然。
 *
 * @param source 原图所在的画布
 * @param output 输出画布，尺寸即最终输出尺寸
 */
export function pixelate(
  source: HTMLCanvasElement,
  output: HTMLCanvasElement,
  options: PixelateOptions,
): void {
  const ctx = output.getContext('2d', { willReadFrequently: true })
  if (!ctx) return

  const outW = output.width
  const outH = output.height
  const blockSize = clamp(options.blockSize, BLOCK_SIZE_MIN, BLOCK_SIZE_MAX)

  const smallW = Math.max(1, Math.floor(outW / blockSize))
  const smallH = Math.max(1, Math.floor(outH / blockSize))

  if (!tmp) tmp = createCanvas(smallW, smallH)
  if (tmp.canvas.width !== smallW || tmp.canvas.height !== smallH) {
    resizeCanvas(tmp.canvas, smallW, smallH)
  } else {
    tmp.ctx.clearRect(0, 0, smallW, smallH)
  }

  // 第一步：带平滑地缩小，使每块得到区域平均色
  tmp.ctx.imageSmoothingEnabled = true
  tmp.ctx.drawImage(source, 0, 0, source.width, source.height, 0, 0, smallW, smallH)

  // 第二步：可选的颜色量化。在小图上做，速度快得多
  if (options.quantize) {
    const data = tmp.ctx.getImageData(0, 0, smallW, smallH)
    tmp.ctx.putImageData(quantizeImageData(data, options.paletteSize), 0, 0)
  }

  // 第三步：关闭平滑地放大回去，形成硬边像素块
  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, outW, outH)
  ctx.drawImage(tmp.canvas, 0, 0, smallW, smallH, 0, 0, outW, outH)
}

/**
 * 把输出尺寸限制在给定上限内（保持比例）
 *
 * 原实现固定为 1600×900。对于手机拍摄的四千像素宽照片，
 * 直接以原尺寸处理会产生数十 MB 的 ImageData，此处保留该约束。
 */
export function fitWithin(
  width: number,
  height: number,
  maxWidth = 1600,
  maxHeight = 900,
): { width: number; height: number; scale: number } {
  const scale = Math.min(1, maxWidth / width, maxHeight / height)
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
    scale,
  }
}
