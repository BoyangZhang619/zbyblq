/**
 * 拇指琴的乐理与几何
 *
 * 从 `public/kalimba/js/main.js` 提取（docs/09-tool-page-spec.md §9 所述 Stage 2）。
 * 这里全部是纯数据变换：不读写 DOM，也不接触 WebAudio——音频图的构建在
 * `composables/useKalimbaSynth.ts`。
 *
 * 算法与全部数值逐值照搬，未做「顺手优化」。音阶映射、随机旋律的分布、
 * 音条高度的指数曲线都保持原样，改一个数音色或手感就会变。
 */

/** 17 键布局，C4..E6 */
export const BASE_NOTES: readonly string[] = [
  'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4',
  'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5',
  'C6', 'D6', 'E6',
]

/**
 * 键盘映射：数字行 1~9 + Q~I，共 17 个，与键数一一对应
 *
 * 用 `code` 而非 `key`：code 不受输入法与键盘布局影响。
 */
export const KEY_CODES: readonly string[] = [
  'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9',
  'KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI',
]

/** 与 KEY_CODES 一一对应的键帽文字 */
export const KEY_LABELS: readonly string[] = [
  '1', '2', '3', '4', '5', '6', '7', '8', '9',
  'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I',
]

export const SCALE_IDS = ['c_major', 'a_minor', 'pentatonic'] as const

export type ScaleId = (typeof SCALE_IDS)[number]

/**
 * 调式 → 允许的音名字母。null 表示原样使用
 *
 * 注意 a_minor 的音集与 c_major 完全相同（自然小调与 C 大调同音集），
 * 因此听感上与 C 大调一致。这是原实现的行为，此处照搬，
 * 已在交付报告中列为待裁决项。
 */
export const SCALE_LETTERS: Record<ScaleId, readonly string[] | null> = {
  c_major: null,
  a_minor: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
  pentatonic: ['C', 'D', 'E', 'G', 'A'],
}

/** 音名匹配：一个字母 + 可选升号 + 一位八度数字 */
const NOTE_PATTERN = /^([A-G])(#?)(\d)$/

/** 音名到半音的对照表 */
const SEMITONES: Record<string, number> = {
  C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5,
  'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11,
}

/**
 * 音名 → 频率（Hz），十二平均律，A4 = 440
 *
 * 无法解析时原实现返回 440，照搬。
 */
export function noteToFreq(note: string): number {
  const m = note.match(NOTE_PATTERN)
  if (!m) return 440

  const semitone = SEMITONES[m[1] + m[2]]
  if (semitone === undefined) return 440

  const midi = (Number(m[3]) + 1) * 12 + semitone
  return 440 * Math.pow(2, (midi - 69) / 12)
}

/** 把音名拆成字母与八度，供界面分两段渲染（八度字号更小） */
export function parseNote(note: string): { letter: string; octave: string } {
  const m = note.match(NOTE_PATTERN)
  if (!m) return { letter: note, octave: '' }
  return { letter: m[1] + m[2], octave: m[3] }
}

/**
 * 向下寻找最近的允许音
 *
 * 查找次序是原实现写死的 `['C','B','A','G','F','E','D']`——即从当前
 * 字母出发逐级向下、绕回 C 之后继续向下。照搬，不要改成按音高排序。
 *
 * 升号在进入查找前被丢弃（原实现注释里即写明是「简化处理」）。
 * 本工具的 BASE_NOTES 全是自然音，该分支不会触发。
 */
export function mapToScale(note: string, allowedLetters: readonly string[]): string {
  const m = note.match(NOTE_PATTERN)
  if (!m) return note

  const letter = m[1]
  const octave = m[3]

  if (allowedLetters.includes(letter)) return `${letter}${octave}`

  const order: readonly string[] = ['C', 'B', 'A', 'G', 'F', 'E', 'D']
  let idx = order.indexOf(letter)
  if (idx < 0) idx = 0

  for (let k = 0; k < order.length; k++) {
    const cand = order[(idx + k) % order.length]
    if (allowedLetters.includes(cand)) return `${cand}${octave}`
  }
  return `${allowedLetters[0]}${octave}`
}

/** 按调式取实际发音的音名 */
export function scaleNote(note: string, scale: ScaleId): string {
  const allowed = SCALE_LETTERS[scale]
  if (!allowed) return note
  return mapToScale(note, allowed)
}

/**
 * 音条高度系数，0..1
 *
 * 原实现直接返回像素高度：`h = peak - (peak - base) * d^1.3`，
 * 其中 d 是「离中心键的归一化距离」。此处只算曲线（指数 1.3 未动），
 * 具体的上下限（130 / 220）交给样式层的自定义属性，
 * 这样窄屏可以整体缩放而不必改算法。
 */
export function makeTineFactors(count: number): number[] {
  const mid = (count - 1) / 2
  const factors: number[] = []

  for (let i = 0; i < count; i++) {
    // 单键时无曲线可言（原实现会得到 NaN）
    if (mid === 0) {
      factors.push(1)
      continue
    }
    const d = Math.abs(i - mid) / mid
    factors.push(1 - Math.pow(d, 1.3))
  }
  return factors
}

/** 键盘码 → 键序号，未命中返回 -1 */
export function indexForKeyCode(code: string): number {
  return KEY_CODES.indexOf(code)
}

/** 收窄一个来自 DOM 的字符串是否为已知调式 */
export function isScaleId(value: string): value is ScaleId {
  return (SCALE_IDS as readonly string[]).includes(value)
}

/* ============================================
   录音与随机旋律
   ============================================ */

export interface MelodyEvent {
  /** 相对录制起点的毫秒偏移 */
  tMs: number
  /** 键序号 */
  index: number
  /** 力度 0..1 */
  vel: number
}

/** 循环长度 = 最后一个音之后再留一段尾巴，但不少于 1.2 秒 */
const MIN_LOOP_MS = 1200
const LOOP_TAIL_MS = 400

export function loopLengthMs(events: readonly MelodyEvent[]): number {
  const last = events[events.length - 1]
  // 原实现在空数组上会抛错。随机旋律 16 步全落空的概率约百万分之一点六，
  // 届时空录音会直接崩掉播放。此处退化为最短循环长度，
  // 对非空输入的行为与原实现完全一致。
  if (!last) return MIN_LOOP_MS
  return Math.max(MIN_LOOP_MS, last.tMs + LOOP_TAIL_MS)
}

/**
 * 随机挑一个「好听」的键号
 *
 * 中心在 8 号键、幅度 6，是原实现围绕 17 键布局写死的分布：
 * 偏向中音区，听起来更像拇指琴的即兴。照搬。
 */
export function pickNiceIndex(length: number, rng: () => number = Math.random): number {
  const mid = 8
  const spread = 6
  const x = mid + Math.round((rng() * 2 - 1) * spread)
  return Math.max(0, Math.min(length - 1, x))
}

/**
 * 生成一段随机小旋律
 *
 * 16 步、基础步长 170ms、命中率 0.55、力度 0.7 + 0..0.25，
 * 每步再叠加 0..60ms 的抖动——全部为原实现的数值。
 *
 * `rng` 可注入，便于独立测试；调用顺序与原实现一致（命中 → 键号 →
 * 力度 → 步长），换成确定性随机源可复现同一段旋律。
 */
export function makeRandomMelody(rng: () => number = Math.random): MelodyEvent[] {
  const steps = 16
  const baseGap = 170
  const events: MelodyEvent[] = []
  let t = 0

  for (let i = 0; i < steps; i++) {
    if (rng() < 0.55) {
      events.push({
        tMs: t,
        index: pickNiceIndex(BASE_NOTES.length, rng),
        vel: 0.7 + rng() * 0.25,
      })
    }
    t += baseGap + rng() * 60
  }
  return events
}
