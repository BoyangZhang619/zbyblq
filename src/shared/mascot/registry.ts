/**
 * 植物注册表
 *
 * 本文件由 src/shared/mascot/svg/ 下的文件生成，新增形态后需重新生成。
 * 使用 ?raw 导入源码文本，由 PlantIcon 渲染为内联 SVG。
 *
 * 与几何图标体系的分工见 docs/08-home-redesign-proposal.md §7.1：
 * 图标管界面功能，植物管品牌表达。
 */

import bamboo from './svg/bamboo.svg?raw'
import clover from './svg/clover.svg?raw'
import fern from './svg/fern.svg?raw'
import flower from './svg/flower.svg?raw'
import hero from './svg/hero.svg?raw'
import leaf from './svg/leaf.svg?raw'
import rosette from './svg/rosette.svg?raw'
import sprout from './svg/sprout.svg?raw'
import vine from './svg/vine.svg?raw'

export const plantRegistry = {
  'bamboo': bamboo,
  'clover': clover,
  'fern': fern,
  'flower': flower,
  'hero': hero,
  'leaf': leaf,
  'rosette': rosette,
  'sprout': sprout,
  'vine': vine,
} as const

export type PlantName = keyof typeof plantRegistry

export const PLANT_NAMES = Object.keys(plantRegistry) as PlantName[]
