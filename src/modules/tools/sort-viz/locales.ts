/**
 * 排序算法可视化 的界面文案
 *
 * 放在工具目录内而非全局文案表：文案与工具同生命周期，且多个工具并行
 * 开发时不会互相冲突。用法见 src/shared/i18n/index.ts 的 useToolI18n。
 *
 * 语种完整性由类型系统保证：基准语种为 zh-CN，en 声明为
 * Record<SortVizKey, string>，漏翻或写错键名都会在 vue-tsc 阶段报错。
 */

import type { Localized } from '@/shared/i18n'

const zhCN = {
  title: '排序算法可视化',
  subtitle: '选择算法、调节数量与速度，观察比较与交换如何发生。',

  algoLabel: '算法',
  algorithmBubble: '冒泡排序',
  algorithmSelection: '选择排序',
  algorithmInsertion: '插入排序',
  algorithmMerge: '归并排序',
  algorithmQuick: '快速排序',

  sizeLabel: '数量',
  speedLabel: '速度',

  actionRandom: '随机',
  actionReverse: '反转',
  actionNearly: '近乎有序',
  actionStart: '开始',
  actionPause: '暂停',
  actionResume: '继续',
  actionStep: '单步',
  actionReset: '重置',

  statCompare: '比较',
  statWrite: '交换 / 写入',
  statStatus: '状态',

  'status.ready': '就绪',
  'status.randomized': '已随机',
  'status.reversed': '已反转',
  'status.nearly': '已生成近乎有序',
  'status.sorting': '排序中…',
  'status.paused': '已暂停',
  'status.stepping': '单步（已暂停）',
  'status.done': '完成',

  barsLabel: '排序可视化柱状图，共 {count} 个柱',
  rangeMerge: '归并区间',
  rangeQuick: '快速区间',
  tipValue: '值：{value}',
  tipIndex: '下标：{index}',

  helpSummary: '使用说明与提示',
  helpTip1: '开始排序后仍可调速度；调数量会触发重置，避免状态冲突。',
  helpTip2: '归并、快速属于分治，会看到较多写入而不是纯交换。',
  helpTip3: '若想看清对比，数量建议取 40 至 90 之间。',
}

/** 文案键，由基准语种推导 */
export type SortVizKey = keyof typeof zhCN

const en: Record<SortVizKey, string> = {
  title: 'Sorting Visualizer',
  subtitle: 'Pick an algorithm, tune the count and speed, and watch comparisons and swaps unfold.',

  algoLabel: 'Algorithm',
  algorithmBubble: 'Bubble sort',
  algorithmSelection: 'Selection sort',
  algorithmInsertion: 'Insertion sort',
  algorithmMerge: 'Merge sort',
  algorithmQuick: 'Quick sort',

  sizeLabel: 'Count',
  speedLabel: 'Speed',

  actionRandom: 'Random',
  actionReverse: 'Reverse',
  actionNearly: 'Nearly sorted',
  actionStart: 'Start',
  actionPause: 'Pause',
  actionResume: 'Resume',
  actionStep: 'Step',
  actionReset: 'Reset',

  statCompare: 'Comparisons',
  statWrite: 'Swaps / writes',
  statStatus: 'Status',

  'status.ready': 'Ready',
  'status.randomized': 'Randomized',
  'status.reversed': 'Reversed',
  'status.nearly': 'Nearly sorted',
  'status.sorting': 'Sorting…',
  'status.paused': 'Paused',
  'status.stepping': 'Step mode (paused)',
  'status.done': 'Done',

  barsLabel: 'Sorting visualization bars, {count} in total',
  rangeMerge: 'Merge range',
  rangeQuick: 'Quick range',
  tipValue: 'Value: {value}',
  tipIndex: 'Index: {index}',

  helpSummary: 'How to use it',
  helpTip1: 'You can still change the speed while sorting; changing the count resets the array.',
  helpTip2: 'Merge and quick sort are divide-and-conquer, so you will see more writes than swaps.',
  helpTip3: 'For the clearest contrast, a count between 40 and 90 works best.',
}

export const messages: Localized<Record<SortVizKey, string>> = {
  'zh-CN': zhCN,
  en,
}
