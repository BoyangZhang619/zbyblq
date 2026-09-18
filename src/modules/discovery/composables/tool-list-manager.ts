/**
 * 工具列表管理器
 *
 * 负责工具的筛选与排序。数据源为各工具的 manifest，见
 * docs/01-refactor-structure.md §6
 */

import { getTools, getToolsByTag } from '@/modules/tools'
import type { ToolManifest } from '@/modules/tools'

export type SortBy = 'default' | 'name' | 'updated'

export interface ToolListOptions {
  /** 按标签筛选 */
  category?: string
  sortBy?: SortBy
}

export class ToolListManager {
  public getToolList(options: ToolListOptions = {}): ToolManifest[] {
    const { category, sortBy = 'default' } = options

    const tools = category ? getToolsByTag(category) : [...getTools()]

    switch (sortBy) {
      case 'name':
        return tools.sort((a, b) => a.title.localeCompare(b.title, 'zh-Hans-CN'))
      case 'updated':
        return tools.sort((a, b) =>
          (b.lifecycle.updated ?? '').localeCompare(a.lifecycle.updated ?? ''),
        )
      default:
        return tools
    }
  }

  public getTool(id: string): ToolManifest | undefined {
    return getTools().find(t => t.id === id)
  }
}
