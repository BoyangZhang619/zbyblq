/**
 * 本地示例图
 *
 * 从 public/img2ascii/js/main.js 的 makeExampleImage 照搬：900×520 的
 * 三段渐变 + 18 个随机圆点 + 两行文字，不请求网络。随机圆点原样保留——
 * 「每次生成都不一样」是旧实现的观感，改成定值反而是行为回归。
 *
 * 绘制用的色值与字体栈是示例图自身的内容（它是被处理的素材，不是界面），
 * 因此不走主题令牌。
 */

import { createCanvas } from '@/shared/utils/canvas'

const WIDTH = 900
const HEIGHT = 520

const GRADIENT_START = '#4a90d9'
const GRADIENT_MIDDLE = '#ffffff'
const GRADIENT_END = '#ff4d4f'

const CIRCLE_COUNT = 18
const CIRCLE_ALPHA = 'rgba(0,0,0,0.14)'
const CIRCLE_RADIUS_MIN = 30
const CIRCLE_RADIUS_SPAN = 120

const TEXT_COLOR = 'rgba(0,0,0,0.75)'
const TEXT_FONT = '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Arial'

/**
 * 画一张示例图并编码为 PNG
 *
 * 返回 Blob 而非 DataURL 或 Image——调用方拿到后交给 useImageFile，
 * 与用户自己选的文件走同一条加载路径。
 */
export async function renderExampleImage(): Promise<Blob | null> {
  let surface: { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }
  try {
    surface = createCanvas(WIDTH, HEIGHT)
  } catch {
    return null
  }
  const { canvas, ctx } = surface

  // 背景渐变
  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT)
  gradient.addColorStop(0, GRADIENT_START)
  gradient.addColorStop(0.55, GRADIENT_MIDDLE)
  gradient.addColorStop(1, GRADIENT_END)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  // 几何图形
  ctx.fillStyle = CIRCLE_ALPHA
  for (let i = 0; i < CIRCLE_COUNT; i++) {
    const x = Math.random() * WIDTH
    const y = Math.random() * HEIGHT
    const r = CIRCLE_RADIUS_MIN + Math.random() * CIRCLE_RADIUS_SPAN
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  // 文字
  ctx.fillStyle = TEXT_COLOR
  ctx.font = `bold 68px ${TEXT_FONT}`
  ctx.fillText('zby ASCII', 40, 120)
  ctx.font = `28px ${TEXT_FONT}`
  ctx.fillText('Image → Text', 44, 170)

  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png')
  })
}
