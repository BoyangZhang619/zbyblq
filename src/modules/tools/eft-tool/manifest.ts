/**
 * 英文字体转换工具 的模块自声明
 *
 * 本文件是该工具的唯一数据来源。路由表与分类页均从此派生，
 * 不再维护中心化的工具清单。参见 docs/01-refactor-structure.md §6
 */

import type { ToolManifest } from '../types'

export const manifest: ToolManifest = {
  id: 'eft-tool',
  title: '英文字体转换工具',
  description: '输入英文，点击样式即可一键转换特殊字体，支持多种花体/粗体/斜体等Unicode样式。',
  icon: 'tool-font',
  route: {
    path: '/tools/eft-tool',
    name: 'tool-eft-tool',
  },
  tags: ['工具'],
  badge: 'not NEW',
  status: 'active',
  entry: 'iframe',
  lifecycle: {
    updated: '2026-01-02',
  },
}
