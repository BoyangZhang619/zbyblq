<template>
  <div class="hm">
    <!-- 星期表头。只标首尾与中点，七列全标在窄屏上会挤成一团 -->
    <ul class="hm__head" aria-hidden="true">
      <li v-for="(label, i) in headLabels" :key="i" class="hm__head-cell">{{ label }}</li>
    </ul>

    <div class="hm__grid" role="img" :aria-label="summary">
      <template v-for="(week, wi) in weeks" :key="wi">
        <span
          v-for="cell in week"
          :key="cell.key"
          class="hm__cell"
          :class="{ 'is-outside': !cell.inRange }"
          :data-level="cell.level"
          :title="cell.title"
        />
      </template>
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
import { computed } from 'vue'
import { useI18n } from '@/shared/i18n'

/**
 * 足迹热力图
 *
 * 布局是「星期为列、周为行」——与常见的 GitHub 图相反。
 * 后者以周为列，在手机竖屏上会横向拉得很长或被迫压缩到看不清；
 * 竖屏更适合窄而高的排布。
 *
 * 只画最近若干周，不画全部历史：热力图的价值在于「最近怎么样」，
 * 无限回溯会让格子小到无法辨认。
 */

const props = withDefaults(defineProps<{
  /** YYYY-MM-DD -> 当天次数 */
  data: Record<string, number>
  /** 显示多少周 */
  weeks?: number
  /** 起点为星期几，0 为周日 */
  weekStartsOn?: number
}>(), {
  weeks: 12,
  weekStartsOn: 1,
})

const { t, locale } = useI18n()

/** 颜色分档。取「有记录」的最大值做归一，而不是固定阈值——
 *  固定阈值会让低频用户永远停在第一档，失去层次 */
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
  count: number
  level: number
  inRange: boolean
  title: string
}

const weeks = computed<Cell[][]>(() => {
  const start = props.weekStartsOn
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 今天所在周的起始日
  const dow = (today.getDay() - start + 7) % 7
  const currentWeekStart = new Date(today)
  currentWeekStart.setDate(today.getDate() - dow)

  const out: Cell[][] = []
  for (let w = props.weeks - 1; w >= 0; w--) {
    const row: Cell[] = []
    for (let d = 0; d < 7; d++) {
      const date = new Date(currentWeekStart)
      date.setDate(currentWeekStart.getDate() - w * 7 + d)

      const key = dateKey(date)
      const count = props.data[key] ?? 0
      const inRange = date <= today

      row.push({
        key,
        count,
        level: inRange ? levelOf(count) : 0,
        inRange,
        title: inRange && count
          ? t('heatmap.cell', { date: key, count })
          : key,
      })
    }
    out.push(row)
  }
  return out
})

/**
 * 星期表头
 *
 * 用 Intl 取本地化的星期名，只保留单字；未提供 Intl 时回落到数字。
 */
const headLabels = computed(() => {
  const fmt = new Intl.DateTimeFormat(locale.value, { weekday: 'narrow' })
  // 2024-01-07 是星期日，作为取名的基准日
  const base = new Date(2024, 0, 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base)
    d.setDate(base.getDate() + ((props.weekStartsOn + i) % 7))
    return fmt.format(d)
  })
})

const totalCount = computed(() =>
  Object.values(props.data).reduce((a, b) => a + b, 0),
)

const activeDays = computed(() =>
  Object.values(props.data).filter(v => v > 0).length,
)

const footerText = computed(() =>
  t('heatmap.summary', { days: activeDays.value, count: totalCount.value }),
)

const summary = computed(() =>
  t('heatmap.summary', { days: activeDays.value, count: totalCount.value }),
)
</script>

<style scoped>
@import './heatmap.css';
</style>
