/**
 * 图片转 ASCII 的核心逻辑
 *
 * 从 public/img2ascii/js/main.js 提取，是 docs/02-fusion-architecture.md
 * 所述 Stage 2 的产物。与原实现的关系：
 *
 * 1. 算法**逐值照搬**：四张字符映射表、亮度/对比度公式、Rec.709 亮度
 *    权重、0.55 的宽高比校正、透明像素的处理分支，一个都没改。
 * 2. 与 DOM 解耦：输入是 HTMLImageElement，输出是纯数据网格；
 *    不再查询元素 id，也不再拼 HTML 字符串。
 * 3. 旧版把彩色结果直接拼成 innerHTML，此处只产出颜色值，
 *    由视图决定如何呈现。
 */

import { ref, computed, shallowRef, watch } from 'vue'
import { createCanvas, resizeCanvas, clamp } from '@/shared/utils/canvas'

/* ============================================
   字符集
   ============================================ */

/**
 * 四张映射表，逐字符照搬自旧实现
 *
 * 索引 0 是空格（最亮），末尾是最密的字符（最暗）。
 * blocks 用的是 U+2588 等块元素字符；binary 名为「二值」，
 * 表里实为「空格 + 0 + 1」三个字符——原样保留，未做「修正」。
 */
export const CHARSETS = {
  detailed: " .'`^\",:;Il!i~+_-?][}{1)(|\\/*tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
  simple: ' .:-=+*#%@',
  blocks: ' ░▒▓█',
  binary: ' 01',
} as const

export type CharsetKey = keyof typeof CHARSETS

/** 界面上的字符集次序。与字符密度由密到疏一致 */
export const CHARSET_KEYS = ['detailed', 'simple', 'blocks', 'binary'] as const satisfies readonly CharsetKey[]

/* ============================================
   参数范围与默认值
   ============================================ */

/** 输出列数 */
export const WIDTH_MIN = 40
export const WIDTH_MAX = 240
export const WIDTH_DEFAULT = 120
/** 输出字号，只影响预览与导出的显示尺寸 */
export const FONT_SIZE_MIN = 8
export const FONT_SIZE_MAX = 18
export const FONT_SIZE_DEFAULT = 10
/** 亮度与对比度共用同一刻度 */
export const ADJUST_MIN = -50
export const ADJUST_MAX = 50
export const ADJUST_DEFAULT = 0
export const DEFAULT_CHARSET: CharsetKey = 'detailed'

/**
 * 字符宽高比校正
 *
 * 等宽字形的宽通常只有高的 0.55 倍，直接按列数等比换算会让字符画被拉长。
 * 旧实现注释写的是「取 0.6 附近」而取值 0.55，此处照搬**取值**。
 */
export const ASPECT_FIX = 0.55

export interface AsciiConfig {
  /** 输出列数 */
  widthCols: number
  /** 预览与导出的字号 */
  fontSize: number
  /** 字符映射表 */
  charset: CharsetKey
  /** 亮度，-50..50 */
  brightness: number
  /** 对比度，-50..50 */
  contrast: number
  /** 反相 */
  invert: boolean
  /** 彩色输出 */
  color: boolean
}

/* ============================================
   纯函数
   ============================================ */

/**
 * 亮度/对比度调整：0..255 进，0..255 出
 *
 * 对比度用经典的 (259*(c+255))/(255*(259-c)) 系数；亮度按 50 档映射到
 * ±64。两处系数都照搬旧实现。
 */
export function applyBrightnessContrast(
  value: number,
  brightness: number,
  contrast: number,
): number {
  const b = (brightness / 50) * 64
  const c = (contrast / 50) * 128
  const f = (259 * (c + 255)) / (255 * (259 - c))

  return clamp(f * (value - 128) + 128 + b, 0, 255)
}

/** 相对亮度（Rec. 709 权重），0..255 */
export function luminance(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** 亮度 → 字符。亮取疏、暗取密，故索引反向 */
export function charForLuminance(value: number, chars: readonly string[]): string {
  const t = value / 255
  const index = Math.floor((1 - t) * (chars.length - 1))
  return chars[clamp(index, 0, chars.length - 1)] ?? ' '
}

/** 输出行数。宽高比校正后按列数等比换算 */
export function gridRows(sourceWidth: number, sourceHeight: number, cols: number): number {
  return Math.max(1, Math.round((sourceHeight / sourceWidth) * cols * ASPECT_FIX))
}

/* ============================================
   网格数据
   ============================================ */

export interface AsciiCell {
  /** 该位置输出的字符 */
  char: string
  /** 彩色模式下的字符颜色，形如 rgb(r,g,b)；透明像素为 null */
  color: string | null
}

export interface AsciiGrid {
  cols: number
  rows: number
  /** 纯文本输出，行以 \n 连接，与旧实现的 lastText 一致 */
  text: string
  /** 彩色输出所需的逐行数据 */
  lines: AsciiCell[][]
  /**
   * 采样后的像素，导出 PNG 时据此取色
   *
   * 注意这与屏幕上的着色不是同一份数据——旧实现导出时重新读取了
   * 未做亮度/对比度调整的原始像素，此处照搬该行为，
   * 差异见迁移报告的 concerns。
   */
  pixels: ImageData
}

/**
 * 把采样像素映射为字符网格
 *
 * 纯数据变换，不触碰 DOM，可单独测试。
 */
export function mapPixels(pixels: ImageData, config: AsciiConfig): AsciiGrid {
  const { width: cols, height: rows } = pixels

  // 键非法时回退到细密表，与旧实现一致
  const chars = (CHARSETS[config.charset] ?? CHARSETS.detailed).split('')
  const data = pixels.data

  const lines: AsciiCell[][] = []
  const textLines: string[] = []

  for (let y = 0; y < rows; y++) {
    const row: AsciiCell[] = []
    let lineText = ''

    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const alpha = data[i + 3]

      // 完全透明的像素当成背景：输出空格，彩色模式下不着色
      if (alpha === 0) {
        row.push({ char: ' ', color: null })
        lineText += ' '
        continue
      }

      const r = applyBrightnessContrast(data[i], config.brightness, config.contrast)
      const g = applyBrightnessContrast(data[i + 1], config.brightness, config.contrast)
      const b = applyBrightnessContrast(data[i + 2], config.brightness, config.contrast)

      let lum = luminance(r, g, b)
      if (config.invert) lum = 255 - lum

      const ch = charForLuminance(lum, chars)

      row.push({ char: ch, color: config.color ? `rgb(${r},${g},${b})` : null })
      lineText += ch
    }

    lines.push(row)
    textLines.push(lineText)
  }

  return { cols, rows, text: textLines.join('\n'), lines, pixels }
}

/* ============================================
   采样
   ============================================ */

/**
 * 采样画布
 *
 * 按旧实现的尺寸复用，避免每次调参都新建画布。
 * 不设置 imageSmoothingEnabled——默认的平滑缩小正是旧实现的效果，
 * 关掉会让缩略采样出现锯齿。
 */
let sampler: { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null = null

/** 把原图缩到 列×行，取出每个格子一个像素 */
export function sampleImage(image: HTMLImageElement, cols: number, rows: number): ImageData {
  if (!sampler) sampler = createCanvas(cols, rows)

  if (sampler.canvas.width !== cols || sampler.canvas.height !== rows) {
    resizeCanvas(sampler.canvas, cols, rows)
  } else {
    sampler.ctx.clearRect(0, 0, cols, rows)
  }

  sampler.ctx.drawImage(image, 0, 0, cols, rows)
  return sampler.ctx.getImageData(0, 0, cols, rows)
}

/** 从原图直接算出完整网格 */
export function buildAsciiGrid(image: HTMLImageElement, config: AsciiConfig): AsciiGrid {
  const cols = config.widthCols
  const rows = gridRows(image.naturalWidth, image.naturalHeight, cols)
  return mapPixels(sampleImage(image, cols, rows), config)
}

/* ============================================
   组合式状态
   ============================================ */

export function useAsciiArt() {
  const widthCols = ref(WIDTH_DEFAULT)
  const fontSize = ref(FONT_SIZE_DEFAULT)
  const charset = ref<CharsetKey>(DEFAULT_CHARSET)
  const brightness = ref(ADJUST_DEFAULT)
  const contrast = ref(ADJUST_DEFAULT)
  const invert = ref(false)
  const color = ref(true)

  /** 原图。仅作引用持有，不参与深层响应式 */
  const image = shallowRef<HTMLImageElement | null>(null)

  /**
   * 结果网格
   *
   * 必须用 shallowRef：一张 240 列的网格有上万个格子对象，
   * 深响应式会把它们全部包成 Proxy，代价远超收益——
   * 网格总是整体替换，浅引用足够触发更新。
   */
  const grid = shallowRef<AsciiGrid | null>(null)

  const config = computed<AsciiConfig>(() => ({
    widthCols: widthCols.value,
    fontSize: fontSize.value,
    charset: charset.value,
    brightness: brightness.value,
    contrast: contrast.value,
    invert: invert.value,
    color: color.value,
  }))

  function render(): void {
    const source = image.value
    if (!source) return
    grid.value = buildAsciiGrid(source, config.value)
  }

  function load(next: HTMLImageElement): void {
    image.value = next
    render()
  }

  // 任一参数变化即重算，与旧版「有图就实时更新」的行为一致
  watch(config, render)

  return {
    widthCols,
    fontSize,
    charset,
    brightness,
    contrast,
    invert,
    color,
    grid,
    load,
    render,
  }
}
