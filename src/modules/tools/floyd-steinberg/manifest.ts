/**
 * Dithering · Floyd–Steinberg 的模块自声明
 *
 * 本文件是该工具的唯一数据来源。路由表与分类页均从此派生，
 * 不再维护中心化的工具清单。参见 docs/01-refactor-structure.md §6
 */

import type { ToolManifest } from '../types'

export const manifest: ToolManifest = {
  id: 'floyd-steinberg',
  title: 'Dithering · Floyd–Steinberg',
  description: '黑白/限定色 Floyd–Steinberg 误差扩散抖动：复古报纸风、GameBoy 风',
  icon: 'tool-dither',
  route: {
    path: '/tools/floyd-steinberg',
    name: 'tool-floyd-steinberg',
  },
  tags: ['图像', '工具'],
  badge: 'USELESS',
  status: 'active',
  entry: 'iframe',
  lifecycle: {
    updated: '2026-01-06',
  },
}
