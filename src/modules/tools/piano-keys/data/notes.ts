/**
 * 音名频率表与键盘映射
 *
 * 两张表都从 public/playPiano/js/main.js 逐值照搬，未做任何调整。
 * 88 键频率表覆盖 A0–C8；键盘映射覆盖 C2–A6。
 *
 * 键盘布局与旧版 index.html 一致：5 个完整八度 + 第 7 组的单个 C7。
 * 第 6 组的 A#6、B6 与 C7 在旧版没有分配按键，此处 label 为空串。
 */

import type { OscType } from '../types'

/** 88 键频率表（Hz） */
export const NOTE_FREQUENCIES: Record<string, number> = {
  "A0": 27.50, "A#0": 29.14, "B0": 30.87,
  "C1": 32.70, "C#1": 34.65, "D1": 36.71, "D#1": 38.89, "E1": 41.20, "F1": 43.65, "F#1": 46.25, "G1": 49.00, "G#1": 51.91, "A1": 55.00, "A#1": 58.27, "B1": 61.74,
  "C2": 65.41, "C#2": 69.30, "D2": 73.42, "D#2": 77.78, "E2": 82.41, "F2": 87.31, "F#2": 92.50, "G2": 98.00, "G#2": 103.83, "A2": 110.00, "A#2": 116.54, "B2": 123.47,
  "C3": 130.81, "C#3": 138.59, "D3": 146.83, "D#3": 155.56, "E3": 164.81, "F3": 174.61, "F#3": 185.00, "G3": 196.00, "G#3": 207.65, "A3": 220.00, "A#3": 233.08, "B3": 246.94,
  "C4": 261.63, "C#4": 277.18, "D4": 293.66, "D#4": 311.13, "E4": 329.63, "F4": 349.23, "F#4": 369.99, "G4": 392.00, "G#4": 415.30, "A4": 440.00, "A#4": 466.16, "B4": 493.88,
  "C5": 523.25, "C#5": 554.37, "D5": 587.33, "D#5": 622.25, "E5": 659.25, "F5": 698.46, "F#5": 739.99, "G5": 783.99, "G#5": 830.61, "A5": 880.00, "A#5": 932.33, "B5": 987.77,
  "C6": 1046.50, "C#6": 1108.73, "D6": 1174.66, "D#6": 1244.51, "E6": 1318.51, "F6": 1396.91, "F#6": 1479.98, "G6": 1567.98, "G#6": 1661.22, "A6": 1760.00, "A#6": 1864.66, "B6": 1975.53,
  "C7": 2093.00, "C#7": 2217.46, "D7": 2349.32, "D#7": 2489.02, "E7": 2637.02, "F7": 2793.83, "F#7": 2959.96, "G7": 3135.96, "G#7": 3322.44, "A7": 3520.00, "A#7": 3729.31, "B7": 3951.07,
  "C8": 4186.01
}

/**
 * 物理按键 → 音名
 *
 * 字母用小写，符号与数字保持原样。运行时取 e.key 的小写形式查表，
 * 因此 C2 八度那一行需要配合 Shift 才成立——与旧版行为一致。
 */
export const KEY_TO_NOTE: Record<string, string> = {
  '!': 'C2', '@': 'C#2', '#': 'D2', '$': 'D#2', '%': 'E2',
  '^': 'F2', '&': 'F#2', '*': 'G2', '(': 'G#2', ')': 'A2', '_': 'A#2', '+': 'B2',
  'z': 'C3', 's': 'C#3', 'x': 'D3', 'd': 'D#3', 'c': 'E3',
  'v': 'F3', 'g': 'F#3', 'b': 'G3', 'h': 'G#3', 'n': 'A3', 'j': 'A#3', 'm': 'B3',
  'q': 'C4', '2': 'C#4', 'w': 'D4', '3': 'D#4', 'e': 'E4',
  'r': 'F4', '5': 'F#4', 't': 'G4', '6': 'G#4', 'y': 'A4', '7': 'A#4', 'u': 'B4',
  'i': 'C5', '9': 'C#5', 'o': 'D5', '0': 'D#5', 'p': 'E5',
  '[': 'F5', '=': 'F#5', ']': 'G5', '\\': 'G#5', 'a': 'A5', 'l': 'A#5', 'f': 'B5',
  '1': 'C6', '4': 'C#6', '8': 'D6', '-': 'D#6', 'k': 'E6',
  ';': 'F6', "'": 'F#6', ',': 'G6', '.': 'G#6', '/': 'A6'
}

/** 音名 → 展示用按键字符（大写）。由 KEY_TO_NOTE 反转得到 */
export const NOTE_TO_KEY: Record<string, string> = Object.fromEntries(
  Object.entries(KEY_TO_NOTE).map(([key, note]) => [note, key.toUpperCase()]),
)

/** 半音阶次序，键盘按此顺序排布，黑键用负外边距叠在白键之间 */
const SEMITONES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

/** 一个琴键 */
export interface PianoKey {
  /** 音名，如 C4 */
  note: string
  /** 是否为黑键 */
  black: boolean
  /** 对应的物理按键字符，无映射时为空串 */
  label: string
}

/** 一个八度组 */
export interface OctaveKeys {
  octave: number
  keys: PianoKey[]
}

function buildOctave(octave: number, semitones: string[]): OctaveKeys {
  return {
    octave,
    keys: semitones.map((semi) => {
      const note = semi + octave
      return { note, black: semi.length > 1, label: NOTE_TO_KEY[note] ?? '' }
    }),
  }
}

/**
 * 键盘布局：C2–B6 五个完整八度，加第 7 组的一个 C7
 *
 * 第 7 组只画一个白键是旧版 index.html 的写法，此处保留——
 * 频率表里虽然还有 A#7、B7，但旧界面没有把它们画出来。
 */
export const KEYBOARD: OctaveKeys[] = [
  buildOctave(2, SEMITONES),
  buildOctave(3, SEMITONES),
  buildOctave(4, SEMITONES),
  buildOctave(5, SEMITONES),
  buildOctave(6, SEMITONES),
  buildOctave(7, ['C']),
]

/** 音色选项。次序即下拉框的次序 */
export const TONE_IDS: readonly OscType[] = ['triangle', 'sine', 'square', 'sawtooth']

/** 默认音色。旧版引擎与下拉框的默认值都是三角波 */
export const DEFAULT_TONE: OscType = 'triangle'

/** 所有会出现在键盘上的音名，用于判定某个音名是否可高亮 */
export const KEYBOARD_NOTES: ReadonlySet<string> = new Set(
  KEYBOARD.flatMap((group) => group.keys.map((key) => key.note)),
)
