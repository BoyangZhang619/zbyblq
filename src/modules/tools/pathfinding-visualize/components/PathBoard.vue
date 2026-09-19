<template>
  <div
    ref="boardEl"
    class="pathfind__board"
    :style="gridStyle"
    role="img"
    :aria-label="label"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
  >
    <span
      v-for="cell in cells"
      :key="cell.key"
      class="pathfind__cell"
      :class="cellClasses(cell.r, cell.c)"
    ></span>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { CSSProperties } from 'vue'
import {
  COLS,
  ROWS,
  TYPE,
  inBounds,
  keyOf,
  type CellType,
  type Coord,
} from '../composables/pathfinding'

/**
 * 网格画布
 *
 * 只做两件事：把网格状态画成格子、把指针位置换算成行列坐标抛给父组件。
 * 算法与绘制状态都不在这里，见 composables/。
 *
 * 坐标取法与原实现不同。旧版用 e.target.closest('.cell') 反查行列，但
 * pointerdown 里的 boardEl.setPointerCapture 会把后续 pointermove 的 target
 * 重定向成 boardEl 本身，closest 恒为 null —— 于是拖拽绘制与拖拽起终点
 * 实际全都不生效，只有按下的那一格会被画上。此处改为按指针坐标反算行列，
 * 拖拽按设计工作，也不再依赖事件目标。
 *
 * 格子用 CSS Grid 排布，行列数由 TS 常量经 --cols / --rows 下发，
 * 网格尺寸因此只有一个来源。
 */

const props = defineProps<{
  grid: CellType[][]
  start: Coord
  end: Coord
  visited: Set<string>
  path: Set<string>
  /** 画布的无障碍标签 */
  label: string
}>()

const emit = defineEmits<{
  (e: 'down', coord: Coord): void
  (e: 'move', coord: Coord): void
  (e: 'up'): void
}>()

const boardEl = ref<HTMLDivElement | null>(null)

/** 按下到抬起之间才派发 move，避免无谓的事件流。不参与渲染 */
let pressed = false

const gridStyle: CSSProperties = {
  '--cols': String(COLS),
  '--rows': String(ROWS),
}

/** 格子清单是静态的，只生成一次 */
const cells = Array.from({ length: ROWS * COLS }, (_, index) => {
  const r = Math.floor(index / COLS)
  const c = index % COLS
  return { r, c, key: keyOf(r, c) }
})

/** 取某格的状态类名。叠加时的取色优先级由样式表的声明次序决定 */
function cellClasses(r: number, c: number): string[] {
  const classes: string[] = []
  const type = props.grid[r][c]

  if (type === TYPE.WALL) classes.push('is-wall')
  if (type === TYPE.WEIGHT) classes.push('is-weight')
  if (r === props.start.r && c === props.start.c) classes.push('is-start')
  if (r === props.end.r && c === props.end.c) classes.push('is-end')
  if (props.visited.has(keyOf(r, c))) classes.push('is-visited')
  if (props.path.has(keyOf(r, c))) classes.push('is-path')

  return classes
}

/** 由指针位置反算行列。位于画布之外时返回 null */
function coordAt(event: PointerEvent): Coord | null {
  const el = boardEl.value
  if (!el) return null

  const rect = el.getBoundingClientRect()
  if (!rect.width || !rect.height) return null

  const c = Math.floor(((event.clientX - rect.left) / rect.width) * COLS)
  const r = Math.floor(((event.clientY - rect.top) / rect.height) * ROWS)
  if (!inBounds(r, c)) return null

  return { r, c }
}

function onPointerDown(event: PointerEvent): void {
  // 只响应主键，右键与中键不绘制
  if (event.button !== 0) return

  boardEl.value?.setPointerCapture?.(event.pointerId)
  pressed = true

  const coord = coordAt(event)
  if (coord) emit('down', coord)
}

function onPointerMove(event: PointerEvent): void {
  if (!pressed) return

  const coord = coordAt(event)
  if (coord) emit('move', coord)
}

function onPointerUp(): void {
  if (!pressed) return
  pressed = false
  emit('up')
}

onMounted(() => {
  // 指针移出画布后抬起时，事件不一定还会回到画布上，兜底监听 window
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerUp)
})

onBeforeUnmount(() => {
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerUp)
})
</script>

<style scoped>
.pathfind__board {
  display: grid;
  grid-template-columns: repeat(var(--cols), 1fr);
  grid-template-rows: repeat(var(--rows), 1fr);
  width: 100%;
  aspect-ratio: calc(var(--cols) / var(--rows));
  cursor: crosshair;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.pathfind__cell {
  background-color: transparent;
  border-right: 1px solid var(--border-subtle);
  border-bottom: 1px solid var(--border-subtle);
}

/* 状态色由 .pathfind 上的局部变量下发，与图例同源。
   声明次序即叠加时的优先级：后声明的压前面的，与旧版 .cell 的规则次序一致，
   保证「权重格被访问过」这类重叠的取色结果不变 */
.pathfind__cell.is-wall {
  background-color: var(--pathfind-state-wall);
}

.pathfind__cell.is-weight {
  background-color: var(--pathfind-state-weight);
}

.pathfind__cell.is-start {
  background-color: var(--pathfind-state-start);
}

.pathfind__cell.is-end {
  background-color: var(--pathfind-state-end);
}

.pathfind__cell.is-visited {
  background-color: var(--pathfind-state-visited);
}

.pathfind__cell.is-path {
  background-color: var(--pathfind-state-path);
}
</style>
