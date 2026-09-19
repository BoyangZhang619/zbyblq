<template>
  <div class="hm">
    <div ref="root" class="hm__body">
      <!-- 星期标签：只标一、三、五，七行全标在窄屏上会糊成一片 -->
      <ul class="hm__labels" :style="labelStyle" aria-hidden="true">
        <li v-for="(label, i) in dayLabels" :key="i" class="hm__label">{{ label }}</li>
      </ul>

      <div class="hm__grid" :style="gridStyle" role="img" :aria-label="summary">
        <span
          v-for="cell in cells"
          :key="cell.key"
          class="hm__cell"
          :data-level="cell.level"
          :title="cell.title"
        />
      </div>
    </div>

    <div class="hm__foot">
      <span class="hm__foot-text">{{ footerText }}</span>
      <ul class="hm__legend" aria-hidden="true">
        <li v-for="l in [0, 1, 2, 3, 4]" :key="l" class="hm__cell hm__cell--legend" :data-level="l" />
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from '@/shared/i18n'

/**
 * 足迹热力图
 *
 * 布局：一列一周，**时间由左向右递增，最右一列为当周**。
 * 当周只画到今天——不画未来，否则空着的格子会被读成「那天没做事」。
 *
 * 周数不是写死的，而是按可用宽度反推（见 weekCount）。
 * 各列间距与各行间距取同一值，格子宽度由「扣掉间距后的余量 ÷ 周数」
 * 得出，因此整块能精确铺满容器而不留零头。
 */

const props = withDefaults(defineProps<{
  /** YYYY-MM-DD -> 当天次数 */
  data: Record<string, number>
  /** 起点为星期几，0 为周日 */
  weekStartsOn?: number
}>(), {
  weekStartsOn: 1,
})

const { t, locale } = useI18n()

/* ============================================
   尺寸：按容器宽度反推周数
   ============================================ */

/** 目标格子边长。实际值由反推得出，这是取整前的期望 */
const TARGET_CELL = 11
/** 列间距与行间距取同一值——两者不等会让视觉节奏散掉 */
const GAP = 3
/** 左侧星期标签占位 */
const LABEL_WIDTH = 16
/** 窄屏下至少保证的周数，再少就看不出趋势 */
const MIN_WEEKS = 8

const root = ref<HTMLElement | null>(null)
const available = ref(0)

let ro: ResizeObserver | null = null

onMounted(() => {
  if (!root.value) return
  ro = new ResizeObserver((entries) => {
    const w = entries[0]?.contentRect.width ?? 0
    if (w > 0) available.value = w
  })
  ro.observe(root.value)
  available.value = root.value.clientWidth
})

onBeforeUnmount(() => {
  ro?.disconnect()
  ro = null
})

/** 可容纳的周数 */
const weekCount = computed(() => {
  const usable = available.value - LABEL_WIDTH
  // 容器尚未测量时返回兜底值。注意 Math.max(8, NaN) 仍是 NaN，
  // 会让下游的循环与模板字符串一起失效，所以必须先挡住非有限值
  if (!Number.isFinite(usable) || usable <= 0) return MIN_WEEKS
  const n = Math.floor((usable + GAP) / (TARGET_CELL + GAP))
  return Number.isFinite(n) ? Math.max(MIN_WEEKS, n) : MIN_WEEKS
})

/** 反推格子边长，使 N 格 + (N-1) 个间距恰好铺满 */
const cellSize = computed(() => {
  const usable = available.value - LABEL_WIDTH
  const n = weekCount.value
  if (!Number.isFinite(usable) || usable <= 0 || n <= 0) return TARGET_CELL
  const size = (usable - (n - 1) * GAP) / n
  return Number.isFinite(size) && size > 0 ? size : TARGET_CELL
})

const gridStyle = computed(() => ({
  gridTemplateRows: `repeat(7, ${cellSize.value}px)`,
  /*
    必须显式给出列宽。
    grid-auto-flow: column 下每列的宽度默认是 auto，而单元格是空 span
    ——没有内容就没有宽度，整列会塌成 0。行高由 gridTemplateRows 定，
    列宽必须由 gridAutoColumns 定，两者缺一不可。
  */
  gridAutoColumns: `${cellSize.value}px`,
  gap: `${GAP}px`,
}))

const labelStyle = computed(() => ({
  gridTemplateRows: `repeat(7, ${cellSize.value}px)`,
  gap: `${GAP}px`,
  width: `${LABEL_WIDTH}px`,
}))

/* ============================================
   数据
   ============================================ */

const maxCount = computed(() => {
  const values = Object.values(props.data)
  return values.length ? Math.max(...values) : 0
})

function levelOf(count: number): number {
  if (!count) return 0
  if (maxCount.value <= 1) return 2
  const ratio = count / maxCount.value
  if (ratio <= 0.25) return 1
  if (ratio <= 0.5) return 2
  if (ratio <= 0.75) return 3
  return 4
}

function dateKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

interface Cell {
  key: string
  level: number
  title: string
}

/**
 * 单元格序列
 *
 * 顺序是「先周后日」，配合 grid-auto-flow: column —— 每周占一列，
 * 列内自上而下为星期。最后一列只到今天，故比其余列短。
 */
const cells = computed<Cell[]>(() => {
  const start = props.weekStartsOn
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 今天在本周内的位置（0 为周首）
  const todayIndex = (today.getDay() - start + 7) % 7

  // 当周的起始日
  const thisWeekStart = new Date(today)
  thisWeekStart.setDate(today.getDate() - todayIndex)

  const n = weekCount.value
  const out: Cell[] = []

  for (let w = n - 1; w >= 0; w--) {
    // w = 0 是当周。左老右新：先放最老的周
    const weekStart = new Date(thisWeekStart)
    weekStart.setDate(thisWeekStart.getDate() - w * 7)

    // 当周只到今天，其余周画满七天
    const lastDay = w === 0 ? todayIndex : 6

    for (let d = 0; d <= lastDay; d++) {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + d)

      const key = dateKey(date)
      const count = props.data[key] ?? 0

      out.push({
        key,
        level: levelOf(count),
        title: count ? t('heatmap.cell', { date: key, count }) : key,
      })
    }
  }
  return out
})

/** 星期标签，只在一、三、五位置写字 */
const dayLabels = computed(() => {
  const fmt = new Intl.DateTimeFormat(locale.value, { weekday: 'narrow' })
  const base = new Date(2024, 0, 7) // 基准日，星期日
  return Array.from({ length: 7 }, (_, i) => {
    if (i % 2 !== 0) return ''
    const d = new Date(base)
    d.setDate(base.getDate() + ((props.weekStartsOn + i) % 7))
    return fmt.format(d)
  })
})

/* ============================================
   统计
   ============================================ */

const totalCount = computed(() =>
  Object.values(props.data).reduce((a, b) => a + b, 0),
)

const activeDays = computed(() =>
  Object.values(props.data).filter(v => v > 0).length,
)

const summary = computed(() =>
  t('heatmap.summary', { days: activeDays.value, count: totalCount.value }),
)

const footerText = summary
</script>

<style scoped>
@import './heatmap.css';
</style>
