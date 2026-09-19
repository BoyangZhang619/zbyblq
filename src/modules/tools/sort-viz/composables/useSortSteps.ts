/**
 * 排序算法步进生成器
 *
 * 从 public/sortviz/js/main.js 的 SortVisualizer 中提取，与 DOM 完全解耦：
 * 输入是一个数组，输出是一串可回放的步骤，不读写任何元素、不监听事件。
 * 这是 docs/02-fusion-architecture.md §3 所述 Stage 2 的产物。
 *
 * 算法逐值照搬，未做任何「顺手优化」：比较与交换的次序、区间标记的时机、
 * 提前退出的条件均与原实现一致，否则动画呈现会变。
 *
 * 原实现的两点已知行为（保留，见报告）：
 * 1. merge / quick 的递归里从未调用过 clearRange，区间高亮一直保留到整段
 *    排序结束才由 buildSteps 末尾统一清除
 * 2. merge 每合并完一段就 markSorted 该段，而 sortedSet 在排序过程中不重置，
 *    因此「已排序」的绿色在分治类算法里会提前出现
 */

export const SORT_ALGOS = ['bubble', 'selection', 'insertion', 'merge', 'quick'] as const
export type SortAlgo = (typeof SORT_ALGOS)[number]

/** 区间高亮的两种来源，决定配色 */
export type RangeKind = 'merge' | 'quick'

/**
 * 一步操作
 *
 * 步骤只描述「发生了什么」，不描述「怎么画」——绘制留给视图层。
 */
export type SortStep =
  | { type: 'compare'; i: number; j: number }
  | { type: 'swap'; i: number; j: number }
  | { type: 'set'; index: number; value: number }
  | { type: 'pivot'; index: number }
  | { type: 'markSorted'; indices: number[] }
  | { type: 'range'; l: number; r: number; kind: RangeKind }
  | { type: 'clearRange' }
  | { type: 'done' }

/* ============================================
   参数范围

   全部取自旧实现，改动即行为回归。
   ============================================ */

/** 柱高的取值区间，柱高直接按百分比呈现 */
export const VALUE_MIN = 1
export const VALUE_MAX = 100

export const SIZE_MIN = 8
export const SIZE_MAX = 140
export const SIZE_DEFAULT = 60

export const SPEED_MIN = 1
export const SPEED_MAX = 100
export const SPEED_DEFAULT = 35

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * 速度档位换算为每步间隔毫秒数
 *
 * 曲线为 140 - (speed/100)^0.8 * 135，钳制在 5~140 毫秒。
 * 指数 0.8 使低档位的间隔下降得比线性更慢，这是旧实现调出来的手感。
 */
export function delayForSpeed(speed: number): number {
  const t = 140 - Math.pow(speed / 100, 0.8) * 135
  return clamp(Math.round(t), 5, 140)
}

/* ============================================
   数组生成
   ============================================ */

export function genRandomArray(n: number, min = VALUE_MIN, max = VALUE_MAX): number[] {
  const out = new Array<number>(n)
  for (let i = 0; i < n; i++) {
    out[i] = Math.floor(Math.random() * (max - min + 1)) + min
  }
  return out
}

/** 升序后随机交换约 8% 的对数（至少一对） */
export function makeNearlySorted(a: number[]): number[] {
  const b = [...a].sort((x, y) => x - y)
  const swaps = Math.max(1, Math.floor(b.length * 0.08))
  for (let k = 0; k < swaps; k++) {
    const i = Math.floor(Math.random() * b.length)
    const j = Math.floor(Math.random() * b.length)
    ;[b[i], b[j]] = [b[j], b[i]]
  }
  return b
}

/** 降序。作用在**当前数组**上，而非初始数组——与旧实现一致 */
export function reverseArray(a: number[]): number[] {
  return [...a].sort((x, y) => y - x)
}

/* ============================================
   步进生成
   ============================================ */

/**
 * 生成完整步骤序列
 *
 * 序列末尾固定有一个 done，动画循环见到它就收尾。
 * 传入的数组不会被修改。
 */
export function buildSteps(algo: SortAlgo, inputArr: number[]): SortStep[] {
  const a = [...inputArr]
  const out: SortStep[] = []

  if (algo === 'bubble') {
    const n = a.length
    for (let end = n - 1; end > 0; end--) {
      let swapped = false
      for (let i = 0; i < end; i++) {
        out.push({ type: 'compare', i, j: i + 1 })
        if (a[i] > a[i + 1]) {
          ;[a[i], a[i + 1]] = [a[i + 1], a[i]]
          out.push({ type: 'swap', i, j: i + 1 })
          swapped = true
        }
      }
      out.push({ type: 'markSorted', indices: [end] })
      if (!swapped) {
        const rest: number[] = []
        for (let k = 0; k <= end; k++) rest.push(k)
        out.push({ type: 'markSorted', indices: rest })
        break
      }
    }
  }

  if (algo === 'selection') {
    const n = a.length
    for (let i = 0; i < n; i++) {
      let minIdx = i
      for (let j = i + 1; j < n; j++) {
        out.push({ type: 'compare', i: minIdx, j })
        if (a[j] < a[minIdx]) minIdx = j
      }
      if (minIdx !== i) {
        ;[a[i], a[minIdx]] = [a[minIdx], a[i]]
        out.push({ type: 'swap', i, j: minIdx })
      }
      out.push({ type: 'markSorted', indices: [i] })
    }
  }

  if (algo === 'insertion') {
    const n = a.length
    out.push({ type: 'markSorted', indices: [0] })
    for (let i = 1; i < n; i++) {
      let j = i
      while (j > 0) {
        out.push({ type: 'compare', i: j - 1, j })
        if (a[j - 1] > a[j]) {
          ;[a[j - 1], a[j]] = [a[j], a[j - 1]]
          out.push({ type: 'swap', i: j - 1, j })
          j--
        } else {
          break
        }
      }
      const done: number[] = []
      for (let k = 0; k <= i; k++) done.push(k)
      out.push({ type: 'markSorted', indices: done })
    }
  }

  if (algo === 'merge') {
    mergeSortSteps(a, 0, a.length - 1, out)
    out.push({ type: 'markSorted', indices: indicesFrom(0, a.length - 1) })
    out.push({ type: 'clearRange' })
  }

  if (algo === 'quick') {
    quickSortSteps(a, 0, a.length - 1, out)
    out.push({ type: 'markSorted', indices: indicesFrom(0, a.length - 1) })
    out.push({ type: 'clearRange' })
  }

  out.push({ type: 'done' })
  return out
}

/** [l, r] 闭区间内的全部下标 */
function indicesFrom(l: number, r: number): number[] {
  const seg: number[] = []
  for (let x = l; x <= r; x++) seg.push(x)
  return seg
}

/** 归并排序。每次合并前标记区间，合并完成后标记该段为已排序 */
function mergeSortSteps(a: number[], l: number, r: number, out: SortStep[]): void {
  if (l >= r) return
  const mid = (l + r) >> 1

  mergeSortSteps(a, l, mid, out)
  mergeSortSteps(a, mid + 1, r, out)

  out.push({ type: 'range', l, r, kind: 'merge' })

  const tmp: number[] = []
  let i = l
  let j = mid + 1
  while (i <= mid && j <= r) {
    out.push({ type: 'compare', i, j })
    if (a[i] <= a[j]) tmp.push(a[i++])
    else tmp.push(a[j++])
  }
  while (i <= mid) tmp.push(a[i++])
  while (j <= r) tmp.push(a[j++])

  for (let k = 0; k < tmp.length; k++) {
    a[l + k] = tmp[k]
    out.push({ type: 'set', index: l + k, value: tmp[k] })
  }

  out.push({ type: 'markSorted', indices: indicesFrom(l, r) })
}

/** 快速排序，Lomuto 分区。每次分区前标记区间，pivot 固定取右端 */
function quickSortSteps(a: number[], l: number, r: number, out: SortStep[]): void {
  if (l > r) return
  if (l === r) {
    out.push({ type: 'markSorted', indices: [l] })
    return
  }

  out.push({ type: 'range', l, r, kind: 'quick' })

  const pivot = a[r]
  out.push({ type: 'pivot', index: r })

  let i = l
  for (let j = l; j < r; j++) {
    out.push({ type: 'compare', i: j, j: r })
    if (a[j] < pivot) {
      if (i !== j) {
        ;[a[i], a[j]] = [a[j], a[i]]
        out.push({ type: 'swap', i, j })
      }
      i++
    }
  }

  ;[a[i], a[r]] = [a[r], a[i]]
  out.push({ type: 'swap', i, j: r })
  out.push({ type: 'markSorted', indices: [i] })

  quickSortSteps(a, l, i - 1, out)
  quickSortSteps(a, i + 1, r, out)
}
