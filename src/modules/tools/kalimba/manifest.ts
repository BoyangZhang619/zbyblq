/**
 * Kalimba 拇指琴 的模块自声明
 *
 * 本文件是该工具的唯一数据来源。路由表与分类页均从此派生，
 * 不再维护中心化的工具清单。参见 docs/01-refactor-structure.md §6
 */

import type { ToolManifest } from '../types'

export const manifest: ToolManifest = {
  id: 'kalimba',
  title: { 'zh-CN': 'Kalimba 拇指琴', en: 'Kalimba' },
  description: { 'zh-CN': '纯 WebAudio 合成拇指琴：点击/键盘演奏，支持调式选择与录制循环，音色治愈', en: 'A WebAudio thumb piano with scale selection, loop recording and a warm tone.' },
  icon: 'tool-kalimba',
  plant: 'flower',
  route: {
    path: '/tools/kalimba',
    name: 'tool-kalimba',
  },
  tags: ['music'],
  badge: 'IDK',
  status: 'active',
  entry: 'iframe',
  lifecycle: {
    updated: '2026-01-06',
  },
}
