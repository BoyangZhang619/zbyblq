/**
 * 图标体系的公开出口
 *
 * 消费方一律从 '@/shared/icons' 引入，不直接引用 registry 或 svg 目录。
 */

export { default as AppIcon } from './AppIcon.vue'
export { iconRegistry, ICON_NAMES } from './registry'
export type { IconName } from './registry'
