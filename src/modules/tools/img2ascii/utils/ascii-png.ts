/**
 * 字符画导出为 PNG
 *
 * 从 public/img2ascii/js/main.js 的 downloadPng 提取，绘制流程与几何
 * 参数逐值照搬：字符格 0.62em × 1.02em（下限 6×8）、四周 16px 留白、
 * 逐字符 fillText。
 *
 * 这里用的是 canvas 的像素值而非组件样式，因此色值以常量给出——
 * 它们不是主题令牌的映射对象，而是导出图自身的配色，旧实现即如此。
 */

import { createCanvas } from '@/shared/utils/canvas'
import type { AsciiGrid } from '../composables/useAsciiArt'

/* 字符格几何：与预览里的 .ascii-char 宽度（0.62em）必须一致 */
const CHAR_WIDTH_RATIO = 0.62
const CHAR_HEIGHT_RATIO = 1.02
const CHAR_WIDTH_MIN = 6
const CHAR_HEIGHT_MIN = 8
const PADDING = 16

/** 导出图的背景与默认字色，深色主题下各一套 */
const BACKGROUND_DARK = 'rgba(0,0,0,0.85)'
const BACKGROUND_LIGHT = 'rgba(255,255,255,1)'
const TEXT_DARK = 'rgba(230,230,230,0.95)'
const TEXT_LIGHT = 'rgba(30,30,30,0.95)'

/** 透明像素的阈值：低于此值不落笔 */
const ALPHA_THRESHOLD = 0.01
/** 彩色字符的最低不透明度，保证浅色像素也看得清 */
const ALPHA_MIN = 0.9

export interface AsciiPngOptions {
  /** 字号，决定字符格尺寸 */
  fontSize: number
  /** 是否用采样像素给字符上色 */
  color: boolean
  /** 当前是否深色主题 */
  dark: boolean
  /** 等宽字体栈 */
  fontFamily: string
}

/**
 * 等宽字体栈
 *
 * canvas 的 font 不接受 var()，只能把 --font-mono 的值取出来。
 * 旧实现读的是旧页面自己的 --mono，迁移后统一到设计系统的令牌。
 */
export function monoFontStack(): string {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue('--font-mono')
    .trim()
  return value || 'monospace'
}

/**
 * 把网格画成一张离屏画布，交由调用方决定如何下载
 *
 * 即使当前是纯文本模式也能导出——颜色取自采样像素，与预览的模式无关。
 */
export function drawAsciiToCanvas(grid: AsciiGrid, options: AsciiPngOptions): HTMLCanvasElement {
  const charW = Math.max(CHAR_WIDTH_MIN, Math.round(options.fontSize * CHAR_WIDTH_RATIO))
  const charH = Math.max(CHAR_HEIGHT_MIN, Math.round(options.fontSize * CHAR_HEIGHT_RATIO))

  const { canvas, ctx } = createCanvas(
    PADDING * 2 + charW * grid.cols,
    PADDING * 2 + charH * grid.rows,
  )

  ctx.fillStyle = options.dark ? BACKGROUND_DARK : BACKGROUND_LIGHT
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.font = `${options.fontSize}px ${options.fontFamily}`
  ctx.textBaseline = 'top'

  const pixels = grid.pixels
  const lines = grid.text.split('\n')

  for (let y = 0; y < lines.length; y++) {
    const line = lines[y] ?? ''

    for (let x = 0; x < grid.cols; x++) {
      const ch = line[x] ?? ' '

      if (options.color && x < pixels.width && y < pixels.height) {
        const i = (y * pixels.width + x) * 4
        const alpha = pixels.data[i + 3] / 255

        // 透明像素不落笔，留出背景
        if (alpha <= ALPHA_THRESHOLD) continue

        ctx.fillStyle =
          `rgba(${pixels.data[i]},${pixels.data[i + 1]},${pixels.data[i + 2]},` +
          `${Math.max(ALPHA_MIN, alpha)})`
      } else {
        ctx.fillStyle = options.dark ? TEXT_DARK : TEXT_LIGHT
      }

      ctx.fillText(ch, PADDING + x * charW, PADDING + y * charH)
    }
  }

  return canvas
}
