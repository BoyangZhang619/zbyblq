/**
 * 工具列表管理器
 *
 * 负责工具的筛选与排序。数据源为各工具的 manifest，见
 * docs/01-refactor-structure.md §6
 */

import { getTools, getToolsByTag } from '@/modules/tools'
import { lt, type Locale, type ToolTag } from '@/shared/i18n'
import type { ToolManifest } from '@/modules/tools'

export type SortBy = 'default' | 'name' | 'updated'

export interface ToolListOptions {
  /** 按分类筛选 */
  category?: ToolTag
  sortBy?: SortBy
}

export class ToolListManager {
  /**
   * @param locale 按名称排序时使用的语言。名称已本地化，排序规则必须
   *               跟随当前语言，否则中文环境会按英文字母序排列
   */
  public getToolList(options: ToolListOptions & { locale?: Locale } = {}): ToolManifest[] {
    const { category, sortBy = 'default', locale = 'zh-CN' } = options

    const tools = category ? getToolsByTag(category) : [...getTools()]

    switch (sortBy) {
      case 'name':
        return tools.sort((a, b) =>
          a.title[locale].localeCompare(b.title[locale], locale),
        )
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

  /** 取工具的当前语言名称 */
  public static titleOf(tool: ToolManifest): string {
    return lt(tool.title)
  }
}
