/**
 * 电子包浆的画布效果
 *
 * 从 public/photoPatina/js/main.js 提取（docs/09-tool-page-spec.md §9 的
 * Stage 2 产物）。与 DOM 解耦：输入输出都是画布与数值，不查询任何页面元素，
 * 也不监听事件。
 *
 * 算法与全部参数**逐值照搬**，未做任何「顺手优化」——色调、脏污、颗粒的
 * 强度差一点，包浆的味道就变了。随机斑点与颗粒的 Math.random() 调用次序
 * 也与旧实现一致。
 *
 * ## 与旧实现的一处必然差异：JPEG 编解码器
 *
 * 旧页面用 `import jpeg from "https://esm.sh/jpeg-js@0.4.4"` 从 CDN 取
 * jpeg-js。本项目没有声明这个依赖，且打包为 Capacitor 应用后不能依赖运行时
 * 联网，因此改用平台自带的 JPEG 编解码器：`canvas.toBlob('image/jpeg', q)`
 * 编码，`createImageBitmap` 解码。回环的**链路与参数**（质量值、先后次序、
 * 回环次数）与旧版一致，只是编解码实现不同，像素结果有细微差异。
 *
 * alpha 的处理随之简化：旧版解码后手动把 alpha 全部写成 255，而 JPEG 不含
 * alpha 通道，平台解码出的位图天然不透明，绘制回来即等价。
 */

import { createCanvas, resizeCanvas } from '@/shared/utils/canvas'

/** 画布与其 2D 上下文。与 shared/utils/canvas 的 createCanvas 返回值同构 */
export interface Surface {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
}

/** 输出尺寸上限：旧实现固定为最长边 1400 */
export const MAX_SIDE = 1400

/**
 * 把尺寸限制在最长边 maxSide 之内（保持比例）
 *
 * 对应旧实现的 fitToMax。四千像素宽的手机照片直接以原尺寸处理会产生
 * 数十 MB 的 ImageData，此处保留该约束。
 */
export function fitToMax(
  width: number,
  height: number,
  maxSide = MAX_SIDE,
): { w: number; h: number } {
  const s = Math.min(1, maxSide / Math.max(width, height))
  return {
    w: Math.max(1, Math.round(width * s)),
    h: Math.max(1, Math.round(height * s)),
  }
}

/** 像素通道裁剪。与旧实现的 clamp255 一致 */
export function clamp255(x: number): number {
  return x < 0 ? 0 : x > 255 ? 255 : x
}

/* ============================================
   JPEG 回环
   ============================================ */

/**
 * 真 JPEG 回环：画布 → JPEG 编码 → 解码 → 写回画布
 *
 * @param target 就地处理的画布
 * @param quality JPEG 质量，量纲为 0~100 的整数（与旧实现 jpeg-js 一致）
 * @returns 编码后的字节数，供界面显示「压到了多少 KB」
 */
export async function jpegRoundTrip(target: Surface, quality: number): Promise<number> {
  const width = target.canvas.width
  const height = target.canvas.height

  const blob = await encodeJPEG(target.canvas, quality)
  if (!blob) return 0

  const bitmap = await createImageBitmap(blob)
  target.ctx.clearRect(0, 0, width, height)
  target.ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  return blob.size
}

/** 编码为 JPEG。平台接口的质量量纲是 0~1，此处从旧版的 0~100 换算 */
function encodeJPEG(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', quality / 100)
  })
}

/* ============================================
   劣化
   ============================================ */

/**
 * 先缩小再放大：制造细节损失与块感
 *
 * 两步都开着平滑，缩小时的插值平均就是块感的来源。
 *
 * @param target 主画布（旧实现的 cA），就地缩小再放大
 * @param temp 中转画布（旧实现的 cB）
 */
export function scaleDegrade(
  target: Surface,
  temp: Surface,
  width: number,
  height: number,
  ratio: number,
): void {
  const tw = Math.max(1, Math.round(width * ratio))
  const th = Math.max(1, Math.round(height * ratio))

  // 缩小
  resizeCanvas(temp.canvas, tw, th)
  temp.ctx.imageSmoothingEnabled = true
  temp.ctx.clearRect(0, 0, tw, th)
  temp.ctx.drawImage(target.canvas, 0, 0, tw, th)

  // 放大回原尺寸
  resizeCanvas(target.canvas, width, height)
  target.ctx.imageSmoothingEnabled = true
  target.ctx.clearRect(0, 0, width, height)
  target.ctx.drawImage(temp.canvas, 0, 0, width, height)
}

/* ============================================
   包浆味道
   ============================================ */

/** 色调老化：轻曲线 + 去饱和 + 泛黄偏绿一点点 */
export function toneAging(
  target: Surface,
  width: number,
  height: number,
  warm: number,
  desat: number,
  contrastWeird: number,
): void {
  const img = target.ctx.getImageData(0, 0, width, height)
  const d = img.data

  const a = contrastWeird * 0.55
  const b = contrastWeird * 0.35

  for (let i = 0; i < d.length; i += 4) {
    let r = d[i]
    let g = d[i + 1]
    let b0 = d[i + 2]

    const nr = r / 255
    const ng = g / 255
    const nb = b0 / 255
    const rr = nr + a * (nr - 0.5) - b * (nr * nr - nr)
    const gg = ng + a * (ng - 0.5) - b * (ng * ng - ng)
    const bb = nb + a * (nb - 0.5) - b * (nb * nb - nb)

    r = clamp255(Math.round(rr * 255))
    g = clamp255(Math.round(gg * 255))
    b0 = clamp255(Math.round(bb * 255))

    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b0
    r = r + (lum - r) * desat
    g = g + (lum - g) * desat
    b0 = b0 + (lum - b0) * desat

    r = r + 34 * warm
    g = g + 28 * warm // 稍微更「旧」
    b0 = b0 - 28 * warm
    g = g + 8 * warm // 很轻微的「脏绿」

    d[i] = clamp255(r)
    d[i + 1] = clamp255(g)
    d[i + 2] = clamp255(b0)
    d[i + 3] = 255
  }

  target.ctx.putImageData(img, 0, 0)
}

/**
 * 脏污：随机斑点 + blur + multiply
 *
 * @param aux 斑点画布（旧实现的 cC）
 * @param temp 模糊用的中转画布。旧版每次新建一张临时画布，这里复用 temp，
 *   绘制前先 clearRect——与新建等价（滤镜只作用于源，但源有透明区域，
 *   目标必须为空，否则会透出残留像素）
 */
export function addGrime(
  target: Surface,
  aux: Surface,
  temp: Surface,
  width: number,
  height: number,
  amount: number,
): void {
  if (amount <= 0) return

  resizeCanvas(aux.canvas, width, height)
  aux.ctx.clearRect(0, 0, width, height)

  const count = Math.round((width * height / 50000) * (8 + amount * 40))
  for (let i = 0; i < count; i++) {
    const x = Math.random() * width
    const y = Math.random() * height
    const r = (10 + Math.random() * 90) * (0.35 + amount)
    const alpha = (0.02 + Math.random() * 0.12) * amount
    const hue = 28 + Math.random() * 18
    aux.ctx.fillStyle = `hsla(${hue}, 35%, ${18 + Math.random() * 20}%, ${alpha})`
    aux.ctx.beginPath()
    aux.ctx.ellipse(
      x, y,
      r, r * (0.6 + Math.random() * 0.9),
      Math.random() * Math.PI,
      0, Math.PI * 2,
    )
    aux.ctx.fill()
  }

  // 模糊成低频斑块
  resizeCanvas(temp.canvas, width, height)
  temp.ctx.filter = 'none'
  temp.ctx.clearRect(0, 0, width, height)
  temp.ctx.filter = `blur(${Math.max(6, 10 * amount)}px)`
  temp.ctx.drawImage(aux.canvas, 0, 0)
  temp.ctx.filter = 'none'

  aux.ctx.clearRect(0, 0, width, height)
  aux.ctx.drawImage(temp.canvas, 0, 0)

  target.ctx.save()
  target.ctx.globalCompositeOperation = 'multiply'
  target.ctx.globalAlpha = 0.85 * amount
  target.ctx.drawImage(aux.canvas, 0, 0)
  target.ctx.restore()
}

/** 颗粒噪点 */
export function addGrain(
  target: Surface,
  width: number,
  height: number,
  amount: number,
): void {
  if (amount <= 0) return

  const img = target.ctx.getImageData(0, 0, width, height)
  const d = img.data
  const strength = 18 * amount

  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() * 2 - 1) * strength
    d[i] = clamp255(d[i] + n)
    d[i + 1] = clamp255(d[i + 1] + n)
    d[i + 2] = clamp255(d[i + 2] + n)
    d[i + 3] = 255
  }

  target.ctx.putImageData(img, 0, 0)
}

/** 暗角 */
export function addVignette(
  target: Surface,
  width: number,
  height: number,
  amount: number,
): void {
  if (amount <= 0) return

  const g = target.ctx.createRadialGradient(
    width / 2, height / 2, Math.min(width, height) * 0.2,
    width / 2, height / 2, Math.max(width, height) * 0.72,
  )
  g.addColorStop(0, 'rgba(0,0,0,0)')
  g.addColorStop(1, `rgba(0,0,0,${0.75 * amount})`)

  target.ctx.save()
  target.ctx.globalCompositeOperation = 'multiply'
  target.ctx.fillStyle = g
  target.ctx.fillRect(0, 0, width, height)
  target.ctx.restore()
}

/** 扫描线 */
export function addScanlines(
  target: Surface,
  width: number,
  height: number,
  amount: number,
): void {
  if (amount <= 0) return

  target.ctx.save()
  target.ctx.globalCompositeOperation = 'multiply'
  target.ctx.globalAlpha = 0.22 * amount
  target.ctx.fillStyle = 'rgba(0,0,0,1)'

  const step = 2
  for (let y = 0; y < height; y += step) {
    if ((y / step) % 2 === 0) target.ctx.fillRect(0, y, width, 1)
  }

  target.ctx.restore()
}

/**
 * 轻锐化：orig + k*(orig - blur)
 *
 * @param temp 原图副本（旧实现的 cB）
 * @param aux 模糊副本（旧实现的 cC）
 */
export function unsharp(
  target: Surface,
  temp: Surface,
  aux: Surface,
  width: number,
  height: number,
  amount: number,
): void {
  if (amount <= 0) return

  resizeCanvas(temp.canvas, width, height)
  temp.ctx.filter = 'none'
  temp.ctx.clearRect(0, 0, width, height)
  temp.ctx.drawImage(target.canvas, 0, 0)

  resizeCanvas(aux.canvas, width, height)
  aux.ctx.filter = 'none'
  aux.ctx.clearRect(0, 0, width, height)
  aux.ctx.filter = 'blur(1.2px)'
  aux.ctx.drawImage(temp.canvas, 0, 0)
  aux.ctx.filter = 'none'

  const orig = temp.ctx.getImageData(0, 0, width, height)
  const blur = aux.ctx.getImageData(0, 0, width, height)
  const o = orig.data
  const bl = blur.data

  const k = 0.9 * amount
  for (let i = 0; i < o.length; i += 4) {
    o[i] = clamp255(o[i] + k * (o[i] - bl[i]))
    o[i + 1] = clamp255(o[i + 1] + k * (o[i + 1] - bl[i + 1]))
    o[i + 2] = clamp255(o[i + 2] + k * (o[i + 2] - bl[i + 2]))
    o[i + 3] = 255
  }

  target.ctx.putImageData(orig, 0, 0)
}

/** 处理链需要的三张画布，对应旧实现的 cA / cB / cC */
export function createSurfaces(): { work: Surface; temp: Surface; aux: Surface } {
  return {
    work: createCanvas(1, 1),
    temp: createCanvas(1, 1),
    aux: createCanvas(1, 1),
  }
}
