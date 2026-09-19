<template>
  <div class="pathfind">
    <div class="page-content">
      <header class="pathfind__header">
        <h1 class="pathfind__title">{{ tt('title') }}</h1>
        <p class="pathfind__subtitle">{{ tt('subtitle') }}</p>
      </header>

      <!-- 主操作 -->
      <div class="pathfind__actions">
        <button
          class="pathfind__btn pathfind__btn--primary"
          type="button"
          :disabled="running"
          @click="run"
        >
          {{ tt('actionRun') }}
        </button>

        <button
          class="pathfind__btn"
          type="button"
          :disabled="running"
          @click="randomize('button')"
        >
          <AppIcon name="shuffle" :size="16" decorative />
          {{ tt('actionRandom') }}
        </button>

        <button class="pathfind__btn" type="button" @click="clearPath">
          {{ tt('actionClearPath') }}
        </button>

        <button class="pathfind__btn" type="button" @click="clearAll">
          <AppIcon name="trash" :size="16" decorative />
          {{ tt('actionClearAll') }}
        </button>
      </div>

      <!-- 网格 -->
      <section class="pathfind__stage">
        <ul class="pathfind__legend">
          <li v-for="item in LEGEND" :key="item.id" class="pathfind__pill">
            <span
              class="pathfind__dot"
              :class="`pathfind__dot--${item.id}`"
              aria-hidden="true"
            ></span>
            {{ tt(item.labelKey) }}
          </li>
        </ul>

        <div class="pathfind__board-wrap">
          <PathBoard
            :grid="grid"
            :start="start"
            :end="end"
            :visited="visited"
            :path="path"
            :label="boardLabel"
            @down="beginPaint"
            @move="movePaint"
            @up="endPaint"
          />

          <p class="pathfind__toast" :class="{ 'is-visible': toast !== null }" role="status">
            <AppIcon v-if="toastIcon" :name="toastIcon" :size="16" decorative />
            {{ toastText }}
          </p>
        </div>

        <p class="pathfind__foot">{{ tt('footHint') }}</p>
      </section>

      <!-- 参数 -->
      <div class="pathfind__controls">
        <section class="pathfind__group">
          <h2 class="pathfind__group-title">{{ tt('algorithmLabel') }}</h2>
          <select
            id="pathfind-algorithm"
            v-model="algorithm"
            class="pathfind__select"
            :aria-label="tt('algorithmLabel')"
          >
            <option v-for="item in ALGORITHMS" :key="item.id" :value="item.id">
              {{ tt(item.labelKey) }}
            </option>
          </select>

          <div class="pathfind__checks">
            <label class="pathfind__check">
              <input v-model="diagonal" type="checkbox" />
              <span>{{ tt('allowDiagonal') }}</span>
            </label>

            <label class="pathfind__check">
              <input v-model="allowWeight" type="checkbox" />
              <span>{{ tt('allowWeightLabel') }}</span>
            </label>
          </div>
        </section>

        <section class="pathfind__group">
          <h2 class="pathfind__group-title">{{ tt('drawModeLabel') }}</h2>
          <div class="pathfind__seg" role="radiogroup" :aria-label="tt('drawModeLabel')">
            <button
              v-for="item in TOOLS"
              :key="item.id"
              class="pathfind__seg-btn"
              :class="{ 'is-active': tool === item.id }"
              type="button"
              role="radio"
              :aria-checked="tool === item.id"
              @click="setTool(item.id)"
            >
              {{ tt(item.labelKey) }}
            </button>
          </div>
          <p class="pathfind__hint">{{ tt('drawHint') }}</p>
        </section>

        <section class="pathfind__group">
          <div class="pathfind__group-head">
            <h2 class="pathfind__group-title">{{ tt('speedLabel') }}</h2>
            <span class="pathfind__value">{{ tt('speedUnit', { value: speed }) }}</span>
          </div>
          <input
            id="pathfind-speed"
            v-model.number="speed"
            class="pathfind__range"
            type="range"
            :min="SPEED_MIN"
            :max="SPEED_MAX"
            step="1"
            :aria-label="tt('speedLabel')"
          />
        </section>

        <section class="pathfind__group">
          <h2 class="pathfind__group-title">{{ tt('statsLabel') }}</h2>
          <ul class="pathfind__stats">
            <li class="pathfind__stat">
              <span class="pathfind__stat-label">{{ tt('statVisited') }}</span>
              <span class="pathfind__stat-value">{{ visitedCount }}</span>
            </li>
            <li class="pathfind__stat">
              <span class="pathfind__stat-label">{{ tt('statPathLength') }}</span>
              <span class="pathfind__stat-value">{{ pathLength }}</span>
            </li>
            <li class="pathfind__stat">
              <span class="pathfind__stat-label">{{ tt('statCost') }}</span>
              <span class="pathfind__stat-value">{{ pathCost }}</span>
            </li>
          </ul>
        </section>

        <section class="pathfind__group pathfind__group--wide">
          <h2 class="pathfind__group-title">{{ tt('shortcutsLabel') }}</h2>
          <ul class="pathfind__keys">
            <li v-for="item in SHORTCUTS" :key="item.labelKey" class="pathfind__key-row">
              <span class="pathfind__key-chord">
                <kbd v-for="key in item.keys" :key="key" class="pathfind__kbd">{{ key }}</kbd>
              </span>
              <span class="pathfind__key-label">{{ tt(item.labelKey) }}</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { AppIcon, type IconName } from '@/shared/icons'
import { useToolI18n } from '@/shared/i18n'
import { messages } from './locales'
import { COLS, ROWS } from './composables/pathfinding'
import {
  SPEED_MAX,
  SPEED_MIN,
  usePathfinding,
  type DrawTool,
} from './composables/usePathfinding'
import PathBoard from './components/PathBoard.vue'

/**
 * 路径寻找可视化
 *
 * 融合迁移（docs/09-tool-page-spec.md 的 Stage 2 + 3）：由 iframe 桥接旧版
 * 静态页改为原生 Vue 组件，接入设计令牌、图标体系与中英双语。
 *
 * 分工：
 * - composables/pathfinding.ts  纯算法（从旧 main.js 提取）
 * - composables/usePathfinding.ts  网格与动画状态
 * - components/PathBoard.vue  网格渲染与指针坐标换算
 *
 * 与原实现的差异集中记在交付说明里，其中影响用户可见行为的只有两处：
 * 拖拽绘制（旧版因 pointer capture 重定向而失效）与快捷键不再抢占
 * 带修饰键的组合。
 */

const { tt } = useToolI18n(messages)

const {
  algorithm,
  tool,
  diagonal,
  allowWeight,
  speed,
  grid,
  start,
  end,
  visited,
  path,
  visitedCount,
  pathLength,
  pathCost,
  running,
  toast,
  run,
  clearPath,
  clearAll,
  randomize,
  setTool,
  beginPaint,
  movePaint,
  endPaint,
  showHint,
} = usePathfinding()

/* ============================================
   界面用到的枚举
   ============================================ */

const ALGORITHMS = [
  { id: 'astar', labelKey: 'algorithmAstar' },
  { id: 'dijkstra', labelKey: 'algorithmDijkstra' },
  { id: 'bfs', labelKey: 'algorithmBfs' },
  { id: 'dfs', labelKey: 'algorithmDfs' },
] as const

const TOOLS = [
  { id: 'wall', labelKey: 'toolWall' },
  { id: 'erase', labelKey: 'toolErase' },
  { id: 'weight', labelKey: 'toolWeight' },
  { id: 'move', labelKey: 'toolMove' },
] as const

const LEGEND = [
  { id: 'start', labelKey: 'legendStart' },
  { id: 'end', labelKey: 'legendEnd' },
  { id: 'wall', labelKey: 'legendWall' },
  { id: 'weight', labelKey: 'legendWeight' },
  { id: 'visited', labelKey: 'legendVisited' },
  { id: 'path', labelKey: 'legendPath' },
] as const

const SHORTCUTS = [
  { keys: ['R'], labelKey: 'shortcutRun' },
  { keys: ['C'], labelKey: 'shortcutClearPath' },
  { keys: ['X'], labelKey: 'shortcutClearAll' },
  { keys: ['G'], labelKey: 'shortcutRandom' },
  { keys: ['W', 'E', 'Q', 'M'], labelKey: 'shortcutTools' },
] as const

/** 绘制模式 → 文案键。用于提示条里的「工具：墙」 */
const TOOL_LABEL_KEYS = {
  wall: 'toolWall',
  erase: 'toolErase',
  weight: 'toolWeight',
  move: 'toolMove',
} as const satisfies Record<DrawTool, string>

/* ============================================
   提示条
   ============================================ */

const boardLabel = computed(() => tt('boardLabel', { cols: COLS, rows: ROWS }))

const toastText = computed(() => {
  const current = toast.value
  if (!current) return ''

  switch (current.kind) {
    case 'hint':
      return tt('toastHint')
    case 'randomMap':
      return tt('toastRandomMap')
    case 'clearedAll':
      return tt('toastClearedAll')
    case 'pathCleared':
      return tt('toastPathCleared')
    case 'toolChanged':
      return tt('toastToolChanged', { name: tt(TOOL_LABEL_KEYS[current.tool]) })
    case 'done':
      return tt('toastDone')
    case 'noPath':
      return tt('toastNoPath')
  }
})

/** 结果类提示配状态图标，普通提示不配，避免干扰 */
const toastIcon = computed<IconName | null>(() => {
  const kind = toast.value?.kind
  if (kind === 'done') return 'status-success'
  if (kind === 'noPath') return 'status-warning'
  return null
})

/* ============================================
   快捷键
   ============================================ */

function onKeydown(event: KeyboardEvent): void {
  if (event.repeat) return
  // 带修饰键的组合（Ctrl+R、Cmd+C 等）留给浏览器，不抢作工具快捷键
  if (event.ctrlKey || event.metaKey || event.altKey) return

  switch (event.key.toLowerCase()) {
    case 'r':
      run()
      break
    case 'c':
      clearPath()
      break
    case 'x':
      clearAll()
      break
    case 'g':
      randomize('key')
      break
    case 'w':
      setTool('wall')
      break
    case 'e':
      setTool('erase')
      break
    case 'q':
      setTool('weight')
      break
    case 'm':
      setTool('move')
      break
  }
}

onMounted(() => {
  // 旧版把快捷键挂在 window 上且从不卸载；此处跟随组件生命周期
  window.addEventListener('keydown', onKeydown)
  showHint()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
@import './pathfinding-visualize.css';
</style>
