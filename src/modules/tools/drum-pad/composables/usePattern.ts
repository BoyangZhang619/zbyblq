/**
 * 鼓垫与 Pattern 数据
 *
 * 从 public/drum/js/main.js 提取：鼓垫表、音序器行表、图案的增删改。
 * 全部与 DOM 解耦——输入输出都是数据，可独立测试。
 *
 * 表内容逐条照搬旧实现：16 个鼓垫（含 4 个不发声的 Ghost）、
 * 4 条音序器行、每小节 16 步。鼓垫的按键布局刻意保持 4 列，
 * 与键盘上的 QWER / ASDF / ZXCV / 1234 四排一一对应。
 */

import type { DrumMessageKey } from '../locales'

/** 一小节的步数。旧版固定 16 步（4/4 拍，十六分音符） */
export const STEPS = 16

/** 步进下标。表格里要按下标遍历，模板内直接用它 */
export const STEP_INDEXES: readonly number[] = Array.from({ length: STEPS }, (_, i) => i)

/**
 * 鼓垫
 *
 * id 同时是合成器的音色标识（见 useDrumSynth 的 trigger）。
 * key 是显示用的按键名，code 是 KeyboardEvent.code——
 * 用 code 而非 key，避免中文输入法或大小写影响判定。
 */
export type PadId =
  | 'kick' | 'snare' | 'hatc' | 'hato'
  | 'clap' | 'tom' | 'perc' | 'ride'
  | 'kick2' | 'snare2' | 'hat2' | 'fx'
  | 'mute1' | 'mute2' | 'mute3' | 'mute4'

export interface PadDef {
  id: PadId
  /** 鼓垫名。走 i18n，中英一致 */
  label: DrumMessageKey
  key: string
  code: string
}

export const PADS: readonly PadDef[] = [
  { id: 'kick', label: 'pad.kick', key: 'Q', code: 'KeyQ' },
  { id: 'snare', label: 'pad.snare', key: 'W', code: 'KeyW' },
  { id: 'hatc', label: 'pad.hatc', key: 'E', code: 'KeyE' },
  { id: 'hato', label: 'pad.hato', key: 'R', code: 'KeyR' },

  { id: 'clap', label: 'pad.clap', key: 'A', code: 'KeyA' },
  { id: 'tom', label: 'pad.tom', key: 'S', code: 'KeyS' },
  { id: 'perc', label: 'pad.perc', key: 'D', code: 'KeyD' },
  { id: 'ride', label: 'pad.ride', key: 'F', code: 'KeyF' },

  { id: 'kick2', label: 'pad.kick2', key: 'Z', code: 'KeyZ' },
  { id: 'snare2', label: 'pad.snare2', key: 'X', code: 'KeyX' },
  { id: 'hat2', label: 'pad.hat2', key: 'C', code: 'KeyC' },
  { id: 'fx', label: 'pad.fx', key: 'V', code: 'KeyV' },

  { id: 'mute1', label: 'pad.mute1', key: '1', code: 'Digit1' },
  { id: 'mute2', label: 'pad.mute2', key: '2', code: 'Digit2' },
  { id: 'mute3', label: 'pad.mute3', key: '3', code: 'Digit3' },
  { id: 'mute4', label: 'pad.mute4', key: '4', code: 'Digit4' },
]

/**
 * 音序器的行
 *
 * 只编排 4 件鼓——旧版刻意从 16 个鼓垫里收窄到 4 行，
 * 让打点保持简单。pad 是该行播放时实际触发的鼓垫，
 * 注意 Hat 行触发的是闭镲 hatc。
 */
export type TrackId = 'kick' | 'snare' | 'hat' | 'clap'

export interface TrackDef {
  id: TrackId
  /** 行名。走 i18n */
  label: DrumMessageKey
  pad: PadId
}

export const TRACKS: readonly TrackDef[] = [
  { id: 'kick', label: 'track.kick', pad: 'kick' },
  { id: 'snare', label: 'track.snare', pad: 'snare' },
  { id: 'hat', label: 'track.hat', pad: 'hatc' },
  { id: 'clap', label: 'track.clap', pad: 'clap' },
]

/** 图案：每条轨道对应一串布尔值 */
export type Pattern = Record<TrackId, boolean[]>

/* ============================================
   纯函数
   ============================================ */

export function makeEmptyPattern(): Pattern {
  const pattern = {} as Pattern
  for (const track of TRACKS) {
    pattern[track.id] = new Array<boolean>(STEPS).fill(false)
  }
  return pattern
}

/**
 * 鼓垫 → 音序器行
 *
 * 录制时用它决定敲下的鼓写进哪一行。前缀匹配照搬旧实现：
 * kick / kick2 都归 kick 行，hatc / hato / hat2 都归 hat 行；
 * 其余鼓垫返回 null，即不参与录制。
 */
export function padToTrack(id: PadId): TrackId | null {
  if (id.startsWith('kick')) return 'kick'
  if (id.startsWith('snare')) return 'snare'
  if (id.startsWith('hat')) return 'hat'
  if (id === 'clap') return 'clap'
  return null
}

/**
 * 是否是不发声的 Ghost 鼓垫
 *
 * 旧版第四排的 4 个 Ghost 只有界面反馈、不触发任何音色，
 * 保留它们的目的是占满键盘第 4 排的视觉位置。界面上做弱化处理，
 * 让「敲了没声」不至于像故障。
 */
export function isSilentPad(id: PadId): boolean {
  return id.startsWith('mute')
}

/** 每步间隔。十六分音符：一拍的毫秒数再除以 4 */
export function stepIntervalMs(bpm: number): number {
  const beatMs = 60000 / bpm
  return beatMs / 4
}

/** 每 4 步一条分隔线，最后一格不加（它是表格右边界） */
export function hasBarline(index: number): boolean {
  return (index + 1) % 4 === 0 && index !== STEPS - 1
}
