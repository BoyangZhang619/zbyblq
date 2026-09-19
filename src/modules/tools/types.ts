/**
 * 工具模块自声明类型
 *
 * 设计目标：把「中心文件罗列所有工具」改为「每个工具声明自己」。
 * 新增工具只需新建一个目录 + 一个 manifest，不再需要改动多处。
 *
 * 参见 docs/01-refactor-structure.md §6
 */

import type { IconName } from '@/shared/icons'
import type { PlantName } from '@/shared/mascot'

/**
 * 工具的接入形态，同时用于标记融合迁移进度
 *
 * - iframe   ：仍以 iframe 桥接旧版静态页面（Stage 0-1）
 * - native   ：已重写为原生 Vue 组件（Stage 3 完成）
 * - external ：指向站外链接，不本地实现
 */
export type ToolEntry = 'iframe' | 'native' | 'external'

/**
 * 工具的生命周期状态
 *
 * - active   ：正常展示
 * - inactive ：暂时下线，保留数据
 * - archived ：已移入 archive/，不在应用内出现
 */
export type ToolStatus = 'active' | 'inactive' | 'archived'

export interface ToolManifest {
  /** 唯一标识，同时用作模块目录名与数据同步的维度 */
  id: string

  /** 卡片标题 */
  title: string

  /** 卡片描述，建议不超过 40 字 */
  description: string

  /** 图标名，对应 shared/icons 的 registry。禁止 emoji */
  icon: IconName

  /**
   * 植物形态名，对应 shared/mascot 的 registry。
   * 用于首页货架的工具身份表达，与几何图标分工不同。
   */
  plant: PlantName

  /** 路由信息。name 统一使用 `tool-<id>` 前缀，与将来的非工具路由形成命名空间隔离 */
  route: {
    path: string
    name: string
  }

  /**
   * 标签。首个标签同时是**主分类**——首页货架按主分类分组，
   * 保证一个工具只出现在一个货架上。
   * 其余标签用于分类页的检索。
   *
   * 刻意不设独立的 category 字段——那会造成与 tags 平行的第二个分类
   * 维度，正是本机制要消除的双写问题。
   */
  tags: string[]

  /** 卡片上的徽章文字，可选 */
  badge?: string

  status: ToolStatus

  /** 接入形态，反映融合迁移进度 */
  entry: ToolEntry

  /** 外链地址，仅 entry === 'external' 时有值 */
  externalUrl?: string

  lifecycle: {
    /** 创建日期，YYYY-MM-DD */
    created?: string
    /** 最后更新日期，YYYY-MM-DD */
    updated?: string
  }
}
