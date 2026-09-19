/**
 * 寻路算法核心
 *
 * 从 public/PathfindingVisualize/js/main.js 提取（docs/09-tool-page-spec.md §9
 * 所述 Stage 2 的产物）。与 DOM 完全解耦：输入是纯数据的网格与起终点，
 * 输出是访问次序、来源表与代价表；不读写任何元素，不注册任何监听，
 * 因此可脱离浏览器直接测试。
 *
 * 算法逐值照搬，未做任何「顺手优化」：
 * - 邻居方向表及其顺序（四向 / 八向）
 * - 对角禁穿墙规则（两侧正交邻格任一为墙即不可走）
 * - 权重代价 5、对角代价 sqrt(2)、启发式为四向曼哈顿 / 八向 octile
 * - 二叉堆的比较语义（上浮到父结点不严格更大即止，下沉取严格更小的子结点），
 *   这决定了同优先级节点的出堆次序，进而决定动画的访问顺序
 * - 随机地图每格调用一次 Math.random()，行优先遍历
 *
 * 原实现中不产生可观测效果的部分未搬运，共两处：
 * 1. `frontierSet` 及其标记 / 取消标记——旧实现只写不读，动画也从未使用，
 *    对应的 .cell.frontier 样式同样从未生效
 * 2. `stepCost` 的 from 参数——旧实现里未使用
 *
 * 另一处**明确缺陷被保留**：Dijkstra / A* 分支里的 `if (!costSoFar.has(k)) continue`
 * 是惰性删除的判据，但 costSoFar 从不删项，该判断恒为假，同一格被多次入堆时
 * 会重复出堆 —— visitedOrder 因此可能含重复项，动画的「已访问」计数会大于
 * 实际格子数。修掉它会改变动画表现，故按原样保留，交由主控决定是否修正。
 */

/* ============================================
   网格
   ============================================ */

export const COLS = 42
export const ROWS = 26

export const TYPE = {
  EMPTY: 0,
  WALL: 1,
  WEIGHT: 2,
} as const

export type CellType = (typeof TYPE)[keyof typeof TYPE]

/** 二维网格，grid[r][c] */
export type Grid = CellType[][]

export interface Coord {
  r: number
  c: number
}

export type Algorithm = 'astar' | 'dijkstra' | 'bfs' | 'dfs'

export function createGrid(): Grid {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => TYPE.EMPTY as CellType),
  )
}

export function keyOf(r: number, c: number): string {
  return `${r},${c}`
}

export function parseKey(key: string): Coord {
  const [r, c] = key.split(',').map(Number)
  return { r, c }
}

export function inBounds(r: number, c: number): boolean {
  return r >= 0 && r < ROWS && c >= 0 && c < COLS
}

export function sameCoord(a: Coord, b: Coord): boolean {
  return a.r === b.r && a.c === b.c
}

/* ============================================
   邻居与代价
   ============================================ */

export interface Neighbor extends Coord {
  /** 是否为对角移动 */
  diag: boolean
}

const DIRS_4: readonly (readonly [number, number])[] = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
]

const DIRS_8: readonly (readonly [number, number])[] = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
  [1, 1], [1, -1], [-1, 1], [-1, -1],
]

/**
 * 取某格的可走邻居
 *
 * 墙不可走；开启对角时禁止穿墙角——对角两侧的正交邻格只要有一格是墙，
 * 该对角移动即被排除。
 */
export function neighbors(grid: Grid, r: number, c: number, diagonal: boolean): Neighbor[] {
  const dirs = diagonal ? DIRS_8 : DIRS_4
  const out: Neighbor[] = []

  for (const [dr, dc] of dirs) {
    const nr = r + dr
    const nc = c + dc
    if (!inBounds(nr, nc)) continue
    if (grid[nr][nc] === TYPE.WALL) continue

    if (diagonal && dr !== 0 && dc !== 0) {
      const r1 = r
      const c1 = c + dc
      const r2 = r + dr
      const c2 = c
      if (inBounds(r1, c1) && inBounds(r2, c2)) {
        if (grid[r1][c1] === TYPE.WALL || grid[r2][c2] === TYPE.WALL) continue
      }
    }

    out.push({ r: nr, c: nc, diag: dr !== 0 && dc !== 0 })
  }

  return out
}

/**
 * 单步代价
 *
 * 基础代价 1，对角为 sqrt(2)；目标格是权重格且开关打开时再加 5。
 */
export function stepCost(grid: Grid, to: Neighbor, allowWeight: boolean): number {
  const base = to.diag ? Math.SQRT2 : 1
  const weight = grid[to.r][to.c] === TYPE.WEIGHT && allowWeight ? 5 : 0
  return base + weight
}

/**
 * A* 的启发式
 *
 * 四向用曼哈顿距离，八向用 octile 距离。
 */
export function heuristic(r: number, c: number, end: Coord, diagonal: boolean): number {
  const dr = Math.abs(r - end.r)
  const dc = Math.abs(c - end.c)
  if (!diagonal) return dr + dc
  const F = Math.SQRT2 - 1
  return dr < dc ? F * dr + dc : F * dc + dr
}

/* ============================================
   优先队列
   ============================================ */

interface HeapEntry {
  key: string
  priority: number
}

/**
 * 二叉最小堆
 *
 * 比较语义与旧实现逐字一致。此处刻意不引入「相等时按入堆次序」之类的
 * 稳定化处理——那会改变同优先级节点的出堆次序，从而改变动画。
 */
class MinHeap {
  private items: HeapEntry[] = []

  get size(): number {
    return this.items.length
  }

  push(entry: HeapEntry): void {
    this.items.push(entry)
    this.up(this.items.length - 1)
  }

  pop(): HeapEntry | null {
    if (this.items.length === 0) return null

    const top = this.items[0]
    const last = this.items.pop() as HeapEntry
    if (this.items.length) {
      this.items[0] = last
      this.down(0)
    }
    return top
  }

  private up(index: number): void {
    let i = index
    while (i > 0) {
      const parent = (i - 1) >> 1
      if (this.items[parent].priority <= this.items[i].priority) break
      const tmp = this.items[parent]
      this.items[parent] = this.items[i]
      this.items[i] = tmp
      i = parent
    }
  }

  private down(index: number): void {
    const n = this.items.length
    let i = index
    for (;;) {
      const left = i * 2 + 1
      const right = left + 1
      let min = i
      if (left < n && this.items[left].priority < this.items[min].priority) min = left
      if (right < n && this.items[right].priority < this.items[min].priority) min = right
      if (min === i) break
      const tmp = this.items[min]
      this.items[min] = this.items[i]
      this.items[i] = tmp
      i = min
    }
  }
}

/* ============================================
   搜索
   ============================================ */

export interface SearchOptions {
  algorithm: Algorithm
  start: Coord
  end: Coord
  /** 是否允许对角移动 */
  diagonal: boolean
  /** 权重格是否按 5 计入代价 */
  allowWeight: boolean
}

export interface SearchResult {
  /** 出堆次序。含起点与终点，且可能含重复项（见文件头说明） */
  visitedOrder: string[]
  /** 子结点 → 来源结点 */
  cameFrom: Map<string, string>
  startKey: string
  endKey: string
  /** 起点到各已松弛结点的当前最小代价。DFS / BFS 只登记起点 */
  costSoFar: Map<string, number>
}

/**
 * 执行一次完整搜索
 *
 * 同步跑完，不参与动画——动画只是把结果按次序播出来。
 */
export function runSearch(grid: Grid, options: SearchOptions): SearchResult {
  const { algorithm, start, end, diagonal, allowWeight } = options
  const startKey = keyOf(start.r, start.c)
  const endKey = keyOf(end.r, end.c)

  const cameFrom = new Map<string, string>()
  const costSoFar = new Map<string, number>()
  const visitedOrder: string[] = []

  if (algorithm === 'dfs') {
    // 深度优先：栈，先入后出，不保证最短
    const stack: string[] = [startKey]
    const seen = new Set<string>([startKey])

    while (stack.length) {
      const k = stack.pop() as string
      visitedOrder.push(k)
      if (k === endKey) break

      const { r, c } = parseKey(k)
      for (const nb of neighbors(grid, r, c, diagonal)) {
        const nk = keyOf(nb.r, nb.c)
        if (seen.has(nk)) continue
        seen.add(nk)
        cameFrom.set(nk, k)
        stack.push(nk)
      }
    }

    // 深度优先的代价没有意义，只登记起点，总代价因此恒为 0
    costSoFar.set(startKey, 0)
  } else if (algorithm === 'bfs') {
    // 广度优先：队列，无权图上的最短路
    const queue: string[] = [startKey]
    let qi = 0
    const seen = new Set<string>([startKey])

    while (qi < queue.length) {
      const k = queue[qi++]
      visitedOrder.push(k)
      if (k === endKey) break

      const { r, c } = parseKey(k)
      for (const nb of neighbors(grid, r, c, diagonal)) {
        const nk = keyOf(nb.r, nb.c)
        if (seen.has(nk)) continue
        seen.add(nk)
        cameFrom.set(nk, k)
        queue.push(nk)
      }
    }

    costSoFar.set(startKey, 0)
  } else {
    // Dijkstra（h 恒为 0）与 A*（h 为启发式距离）共用一套松弛流程
    const pq = new MinHeap()
    pq.push({ key: startKey, priority: 0 })
    costSoFar.set(startKey, 0)

    while (pq.size) {
      const current = pq.pop()
      if (!current) break

      const k = current.key
      // 惰性删除判据：见文件头，此判断恒为假，行为按原样保留
      if (!costSoFar.has(k)) continue

      visitedOrder.push(k)
      if (k === endKey) break

      const { r, c } = parseKey(k)
      for (const nb of neighbors(grid, r, c, diagonal)) {
        const nk = keyOf(nb.r, nb.c)
        const newCost = (costSoFar.get(k) as number) + stepCost(grid, nb, allowWeight)

        if (!costSoFar.has(nk) || newCost < (costSoFar.get(nk) as number)) {
          costSoFar.set(nk, newCost)
          cameFrom.set(nk, k)

          const h = algorithm === 'astar' ? heuristic(nb.r, nb.c, end, diagonal) : 0
          pq.push({ key: nk, priority: newCost + h })
        }
      }
    }
  }

  return { visitedOrder, cameFrom, startKey, endKey, costSoFar }
}

/**
 * 由来源表回溯出完整路径（含起点与终点）
 *
 * 终点不可达时返回空数组。
 */
export function reconstructPath(
  cameFrom: Map<string, string>,
  startKey: string,
  endKey: string,
): string[] {
  const path: string[] = []
  let k: string | undefined = endKey

  if (k !== startKey && !cameFrom.has(k)) return []

  while (k && k !== startKey) {
    path.push(k)
    k = cameFrom.get(k)
  }
  path.push(startKey)
  path.reverse()

  return path
}

/* ============================================
   随机地图
   ============================================ */

export interface RandomMapOptions {
  start: Coord
  end: Coord
  allowWeight: boolean
  /** 墙密度，0～0.45 较舒适 */
  wallDensity?: number
  /** 权重密度，0～0.20 较舒适 */
  weightDensity?: number
  /** 在现有网格上叠加而非重置。原实现保留的开关，当前无调用方使用 */
  keepExisting?: boolean
}

/**
 * 生成随机地图
 *
 * 起点与终点位置始终清空为普通格。每格按行优先调用一次 Math.random()，
 * 次序与原实现一致：先判墙，再判权重。
 */
export function generateRandomMap(grid: Grid, options: RandomMapOptions): Grid {
  const {
    start,
    end,
    allowWeight,
    wallDensity = 0.22,
    weightDensity = 0.08,
    keepExisting = false,
  } = options

  const next: Grid = keepExisting ? grid.map(row => row.slice()) : createGrid()

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (sameCoord(start, { r, c }) || sameCoord(end, { r, c })) {
        next[r][c] = TYPE.EMPTY
        continue
      }

      if (keepExisting && next[r][c] === TYPE.WALL) continue

      const roll = Math.random()
      if (roll < wallDensity) {
        next[r][c] = TYPE.WALL
      } else if (allowWeight && roll < wallDensity + weightDensity) {
        next[r][c] = TYPE.WEIGHT
      } else {
        next[r][c] = TYPE.EMPTY
      }
    }
  }

  return next
}
