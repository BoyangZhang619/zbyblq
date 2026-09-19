/**
 * 二叉树的解析、构建、统计与布局
 *
 * 从 public/btree/js/main.js 提取。与 DOM 完全解耦：输入是一段字符串，
 * 输出是带画布坐标的节点树，可独立测试。绘制（canvas API 调用）留在
 * 视图层 components/TreeCanvas.vue —— 它依赖具体的渲染方式，不属于
 * 可提取的逻辑。这是 docs/09-tool-page-spec.md §9 所述 Stage 2 的产物。
 *
 * 布局与几何参数逐值照搬旧实现的 config，未做任何调整。
 *
 * 相对旧实现的行为差异，逐条记录：
 * 1. 解析失败不再 `alert`，改为返回结果对象，由视图就地提示
 * 2. 去掉 window.resize 上的重新生成 —— 布局只由节点数与层级决定，
 *    与视口宽度无关，旧版的这段重算没有实际作用
 * 3. 删除旧实现中的三处死代码：adjustOffset（从未被调用）、
 *    calculatePositions 里的 positions 映射（收集后从未读取）与
 *    config.colors.nullNode（空节点根本不绘制）
 */

import { computed, ref, shallowRef } from 'vue'

/**
 * 画布几何常量
 *
 * 逐值照搬旧实现的 config：节点半径 24、层高 80、最小节点间距 55、
 * 字号 14、线宽 2.5、内边距 50。这些数值共同决定树的疏密观感，
 * 改一个就会整体走样，因此不做「顺手优化」。
 */
export const TREE_LAYOUT = {
  nodeRadius: 24,
  levelHeight: 80,
  minNodeSpacing: 55,
  fontSize: 14,
  lineWidth: 2.5,
  padding: 50,
} as const

/** 输入框的初始值，与旧版静态页的初始值一致 */
export const DEFAULT_INPUT = '[1, 2, 3, 4, 5, 6, 7]'

export interface TreeNode {
  /** 节点值。旧实现同时接受数字与字符串 */
  val: unknown
  left: TreeNode | null
  right: TreeNode | null
  /** 画布坐标，由 layoutTree 写入 */
  x: number
  y: number
}

function createNode(val: unknown): TreeNode {
  return { val, left: null, right: null, x: 0, y: 0 }
}

export interface TreeStats {
  nodeCount: number
  leafCount: number
  /** 节点数最多的层数，从 1 起算（单个节点的树高度为 1） */
  height: number
}

export interface TreeLayoutSize {
  width: number
  height: number
}

/** 失败原因。文案由视图层映射，逻辑层不认识文案键 */
export type TreeErrorCode = 'empty-input' | 'invalid-format' | 'no-tree' | 'too-large'

/**
 * 解析层序遍历数组
 *
 * 容错与旧实现一致：缺少外层方括号时自动补齐；大小写不同的 null
 * （NULL、Null）统一为小写，否则 JSON.parse 会失败。
 */
export function parseTreeInput(raw: string): { ok: true; values: unknown[] } | { ok: false } {
  try {
    let cleaned = raw.trim()
    if (!cleaned.startsWith('[')) {
      cleaned = `[${cleaned}]`
    }
    cleaned = cleaned.replace(/\bnull\b/gi, 'null')

    const parsed: unknown = JSON.parse(cleaned)
    if (!Array.isArray(parsed)) return { ok: false }

    return { ok: true, values: parsed }
  } catch {
    return { ok: false }
  }
}

/**
 * 由层序遍历数组构建二叉树
 *
 * 空数组、或首元素为 null 时返回 null——没有根节点就无从谈起。
 */
export function buildTree(values: readonly unknown[]): TreeNode | null {
  if (values.length === 0 || values[0] === null) return null

  const root = createNode(values[0])
  const queue: TreeNode[] = [root]
  let i = 1

  while (queue.length > 0 && i < values.length) {
    const node = queue.shift()
    if (!node) break

    if (i < values.length) {
      if (values[i] !== null) {
        node.left = createNode(values[i])
        queue.push(node.left)
      }
      i++
    }

    if (i < values.length) {
      if (values[i] !== null) {
        node.right = createNode(values[i])
        queue.push(node.right)
      }
      i++
    }
  }

  return root
}

/** 深度优先统计节点数、叶子数与树高 */
export function getTreeStats(root: TreeNode | null): TreeStats {
  let nodeCount = 0
  let leafCount = 0
  let maxHeight = 0

  function dfs(node: TreeNode | null, depth: number): void {
    if (!node) return

    nodeCount++
    maxHeight = Math.max(maxHeight, depth)

    if (!node.left && !node.right) {
      leafCount++
    }

    dfs(node.left, depth + 1)
    dfs(node.right, depth + 1)
  }

  dfs(root, 1)

  return { nodeCount, leafCount, height: maxHeight }
}

/**
 * 计算节点坐标并返回整棵树的画布尺寸
 *
 * 第一遍中序遍历分配 x：每个节点占一个 minNodeSpacing 的槽位，
 * 左子树全部在父节点左侧、右子树全部在右侧，因此不管树的形状如何
 * 都不会重叠（代价是空档处留白，与旧实现一致）。
 * 第二遍整体平移，使最小 x 落在 padding + nodeRadius 处。
 *
 * 副作用是写入各节点的 x/y，这是本工具唯一的「就地改数据」，
 * 调用方需在绘制前调用一次。
 */
export function layoutTree(root: TreeNode | null): TreeLayoutSize {
  if (!root) return { width: 0, height: 0 }

  let minX = Infinity
  let maxX = -Infinity
  let maxDepth = 0
  let xCounter = 0

  function assignX(node: TreeNode | null, depth: number): void {
    if (!node) return

    assignX(node.left, depth + 1)

    node.x = xCounter * TREE_LAYOUT.minNodeSpacing
    node.y = depth * TREE_LAYOUT.levelHeight
    xCounter++

    minX = Math.min(minX, node.x)
    maxX = Math.max(maxX, node.x)
    maxDepth = Math.max(maxDepth, depth)

    assignX(node.right, depth + 1)
  }

  assignX(root, 0)

  const width = maxX - minX + TREE_LAYOUT.nodeRadius * 2 + TREE_LAYOUT.padding * 2
  const height = maxDepth * TREE_LAYOUT.levelHeight + TREE_LAYOUT.nodeRadius * 2 + TREE_LAYOUT.padding * 2

  function shift(node: TreeNode | null): void {
    if (!node) return

    node.x = node.x - minX + TREE_LAYOUT.padding + TREE_LAYOUT.nodeRadius
    node.y = node.y + TREE_LAYOUT.padding + TREE_LAYOUT.nodeRadius

    shift(node.left)
    shift(node.right)
  }

  shift(root)

  return { width, height }
}

/* ============================================
   组合式状态
   ============================================ */

/**
 * 单个画布的最大边长
 *
 * 取 16384 而非各浏览器的实际上限（Chrome 65535、Safari 4096 至 16384
 * 不等）——按最保守的算，宁可多拒绝一次，也不要产出白屏。
 */
export const MAX_CANVAS_SIDE = 16384

/** 按当前 devicePixelRatio 换算后是否超出画布上限 */
export function exceedsCanvasLimit(size: TreeLayoutSize, dpr: number): boolean {
  return size.width * dpr > MAX_CANVAS_SIDE || size.height * dpr > MAX_CANVAS_SIDE
}

export function useTreeLayout() {
  const input = ref(DEFAULT_INPUT)
  /**
   * 用 shallowRef：树可能上百个节点，逐节点建代理没有收益——
   * 节点坐标只在生成时写入一次，之后整体替换
   */
  const tree = shallowRef<TreeNode | null>(null)
  const layout = ref<TreeLayoutSize>({ width: 0, height: 0 })
  const stats = ref<TreeStats>({ nodeCount: 0, leafCount: 0, height: 0 })
  const error = ref<TreeErrorCode | null>(null)

  const hasTree = computed(() => tree.value !== null)

  /** 按当前输入重新生成。任一环节失败都只置错误码，保留现有画面 */
  function generate(dpr = 2): void {
    const raw = input.value.trim()
    if (!raw) {
      error.value = 'empty-input'
      return
    }

    const parsed = parseTreeInput(raw)
    if (!parsed.ok) {
      error.value = 'invalid-format'
      return
    }

    const root = buildTree(parsed.values)
    if (!root) {
      error.value = 'no-tree'
      return
    }

    const next = layoutTree(root)

    /*
      画布尺寸上限检查

      画布宽 = 节点跨度 + 148，高 = 层数 × 80 + 100。浏览器对单个画布
      有尺寸上限（Chrome 系约 16384×16384），且 devicePixelRatio 会把
      两个方向都再放大一倍。超出时创建画布不会报错，而是得到一张空白
      位图——用户看到的是白屏，无从判断原因。

      因此在生成前就拒绝，并给出可执行的建议。
    */
    if (exceedsCanvasLimit(next, dpr)) {
      tree.value = null
      layout.value = { width: 0, height: 0 }
      stats.value = getTreeStats(root)
      error.value = 'too-large'
      return
    }

    layout.value = next
    tree.value = root
    stats.value = getTreeStats(root)
    error.value = null
  }

  function clear(): void {
    input.value = ''
    tree.value = null
    layout.value = { width: 0, height: 0 }
    stats.value = { nodeCount: 0, leafCount: 0, height: 0 }
    error.value = null
  }

  /** 点击示例：填入后立即生成，与旧版示例按钮的行为一致 */
  function loadExample(value: string): void {
    input.value = value
    generate()
  }

  return { input, tree, layout, stats, error, hasTree, generate, clear, loadExample }
}
