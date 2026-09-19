/**
 * 拇指琴的 WebAudio 合成引擎
 *
 * 由 `public/kalimba/js/main.js` 的 enableAudio / playPluck / createNoiseBuffer
 * 提取而来（docs/09-tool-page-spec.md §9 所述 Stage 2）。与原实现的唯一区别
 * 是音色参数不再从 DOM 读取，而是由调用方传入——合成本身逐值照搬：
 * 振荡器类型、detune、低通截止与 Q、ADSR、噪声 click、颤音 LFO、
 * delay 的时值与反馈比例。
 *
 * 「合成参数不得改动」是本工具迁移的硬约束：任何一个数字变化都会改变音色。
 */

import { reactive, ref, watch } from 'vue'

/** 音色参数，取值范围与原界面一致 */
export interface SynthParams {
  /** 主音量 0..100 */
  master: number
  /** 延音，毫秒 40..1800 */
  release: number
  /** 亮度 0..100 */
  brightness: number
  /** 颤音 0..100 */
  vibrato: number
  /** 空间感 0..100 */
  space: number
}

/** 原界面各滑杆的初值 */
export const PARAM_DEFAULTS: SynthParams = {
  master: 70,
  release: 850,
  brightness: 55,
  vibrato: 12,
  space: 20,
}

export interface ParamSpec {
  key: keyof SynthParams
  min: number
  max: number
}

/** 原界面各滑杆的上下限，顺序即界面顺序 */
export const PARAM_SPECS: readonly ParamSpec[] = [
  { key: 'master', min: 0, max: 100 },
  { key: 'release', min: 40, max: 1800 },
  { key: 'brightness', min: 0, max: 100 },
  { key: 'vibrato', min: 0, max: 100 },
  { key: 'space', min: 0, max: 100 },
]

/** 首次启用 / 已启用后重新进入页面 / 浏览器不支持 WebAudio */
export type EnableResult = 'created' | 'resumed' | 'unsupported'

type AudioContextCtor = new () => AudioContext

export function useKalimbaSynth() {
  const params = reactive<SynthParams>({ ...PARAM_DEFAULTS })
  const enabled = ref(false)
  const supported = ref(true)

  let ctx: AudioContext | null = null
  let masterGain: GainNode | null = null
  let fxSend: GainNode | null = null
  let noiseBuffer: AudioBuffer | null = null

  /** 音频时间轴的当前时刻，供调度器计算未来的发音点 */
  function now(): number {
    return ctx ? ctx.currentTime : 0
  }

  /** 生成噪声缓冲，用作拨片起音的那一记短促「咔」 */
  function createNoiseBuffer(c: AudioContext, seconds: number): AudioBuffer {
    const sr = c.sampleRate
    const buffer = c.createBuffer(1, Math.floor(seconds * sr), sr)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    return buffer
  }

  /**
   * 建立音频图。首次调用创建上下文，之后只负责恢复被浏览器挂起的上下文
   */
  async function enable(): Promise<EnableResult> {
    if (ctx) {
      if (ctx.state === 'suspended') await ctx.resume()
      enabled.value = true
      return 'resumed'
    }

    const globalWithWebkit = window as unknown as { webkitAudioContext?: AudioContextCtor }
    const Ctor: AudioContextCtor | undefined = window.AudioContext ?? globalWithWebkit.webkitAudioContext
    if (!Ctor) {
      supported.value = false
      return 'unsupported'
    }

    ctx = new Ctor()

    // 干路
    masterGain = ctx.createGain()
    masterGain.gain.value = params.master / 100
    masterGain.connect(ctx.destination)

    // 湿路：简易 delay 作为空间感
    fxSend = ctx.createGain()
    const fxReturn = ctx.createGain()
    fxSend.gain.value = params.space / 100
    fxReturn.gain.value = 0.55

    const delay = ctx.createDelay(1.2)
    delay.delayTime.value = 0.22 // 拇指琴适合 200ms 左右的延迟
    const delayFb = ctx.createGain()
    delayFb.gain.value = 0.22

    const delayMix = ctx.createGain()
    delayMix.gain.value = 0.9

    fxSend.connect(delay)
    delay.connect(delayMix)
    delayMix.connect(fxReturn)
    fxReturn.connect(masterGain)

    delay.connect(delayFb)
    delayFb.connect(delay)

    noiseBuffer = createNoiseBuffer(ctx, 0.25)

    if (ctx.state === 'suspended') await ctx.resume()

    enabled.value = true
    return 'created'
  }

  /**
   * 拨一根音条
   *
   * @param freq 频率（Hz）
   * @param when 绝对发音时刻（AudioContext 时间轴），null 表示立即
   * @param vel 力度，0..1
   */
  function pluck(freq: number, when: number | null, vel: number): void {
    if (!ctx || !masterGain || !fxSend || !noiseBuffer) return

    const c = ctx
    const t = when ?? c.currentTime

    const releaseMs = params.release
    const release = Math.max(0.05, releaseMs / 1000) // 秒
    const brightness = params.brightness / 100 // 0..1
    const vib = params.vibrato / 100 // 0..1

    // 主振荡器
    const osc = c.createOscillator()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(freq, t)

    // 轻微 detune 的对偶振荡器，做出合唱般的厚度
    const osc2 = c.createOscillator()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(freq, t)
    osc2.detune.setValueAtTime(-6, t)

    // 低通：亮度
    const lp = c.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.setValueAtTime(1200 + brightness * 5200, t)
    lp.Q.setValueAtTime(0.8 + brightness * 1.2, t)

    // 音量包络：极快起音 + 指数衰减
    const gain = c.createGain()
    const peak = 0.55 * vel

    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.linearRampToValueAtTime(peak, t + 0.006)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + release)

    // 拨片起音：噪声脉冲
    const click = c.createBufferSource()
    click.buffer = noiseBuffer

    const clickHP = c.createBiquadFilter()
    clickHP.type = 'highpass'
    clickHP.frequency.value = 2000 + brightness * 4000

    const clickGain = c.createGain()
    clickGain.gain.setValueAtTime(0.0001, t)
    clickGain.gain.linearRampToValueAtTime(0.18 * vel, t + 0.002)
    clickGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.02)

    // 颤音：vibrato 为 0 时不建节点
    let lfo: OscillatorNode | null = null
    if (vib > 0.001) {
      lfo = c.createOscillator()
      lfo.type = 'sine'
      lfo.frequency.setValueAtTime(5.0 + vib * 4.0, t)

      const lfoGain = c.createGain()
      lfoGain.gain.setValueAtTime(0, t)
      // 颤音深度：0..12 音分
      lfoGain.gain.linearRampToValueAtTime(6 + vib * 10, t + 0.04)

      lfo.connect(lfoGain)
      lfoGain.connect(osc.detune)
      lfoGain.connect(osc2.detune)
    }

    const mix = c.createGain()
    mix.gain.value = 1.0

    osc.connect(lp)
    osc2.connect(lp)
    lp.connect(gain)
    gain.connect(mix)

    click.connect(clickHP)
    clickHP.connect(clickGain)
    clickGain.connect(mix)

    // 干湿分发
    mix.connect(masterGain)
    mix.connect(fxSend)

    osc.start(t)
    osc2.start(t)
    click.start(t)

    const stopAt = t + Math.max(0.06, release + 0.05)
    osc.stop(stopAt)
    osc2.stop(stopAt)
    click.stop(t + 0.03)

    if (lfo) {
      lfo.start(t)
      lfo.stop(stopAt)
    }
  }

  /**
   * 主音量与空间感是「实时」参数：原实现绑在 range 的 input 事件上，
   * 拖动过程中立即生效。延音 / 亮度 / 颤音只在下一个音生效，故不监听。
   */
  watch(() => params.master, (v) => {
    if (masterGain) masterGain.gain.value = v / 100
  })

  watch(() => params.space, (v) => {
    if (fxSend) fxSend.gain.value = v / 100
  })

  /**
   * 关闭并释放音频上下文
   *
   * 旧版是整页跳转，离开即静音；本工具在 SPA 内被卸载时若不主动关闭，
   * 循环播放会继续出声。关闭后再次进入工具需要重新点一次「启用音频」，
   * 这同时也符合浏览器的自动播放策略。
   */
  function dispose(): void {
    if (ctx && ctx.state !== 'closed') void ctx.close()
    ctx = null
    masterGain = null
    fxSend = null
    noiseBuffer = null
    enabled.value = false
  }

  return { params, enabled, supported, enable, pluck, now, dispose }
}
