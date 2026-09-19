/**
 * 曲谱解析与播放排程
 *
 * 从 public/playPiano/js/main.js 提取：_buildEventsFromSheet、
 * _adaptNotesForEnvelope、_scheduleEvents、_playSheetInternal 与 stopSheet。
 * 所有数值逐值照搬（速度系数 0.80、起播留白 0.12 秒、包络适配的三档
 * 补偿、声部次序 bass < harmony < melody），未做任何「优化」。
 *
 * 三处与旧实现的差异：
 * 1. 解析与发音分离：本文件只产出「事件」并把事件排进引擎，不认识 DOM，
 *    也无从知道界面如何渲染。
 * 2. overlay（叠加播放）分支未移植——旧界面从未调用过 playSheetOverlay，
 *    该分支在旧代码里是死代码。
 * 3. 事件解析时不再把事件摊平成数组再解构回原样（旧版 _scheduleEvents
 *    的第一步），直接读事件字段，结果相同。
 *
 * 另有一处旧实现的死代码未移植：_adaptNotesForEnvelope 里对休止符的
 * 压缩分支。它只在「整段 notes 一起适配」时才会命中，而播放路径
 * （_scheduleEvents）先跳过休止符再逐音适配，因此该分支永远走不到。
 */

import { ref, onScopeDispose } from 'vue'
import type { PianoEngine } from './usePiano'
import type { NoteSpec, RawSheet, RawTrack, ScoreEvent, Voice } from '../types'

/** 播放速度系数。0.80 即比原速慢 20% */
export const PLAY_SPEED = 0.80

/** 起播前的留白（秒），给上下文恢复与首个包络留出余量 */
export const SCHEDULE_LEAD = 0.12

/** 休止符的显示记号 */
export const REST_MARK = '·'

/** 同刻事件的声部次序，未列出的声部排在最后 */
const ROLE_PRIORITY: Record<string, number> = { bass: 0, harmony: 1, melody: 2 }

/** 缺省 BPM */
const DEFAULT_BPM = 120

/** 判定是否为休止符 */
export function isRest(note: NoteSpec | null | undefined): boolean {
  return note === 'R' || note === 'REST' || note === '-'
}

/** 判定是否为「渲染专用标签」（形如 [xxx]，不发声也不占时长） */
export function isLabel(note: NoteSpec | null | undefined): boolean {
  return typeof note === 'string' && note.startsWith('[') && note.endsWith(']')
}

/**
 * 事件的显示文本
 *
 * 和弦用 + 连接，休止符用中点。旧版 playSheet 的 onNote 回调即如此，
 * 与界面上的琴谱记号（见下）不是同一套写法。
 */
export function displayOf(note: NoteSpec | null | undefined): string {
  if (note === null || note === undefined) return ''
  if (isRest(note)) return REST_MARK
  if (Array.isArray(note)) return note.join('+')
  return note
}

/**
 * 短音补偿
 *
 * 新包络会提前收音，短音听起来比谱面更短，因此按三档放大时长。
 * 阈值与系数逐值照搬。
 */
export function adaptNoteDuration(ms: number): number {
  if (ms < 180) return Math.round(ms * 1.35)
  if (ms < 260) return Math.round(ms * 1.22)
  if (ms < 380) return Math.round(ms * 1.10)
  return ms
}

/**
 * 曲谱 → 事件序列
 *
 * 每条轨道各自从 0 开始累加时间，产出的事件都带「相对曲谱起点」的秒数，
 * 因此多轨天然并行。最后按时间排序，同一时刻按声部次序排列——
 * 低音先于和声先于旋律，听感更稳。
 */
export function buildEvents(sheet: RawSheet): ScoreEvent[] {
  const bpm = sheet.bpm || DEFAULT_BPM
  const beatMs = 60000 / bpm

  // 没有 tracks 时把单轨 notes 包成一条 melody 轨
  const tracks: RawTrack[] = sheet.tracks && sheet.tracks.length
    ? sheet.tracks
    : [{ role: 'melody', notes: (sheet.notes ?? []).map(([note, ms]) => ({ n: note, ms })) }]

  const events: ScoreEvent[] = []

  for (const track of tracks) {
    const role = track.role || 'track'
    let tMs = 0

    for (const item of track.notes ?? []) {
      // 两种输入：{ n, d | ms } 与旧格式 [note, ms]
      const record = item && typeof item === 'object' && !Array.isArray(item) ? item : null
      const n: NoteSpec | null = record ? record.n ?? null : null

      let durMs = 0
      if (record) {
        if (typeof record.ms === 'number') durMs = record.ms
        else durMs = (record.d || 0) * beatMs
      }

      if (!n && Array.isArray(item) && item.length >= 2) {
        events.push({ tSec: tMs / 1000, n: item[0], durMs: item[1], role })
        tMs += item[1]
        continue
      }

      events.push({ tSec: tMs / 1000, n, durMs, role })
      tMs += durMs
    }
  }

  events.sort((a, b) => {
    if (a.tSec !== b.tSec) return a.tSec - b.tSec
    return (ROLE_PRIORITY[a.role] ?? 9) - (ROLE_PRIORITY[b.role] ?? 9)
  })

  return events
}

/** 每个音播放时的回调：显示文本、时长（毫秒）、事件序号 */
export type SheetNoteHandler = (display: string, durationMs: number, index: number) => void

/**
 * 曲谱播放器
 *
 * 排程分两条线：声音走音频时钟（引擎），界面高亮走 setTimeout——
 * 与旧版一致，界面回调不做任何声音处理。
 */
export function useSheetPlayer(engine: PianoEngine) {
  const isPlaying = ref(false)

  /** 界面回调的定时器 */
  let timeouts: number[] = []

  /** 本次播放排出的全部发声单元 */
  const voices: Voice[] = []

  function clearTimers(): void {
    for (const id of timeouts) clearTimeout(id)
    timeouts = []
  }

  /** 停止：撤销未触发的界面回调，掐断已排程的声音，并松开所有按住的音 */
  function stop(): void {
    clearTimers()
    isPlaying.value = false
    engine.stopVoices(voices)
    engine.stopAllNotes()
  }

  /**
   * 播放整首曲谱
   *
   * @param events 由 buildEvents 解析出的事件序列
   * @returns 是否已开始播放（无事件或浏览器不支持 Web Audio 时为 false）
   */
  function play(events: ScoreEvent[], onNote?: SheetNoteHandler, onEnd?: () => void): boolean {
    if (!events.length) return false

    const ctx = engine.ensureAudio()
    if (!ctx) return false

    // 非叠加播放：先停掉上一首
    if (isPlaying.value) stop()

    isPlaying.value = true

    const scheduleUi = (fn: () => void, targetTime: number): void => {
      const delayMs = Math.max(0, (targetTime - engine.now) * 1000)
      timeouts.push(window.setTimeout(fn, delayMs))
    }

    const speed = PLAY_SPEED
    const baseStart = engine.now + SCHEDULE_LEAD

    for (let i = 0; i < events.length; i++) {
      const { n: raw, durMs, tSec } = events[i]
      const scaledMs = durMs / Math.max(0.001, speed)
      const noteStart = baseStart + tSec / Math.max(0.001, speed)

      // 界面：高亮当前音。声音被停掉后，排队中的回调不再生效
      if (onNote) {
        scheduleUi(() => {
          if (!isPlaying.value || !onNote) return
          onNote(displayOf(raw), Math.round(scaledMs), i)
        }, noteStart)
      }

      if (isRest(raw) || durMs <= 0) continue

      // 包络适配逐个事件做，时长的放大不影响起音时刻
      const adaptedSec = adaptNoteDuration(durMs) / Math.max(0.001, speed) / 1000
      if (Array.isArray(raw)) {
        engine.playChord(raw, adaptedSec, noteStart, voices)
      } else if (typeof raw === 'string') {
        engine.play(raw, adaptedSec, noteStart, voices)
      }
    }

    // 结束时刻以最后一个事件的收尾为准，再留一段同样的余量
    const endSec = events.reduce((max, ev) => Math.max(max, ev.tSec + ev.durMs / 1000), 0)
    const finishAt = baseStart + endSec / Math.max(0.001, speed) + SCHEDULE_LEAD

    scheduleUi(() => {
      isPlaying.value = false
      // 发声单元各自到点自清，这里只清空本轮登记表
      voices.length = 0
      onEnd?.()
    }, finishAt)

    return true
  }

  onScopeDispose(() => stop())

  return { isPlaying, play, stop }
}
