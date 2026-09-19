/**
 * 电子包浆的组合式
 *
 * 承载参数状态与处理链的调度；画布效果本身在 patina-effects.ts。
 * 两者都不查询 DOM 元素——可见画布由组件通过 ref 传入，因此本文件
 * 可以脱离视图单独测试（docs/09-tool-page-spec.md §9）。
 *
 * 参数默认值、取值范围、随机区间全部照搬 public/photoPatina/，
 * 不做任何「顺手优化」。
 */

import { reactive, ref, watch, type Ref } from 'vue'
import { resizeCanvas } from '@/shared/utils/canvas'
import {
  addGrain,
  addGrime,
  addScanlines,
  addVignette,
  createSurfaces,
  fitToMax,
  jpegRoundTrip,
  scaleDegrade,
  toneAging,
  unsharp,
} from './patina-effects'

/** 全部可调参数。对应旧实现 index.html 上的 12 个 range */
export interface PatinaParams {
  /** 第一次 JPEG 质量 */
  q1: number
  /** 缩放倍率（先缩后放） */
  scale: number
  /** 第二次 JPEG 质量 */
  q2: number
  /** 额外回环次数 */
  loops: number
  /** 泛黄/旧色 */
  warm: number
  /** 去饱和 */
  desat: number
  /** 对比异常 */
  contrast: number
  /** 脏污 */
  grime: number
  /** 颗粒噪点 */
  grain: number
  /** 暗角 */
  vignette: number
  /** 轻锐化 */
  sharpen: number
  /** 扫描线 */
  scanlines: number
}

/** 默认值，与旧实现 main.js 的 defaults 逐值一致 */
export const PATINA_DEFAULTS: PatinaParams = {
  q1: 55,
  scale: 0.72,
  q2: 35,
  loops: 1,
  warm: 0.26,
  desat: 0.18,
  contrast: 0.12,
  grime: 0.22,
  grain: 0.12,
  vignette: 0.16,
  sharpen: 0.22,
  scanlines: 0.08,
}

/** 取值范围，与旧实现 index.html 各 input 的 min/max/step 逐值一致 */
export const PATINA_LIMITS: Record<keyof PatinaParams, { min: number; max: number; step: number }> = {
  q1: { min: 5, max: 95, step: 1 },
  scale: { min: 0.25, max: 1, step: 0.01 },
  q2: { min: 5, max: 95, step: 1 },
  loops: { min: 0, max: 4, step: 1 },
  warm: { min: 0, max: 1, step: 0.01 },
  desat: { min: 0, max: 1, step: 0.01 },
  contrast: { min: 0, max: 0.6, step: 0.01 },
  grime: { min: 0, max: 1, step: 0.01 },
  grain: { min: 0, max: 1, step: 0.01 },
  vignette: { min: 0, max: 1, step: 0.01 },
  sharpen: { min: 0, max: 1, step: 0.01 },
  scanlines: { min: 0, max: 1, step: 0.01 },
}

/** 界面上那行性能读数 */
export interface PatinaStats {
  elapsedMs: number
  jpeg1KB: number
  jpeg2KB: number
  extraKB: number
}

export interface UsePhotoPatinaOptions {
  /** 原图画布（可见），同时是处理链的输入 */
  sourceCanvas: Ref<HTMLCanvasElement | null>
  /** 结果画布（可见） */
  outputCanvas: Ref<HTMLCanvasElement | null>
  /** 是否已载入图片 */
  hasImage: Ref<boolean>
}

export function usePhotoPatina(options: UsePhotoPatinaOptions) {
  const params = reactive<PatinaParams>({ ...PATINA_DEFAULTS })
  const isProcessing = ref(false)
  const stats = ref<PatinaStats | null>(null)

  /** 处理尺寸（原图受最长边上限约束后的尺寸） */
  const outputSize = ref<{ width: number; height: number } | null>(null)

  // 处理链的三张离屏画布，对应旧实现的 cA / cB / cC
  const { work, temp, aux } = createSurfaces()

  let sourceWidth = 0
  let sourceHeight = 0

  // 同一时刻只跑一条处理链；运行中到达的请求合并为结束后的一次重跑
  let running = false
  let pending = false

  function getContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
    return canvas.getContext('2d', { willReadFrequently: true })
  }

  /**
   * 载入原图
   *
   * 把原图按最长边上限缩放到两个可见画布上（旧实现的 drawToSrc）。
   * 调用前画布必须已挂载——组件在后面等一次 nextTick。
   */
  function setSource(image: HTMLImageElement): void {
    const { w, h } = fitToMax(image.naturalWidth || image.width, image.naturalHeight || image.height)
    sourceWidth = w
    sourceHeight = h
    outputSize.value = { width: w, height: h }

    const source = options.sourceCanvas.value
    const output = options.outputCanvas.value
    if (!source || !output) return

    resizeCanvas(source, w, h)
    resizeCanvas(output, w, h)

    const sctx = getContext(source)
    if (!sctx) return
    sctx.imageSmoothingEnabled = true
    sctx.clearRect(0, 0, w, h)
    sctx.drawImage(image, 0, 0, w, h)

    const octx = getContext(output)
    if (!octx) return
    octx.clearRect(0, 0, w, h)
    octx.drawImage(source, 0, 0)
  }

  /** 跑一遍完整处理链。返回值只用于等待，界面不关心 */
  async function processOnce(): Promise<void> {
    const source = options.sourceCanvas.value
    const output = options.outputCanvas.value
    if (!source || !output || sourceWidth < 1 || sourceHeight < 1) return

    const width = sourceWidth
    const height = sourceHeight
    const {
      q1, q2, loops, scale,
      warm, desat, contrast, grime, grain, vignette, sharpen, scanlines,
    } = params

    const t0 = performance.now()

    // 从原图开始
    resizeCanvas(work.canvas, width, height)
    work.ctx.imageSmoothingEnabled = true
    work.ctx.clearRect(0, 0, width, height)
    work.ctx.drawImage(source, 0, 0, width, height)

    // JPEG #1
    const bytes1 = await jpegRoundTrip(work, q1)

    // 缩放劣化
    scaleDegrade(work, temp, width, height, scale)

    // JPEG #2
    const bytes2 = await jpegRoundTrip(work, q2)

    // 额外回环：每次质量递减 5，并轻微抖动缩放
    let extraBytes = 0
    for (let i = 0; i < loops; i++) {
      const qq = Math.max(5, Math.round(q2 - i * 5))
      extraBytes = await jpegRoundTrip(work, qq)
      const rr = Math.max(0.25, Math.min(1, scale - 0.03 + Math.random() * 0.06))
      scaleDegrade(work, temp, width, height, rr)
    }

    // 旧色与脏感
    toneAging(work, width, height, warm, desat, contrast)
    addGrime(work, aux, temp, width, height, grime)
    addGrain(work, width, height, grain)
    addVignette(work, width, height, vignette)
    addScanlines(work, width, height, scanlines)
    unsharp(work, temp, aux, width, height, sharpen)

    // 输出到可见画布
    resizeCanvas(output, width, height)
    const octx = getContext(output)
    if (!octx) return
    octx.clearRect(0, 0, width, height)
    octx.drawImage(work.canvas, 0, 0)

    stats.value = {
      elapsedMs: performance.now() - t0,
      jpeg1KB: bytes1 / 1024,
      jpeg2KB: bytes2 / 1024,
      extraKB: extraBytes / 1024,
    }
  }

  /**
   * 触发一次处理
   *
   * 这里的 JPEG 编解码必须走平台接口，因此是异步的：拖动滑杆会产生大量请求，
   * 合并策略与旧实现的 requestAnimationFrame 同一目的——同一时刻只跑一条链，
   * 运行中到达的请求合并为结束后的一次重跑，且每次重跑都重新读取参数，
   * 结果永远对应最新状态。
   */
  async function render(): Promise<void> {
    if (!options.hasImage.value) return

    if (running) {
      pending = true
      return
    }

    running = true
    isProcessing.value = true
    try {
      do {
        pending = false
        await processOnce()
      } while (pending && options.hasImage.value)
    } catch (error) {
      // 与旧实现一致：处理失败就中止，画布保留上一帧。旧版是同步抛错，
      // 这里必须接住——异步链的异常会变成未处理的 rejection
      pending = false
      console.error('[photo-patina] 处理失败', error)
    } finally {
      running = false
      isProcessing.value = false
    }
  }

  /** 保留两位小数，与旧实现用 toFixed(2) 写回 input 的效果一致 */
  function round2(value: number): number {
    return Math.round(value * 100) / 100
  }

  /**
   * 随机一组参数
   *
   * 区间与旧实现 randomBtn 的处理逐值一致。改完由下方的 watch 触发重绘，
   * 不在这里额外调用 render——那会多跑一遍完整处理链。
   */
  function randomize(): void {
    const rnd = (a: number, b: number) => a + Math.random() * (b - a)

    params.q1 = Math.round(rnd(35, 70))
    params.q2 = Math.round(rnd(18, 48))
    params.scale = round2(rnd(0.45, 0.85))
    params.loops = Math.random() < 0.6 ? Math.round(rnd(0, 2)) : Math.round(rnd(2, 4))

    params.warm = round2(rnd(0.10, 0.45))
    params.desat = round2(rnd(0.05, 0.35))
    params.contrast = round2(rnd(0.05, 0.25))

    params.grime = round2(rnd(0.05, 0.55))
    params.grain = round2(rnd(0.05, 0.35))
    params.vignette = round2(rnd(0.05, 0.40))
    params.sharpen = round2(rnd(0.05, 0.45))
    params.scanlines = round2(Math.random() < 0.5 ? rnd(0, 0.18) : rnd(0.05, 0.35))
  }

  /** 回到默认值 */
  function reset(): void {
    Object.assign(params, PATINA_DEFAULTS)
  }

  // 参数一变就重绘。reactive 对象默认深度监听，randomize 一次改 12 个字段
  // 也只会触发一次
  watch(params, () => { void render() })

  return { params, isProcessing, stats, outputSize, setSource, render, randomize, reset }
}
