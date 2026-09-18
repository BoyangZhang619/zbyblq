/**
 * 路径寻找可视化 的模块自声明
 *
 * 本文件是该工具的唯一数据来源。路由表与分类页均从此派生，
 * 不再维护中心化的工具清单。参见 docs/01-refactor-structure.md §6
 */

import type { ToolManifest } from '../types'

export const manifest: ToolManifest = {
  id: 'pathfinding-visualize',
  title: '路径寻找可视化',
  description: '可视化不同路径寻找算法的过程，支持多种算法与参数设置',
  icon: 'tool-path',
  route: {
    path: '/tools/pathfinding-visualize',
    name: 'tool-pathfinding-visualize',
  },
  tags: ['算法', '工具'],
  badge: 'INTERESTING',
  status: 'active',
  entry: 'iframe',
  lifecycle: {
    updated: '2026-01-06',
  },
}
