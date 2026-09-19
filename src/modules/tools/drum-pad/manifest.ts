/**
 * Drum Pad 鼓机 的模块自声明
 *
 * 本文件是该工具的唯一数据来源。路由表与分类页均从此派生，
 * 不再维护中心化的工具清单。参见 docs/01-refactor-structure.md §6
 */

import type { ToolManifest } from '../types'

export const manifest: ToolManifest = {
  id: 'drum-pad',
  title: { 'zh-CN': 'Drum Pad 鼓机', en: 'Drum Pad' },
  description: { 'zh-CN': '纯 WebAudio 合成鼓垫：Kick/Snare/Hat/Clap，支持键盘演奏与 16 步编排循环', en: 'A WebAudio drum machine with keyboard play and a 16-step sequencer.' },
  icon: 'tool-drum',
  plant: 'sprout',
  route: {
    path: '/tools/drum-pad',
    name: 'tool-drum-pad',
  },
  tags: ['music'],
  badge: 'IDK',
  status: 'active',
  entry: 'iframe',
  lifecycle: {
    updated: '2026-01-06',
  },
}
