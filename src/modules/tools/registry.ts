/**
 * 工具注册表
 *
 * 聚合各工具模块的 manifest，是获取工具列表的唯一入口。
 * 本文件的导入列表由脚本生成，新增工具时需在此登记。
 *
 * 参见 docs/01-refactor-structure.md §6
 */

import type { ToolManifest, ToolStatus } from './types'
import { manifest as BtreeVisual } from './btree-visual/manifest'
import { manifest as EftTool } from './eft-tool/manifest'
import { manifest as EncryptionGraph } from './encryption-graph/manifest'
import { manifest as DrumPad } from './drum-pad/manifest'
import { manifest as Kalimba } from './kalimba/manifest'
import { manifest as SortViz } from './sort-viz/manifest'
import { manifest as Img2ascii } from './img2ascii/manifest'
import { manifest as Pixelate } from './pixelate/manifest'
import { manifest as FloydSteinberg } from './floyd-steinberg/manifest'
import { manifest as PathfindingVisualize } from './pathfinding-visualize/manifest'
import { manifest as PhotoPatina } from './photo-patina/manifest'
import { manifest as PianoKeys } from './piano-keys/manifest'

/** 全部工具，按 manifest 登记顺序 */
export const ALL_TOOLS: readonly ToolManifest[] = [
  BtreeVisual,
  EftTool,
  EncryptionGraph,
  DrumPad,
  Kalimba,
  SortViz,
  Img2ascii,
  Pixelate,
  FloydSteinberg,
  PathfindingVisualize,
  PhotoPatina,
  PianoKeys,
]

/* ============================================
   查询
   ============================================ */

export function getToolById(id: string): ToolManifest | undefined {
  return ALL_TOOLS.find(t => t.id === id)
}

export function getToolByRouteName(name: string): ToolManifest | undefined {
  return ALL_TOOLS.find(t => t.route.name === name)
}

/** 按状态筛选，默认只取 active */
export function getTools(status: ToolStatus = 'active'): ToolManifest[] {
  return ALL_TOOLS.filter(t => t.status === status)
}

export function getToolsByTag(tag: string): ToolManifest[] {
  return getTools().filter(t => t.tags.includes(tag))
}

/** 全部标签，按工具数量降序 */
export function getAllTags(): string[] {
  const counts = new Map<string, number>()
  for (const tool of getTools()) {
    for (const tag of tool.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag]) => tag)
}
