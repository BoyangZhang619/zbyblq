/**
 * 路径寻找的界面状态与动画编排
 *
 * 与 composables/pathfinding.ts 的分工：
 * - pathfinding.ts 是纯算法，不认识界面
 * - 本文件持有网格、起终点、叠加层与提示条等**状态**，并负责把搜索结果
 *   按旧实现的节奏逐格播出来
 *
 * 这里不出现任何 DOM 查询与元素引用：绘制落在哪个格子由视图换算成坐标后
 * 以参数传入，样式由视图根据状态决定。
 *
 * 动画时序与原实现一致：
 * - 先按 visitedOrder 顺序点亮「已访问」，每步间隔 = 速度值
 * - 访问阶段走完后立刻写入路径长度与总代价（此时路径还没画）
 * - 再按路径顺序点亮，每步间隔 = max(8, 速度值)
 * - 找不到路径时直接提示，不进入路径阶段
 */

import { onBeforeUnmount, ref } from 'vue'
import {
  COLS,
  ROWS,
  TYPE,
  createGrid,
  generateRandomMap,
  inBounds,
  reconstructPath,
  runSearch,
  sameCoord,
  type Algorithm,
  type CellType,
  type Coord,
  type SearchResult,
} from './pathfinding'

/** 绘制模式 */
export type DrawTool = 'wall' | 'erase' | 'weight' | 'move'

/** 提示条内容。文案在视图层经 tt() 取，本层不持有任何中文 */
export type Toast =
  | { kind: 'hint' }
  | { kind: 'randomMap' }
  | { kind: 'clearedAll' }
  | { kind: 'pathCleared' }
  | { kind: 'done' }
  | { kind: 'noPath' }
  | { kind: 'toolChanged'; tool: DrawTool }

/** 随机地图的入口：工具栏按钮与 G 键 */
export type RandomSource = 'button' | 'key'

export const SPEED_MIN = 5
export const SPEED_MAX = 120
export const SPEED_DEFAULT = 30

/** 提示条停留时长 */
const TOAST_DURATION = 1600

/** 路径阶段的最小步进 */
const PATH_STEP_MIN = 8

/**
 * 随机地图密度
 *
 * 原实现里工具栏按钮传的是 weightDensity 0.10，而 G 键走函数默认值 0.08，
 * 两条入口的权重密度并不一致。此处照搬，不做统一。
 */
const DENSITY_FROM_BUTTON = { wallDensity: 0.22, weightDensity: 0.10 }
const DENSITY_FROM_KEY = { wallDensity: 0.22, weightDensity: 0.08 }

export function usePathfinding() {
  /* ============================================
     参数
     ============================================ */

  const algorithm = ref<Algorithm>('astar')
  const tool = ref<DrawTool>('wall')
  const diagonal = ref(false)
  const allowWeight = ref(true)
  const speed = ref(SPEED_DEFAULT)

  /* ============================================
     网格与叠加层
     ============================================ */

  const grid = ref<CellType[][]>(createGrid())

  // 起点留一格边，终点同样留一格边
  const start = ref<Coord>({ r: 3, c: 3 })
  const end = ref<Coord>({ r: ROWS - 4, c: COLS - 4 })

  /** 搜索过程中访问过的格子 */
  const visited = ref<Set<string>>(new Set())
  /** 最终路径上的格子 */
  const path = ref<Set<string>>(new Set())

  /* ============================================
     统计与状态
     ============================================ */

  const visitedCount = ref(0)
  const pathLength = ref(0)
  const pathCost = ref(0)

  const running = ref(false)
  const toast = ref<Toast | null>(null)

  let timer: ReturnType<typeof setTimeout> | null = null
  let toastTimer: ReturnType<typeof setTimeout> | null = null

  // 指针与拖拽状态。不参与渲染，无需响应式
  let pointerDown = false
  let dragNode: 'start' | 'end' | null = null

  /* ============================================
     提示条
     ============================================ */

  function showToast(next: Toast): void {
    toast.value = next
    // 旧实现每次都挂一个新的定时器而不清旧的，连续提示时前一条的定时器
    // 会提前收走后一条。此处清旧再挂新，停留时长不变
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => {
      toast.value = null
      toastTimer = null
    }, TOAST_DURATION)
  }

  /* ============================================
     动画
     ============================================ */

  function stopAnim(): void {
    if (timer) clearTimeout(timer)
    timer = null
    running.value = false
  }

  function clearOverlay(): void {
    visited.value.clear()
    path.value.clear()
  }

  function resetStats(): void {
    visitedCount.value = 0
    pathLength.value = 0
    pathCost.value = 0
  }

  function animate(result: SearchResult): void {
    running.value = true

    const delay = speed.value || SPEED_DEFAULT
    const { visitedOrder, cameFrom, startKey, endKey, costSoFar } = result

    // 搜索已经跑完，路径在动画开始前就确定，与原实现一致
    const pathKeys = reconstructPath(cameFrom, startKey, endKey)
    const found = pathKeys.length > 0 && pathKeys[pathKeys.length - 1] === endKey

    let i = 0

    const stepVisit = (): void => {
      if (!running.value) return

      if (i < visitedOrder.length) {
        const key = visitedOrder[i]
        i += 1
        // 起点与终点不点亮为已访问，它们有自己的颜色
        if (key !== startKey && key !== endKey) visited.value.add(key)
        visitedCount.value = i
        timer = setTimeout(stepVisit, delay)
        return
      }

      if (!found) {
        stopAnim()
        showToast({ kind: 'noPath' })
        return
      }

      pathLength.value = Math.max(0, pathKeys.length - 1)
      pathCost.value = Math.round((costSoFar.get(endKey) ?? 0) * 100) / 100

      let j = 0

      const stepPath = (): void => {
        if (!running.value) return

        if (j >= pathKeys.length) {
          stopAnim()
          showToast({ kind: 'done' })
          return
        }

        const key = pathKeys[j]
        j += 1
        if (key !== startKey && key !== endKey) path.value.add(key)
        timer = setTimeout(stepPath, Math.max(PATH_STEP_MIN, delay))
      }

      stepPath()
    }

    stepVisit()
  }

  /* ============================================
     动作
     ============================================ */

  /** 运行 / 重新运行。动画中再次运行即重新开始 */
  function run(): void {
    stopAnim()
    clearOverlay()
    resetStats()

    const result = runSearch(grid.value, {
      algorithm: algorithm.value,
      start: start.value,
      end: end.value,
      diagonal: diagonal.value,
      allowWeight: allowWeight.value,
    })

    animate(result)
  }

  /** 只清除访问与路径的着色，保留墙与权重 */
  function clearPath(): void {
    stopAnim()
    clearOverlay()
    resetStats()
    showToast({ kind: 'pathCleared' })
  }

  /** 清空全部：墙、权重、叠加层与统计。起点终点保持原位 */
  function clearAll(): void {
    stopAnim()
    grid.value = createGrid()
    clearOverlay()
    resetStats()
    showToast({ kind: 'clearedAll' })
  }

  function randomize(source: RandomSource): void {
    if (running.value) return

    stopAnim()
    clearOverlay()
    resetStats()

    const density = source === 'button' ? DENSITY_FROM_BUTTON : DENSITY_FROM_KEY
    grid.value = generateRandomMap(grid.value, {
      start: start.value,
      end: end.value,
      allowWeight: allowWeight.value,
      ...density,
    })

    showToast({ kind: 'randomMap' })
  }

  function setTool(next: DrawTool): void {
    tool.value = next
    showToast({ kind: 'toolChanged', tool: next })
  }

  /* ============================================
     绘制
     ============================================ */

  function isStart(coord: Coord): boolean {
    return sameCoord(coord, start.value)
  }

  function isEnd(coord: Coord): boolean {
    return sameCoord(coord, end.value)
  }

  function applyToolAt(coord: Coord): void {
    if (!inBounds(coord.r, coord.c)) return
    if (isStart(coord) || isEnd(coord)) return

    if (tool.value === 'wall') {
      grid.value[coord.r][coord.c] = TYPE.WALL
    } else if (tool.value === 'erase') {
      grid.value[coord.r][coord.c] = TYPE.EMPTY
    } else if (tool.value === 'weight') {
      if (!allowWeight.value) return
      grid.value[coord.r][coord.c] =
        grid.value[coord.r][coord.c] === TYPE.WEIGHT ? TYPE.EMPTY : TYPE.WEIGHT
    }
  }

  /** 指针按下 */
  function beginPaint(coord: Coord): void {
    if (running.value) return

    pointerDown = true

    if (tool.value === 'move') {
      if (isStart(coord)) dragNode = 'start'
      else if (isEnd(coord)) dragNode = 'end'
      else dragNode = null
      return
    }

    if (isStart(coord) || isEnd(coord)) return
    applyToolAt(coord)
  }

  /** 指针拖过某格 */
  function movePaint(coord: Coord): void {
    if (running.value || !pointerDown) return

    if (tool.value === 'move') {
      if (!dragNode) return
      // 终点不能拖进墙里，也不能与另一端重合
      if (grid.value[coord.r][coord.c] === TYPE.WALL) return
      if (dragNode === 'start' && isEnd(coord)) return
      if (dragNode === 'end' && isStart(coord)) return

      if (dragNode === 'start') start.value = coord
      else end.value = coord
      return
    }

    if (isStart(coord) || isEnd(coord)) return
    applyToolAt(coord)
  }

  /** 指针抬起 */
  function endPaint(): void {
    pointerDown = false
    dragNode = null
  }

  /** 开场提示，在挂载后调用一次 */
  function showHint(): void {
    showToast({ kind: 'hint' })
  }

  onBeforeUnmount(() => {
    stopAnim()
    if (toastTimer) clearTimeout(toastTimer)
  })

  return {
    // 参数
    algorithm,
    tool,
    diagonal,
    allowWeight,
    speed,

    // 网格
    grid,
    start,
    end,
    visited,
    path,

    // 状态
    visitedCount,
    pathLength,
    pathCost,
    running,
    toast,

    // 动作
    run,
    clearPath,
    clearAll,
    randomize,
    setTool,
    beginPaint,
    movePaint,
    endPaint,
    showHint,
  }
}
