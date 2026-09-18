/**
 * 图片转 ASCII 的模块自声明
 *
 * 本文件是该工具的唯一数据来源。路由表与分类页均从此派生，
 * 不再维护中心化的工具清单。参见 docs/01-refactor-structure.md §6
 */

import type { ToolManifest } from '../types'

export const manifest: ToolManifest = {
  id: 'img2ascii',
  title: '图片转 ASCII',
  description: '上传图片生成字符画，支持亮度/对比度/反相，彩色 ASCII，可导出 TXT/PNG',
  icon: 'tool-ascii',
  route: {
    path: '/tools/img2ascii',
    name: 'tool-img2ascii',
  },
  tags: ['图像', '工具', '实验'],
  badge: 'INTERESTING',
  status: 'active',
  entry: 'iframe',
  lifecycle: {
    updated: '2026-01-06',
  },
}
