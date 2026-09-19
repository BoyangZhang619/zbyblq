/**
 * 二叉树可视化 的模块自声明
 *
 * 本文件是该工具的唯一数据来源。路由表与分类页均从此派生，
 * 不再维护中心化的工具清单。参见 docs/01-refactor-structure.md §6
 */

import type { ToolManifest } from '../types'

export const manifest: ToolManifest = {
  id: 'btree-visual',
  title: { 'zh-CN': '二叉树可视化', en: 'Binary Tree Visualizer' },
  description: { 'zh-CN': '输入层序遍历数组，自动生成可视化二叉树，支持保存为图片', en: 'Enter a level-order array to generate a tree diagram. Exportable as an image.' },
  icon: 'tool-btree',
  plant: 'fern',
  route: {
    path: '/tools/btree-visual',
    name: 'tool-btree-visual',
  },
  tags: ['algorithm', 'utility'],
  badge: 'USELESS',
  status: 'active',
  entry: 'iframe',
  lifecycle: {
    updated: '2026-01-03',
  },
}
