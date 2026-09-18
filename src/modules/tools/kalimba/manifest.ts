/**
 * Kalimba 拇指琴 的模块自声明
 *
 * 本文件是该工具的唯一数据来源。路由表与分类页均从此派生，
 * 不再维护中心化的工具清单。参见 docs/01-refactor-structure.md §6
 */

import type { ToolManifest } from '../types'

export const manifest: ToolManifest = {
  id: 'kalimba',
  title: 'Kalimba 拇指琴',
  description: '纯 WebAudio 合成拇指琴：点击/键盘演奏，支持调式选择与录制循环，音色治愈',
  icon: 'tool-kalimba',
  route: {
    path: '/tools/kalimba',
    name: 'tool-kalimba',
  },
  tags: ['音乐'],
  badge: 'IDK',
  status: 'active',
  entry: 'iframe',
  lifecycle: {
    updated: '2026-01-06',
  },
}
