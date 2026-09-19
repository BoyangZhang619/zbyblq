/**
 * 植物体系（品牌表达层）
 *
 * 与 @/shared/icons 的几何图标体系分工不同：
 * 图标承担界面功能，植物承担工具身份与主视觉。
 * 参见 docs/08-home-redesign-proposal.md §7.1
 */

export { default as PlantIcon } from './PlantIcon.vue'
export { plantRegistry, PLANT_NAMES } from './registry'
export type { PlantName } from './registry'
