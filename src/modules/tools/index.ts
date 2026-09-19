/**
 * tools 模块的公开出口
 *
 * 其他模块只能通过本文件访问工具数据，不得直接 import 各工具的
 * manifest 或内部实现。这条约束保证工具数据源可以独立演进——
 * 例如新增工具时，消费方无需任何改动。
 *
 * 参见 docs/01-refactor-structure.md §3.6 与 §6
 */

export {
  ALL_TOOLS,
  getToolById,
  getToolByRouteName,
  getTools,
  getToolsByTag,
  getToolsByPrimaryTag,
  getAllTags,
  getShelves,
} from './registry'

export type { Shelf } from './registry'
export type { ToolManifest, ToolEntry, ToolStatus } from './types'
