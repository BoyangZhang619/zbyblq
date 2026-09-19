<template>
  <div class="sortviz">
    <div class="page-content">
      <header class="sortviz__header">
        <h1 class="sortviz__title">{{ tt('title') }}</h1>
        <p class="sortviz__subtitle">{{ tt('subtitle') }}</p>
      </header>

      <!-- 控制面板 -->
      <div class="sortviz__panel">
        <div class="sortviz__fields">
          <div class="sortviz__field">
            <label class="sortviz__label" for="sortviz-algo">{{ tt('algoLabel') }}</label>
            <select id="sortviz-algo" v-model="algo" class="sortviz__select" :disabled="isSorting">
              <option v-for="item in SORT_ALGOS" :key="item" :value="item">
                {{ tt(ALGO_LABELS[item]) }}
              </option>
            </select>
          </div>

          <div class="sortviz__field">
            <label class="sortviz__label" for="sortviz-size">{{ tt('sizeLabel') }}</label>
            <input
              id="sortviz-size"
              v-model.number="size"
              class="app-range"
              type="range"
              :min="SIZE_MIN"
              :max="SIZE_MAX"
              step="1"
              :disabled="isSorting"
              @change="regenerate"
            />
            <span class="sortviz__value">{{ size }}</span>
          </div>

          <div class="sortviz__field">
            <label class="sortviz__label" for="sortviz-speed">{{ tt('speedLabel') }}</label>
            <input
              id="sortviz-speed"
              v-model.number="speed"
              class="app-range"
              type="range"
              :min="SPEED_MIN"
              :max="SPEED_MAX"
              step="1"
            />
            <span class="sortviz__value">{{ speed }}</span>
          </div>
        </div>

        <div class="sortviz__actions">
          <button
            class="sortviz__btn"
            type="button"
            :disabled="isSorting"
            @click="generate('random')"
          >
            <AppIcon name="shuffle" :size="16" decorative />
            {{ tt('actionRandom') }}
          </button>
          <button
            class="sortviz__btn"
            type="button"
            :disabled="isSorting"
            @click="generate('reverse')"
          >
            {{ tt('actionReverse') }}
          </button>
          <button
            class="sortviz__btn"
            type="button"
            :disabled="isSorting"
            @click="generate('nearly')"
          >
            <AppIcon name="sparkle" :size="16" decorative />
            {{ tt('actionNearly') }}
          </button>

          <span class="sortviz__divider" aria-hidden="true"></span>

          <button
            class="sortviz__btn sortviz__btn--primary"
            type="button"
            :disabled="isSorting"
            @click="start"
          >
            {{ tt('actionStart') }}
          </button>
          <button class="sortviz__btn" type="button" :disabled="!isSorting" @click="togglePause">
            {{ isPaused ? tt('actionResume') : tt('actionPause') }}
          </button>
          <button class="sortviz__btn" type="button" :disabled="!isSorting" @click="stepOnce">
            {{ tt('actionStep') }}
          </button>
          <button class="sortviz__btn sortviz__btn--danger" type="button" @click="reset">
            {{ tt('actionReset') }}
          </button>
        </div>

        <div class="app-stats">
          <div class="app-stat">
            <span class="app-stat__label">{{ tt('statCompare') }}</span>
            <span class="app-stat__value">{{ compareCount }}</span>
          </div>
          <div class="app-stat">
            <span class="app-stat__label">{{ tt('statWrite') }}</span>
            <span class="app-stat__value">{{ writeCount }}</span>
          </div>
          <div class="app-stat">
            <span class="app-stat__label">{{ tt('statStatus') }}</span>
            <span class="app-stat__value" :class="{ 'is-done': isDone }" aria-live="polite">
              <AppIcon v-if="isDone" name="check" :size="14" decorative />
              {{ statusText }}
            </span>
          </div>
        </div>
      </div>

      <!-- 柱状图 -->
      <div class="sortviz__viz">
        <div class="sortviz__bars" role="img" :aria-label="tt('barsLabel', { count: values.length })">
          <div class="sortviz__shade-layer">
            <div
              v-if="shadeRect"
              class="sortviz__shade"
              :class="shadeRect.kind === 'quick' ? 'is-quick' : 'is-merge'"
              :style="{ left: shadeRect.left, width: shadeRect.width }"
            ></div>
          </div>

          <div
            v-for="(value, i) in values"
            :key="i"
            class="sortviz__bar"
            :class="{
              'is-active': i === activeA || i === activeB,
              'is-pivot': i === pivotIndex,
              'is-sorted': sortedSet.has(i),
            }"
            :style="{ height: `${value}%` }"
            @mouseenter="showTip(i, $event)"
            @mousemove="moveTip($event)"
            @mouseleave="hideTip"
          ></div>

          <!-- 区间标签另起一层，压在柱体之上，几何与区间层完全一致 -->
          <div class="sortviz__shade-layer sortviz__shade-layer--label">
            <span
              v-if="shadeRect"
              class="sortviz__shade-label"
              :style="{ left: shadeRect.left }"
            >
              {{ shadeRect.kind === 'quick' ? tt('rangeQuick') : tt('rangeMerge') }}
              [{{ shadeRect.l }}, {{ shadeRect.r }}]
            </span>
          </div>
        </div>
      </div>

      <details class="sortviz__help">
        <summary class="sortviz__help-summary">
          <AppIcon name="hint" :size="18" decorative />
          {{ tt('helpSummary') }}
        </summary>
        <ul class="sortviz__help-list">
          <li class="sortviz__help-item">{{ tt('helpTip1') }}</li>
          <li class="sortviz__help-item">{{ tt('helpTip2') }}</li>
          <li class="sortviz__help-item">{{ tt('helpTip3') }}</li>
        </ul>
      </details>

      <!-- 悬停提示：跟随指针，纯视觉，故对读屏隐藏 -->
      <div
        class="sortviz__tip"
        :class="{ 'is-visible': hoveredIndex >= 0 }"
        :style="{ left: `${tipX}px`, top: `${tipY}px` }"
        aria-hidden="true"
      >
        <div class="sortviz__tip-value">{{ tt('tipValue', { value: hoveredValue }) }}</div>
        <div class="sortviz__tip-index">{{ tt('tipIndex', { index: hoveredIndex }) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { AppIcon } from '@/shared/icons'
import { useToolI18n } from '@/shared/i18n'
import {
  SIZE_MAX,
  SIZE_MIN,
  SORT_ALGOS,
  SPEED_MAX,
  SPEED_MIN,
  clamp,
  type SortAlgo,
} from './composables/useSortSteps'
import { useSortViz, type StatusKey } from './composables/useSortViz'
import { messages, type SortVizKey } from './locales'

/**
 * 排序算法可视化
 *
 * 融合迁移完成（docs/02-fusion-architecture.md Stage 3）：由 iframe 桥接改为
 * 原生 Vue 组件。与旧实现的对应关系：
 * - 步进生成器 → composables/useSortSteps.ts（纯函数，与 DOM 无关）
 * - 运行状态与动画循环 → composables/useSortViz.ts（循环由 Vue 生命周期驱动）
 * - 柱状图、区间高亮、悬停提示 → 本文件的模板，声明式渲染取代手工建元素
 */

const { tt } = useToolI18n(messages)

const {
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
} = useSortViz()

/**
 * 键到文案的映射写成常量表而非模板字符串拼接，
 * 键名因此有类型约束，文案键改名会连带报错。
 */
const ALGO_LABELS = {
  bubble: 'algorithmBubble',
  selection: 'algorithmSelection',
  insertion: 'algorithmInsertion',
  merge: 'algorithmMerge',
  quick: 'algorithmQuick',
} as const satisfies Record<SortAlgo, SortVizKey>

const STATUS_LABELS = {
  ready: 'status.ready',
  randomized: 'status.randomized',
  reversed: 'status.reversed',
  nearly: 'status.nearly',
  sorting: 'status.sorting',
  paused: 'status.paused',
  stepping: 'status.stepping',
  done: 'status.done',
} as const satisfies Record<StatusKey, SortVizKey>

const statusText = computed(() => tt(STATUS_LABELS[status.value]))

/* ============================================
   区间高亮

   旧实现用百分比估算区间位置（未计入 flex 间隙），此处沿用同一估算方式，
   观感与旧版一致。下标越界时钳制到有效范围。
   ============================================ */

const shadeRect = computed(() => {
  const current = shade.value
  const n = values.value.length
  if (!current || n <= 0) return null

  const l = clamp(current.l, 0, n - 1)
  const r = clamp(current.r, 0, n - 1)
  if (l > r) return null

  return {
    kind: current.kind,
    l,
    r,
    left: `${(l / n) * 100}%`,
    width: `${((r - l + 1) / n) * 100}%`,
  }
})

/* ============================================
   悬停提示
   ============================================ */

/** 提示框相对指针的偏移，与旧实现同值 */
const TIP_OFFSET = 14

const hoveredIndex = ref(-1)
const tipX = ref(0)
const tipY = ref(0)

const hoveredValue = computed(() => values.value[hoveredIndex.value] ?? 0)

function showTip(index: number, event: MouseEvent): void {
  hoveredIndex.value = index
  moveTip(event)
}

function moveTip(event: MouseEvent): void {
  tipX.value = event.clientX + TIP_OFFSET
  tipY.value = event.clientY + TIP_OFFSET
}

function hideTip(): void {
  hoveredIndex.value = -1
}

// 窗口失焦后指针位置不再可信，收起提示（旧实现挂在 window 上的 blur）
onMounted(() => {
  window.addEventListener('blur', hideTip)
})

onBeforeUnmount(() => {
  window.removeEventListener('blur', hideTip)
})
</script>

<style scoped>
@import './sort-viz.css';
</style>
