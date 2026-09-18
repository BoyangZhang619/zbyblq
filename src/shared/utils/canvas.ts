/**
 * 画布工具
 *
 * 从旧版图像工具的 js/main.js 中提取。旧实现普遍在模块作用域里散落
 * 着 createElement('canvas') 与 getContext 调用，此处统一为显式构造。
 */

/** 创建离屏画布及其 2D 上下文 */
export function createCanvas(
  width = 1,
  height = 1,
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('无法获取 2D 绘图上下文')

  return { canvas, ctx }
}

/** 调整尺寸，并在需要时清空内容 */
export function resizeCanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
): void {
  canvas.width = Math.max(1, Math.round(width))
  canvas.height = Math.max(1, Math.round(height))
}

/** 把图像按原始尺寸绘制到画布 */
export function drawImageToCanvas(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
): void {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  ctx.drawImage(image, 0, 0)
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/** 生成带时间戳的导出文件名 */
export function timestampedName(prefix: string, ext: string): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const stamp =
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  return `${prefix}_${stamp}.${ext}`
}

/** 触发浏览器下载 */
export function downloadCanvasPNG(canvas: HTMLCanvasElement, prefix: string): void {
  const link = document.createElement('a')
  link.download = timestampedName(prefix, 'png')
  link.href = canvas.toDataURL('image/png')
  link.click()
}

export function downloadText(text: string, prefix: string, ext = 'txt'): void {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = timestampedName(prefix, ext)
  link.href = url
  link.click()
  URL.revokeObjectURL(url)
}
