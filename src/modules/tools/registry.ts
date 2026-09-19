/**
 * 工具注册表
 *
 * 聚合各工具模块的 manifest，是获取工具列表的唯一入口。
 * 本文件的导入列表由脚本生成，新增工具时需在此登记。
 *
 * 参见 docs/01-refactor-structure.md §6
 */

import type { ToolManifest, ToolStatus } from './types'
import { TAG_ORDER, type ToolTag } from '@/shared/i18n'
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

export function getToolsByTag(tag: ToolTag): ToolManifest[] {
  return getTools().filter(t => t.tags.includes(tag))
}

/**
 * 货架分组
 *
 * 按**首个标签**（主分类）分组，保证一个工具只出现在一个货架上。
 * 与 getAllTags 的区别：后者按全部标签聚合，多标签工具会重复出现，
 * 只适合分类页的检索，不适合首页货架。
 */
export interface Shelf {
  /** 分类标识。显示名由 i18n 的 tag.* 提供 */
  tag: ToolTag
  tools: ToolManifest[]
}

export function getShelves(): Shelf[] {
  const shelves = new Map<ToolTag, ToolManifest[]>()

  for (const tool of getTools()) {
    const primary = tool.tags[0]
    if (!primary) continue
    const bucket = shelves.get(primary)
    if (bucket) bucket.push(tool)
    else shelves.set(primary, [tool])
  }

  // 工具多的货架排前面；数量相同则按分类 ID 的固定顺序，保证切换语言
  // 时货架次序不跳动
  return [...shelves.entries()]
    .map(([tag, tools]) => ({ tag, tools }))
    .sort((a, b) => b.tools.length - a.tools.length || TAG_ORDER.indexOf(a.tag) - TAG_ORDER.indexOf(b.tag))
}

/**
 * 按主分类取工具
 *
 * 与 getToolsByTag 的区别：后者按任意标签匹配，多标签工具会重复出现。
 * 分类页必须与首页货架用同一套分组，否则会出现「货架上 1 个、
 * 详情页 9 个」的矛盾——所以详情页走本函数。
 */
export function getToolsByPrimaryTag(tag: ToolTag): ToolManifest[] {
  return getTools().filter(t => t.tags[0] === tag)
}

/** 全部标签，按工具数量降序 */
export function getAllTags(): ToolTag[] {
  const counts = new Map<ToolTag, number>()
  for (const tool of getTools()) {
    for (const tag of tool.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag]) => tag)
}
