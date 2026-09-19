/**
 * 排序可视化的运行状态
 *
 * 旧实现把「生成步骤 → 定时器推进 → 直接改 DOM」揉在一个类里。此处把
 * 状态与推进逻辑抽出来，渲染交给视图层：本文件不引用任何元素、不写样式。
 *
 * 动画循环改由 Vue 生命周期驱动（docs/02-fusion-architecture.md §5）：
 * 旧实现用 while + await 的长驻循环，靠实例字段 running 做互斥；这里改为
 * 单次 setTimeout 自续，卸载时在 onBeforeUnmount 里清掉，不存在循环泄漏。
 *
 * 文案不在本文件出现——状态以键（StatusKey）表达，由视图翻译。
 */

import { computed, onBeforeUnmount, ref } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import {
  SIZE_DEFAULT,
  SPEED_DEFAULT,
  buildSteps,
  delayForSpeed,
  genRandomArray,
  makeNearlySorted,
  reverseArray,
  type RangeKind,
  type SortAlgo,
  type SortStep,
} from './useSortSteps'

/** 数组生成方式 */
export type GenerateKind = 'random' | 'reverse' | 'nearly'

/** 状态文案的键，与 locales.ts 里的 status.* 一一对应 */
export type StatusKey =
  | 'ready'
  | 'randomized'
  | 'reversed'
  | 'nearly'
  | 'sorting'
  | 'paused'
  | 'stepping'
  | 'done'

/** 区间高亮：归一化后的当前处理区间 */
export interface RangeShade {
  l: number
  r: number
  kind: RangeKind
}

/** 暂停时动画循环的轮询间隔（毫秒），与旧实现同值 */
const PAUSE_POLL_MS = 40

interface UseSortViz {
  algo: Ref<SortAlgo>
  size: Ref<number>
  speed: Ref<number>
  values: Ref<number[]>

  compareCount: Ref<number>
  writeCount: Ref<number>

  activeA: Ref<number>
  activeB: Ref<number>
  pivotIndex: Ref<number>
  sortedSet: Ref<Set<number>>
  shade: Ref<RangeShade | null>

  isSorting: Ref<boolean>
  isPaused: Ref<boolean>
  status: Ref<StatusKey>
  isDone: ComputedRef<boolean>

  generate(kind: GenerateKind): void
  regenerate(): void
  reset(): void
  start(): void
  togglePause(): void
  stepOnce(): void
}

export function useSortViz(): UseSortViz {
  /* ============================================
     参数与数据
     ============================================ */

  const algo = ref<SortAlgo>('bubble')
  const size = ref(SIZE_DEFAULT)
  const speed = ref(SPEED_DEFAULT)

  const values = ref<number[]>(genRandomArray(SIZE_DEFAULT))
  /** 生成时的数组，重置按钮回到这里 */
  const original = ref<number[]>([...values.value])

  /* ============================================
     运行状态
     ============================================ */

  /** 步骤序列与游标不参与渲染，无需响应式 */
  let steps: SortStep[] = []
  let cursor = 0

  const isSorting = ref(false)
  const isPaused = ref(false)
  const status = ref<StatusKey>('ready')
  const isDone = computed(() => status.value === 'done')

  const compareCount = ref(0)
  const writeCount = ref(0)

  const activeA = ref(-1)
  const activeB = ref(-1)
  const pivotIndex = ref(-1)
  const sortedSet = ref<Set<number>>(new Set())
  const shade = ref<RangeShade | null>(null)

  /* ============================================
     动画循环

     单次 timeout 自续：每步执行完按当前速度安排下一步。
     暂停时以固定间隔空转，与旧实现相同（便于随时恢复）。
     ============================================ */

  let timer: ReturnType<typeof setTimeout> | null = null

  function stopTimer(): void {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }

  function schedule(delay: number): void {
    stopTimer()
    timer = setTimeout(tick, delay)
  }

  function tick(): void {
    timer = null
    if (!isSorting.value) return
    if (isPaused.value) {
      schedule(PAUSE_POLL_MS)
      return
    }
    if (!applyStep()) {
      finish()
      return
    }
    schedule(delayForSpeed(speed.value))
  }

  /* ============================================
     单步执行
     ============================================ */

  /** 高亮每步重算，但保留已排序集合与区间高亮 */
  function clearStepHighlight(): void {
    activeA.value = -1
    activeB.value = -1
    pivotIndex.value = -1
  }

  function clearHighlights(): void {
    clearStepHighlight()
    sortedSet.value.clear()
    shade.value = null
  }

  function resetCounters(): void {
    compareCount.value = 0
    writeCount.value = 0
  }

  /** 执行一步。返回 false 表示序列已走完 */
  function applyStep(): boolean {
    if (cursor >= steps.length) return false

    const step = steps[cursor++]
    clearStepHighlight()

    switch (step.type) {
      case 'compare': {
        compareCount.value++
        activeA.value = step.i
        activeB.value = step.j
        break
      }
      case 'swap': {
        writeCount.value++
        activeA.value = step.i
        activeB.value = step.j
        const arr = values.value
        ;[arr[step.i], arr[step.j]] = [arr[step.j], arr[step.i]]
        break
      }
      case 'set': {
        writeCount.value++ // 写入同样计入「交换/写入」
        activeA.value = step.index
        values.value[step.index] = step.value
        break
      }
      case 'pivot': {
        pivotIndex.value = step.index
        break
      }
      case 'markSorted': {
        for (const i of step.indices) sortedSet.value.add(i)
        break
      }
      case 'range': {
        shade.value = { l: step.l, r: step.r, kind: step.kind }
        break
      }
      case 'clearRange': {
        shade.value = null
        break
      }
      case 'done': {
        return false
      }
    }

    return true
  }

  /** 排序结束：全部标为已排序 */
  function finalizeSorted(): void {
    sortedSet.value.clear()
    for (let i = 0; i < values.value.length; i++) sortedSet.value.add(i)
    clearStepHighlight()
    shade.value = null
  }

  function finish(): void {
    stopTimer()
    isSorting.value = false
    isPaused.value = false
    finalizeSorted()
    status.value = 'done'
  }

  /* ============================================
     重置与生成
     ============================================ */

  function resetAll(keepArray: boolean): void {
    stopTimer()
    isSorting.value = false
    isPaused.value = false

    steps = []
    cursor = 0

    clearHighlights()
    resetCounters()

    if (keepArray) {
      values.value = [...original.value]
    } else {
      values.value = genRandomArray(size.value)
      original.value = [...values.value]
    }

    status.value = 'ready'
  }

  function generate(kind: GenerateKind): void {
    if (isSorting.value) return

    const next =
      kind === 'random'
        ? genRandomArray(size.value)
        : kind === 'reverse'
          ? reverseArray(values.value)
          : makeNearlySorted(values.value)

    values.value = next
    original.value = [...next]

    steps = []
    cursor = 0

    clearHighlights()
    resetCounters()

    status.value = kind === 'random' ? 'randomized' : kind === 'reverse' ? 'reversed' : 'nearly'
  }

  /** 数量变化：换一批随机数据，避免与旧数组的状态纠缠 */
  function regenerate(): void {
    if (isSorting.value) return
    resetAll(false)
  }

  function reset(): void {
    resetAll(true)
  }

  /* ============================================
     播放控制
     ============================================ */

  function start(): void {
    if (isSorting.value) return

    clearHighlights()
    resetCounters()

    steps = buildSteps(algo.value, values.value)
    cursor = 0

    isSorting.value = true
    isPaused.value = false
    status.value = 'sorting'

    // 旧实现先走一步再等，首帧不会空一拍
    tick()
  }

  function togglePause(): void {
    if (!isSorting.value) return
    isPaused.value = !isPaused.value
    status.value = isPaused.value ? 'paused' : 'sorting'
  }

  function stepOnce(): void {
    if (!isSorting.value) return
    isPaused.value = true
    status.value = 'stepping'
    if (!applyStep()) finish()
  }

  onBeforeUnmount(stopTimer)

  return {
    algo,
    size,
    speed,
    values,
    compareCount,
    writeCount,
    activeA,
    activeB,
    pivotIndex,
    sortedSet,
    shade,
    isSorting,
    isPaused,
    status,
    isDone,
    generate,
    regenerate,
    reset,
    start,
    togglePause,
    stepOnce,
  }
}
