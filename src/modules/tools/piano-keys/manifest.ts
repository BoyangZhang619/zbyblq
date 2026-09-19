/**
 * Piano Keys 的模块自声明
 *
 * 本文件是该工具的唯一数据来源。路由表与分类页均从此派生，
 * 不再维护中心化的工具清单。参见 docs/01-refactor-structure.md §6
 */

import type { ToolManifest } from '../types'

export const manifest: ToolManifest = {
  id: 'piano-keys',
  title: { 'zh-CN': 'Piano Keys', en: 'Piano Keys' },
  description: { 'zh-CN': '基于 Web Audio API 的在线钢琴，支持键盘演奏、多种音色切换、预设曲目播放', en: 'A Web Audio piano with keyboard play, several timbres and preset songs.' },
  icon: 'tool-piano',
  plant: 'fern',
  route: {
    path: '/tools/piano-keys',
    name: 'tool-piano-keys',
  },
  tags: ['music'],
  badge: 'INTERESTING',
  status: 'active',
  entry: 'native',
  lifecycle: {
    updated: '2026-01-04',
  },
}
