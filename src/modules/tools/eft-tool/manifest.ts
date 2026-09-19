/**
 * 英文字体转换工具 的模块自声明
 *
 * 本文件是该工具的唯一数据来源。路由表与分类页均从此派生，
 * 不再维护中心化的工具清单。参见 docs/01-refactor-structure.md §6
 */

import type { ToolManifest } from '../types'

export const manifest: ToolManifest = {
  id: 'eft-tool',
  title: { 'zh-CN': '英文字体转换工具', en: 'Font Style Converter' },
  description: { 'zh-CN': '输入英文，点击样式即可一键转换特殊字体，支持多种花体/粗体/斜体等Unicode样式。', en: 'Type English text and pick a style to convert it into Unicode letterforms.' },
  icon: 'tool-font',
  plant: 'flower',
  route: {
    path: '/tools/eft-tool',
    name: 'tool-eft-tool',
  },
  tags: ['utility'],
  badge: 'not NEW',
  status: 'active',
  entry: 'native',
  lifecycle: {
    updated: '2026-09-18',
  },
}
