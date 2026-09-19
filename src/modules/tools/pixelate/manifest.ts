/**
 * Pixelate · 图片像素化 的模块自声明
 *
 * 本文件是该工具的唯一数据来源。路由表与分类页均从此派生，
 * 不再维护中心化的工具清单。参见 docs/01-refactor-structure.md §6
 */

import type { ToolManifest } from '../types'

export const manifest: ToolManifest = {
  id: 'pixelate',
  title: 'Pixelate · 图片像素化',
  description: '上传图片 → 调像素块大小 → 导出PNG（可选限制色板 8/16/32 色）',
  icon: 'tool-pixelate',
  plant: 'clover',
  route: {
    path: '/tools/pixelate',
    name: 'tool-pixelate',
  },
  tags: ['图像', '工具'],
  badge: 'IDK',
  status: 'active',
  entry: 'iframe',
  lifecycle: {
    updated: '2026-01-06',
  },
}
