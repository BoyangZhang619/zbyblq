/**
 * 拇指琴的演奏状态机
 *
 * 由 `public/kalimba/js/main.js` 的 playKey / toggleRec / togglePlay /
 * playRandomMelody / flashKey 等提取而来（Stage 2）。这里不出现任何 DOM：
 * 琴键是数据，按下是函数调用，发声交给 `useKalimbaSynth`。
 *
 * 与原实现的差异只有两处，都会一并写入交付报告：
 * 1. 键盘监听由视图在挂载期绑定、卸载期解绑（原实现是整页生命周期）
 * 2. 新增 dispose()：SPA 内卸载时关闭音频上下文，否则循环播放会继续出声
 */

import { computed, reactive, ref } from 'vue'
import {
  BASE_NOTES,
  KEY_LABELS,
  indexForKeyCode,
  loopLengthMs,
  makeRandomMelody,
  makeTineFactors,
  noteToFreq,
  parseNote,
  scaleNote,
  type MelodyEvent,
  type ScaleId,
} from '../utils/music'
import { useKalimbaSynth } from './useKalimbaSynth'
import type { KalimbaKey } from '../locales'

/** 琴键点亮时长（毫秒），原实现为 90 */
const FLASH_MS = 90

/**
 * 状态行
 *
 * 存的是**文案键**而不是成品文字：逻辑层不产出界面文案，
 * 由视图用 tt() 翻译，语言切换才会自动生效。
 */
export interface KalimbaStatus {
  key: KalimbaKey
  params?: Record<string, string | number>
}

/** 一根音条在界面上需要的数据 */
export interface Tine {
  index: number
  /** 基础音名，如 C4 */
  note: string
  /** 音名的字母部分 */
  letter: string
  /** 音名的八度部分 */
  octave: string
  /** 键帽文字，如 1 / Q */
  key: string
  /** 高度系数 0..1 的字符串形式，直接喂给 CSS 的 calc() */
  factor: string
}

export function useKalimba() {
  const synth = useKalimbaSynth()
  const { params, enabled, supported } = synth

  const scale = ref<ScaleId>('c_major')
  const status = ref<KalimbaStatus>({ key: 'statusIdle' })
  const isRecording = ref(false)
  const isPlaying = ref(false)
  /** 正在点亮的琴键，仅用于视觉反馈 */
  const activeKeys = reactive(new Set<number>())

  /**
   * 录音事件。刻意不做成响应式——界面只需要它的长度，
   * 而播放循环每轮都会遍历它，响应式代理在这里没有收益。
   */
  let record: MelodyEvent[] = []
  let recStartMs = 0
  let playTimer: ReturnType<typeof setTimeout> | null = null

  const tines = computed<Tine[]>(() => {
    const factors = makeTineFactors(BASE_NOTES.length)
    return BASE_NOTES.map((note, index) => {
      const parsed = parseNote(note)
      return {
        index,
        note,
        letter: parsed.letter,
        octave: parsed.octave,
        key: KEY_LABELS[index],
        // 保留 4 位小数即可，避免浮点尾巴进到内联样式里
        factor: factors[index].toFixed(4),
      }
    })
  })

  function setStatus(key: KalimbaKey, values?: Record<string, string | number>): void {
    status.value = { key, params: values }
  }

  /** 点亮一根音条，90ms 后自动熄灭 */
  function flashKey(index: number): void {
    activeKeys.add(index)
    setTimeout(() => activeKeys.delete(index), FLASH_MS)
  }

  /* ============================================
     演奏
     ============================================ */

  /**
   * 发声。index 为键序号，when 为绝对时刻（null 表示立即）
   *
   * 录制中的每一次发声都会记入录音——包括回放时的自动重放，
   * 这是原实现的行为，保留。
   */
  function playKey(index: number, vel = 1.0, when: number | null = null): void {
    if (!enabled.value) {
      setStatus('statusNeedAudio')
      return
    }

    flashKey(index)

    const freq = noteToFreq(scaleNote(BASE_NOTES[index], scale.value))

    if (isRecording.value) {
      const nowMs = performance.now()
      if (!recStartMs) recStartMs = nowMs
      record.push({ tMs: nowMs - recStartMs, index, vel })
    }

    synth.pluck(freq, when, vel)
  }

  /**
   * 处理一个键盘码，返回是否已由本工具消费
   *
   * 消费即表示调用方应当阻止默认行为。Space 无论是否已启用音频都要吞掉，
   * 否则会滚动页面——原实现如此。
   */
  function pressCode(code: string): boolean {
    if (code === 'Space') {
      if (enabled.value) togglePlay()
      return true
    }

    const index = indexForKeyCode(code)
    if (index < 0) return false

    playKey(index, 1.0)
    return true
  }

  /* ============================================
     录音与回放
     ============================================ */

  function toggleRec(): void {
    if (!enabled.value) return

    isRecording.value = !isRecording.value

    if (isRecording.value) {
      record = []
      recStartMs = performance.now()
      setStatus('statusRecording')
      return
    }

    if (record.length) setStatus('statusRecorded', { count: record.length })
    else setStatus('statusRecordedEmpty')
  }

  function clearRecord(): void {
    record = []
    isPlaying.value = false
    stopTimer()
    setStatus('statusCleared')
  }

  function togglePlay(): void {
    if (!enabled.value) return

    if (!record.length) {
      setStatus('statusNoRecording')
      return
    }

    if (isPlaying.value) stopPlay()
    else startPlay()
  }

  function startPlay(): void {
    isPlaying.value = true
    setStatus('statusPlaying')

    const loopLenMs = loopLengthMs(record)

    const schedule = (): void => {
      if (!isPlaying.value) return

      const base = synth.now() + 0.02
      for (const evt of record) {
        playKey(evt.index, evt.vel, base + evt.tMs / 1000)
      }

      playTimer = setTimeout(schedule, loopLenMs)
    }

    schedule()
  }

  function stopPlay(): void {
    isPlaying.value = false
    stopTimer()
    setStatus('statusPaused')
  }

  function stopTimer(): void {
    if (playTimer) clearTimeout(playTimer)
    playTimer = null
  }

  /** 生成一段随机小旋律并立即循环播放 */
  function playRandomMelody(): void {
    if (!enabled.value) return

    record = makeRandomMelody()
    recStartMs = performance.now()

    setStatus('statusRandomReady', { count: record.length })
    startPlay()
  }

  /* ============================================
     音频与调式
     ============================================ */

  async function enableAudio(): Promise<void> {
    const result = await synth.enable()

    if (result === 'unsupported') {
      setStatus('statusUnsupported')
      return
    }
    setStatus(result === 'created' ? 'statusReady' : 'statusEnabled')
  }

  /** 换调式只影响后续的发声，已经在响的音不受影响 */
  function changeScale(): void {
    setStatus('statusScaleChanged')
  }

  /** 组件卸载时调用：停掉循环并释放音频上下文 */
  function dispose(): void {
    stopTimer()
    isPlaying.value = false
    isRecording.value = false
    synth.dispose()
  }

  return {
    params,
    enabled,
    supported,
    scale,
    status,
    isRecording,
    isPlaying,
    activeKeys,
    tines,
    playKey,
    pressCode,
    toggleRec,
    togglePlay,
    clearRecord,
    playRandomMelody,
    enableAudio,
    changeScale,
    dispose,
  }
}
