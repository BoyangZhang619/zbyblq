/**
 * tools 模块的公开出口
 *
 * 其他模块只能通过本文件访问工具数据，不得直接 import `data/` 下的内部实现。
 * 这条约束保证了工具数据源可以独立演进——例如后续用各工具的 manifest.ts
 * 取代中心化的 pages-data.ts 时，消费方无需改动。
 *
 * 参见 docs/01-refactor-structure.md §3.6 与 §6
 */

export {
  pageRouteMap,
  getPageInfo,
  getAllToolPages,
  getPagesByTag,
  getAllTags,
  getActivePages,
  getInactivePages,
} from './data/pages-data'

export type { NavItem, PagesData } from './data/pages-data'
