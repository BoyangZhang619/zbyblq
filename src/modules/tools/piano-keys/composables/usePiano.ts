/**
 * Web Audio 钢琴引擎
 *
 * 从 public/playPiano/js/main.js 的 SimplePiano 提取（docs/09-tool-page-spec.md
 * §2 所述 Stage 2）。所有合成参数逐值照搬：振荡器波形、低通滤波器、
 * 包络的四个时间点与两个电平、主增益、压缩器五个参数，均未调整。
 *
 * 与 DOM 完全解耦——本文件不引用任何元素、不监听任何事件。播放排程
 * 在 useSheetPlayer.ts，两者都不认识界面的存在。
 *
 * 三处与旧实现的差异，都属实现方式而非声音：
 * 1. 音频上下文改为惰性创建（首次发声时才建）。旧版在脚本解析时就
 *    new AudioContext()，浏览器会因此打印「尚未获得用户手势」的告警。
 * 2. 每次创建的发声节点与延时器都登记在册，dispose() 时统一清理并
 *    关闭上下文。旧的静态页靠离开页面来回收；本应用是单页，
 *    不关闭上下文会在切换工具时累积（浏览器对同时存在的上下文有上限）。
 * 3. 未找到音名时的告警保留，但不影响调用方继续处理其它音。
 */

import { ref, onScopeDispose } from 'vue'
import { DEFAULT_TONE, NOTE_FREQUENCIES } from '../data/notes'
import type { OscType, Voice } from '../types'

/* ============================================
   合成参数。全部逐值照搬旧版，勿改
   ============================================ */

/** 主增益 */
const MASTER_GAIN = 0.8

/** 压缩器 */
const COMPRESSOR_THRESHOLD = -18
const COMPRESSOR_KNEE = 18
const COMPRESSOR_RATIO = 4
const COMPRESSOR_ATTACK = 0.003
const COMPRESSOR_RELEASE = 0.12

/** 低通滤波器：截止频率与 Q 值 */
const FILTER_FREQ = 4200
const FILTER_Q = 0.6

/** 单音的包络电平 */
const NOTE_PEAK = 0.70
const NOTE_SUSTAIN = 0.18

/** 和弦每个音的包络电平，另乘音量系数 */
const CHORD_PEAK = 0.75
const CHORD_SUSTAIN = 0.20

/** 未指定时长时的默认延音（秒） */
const DEFAULT_SUSTAIN = 1.5

/** 起音、衰减、释放的时间点（秒） */
const ATTACK_TIME = 0.006
const DECAY_TIME = 0.045

/** 按下琴键时的包络 */
const HOLD_PEAK = 0.6
const HOLD_SUSTAIN = 0.5
const HOLD_ATTACK_TIME = 0.02
const HOLD_DECAY_TIME = 0.05
const HOLD_RELEASE_TIME = 0.3
const HOLD_RELEASE_LEVEL = 0.01

/** 校验 0.02 = gate 的下限，0.90 = gate 占时长的比例 */
const GATE_MIN = 0.02
const GATE_RATIO = 0.90
/** 释放段 = 时长的 25%，夹在 0.03–0.12 秒之间 */
const RELEASE_RATIO = 0.25
const RELEASE_MIN = 0.03
const RELEASE_MAX = 0.12

/** 指数包络的起止电平 */
const SILENT = 0.0001

/** 松键后等待多久再断开节点（毫秒） */
const HOLD_CLEANUP_DELAY = 350

/* ============================================ */

export class PianoEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private tone: OscType = DEFAULT_TONE

  /** 正在按住的音，key 为音名 */
  private held = new Map<string, { osc: OscillatorNode; gain: GainNode }>()

  /** 待执行的延时器，dispose 时统一清除 */
  private timers = new Set<number>()

  private disposed = false

  /** 浏览器是否具备 Web Audio。构造时即确定，不会变化 */
  readonly supported: boolean = typeof AudioContext !== 'undefined'

  /**
   * 切换音色
   *
   * 只影响之后创建的振荡器。正在按住的音保持原音色——旧版如此。
   */
  setTone(tone: OscType): void {
    this.tone = tone
  }

  /** 音频上下文当前时刻。未创建时为 0 */
  get now(): number {
    return this.ctx ? this.ctx.currentTime : 0
  }

  /**
   * 确保上下文可用
   *
   * 创建时一并接好主增益与压缩器链路：master -> compressor -> destination。
   * 挂起状态（浏览器要求在用户手势后才出声）就地尝试恢复，失败也不阻断
   * 后续调用——下次手势时还会再试。
   */
  ensureAudio(): AudioContext | null {
    if (this.disposed || !this.supported) return null

    if (!this.ctx) {
      const ctx = new AudioContext()
      const master = ctx.createGain()
      master.gain.value = MASTER_GAIN

      const compressor = ctx.createDynamicsCompressor()
      compressor.threshold.value = COMPRESSOR_THRESHOLD
      compressor.knee.value = COMPRESSOR_KNEE
      compressor.ratio.value = COMPRESSOR_RATIO
      compressor.attack.value = COMPRESSOR_ATTACK
      compressor.release.value = COMPRESSOR_RELEASE

      master.connect(compressor)
      compressor.connect(ctx.destination)

      this.ctx = ctx
      this.master = master
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {
        /* 未获得手势许可时保持挂起，下次交互再试 */
      })
    }

    return this.ctx
  }

  /* ============================================
     按住不放
     ============================================ */

  /**
   * 按下琴键：持续发声，直到 stopNote
   *
   * 重复按下同一个音会先停掉上一个，避免叠加。
   */
  startNote(note: string): void {
    if (this.held.has(note)) this.stopNote(note)

    const freq = NOTE_FREQUENCIES[note]
    if (!freq) {
      console.warn(`[Piano] Note not found: ${note}`)
      return
    }

    const ctx = this.ensureAudio()
    if (!ctx) return

    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = this.tone
    osc.frequency.value = freq

    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(HOLD_PEAK, t + HOLD_ATTACK_TIME)
    gain.gain.setValueAtTime(HOLD_SUSTAIN, t + HOLD_DECAY_TIME)

    osc.connect(gain)
    gain.connect(this.master ?? ctx.destination)

    osc.start(t)
    this.held.set(note, { osc, gain })
  }

  /** 松开琴键：0.3 秒指数衰减后停止 */
  stopNote(note: string): void {
    const voice = this.held.get(note)
    if (!voice || !this.ctx) return

    const { osc, gain } = voice
    const t = this.ctx.currentTime

    gain.gain.cancelScheduledValues(t)
    gain.gain.setValueAtTime(gain.gain.value, t)
    gain.gain.exponentialRampToValueAtTime(HOLD_RELEASE_LEVEL, t + HOLD_RELEASE_TIME)
    osc.stop(t + HOLD_RELEASE_TIME)

    this.after(HOLD_CLEANUP_DELAY, () => {
      disconnect(osc, gain)
    })

    this.held.delete(note)
  }

  /** 停止全部按住的音 */
  stopAllNotes(): void {
    for (const note of [...this.held.keys()]) this.stopNote(note)
  }

  /* ============================================
     按谱面排程：给定起点与时长，到点自动收尾
     ============================================ */

  /**
   * 排一个单音
   *
   * @param durationSec 时长（秒）。缺省时用默认延音
   * @param startTime   音频上下文时间轴上的起点。缺省为「现在」
   * @param trackList   登记到该数组，便于整批停止
   */
  play(note: string, durationSec?: number, startTime?: number, trackList?: Voice[]): void {
    const freq = NOTE_FREQUENCIES[note]
    if (!freq) {
      console.warn(`[Piano] Note not found: ${note}`)
      return
    }

    const ctx = this.ensureAudio()
    if (!ctx) return

    this.schedule(ctx, freq, durationSec, startTime, trackList, NOTE_PEAK, NOTE_SUSTAIN)
  }

  /**
   * 排一个和弦：同一时刻起若干个音，各自降一点音量
   *
   * 音量系数 1/sqrt(n)，避免音数越多越吵。休止符直接跳过。
   */
  playChord(notes: string[], durationSec?: number, startTime?: number, trackList?: Voice[]): void {
    const ctx = this.ensureAudio()
    if (!ctx) return

    const volumeScale = Math.min(1, 1 / Math.sqrt(notes.length))
    const start = startTime ?? ctx.currentTime + 0.01

    for (const note of notes) {
      if (note === 'R' || note === 'REST' || note === '-') continue

      const freq = NOTE_FREQUENCIES[note]
      if (!freq) {
        console.warn(`[Piano] Note not found: ${note}`)
        continue
      }

      this.schedule(
        ctx,
        freq,
        durationSec,
        start,
        trackList,
        CHORD_PEAK * volumeScale,
        CHORD_SUSTAIN * volumeScale,
      )
    }
  }

  /**
   * 停掉一批已排程的发声单元
   *
   * 先取消包络、再停振荡器、最后断开。任何一步失败都不影响其余节点。
   */
  stopVoices(list: Voice[]): void {
    const ctx = this.ctx
    if (!ctx) return

    const now = ctx.currentTime
    for (const { osc, gain, startTime } of list) {
      try {
        gain.gain.cancelScheduledValues(now)
        gain.gain.setValueAtTime(0, now)
      } catch {
        /* 节点可能已被回收 */
      }
      try {
        osc.stop(Math.max(now, startTime + 0.001))
      } catch {
        /* 同上 */
      }
      disconnect(osc, gain)
    }

    list.length = 0
  }

  /** 关闭上下文并清理全部待执行的延时器。组件卸载时调用 */
  dispose(): void {
    this.disposed = true
    this.stopAllNotes()

    for (const id of this.timers) clearTimeout(id)
    this.timers.clear()

    const ctx = this.ctx
    this.ctx = null
    this.master = null
    this.held.clear()

    if (ctx) {
      ctx.close().catch(() => {
        /* 已关闭或已被浏览器回收 */
      })
    }
  }

  /* ============================================ */

  /**
   * 报时器：登记之后统一清理，避免卸载后仍有回调打到已销毁的节点上
   */
  private after(ms: number, fn: () => void): void {
    const id = window.setTimeout(() => {
      this.timers.delete(id)
      fn()
    }, ms)
    this.timers.add(id)
  }

  /**
   * 排一个音：振荡器 -> 低通 -> 包络 -> 总线
   *
   * 包络形状固定为「极短的线性起音 -> 指数衰减到保持电平 -> 保持到 gate
   * -> 指数释放到静音」，其中 gate 与 release 由时长推出。
   */
  private schedule(
    ctx: AudioContext,
    freq: number,
    durationSec: number | undefined,
    startTime: number | undefined,
    trackList: Voice[] | undefined,
    peak: number,
    sustain: number,
  ): void {
    const start = Math.max(startTime ?? ctx.currentTime, ctx.currentTime)
    const slot = durationSec || DEFAULT_SUSTAIN

    const gate = Math.max(GATE_MIN, slot * GATE_RATIO)
    const release = Math.min(RELEASE_MAX, Math.max(RELEASE_MIN, slot * RELEASE_RATIO))
    const stopAt = start + gate + release

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()

    osc.type = this.tone
    osc.frequency.setValueAtTime(freq, start)

    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(FILTER_FREQ, start)
    filter.Q.setValueAtTime(FILTER_Q, start)

    // 指数包络不能取 0，和弦降音量后仍须留一个极小的正数
    const level = Math.max(SILENT, sustain)

    gain.gain.cancelScheduledValues(start)
    gain.gain.setValueAtTime(SILENT, start)
    gain.gain.linearRampToValueAtTime(peak, start + ATTACK_TIME)
    gain.gain.exponentialRampToValueAtTime(level, start + DECAY_TIME)
    gain.gain.setValueAtTime(level, start + gate)
    gain.gain.exponentialRampToValueAtTime(SILENT, stopAt)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.master ?? ctx.destination)

    osc.start(start)
    osc.stop(stopAt + 0.005)

    const voice: Voice = { osc, gain, startTime: start, stopTime: stopAt }
    if (trackList) trackList.push(voice)

    // 收尾时间由音频时钟推出，与界面上的走时无关
    const cleanupDelay = Math.max(0, (stopAt - ctx.currentTime) * 1000 + 200)
    this.after(cleanupDelay, () => {
      disconnect(osc, filter, gain)
      if (trackList) {
        const idx = trackList.indexOf(voice)
        if (idx !== -1) trackList.splice(idx, 1)
      }
    })
  }
}

/** 断开一组节点。节点可能已断开或已被回收，失败即忽略 */
function disconnect(...nodes: AudioNode[]): void {
  for (const node of nodes) {
    try {
      node.disconnect()
    } catch {
      /* 已断开 */
    }
  }
}

/* ============================================
   组合式接口
   ============================================ */

export function usePiano() {
  const engine = new PianoEngine()
  const tone = ref<OscType>(DEFAULT_TONE)

  /** 切换音色：写进引擎，正在按住的音不受影响 */
  function setTone(next: OscType): void {
    tone.value = next
    engine.setTone(next)
  }

  engine.setTone(tone.value)

  // 组件卸载即释放音频上下文，单页应用内不会累积
  onScopeDispose(() => engine.dispose())

  return { engine, tone, setTone }
}
