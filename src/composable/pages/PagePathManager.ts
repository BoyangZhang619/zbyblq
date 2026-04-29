/**
 * 页面路由路径管理
 * 统一管理原生页面的路径
 */

export interface PagePath {
  id: string
  iframePath: string
  routeName: string
  title: string
}

export const PAGE_PATHS: Record<string, PagePath> = {
  'btree-visual': {
    id: 'btree-visual',
    iframePath: '/btree/index.html',
    routeName: 'btree-visual',
    title: '二叉树可视化',
  },
  'eft-tool': {
    id: 'eft-tool',
    iframePath: '/eft/index.html',
    routeName: 'eft-tool',
    title: '英文字体转换工具',
  },
  'encryption-graph': {
    id: 'encryption-graph',
    iframePath: '/encryptionGraph/index.html',
    routeName: 'encryption-graph',
    title: '小番茄图片混淆',
  },
  'drum-pad': {
    id: 'drum-pad',
    iframePath: '/drum/index.html',
    routeName: 'drum-pad',
    title: 'Drum Pad 鼓机',
  },
  'kalimba': {
    id: 'kalimba',
    iframePath: '/kalimba/index.html',
    routeName: 'kalimba',
    title: 'Kalimba 拇指琴',
  },
  'sort-viz': {
    id: 'sort-viz',
    iframePath: '/sortviz/index.html',
    routeName: 'sort-viz',
    title: '排序算法可视化',
  },
  'img2ascii': {
    id: 'img2ascii',
    iframePath: '/img2ascii/index.html',
    routeName: 'img2ascii',
    title: '图片转 ASCII',
  },
  'pixelate': {
    id: 'pixelate',
    iframePath: '/pixelate/index.html',
    routeName: 'pixelate',
    title: 'Pixelate · 图片像素化',
  },
  'floyd-steinberg': {
    id: 'floyd-steinberg',
    iframePath: '/Floyd–Steinberg/index.html',
    routeName: 'floyd-steinberg',
    title: 'Dithering · Floyd–Steinberg',
  },
  'pathfinding-visualize': {
    id: 'pathfinding-visualize',
    iframePath: '/PathfindingVisualize/index.html',
    routeName: 'pathfinding-visualize',
    title: '路径寻找可视化',
  },
  'photo-patina': {
    id: 'photo-patina',
    iframePath: '/photoPatina/index.html',
    routeName: 'photo-patina',
    title: '电子包浆 · JPEG 二次压缩',
  },
  'piano-keys': {
    id: 'piano-keys',
    iframePath: '/playPiano/index.html',
    routeName: 'piano-keys',
    title: 'Piano Keys',
  },
  'lesson-table': {
    id: 'lesson-table',
    iframePath: '/lessonTable/index.html',
    routeName: 'lesson-table',
    title: '课程表',
  },
}

/**
 * 获取页面路径信息
 */
export function getPagePath(routeNameOrId: string): PagePath | undefined {
  return PAGE_PATHS[routeNameOrId]
}

/**
 * 验证页面是否存在
 */
export function isPageExists(routeNameOrId: string): boolean {
  return routeNameOrId in PAGE_PATHS
}

/**
 * 获取所有页面路径
 */
export function getAllPagePaths(): PagePath[] {
  return Object.values(PAGE_PATHS)
}
