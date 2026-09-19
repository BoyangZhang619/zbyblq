/**
 * 排序算法可视化 的模块自声明
 *
 * 本文件是该工具的唯一数据来源。路由表与分类页均从此派生，
 * 不再维护中心化的工具清单。参见 docs/01-refactor-structure.md §6
 */

import type { ToolManifest } from '../types'

export const manifest: ToolManifest = {
  id: 'sort-viz',
  title: { 'zh-CN': '排序算法可视化', en: 'Sorting Visualizer' },
  description: { 'zh-CN': '支持冒泡/选择/插入/归并/快速，观察比较与交换过程，支持调速与单步执行', en: 'Watch bubble, selection, insertion, merge and quick sort, step by step.' },
  icon: 'tool-sort',
  plant: 'bamboo',
  route: {
    path: '/tools/sort-viz',
    name: 'tool-sort-viz',
  },
  tags: ['algorithm', 'utility'],
  badge: 'GOOD-LOOKING',
  status: 'active',
  entry: 'iframe',
  lifecycle: {
    updated: '2026-01-06',
  },
}
