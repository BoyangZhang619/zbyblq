/**
 * Piano Keys 的类型
 *
 * 曲谱的数据形状来自 public/playPiano/json/puzi.json。旧实现把
 * 「事件构建」与「发音」写在同一段 JS 里，且字段全靠约定——此处补齐
 * 类型，运行时行为不变。
 */

import type { Localized } from '@/shared/i18n'

/**
 * 振荡器波形
 *
 * 只取 OscillatorNode 的前四个取值，排除 'custom'——自定义波形需要
 * 额外的 PeriodicWave，旧实现未使用。界面提供的四种音色即此四种。
 */
export type OscType = 'triangle' | 'sine' | 'square' | 'sawtooth'

/** 音名（如 C4、F#5），或和弦（音名数组） */
export type NoteSpec = string | string[]

/**
 * 曲谱中的一个音符条目
 *
 * 时长有两种写法：d 为拍数（推荐，需配合 bpm 换算），ms 为毫秒
 * （旧格式，保留兼容）。两者同时存在时 ms 优先，与旧实现一致。
 */
export interface RawNote {
  n?: NoteSpec
  /** 拍数 */
  d?: number
  /** 毫秒。旧格式 */
  ms?: number
}

/** 旧格式还允许直接写 ["C4", 400] */
export type RawNoteEntry = RawNote | [string, number]

export interface RawTrack {
  /** 声部，决定同刻事件的前后次序。缺省为 'track' */
  role?: string
  notes: RawNoteEntry[]
}

export interface RawSheet {
  /** 曲名，双语 */
  name?: Localized
  /** 编制说明，双语。旧数据把这些话混写在 name 里 */
  desc?: Localized
  /** 每分钟拍数，缺省 120 */
  bpm?: number
  /** 多轨。缺省时退化为单轨 notes */
  tracks?: RawTrack[]
  /** 单轨旧格式，保留兼容 */
  notes?: [string, number][]
}

/** 解析后的事件：相对曲谱起点的秒数 + 音 + 时长 + 声部 */
export interface ScoreEvent {
  /** 相对曲谱起点的秒数（未乘速度系数） */
  tSec: number
  n: NoteSpec | null
  /** 毫秒（未做包络适配前的原始时长） */
  durMs: number
  role: string
}

/** 一个已排程的发音单元，用于停止与清理 */
export interface Voice {
  osc: OscillatorNode
  gain: GainNode
  startTime: number
  stopTime: number
}
