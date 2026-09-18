/**
 * 工具列表数据管理器
 * 负责工具的显示、筛选和导向
 */

import { getPagesByTag, getAllToolPages, getPageInfo } from '@/modules/tools'
import type { NavItem } from '@/modules/tools'

export interface ToolListOptions {
  category?: string
  sortBy?: 'name' | 'date' | 'default'
  filterInactive?: boolean
}

export class ToolListManager {
  /**
   * 获取工具列表
   */
  public getToolList(options?: ToolListOptions): NavItem[] {
    let tools: NavItem[] = []

    // 按分类获取或获取全部
    if (options?.category) {
      tools = getPagesByTag(options.category)
    } else {
      tools = getAllToolPages()
    }

    // 筛选活跃工具
    if (options?.filterInactive !== false) {
      tools = tools.filter(t => t.status === 'active')
    }

    // 排序
    if (options?.sortBy === 'name') {
      tools = [...tools].sort((a, b) => a.title.localeCompare(b.title, 'zh'))
    } else if (options?.sortBy === 'date') {
      tools = [...tools].sort((a, b) => {
        const dateA = new Date(b.updateTime || b.createTime || '').getTime()
        const dateB = new Date(a.updateTime || a.createTime || '').getTime()
        return dateA - dateB
      })
    }

    return tools
  }

  /**
   * 按ID获取单个工具
   */
  public getToolById(toolId: string): NavItem | undefined {
    return getPageInfo(toolId)
  }

  /**
   * 获取工具的路由路径
   */
  public getToolPath(tool: NavItem): string {
    return tool.href || `/tools/${tool.id}`
  }

  /**
   * 验证工具是否存在
   */
  public isToolExists(toolId: string): boolean {
    return getPageInfo(toolId) !== undefined
  }
}
