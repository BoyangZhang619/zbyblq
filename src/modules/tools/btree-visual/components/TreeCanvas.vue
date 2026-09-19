<template>
  <div ref="hostRef" class="btree__canvas-host">
    <!-- 令牌探针：canvas 不认 var()，需要一个真实元素把颜色解析成绝对值 -->
    <span ref="probeRef" class="visually-hidden" aria-hidden="true"></span>
    <canvas ref="canvasRef" class="btree__canvas" role="img" :aria-label="label"></canvas>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useTheme } from '@/shared/composables/useTheme'
import { createCanvas, downloadCanvasPNG } from '@/shared/utils/canvas'
import { TREE_LAYOUT, type TreeNode } from '../composables/useTreeLayout'

/**
 * 二叉树画布
 *
 * 绘制属于视图层职责（docs/09-tool-page-spec.md §9），所以不放进
 * composables —— 那里只做解析、构建与坐标计算。
 *
 * 颜色一律在绘制时从语义令牌现读（见 resolveColor），代码里不写死
 * 任何色值：明暗模式与六套色板切换后无需改动，也不会在深色下用错色。
 *
 * 与旧实现的差异：
 * 1. 节点改为纯色填充。旧版是「靛蓝到紫罗兰的渐变 + 外发光」，那是
 *    深色单一配色下的效果；本层有深浅两套主题与六套色板，渐变一旦
 *    走向 --accent-text（浅色下是深色档），节点文字对比度就掉到 2:1
 *    上下。改用 --accent-fg 单色，它与 --text-on-accent 是设计上成对
 *    的令牌，任何主题与色板下都保证可读。
 * 2. 画布按容器宽度等比缩放。全局隐藏了滚动条，横向溢出会变成看不到
 *    的截断，因此宁可整棵树缩小，也不横向滚动。
 */

const props = defineProps<{
  /** 树根。坐标已由 layoutTree 写入 */
  root: TreeNode | null
  /** 画布坐标系的宽高，由 layoutTree 计算 */
  width: number
  height: number
  /** 无障碍描述，由父级按当前语种拼好 */
  label: string
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const hostRef = ref<HTMLElement | null>(null)
const probeRef = ref<HTMLElement | null>(null)

/* ============================================
   令牌取值
   ============================================ */

/** 读取令牌原始文本，用于字体族、字重这类非颜色令牌 */
function readToken(token: string): string {
  const probe = probeRef.value
  if (!probe) return ''
  return getComputedStyle(probe).getPropertyValue(token).replace(/\s+/g, ' ').trim()
}

/**
 * 把颜色令牌解析为 canvas 可用的具体色值
 *
 * 深色主题下的 --accent-fg 是 color-mix() 表达式，直接取令牌文本也没法
 * 交给 canvas。改用一个隐藏元素把 color 设成该令牌，读回的 computed
 * color 必定是已解析的绝对值。
 */
function resolveColor(token: string): string {
  const probe = probeRef.value
  if (!probe || !readToken(token)) return 'currentColor'

  probe.style.color = `var(${token})`
  return getComputedStyle(probe).color || 'currentColor'
}

interface CanvasPalette {
  /** 节点填充。与 nodeText 是成对的令牌 */
  nodeFill: string
  /** 节点文字 */
  nodeText: string
  /** 连线 */
  edge: string
  /** 导出时的底色 */
  background: string
  fontFamily: string
  fontWeight: string
}

function palette(): CanvasPalette {
  return {
    nodeFill: resolveColor('--accent-fg'),
    nodeText: resolveColor('--text-on-accent'),
    edge: resolveColor('--text-tertiary'),
    background: resolveColor('--surface-sunken'),
    fontFamily: readToken('--font-sans') || 'sans-serif',
    fontWeight: readToken('--weight-bold') || '600',
  }
}

/* ============================================
   绘制
   ============================================ */

/**
 * 绘制一条连线，从父节点圆边到子节点圆边
 *
 * 圆心距离不足两个半径时跳过——此时线段会被圆完全盖住，画了也看不见。
 */
function drawLineBetween(
  ctx: CanvasRenderingContext2D,
  from: TreeNode,
  to: TreeNode,
): void {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const distance = Math.sqrt(dx * dx + dy * dy)

  if (distance <= TREE_LAYOUT.nodeRadius * 2) return

  const unitX = dx / distance
  const unitY = dy / distance

  ctx.beginPath()
  ctx.moveTo(from.x + unitX * TREE_LAYOUT.nodeRadius, from.y + unitY * TREE_LAYOUT.nodeRadius)
  ctx.lineTo(to.x - unitX * TREE_LAYOUT.nodeRadius, to.y - unitY * TREE_LAYOUT.nodeRadius)
  ctx.stroke()
}

/** 先序遍历画完所有连线 */
function drawEdges(ctx: CanvasRenderingContext2D, node: TreeNode | null): void {
  if (!node) return

  if (node.left) {
    drawLineBetween(ctx, node, node.left)
    drawEdges(ctx, node.left)
  }

  if (node.right) {
    drawLineBetween(ctx, node, node.right)
    drawEdges(ctx, node.right)
  }
}

/** 先序遍历画所有节点 */
function drawNodes(
  ctx: CanvasRenderingContext2D,
  node: TreeNode | null,
  p: CanvasPalette,
): void {
  if (!node) return

  const radius = TREE_LAYOUT.nodeRadius

  ctx.beginPath()
  ctx.arc(node.x, node.y, radius, 0, Math.PI * 2)
  ctx.fillStyle = p.nodeFill
  ctx.fill()

  // 超过 4 个字符的节点值截断并缩小一号字，否则文字会溢出圆外
  let text = String(node.val)
  let fontSize = TREE_LAYOUT.fontSize
  if (text.length > 4) {
    text = `${text.slice(0, 3)}…`
    fontSize = TREE_LAYOUT.fontSize - 2
  }

  ctx.fillStyle = p.nodeText
  ctx.font = `${p.fontWeight} ${fontSize}px ${p.fontFamily}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, node.x, node.y)

  drawNodes(ctx, node.left, p)
  drawNodes(ctx, node.right, p)
}

/* ============================================
   尺寸与重绘
   ============================================ */

/**
 * 按容器宽度等比设定显示尺寸
 *
 * 备份存储已按 DPR 放大，这里只管显示尺寸；两者独立，缩放窗口
 * 不会引起重绘，也不会累积失真。
 */
function fitDisplay(): void {
  const canvas = canvasRef.value
  const host = hostRef.value
  if (!canvas || !host || props.width <= 0) return

  const available = host.clientWidth
  if (available <= 0) return

  const scale = Math.min(1, available / props.width)
  canvas.style.width = `${props.width * scale}px`
  canvas.style.height = `${props.height * scale}px`
}

function render(): void {
  const canvas = canvasRef.value
  if (!canvas) return

  if (!props.root || props.width <= 0 || props.height <= 0) {
    canvas.width = 1
    canvas.height = 1
    return
  }

  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.round(props.width * dpr)
  canvas.height = Math.round(props.height * dpr)

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // 画布宽高的赋值会重置变换，因此这里重新建立 DPR 缩放
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, props.width, props.height)

  const p = palette()
  ctx.strokeStyle = p.edge
  ctx.lineWidth = TREE_LAYOUT.lineWidth
  ctx.lineCap = 'round'

  drawEdges(ctx, props.root)
  drawNodes(ctx, props.root, p)

  fitDisplay()
}

/**
 * 导出 PNG
 *
 * 与旧实现一样铺一层底色——树上没有像素的地方在 PNG 里会是透明的，
 * 而透明背景在多数聊天窗口里显示为黑色。底色取界面同款表面色。
 */
function exportPNG(): void {
  const source = canvasRef.value
  if (!source || !props.root) return

  const { canvas, ctx } = createCanvas(source.width, source.height)
  ctx.fillStyle = palette().background
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(source, 0, 0)

  downloadCanvasPNG(canvas, 'binary-tree')
}

defineExpose({ exportPNG })

/* ============================================
   生命周期
   ============================================ */

const { resolvedMode, accent } = useTheme()

let observer: ResizeObserver | null = null

onMounted(() => {
  render()

  const host = hostRef.value
  if (!host || typeof ResizeObserver === 'undefined') return

  observer = new ResizeObserver(fitDisplay)
  observer.observe(host)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})

// 树换了要重绘
watch([() => props.root, () => props.width, () => props.height], render, { flush: 'post' })

// 主题换色要重绘。post 确保读到的是已经落到 DOM 上的新令牌
watch([resolvedMode, accent], render, { flush: 'post' })
</script>
