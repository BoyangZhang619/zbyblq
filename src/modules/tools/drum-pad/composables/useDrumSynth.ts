/**
 * 鼓机合成引擎
 *
 * 从 public/drum/js/main.js 提取，与 DOM 完全解耦：不读取任何输入元素，
 * 参数由调用方传入；不触碰界面，只产出声音。这是 docs/09-tool-page-spec.md
 * §9 所述 Stage 2 的产物。
 *
 * **所有合成参数逐值照搬原实现**——振荡器波形、频率斜率、包络时间、
 * 滤波器截止与 Q 值、增益倍数、延迟链比例，一个都没有「顺手优化」。
 * 音色差一点就变了。
 *
 * 与旧实现的行为差异只有一处，且不涉及音色：旧版即使合成参数写错也不会
 * 报错，本实现同样不做校验（Number(input.value) 的结果直接使用）。
 */

import type { PadId } from './usePattern'

/**
 * 合成参数。对应控制台上的三个音色滑杆，在**触发时**读取，
 * 因此拖动滑杆会立刻影响下一声，与旧实现一致
 */
export interface SynthParams {
  /** Kick 基频，滑杆范围 30..90 */
  kickTone: number
  /** Snare 噪声占比，滑杆范围 0..100 */
  snareNoise: number
  /** Hat 亮度，滑杆范围 0..100 */
  hatBright: number
}

/** 与旧版 index.html 的 value 属性一致 */
export const SYNTH_PARAM_DEFAULTS: SynthParams = {
  kickTone: 55,
  snareNoise: 70,
  hatBright: 75,
}

/** 主音量与空间感的初始比例，对应滑杆默认值 70 与 18 */
export const MASTER_DEFAULT_RATIO = 0.7
export const FX_SEND_DEFAULT_RATIO = 0.18

/* ============================================
   固定参数
   ============================================ */

/** 反馈延迟链。旧版注释称「reverb-ish」，实际是带回授的延迟 */
const DELAY_MAX_SECONDS = 1.0
const DELAY_TIME = 0.17
const DELAY_FEEDBACK = 0.25
const DELAY_MIX = 0.85
const FX_RETURN_GAIN = 0.6

/** 噪声缓冲区长度（秒），白噪声，所有噪声类音色共用 */
const NOISE_SECONDS = 1.0

/** Kick 的软削波曲线强度 */
const KICK_DRIVE = 220

export type HatType = 'closed' | 'open' | 'closed2'

/* ============================================
   纯函数部件
   ============================================ */

/**
 * 软削波曲线
 *
 * 逐值照搬旧实现：44100 点，公式与 k 的取值均未改动。
 * 参数已类型化，故省去旧版 `typeof amount === 'number' ? amount : 200`
 * 的兜底（其结果恒等于 amount）。
 *
 * 返回类型不显式标注：由 new Float32Array(n) 推导，才能与
 * WaveShaperNode.curve 的 Float32Array<ArrayBuffer> 精确对上。
 */
export function createDriveCurve(amount = 200) {
  const n = 44100
  const curve = new Float32Array(n)
  const k = amount
  const deg = Math.PI / 180
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x))
  }
  return curve
}

/** 白噪声缓冲区。逐值照搬：单声道，Math.random() * 2 - 1 */
export function createNoiseBuffer(ctx: BaseAudioContext, seconds: number): AudioBuffer {
  const sampleRate = ctx.sampleRate
  const buffer = ctx.createBuffer(1, seconds * sampleRate, sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return buffer
}

/** AudioContext 构造器的类型。lib.dom 把它声明为全局变量而非 window 属性 */
type AudioContextCtor = typeof AudioContext

/**
 * 解析 AudioContext 构造器
 *
 * 保留旧版对 webkit 前缀的兜底——虽然现代浏览器都已支持无前缀形式，
 * 但这是旧实现的一部分，且成本为零。
 */
function resolveAudioContextCtor(): AudioContextCtor | undefined {
  const standard: AudioContextCtor | undefined = AudioContext
  const legacy = (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext
  return standard ?? legacy
}

/* ============================================
   引擎
   ============================================ */

export interface DrumSynth {
  /** 音频图是否已建立 */
  isReady(): boolean
  /** 当前时钟（秒）。未启用时为 0 */
  now(): number
  /** 建立音频图并解锁。由用户手势调用，重复调用只做 resume */
  enable(masterRatio: number, fxRatio: number, params: SynthParams): Promise<void>
  /** 同步音色参数 */
  setParams(params: SynthParams): void
  /** 主音量，0..1 */
  setMasterRatio(ratio: number): void
  /** 空间感送出量，0..1 */
  setFxSendRatio(ratio: number): void
  /** 触发一次鼓声。省略 time 时取当前时钟 */
  trigger(id: PadId, time?: number): void
}

export function createDrumSynth(): DrumSynth {
  let ctx: AudioContext | null = null
  let masterGain: GainNode | null = null
  let fxSend: GainNode | null = null
  let noiseBuffer: AudioBuffer | null = null
  let params: SynthParams = { ...SYNTH_PARAM_DEFAULTS }

  /** 建立音频图。节点与连接顺序逐条照搬旧版的 enableAudio() */
  function build(masterRatio: number, fxRatio: number): AudioContext {
    const Ctor = resolveAudioContextCtor()
    if (!Ctor) throw new Error('WebAudio is not available')

    const audio = new Ctor()
    ctx = audio

    // 主输出
    const master = audio.createGain()
    master.gain.value = masterRatio
    master.connect(audio.destination)
    masterGain = master

    // 送出 / 返回。旧版注释为「simple delay reverb-ish」
    const send = audio.createGain()
    const ret = audio.createGain()
    send.gain.value = fxRatio
    ret.gain.value = FX_RETURN_GAIN
    fxSend = send

    // 延迟与反馈
    const delay = audio.createDelay(DELAY_MAX_SECONDS)
    delay.delayTime.value = DELAY_TIME
    const feedback = audio.createGain()
    feedback.gain.value = DELAY_FEEDBACK

    // 湿声比例。旧版名为 delayMix，取 0.85
    const mix = audio.createGain()
    mix.gain.value = DELAY_MIX

    // 链路：send -> delay -> mix -> return -> master
    send.connect(delay)
    delay.connect(mix)
    mix.connect(ret)
    ret.connect(master)

    // 反馈环：delay -> feedback -> delay
    delay.connect(feedback)
    feedback.connect(delay)

    noiseBuffer = createNoiseBuffer(audio, NOISE_SECONDS)

    return audio
  }

  async function enable(
    masterRatio: number,
    fxRatio: number,
    next: SynthParams,
  ): Promise<void> {
    params = { ...next }

    if (ctx) {
      // 已建立：只做解锁，与旧版第二次点击的行为一致
      if (ctx.state === 'suspended') await ctx.resume()
      return
    }

    const audio = build(masterRatio, fxRatio)
    if (audio.state === 'suspended') await audio.resume()
  }

  function trigger(id: PadId, time?: number): void {
    if (!ctx) return
    const t = time ?? ctx.currentTime

    switch (id) {
      case 'kick': return playKick(t, 1.0)
      case 'kick2': return playKick(t, 0.7)
      case 'snare': return playSnare(t, 1.0)
      case 'snare2': return playSnare(t, 0.75)
      case 'hatc': return playHat(t, 'closed')
      case 'hato': return playHat(t, 'open')
      case 'hat2': return playHat(t, 'closed2')
      case 'clap': return playClap(t)
      case 'tom': return playTom(t)
      case 'perc': return playPerc(t)
      case 'ride': return playRide(t)
      case 'fx': return playFX(t)
      default:
        // Ghost 鼓垫不发声，只有界面反馈
        return
    }
  }

  /* ==========================================
     音色。以下方法的每个数值都来自旧实现
     ========================================== */

  function playKick(t: number, level: number): void {
    if (!ctx || !masterGain || !fxSend) return
    const audio = ctx
    const tone = params.kickTone

    const osc = audio.createOscillator()
    osc.type = 'sine'

    const gain = audio.createGain()
    const drive = audio.createWaveShaper()

    drive.curve = createDriveCurve(KICK_DRIVE)
    drive.oversample = '2x'

    // 音高下扫：3.2 倍频 -> 基频 -> 0.62 倍频
    osc.frequency.setValueAtTime(tone * 3.2, t)
    osc.frequency.exponentialRampToValueAtTime(tone, t + 0.06)
    osc.frequency.exponentialRampToValueAtTime(tone * 0.62, t + 0.16)

    // 幅度包络
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.linearRampToValueAtTime(0.95 * level, t + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22)

    osc.connect(drive)
    drive.connect(gain)

    // 干声 + 空间送出
    gain.connect(masterGain)
    gain.connect(fxSend)

    osc.start(t)
    osc.stop(t + 0.25)
  }

  function playSnare(t: number, level: number): void {
    if (!ctx || !masterGain || !fxSend || !noiseBuffer) return
    const audio = ctx
    const noiseAmt = params.snareNoise / 100

    // 噪声成分
    const noise = audio.createBufferSource()
    noise.buffer = noiseBuffer

    const nFilter = audio.createBiquadFilter()
    nFilter.type = 'highpass'
    nFilter.frequency.value = 1800

    const nGain = audio.createGain()
    nGain.gain.setValueAtTime(0.0001, t)
    nGain.gain.linearRampToValueAtTime(0.85 * noiseAmt * level, t + 0.002)
    nGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14)

    noise.connect(nFilter)
    nFilter.connect(nGain)

    // 音高成分
    const osc = audio.createOscillator()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(190, t)

    const oGain = audio.createGain()
    oGain.gain.setValueAtTime(0.0001, t)
    oGain.gain.linearRampToValueAtTime(0.35 * (1 - noiseAmt * 0.5) * level, t + 0.003)
    oGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.11)

    osc.connect(oGain)

    // 混合
    const mix = audio.createGain()
    nGain.connect(mix)
    oGain.connect(mix)

    mix.connect(masterGain)
    mix.connect(fxSend)

    noise.start(t)
    noise.stop(t + 0.16)

    osc.start(t)
    osc.stop(t + 0.14)
  }

  function playHat(t: number, type: HatType): void {
    if (!ctx || !masterGain || !fxSend || !noiseBuffer) return
    const audio = ctx
    const bright = params.hatBright / 100
    const dur = type === 'open' ? 0.30 : type === 'closed2' ? 0.09 : 0.06

    const noise = audio.createBufferSource()
    noise.buffer = noiseBuffer

    const hp = audio.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 6500 + bright * 3500

    const bp = audio.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 9000 + bright * 2500
    bp.Q.value = 2.5

    const gain = audio.createGain()
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.linearRampToValueAtTime(0.45, t + 0.002)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)

    noise.connect(hp)
    hp.connect(bp)
    bp.connect(gain)

    gain.connect(masterGain)
    gain.connect(fxSend)

    noise.start(t)
    noise.stop(t + dur + 0.01)
  }

  function playClap(t: number): void {
    if (!ctx || !masterGain || !fxSend || !noiseBuffer) return
    const audio = ctx

    // 三次短噪声爆发，模拟拍手的多人叠加
    const burstTimes = [0.0, 0.015, 0.03]
    const out = audio.createGain()

    burstTimes.forEach(dt => {
      const noise = audio.createBufferSource()
      noise.buffer = noiseBuffer

      const bp = audio.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = 2200
      bp.Q.value = 0.8

      const g = audio.createGain()
      g.gain.setValueAtTime(0.0001, t + dt)
      g.gain.linearRampToValueAtTime(0.7, t + dt + 0.002)
      g.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.06)

      noise.connect(bp)
      bp.connect(g)
      g.connect(out)

      noise.start(t + dt)
      noise.stop(t + dt + 0.08)
    })

    out.connect(masterGain)
    out.connect(fxSend)
  }

  function playTom(t: number): void {
    if (!ctx || !masterGain || !fxSend) return
    const audio = ctx

    const osc = audio.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(180, t)
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.16)

    const gain = audio.createGain()
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.linearRampToValueAtTime(0.55, t + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.20)

    osc.connect(gain)
    gain.connect(masterGain)
    gain.connect(fxSend)

    osc.start(t)
    osc.stop(t + 0.22)
  }

  function playPerc(t: number): void {
    if (!ctx || !masterGain || !fxSend) return
    const audio = ctx

    const osc = audio.createOscillator()
    osc.type = 'square'
    osc.frequency.setValueAtTime(520, t)

    const filt = audio.createBiquadFilter()
    filt.type = 'lowpass'
    filt.frequency.value = 1200

    const gain = audio.createGain()
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.linearRampToValueAtTime(0.25, t + 0.003)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08)

    osc.connect(filt)
    filt.connect(gain)

    gain.connect(masterGain)
    gain.connect(fxSend)

    osc.start(t)
    osc.stop(t + 0.10)
  }

  function playRide(t: number): void {
    if (!ctx || !masterGain || !fxSend || !noiseBuffer) return
    const audio = ctx

    // 金属感：噪声过谐振带通
    const noise = audio.createBufferSource()
    noise.buffer = noiseBuffer

    const bp = audio.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 7200
    bp.Q.value = 6

    const gain = audio.createGain()
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.linearRampToValueAtTime(0.35, t + 0.002)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35)

    noise.connect(bp)
    bp.connect(gain)

    gain.connect(masterGain)
    gain.connect(fxSend)

    noise.start(t)
    noise.stop(t + 0.4)
  }

  function playFX(t: number): void {
    if (!ctx || !masterGain || !fxSend) return
    const audio = ctx

    // 扫频音效
    const osc = audio.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(180, t)
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.18)

    const filt = audio.createBiquadFilter()
    filt.type = 'lowpass'
    filt.frequency.setValueAtTime(400, t)
    filt.frequency.exponentialRampToValueAtTime(3800, t + 0.18)

    const gain = audio.createGain()
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.linearRampToValueAtTime(0.35, t + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22)

    osc.connect(filt)
    filt.connect(gain)

    gain.connect(masterGain)
    gain.connect(fxSend)

    osc.start(t)
    osc.stop(t + 0.25)
  }

  /* ==========================================
     参数
     ========================================== */

  return {
    isReady: () => ctx !== null,
    now: () => ctx?.currentTime ?? 0,

    enable,

    setParams(next: SynthParams): void {
      params = { ...next }
    },

    setMasterRatio(ratio: number): void {
      if (masterGain) masterGain.gain.value = ratio
    },

    setFxSendRatio(ratio: number): void {
      if (fxSend) fxSend.gain.value = ratio
    },

    trigger,
  }
}
