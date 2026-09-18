/**
 * 分类管理器
 * 负责工具分类的组织和筛选
 */

import { getAllToolPages, getPagesByTag, getAllTags } from '@/modules/tools'
import type { NavItem } from '@/modules/tools'

export interface Category {
  id: string
  name: string
  count: number
  description: string
}

export class CategoryManager {
  private categories: Map<string, Category> = new Map()
  private tools: NavItem[] = []

  constructor() {
    this.initialize()
  }

  /**
   * 初始化分类系统
   */
  private initialize(): void {
    this.tools = getAllToolPages()
    const tags = getAllTags()

    tags.forEach(tag => {
      const toolsInTag = getPagesByTag(tag)
      this.categories.set(tag, {
        id: tag,
        name: tag,
        count: toolsInTag.length,
        description: this.getTagDescription(tag),
      })
    })
  }

  /**
   * 获取标签描述
   */
  private getTagDescription(tag: string): string {
    const descriptions: Record<string, string> = {
      '工具': '实用工具集合',
      '算法': '算法可视化和演示',
      '图像': '图像处理工具',
      '音乐': '音乐创作和播放工具',
      '实验': '实验性功能',
    }
    return descriptions[tag] || `${tag}相关工具`
  }

  /**
   * 获取所有分类
   */
  public getCategories(): Category[] {
    return Array.from(this.categories.values()).sort((a, b) => b.count - a.count)
  }

  /**
   * 按分类ID获取分类
   */
  public getCategoryById(id: string): Category | undefined {
    return this.categories.get(id)
  }

  /**
   * 获取指定分类下的工具
   */
  public getToolsByCategory(categoryId: string): NavItem[] {
    return getPagesByTag(categoryId)
  }

  /**
   * 获取所有工具
   */
  public getAllTools(): NavItem[] {
    return this.tools
  }

  /**
   * 获取分类总数
   */
  public getCategoryCount(): number {
    return this.categories.size
  }

  /**
   * 判断分类是否存在
   */
  public isCategoryExists(categoryId: string): boolean {
    return this.categories.has(categoryId)
  }

  /**
   * 获取分类的工具并返回带有导向信息的数据
   */
  public getCategoryToolsWithNav(categoryId: string): NavItem[] {
    if (!this.isCategoryExists(categoryId)) {
      return []
    }
    return getPagesByTag(categoryId)
  }
}
