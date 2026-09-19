/**
 * 分类管理器
 *
 * 按标签聚合工具。分类不由中心配置定义，而是从各工具 manifest 的
 * tags 字段派生——新增工具时分类自动收敛。
 *
 * 参见 docs/01-refactor-structure.md §6
 */

import { getTools, getToolsByTag, getAllTags } from '@/modules/tools'
import type { ToolManifest } from '@/modules/tools'
import { tagName, tagDescription, type ToolTag } from '@/shared/i18n'

export interface Category {
  /** 分类标识 */
  id: ToolTag
  /** 显示名，随语言变化 */
  name: string
  count: number
  /** 说明文案，随语言变化 */
  description: string
}

export class CategoryManager {
  private categories: Map<ToolTag, Category> = new Map()
  private tools: ToolManifest[] = []

  constructor() {
    this.initialize()
  }

  private initialize(): void {
    this.tools = getTools()

    for (const tag of getAllTags()) {
      const toolsInTag = getToolsByTag(tag)
      this.categories.set(tag, {
        id: tag,
        name: tagName(tag),
        count: toolsInTag.length,
        description: tagDescription(tag),
      })
    }
  }

  /** 全部分类，按工具数量降序 */
  public getCategories(): Category[] {
    return Array.from(this.categories.values()).sort((a, b) => b.count - a.count)
  }

  public getCategoryById(id: ToolTag): Category | undefined {
    return this.categories.get(id)
  }

  public getToolsByCategory(categoryId: ToolTag): ToolManifest[] {
    return getToolsByTag(categoryId)
  }

  public getAllTools(): ToolManifest[] {
    return this.tools
  }

  public getCategoryCount(): number {
    return this.categories.size
  }

  public isCategoryExists(categoryId: ToolTag): boolean {
    return this.categories.has(categoryId)
  }
}
