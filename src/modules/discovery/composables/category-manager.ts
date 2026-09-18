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

export interface Category {
  id: string
  name: string
  count: number
  description: string
}

/** 已知分类的说明文案。未在此登记的标签回退为通用描述 */
const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  工具: '实用工具集合',
  算法: '算法可视化与演示',
  图像: '图像处理与转换',
  音乐: '音乐创作与演奏',
  实验: '试验性质的功能',
}

export class CategoryManager {
  private categories: Map<string, Category> = new Map()
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
        name: tag,
        count: toolsInTag.length,
        description: CATEGORY_DESCRIPTIONS[tag] ?? `${tag}相关工具`,
      })
    }
  }

  /** 全部分类，按工具数量降序 */
  public getCategories(): Category[] {
    return Array.from(this.categories.values()).sort((a, b) => b.count - a.count)
  }

  public getCategoryById(id: string): Category | undefined {
    return this.categories.get(id)
  }

  public getToolsByCategory(categoryId: string): ToolManifest[] {
    return getToolsByTag(categoryId)
  }

  public getAllTools(): ToolManifest[] {
    return this.tools
  }

  public getCategoryCount(): number {
    return this.categories.size
  }

  public isCategoryExists(categoryId: string): boolean {
    return this.categories.has(categoryId)
  }
}
