/**
 * 小番茄图片混淆 的模块自声明
 *
 * 本文件是该工具的唯一数据来源。路由表与分类页均从此派生，
 * 不再维护中心化的工具清单。参见 docs/01-refactor-structure.md §6
 */

import type { ToolManifest } from '../types'

export const manifest: ToolManifest = {
  id: 'encryption-graph',
  title: '小番茄图片混淆',
  description: '基于空间填充曲线的图片混淆工具，混淆后压缩仍保持色彩，支持混淆/解混淆/还原操作',
  icon: 'tool-scramble',
  plant: 'rosette',
  route: {
    path: '/tools/encryption-graph',
    name: 'tool-encryption-graph',
  },
  tags: ['图像', '工具'],
  badge: 'XIXI',
  status: 'active',
  entry: 'iframe',
  lifecycle: {
    updated: '2026-01-02',
  },
}
