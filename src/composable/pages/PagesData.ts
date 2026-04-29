/**
 * 页面数据管理
 * 基于navItems.json的数据结构
 */

export interface NavItem {
  id: string
  href: string
  icon: string
  title: string
  desc: string
  tags: string[]
  badge: string
  badgeColor: string
  status: 'active' | 'inactive'
  banMsg?: string
  createTime?: string
  updateTime?: string
}

export interface PagesData {
  items: NavItem[]
  settings: {
    showTags: boolean
    showBadge: boolean
    showUpdateTime: boolean
    maxTagsDisplay: number
  }
}

/**
 * 页面数据映射 - 将路由映射到导航项
 */
export const pageRouteMap: Record<string, NavItem> = {
  'btree-visual': {
    id: 'btree-visual',
    href: '/tools/btree-visual',
    icon: '🌳',
    title: '二叉树可视化',
    desc: '输入层序遍历数组，自动生成可视化二叉树，支持保存为图片',
    tags: ['算法', '工具'],
    badge: 'USELESS',
    badgeColor: 'G',
    status: 'active',
    updateTime: '2026-01-03',
  },
  'eft-tool': {
    id: 'eft-tool',
    href: '/tools/eft-tool',
    icon: '🔤',
    title: '英文字体转换工具',
    desc: '输入英文，点击样式即可一键转换特殊字体，支持多种花体/粗体/斜体等Unicode样式。',
    tags: ['工具'],
    badge: 'not NEW',
    badgeColor: '#444',
    status: 'active',
    updateTime: '2026-01-02',
  },
  'encryption-graph': {
    id: 'encryption-graph',
    href: '/tools/encryption-graph',
    icon: '🍅',
    title: '小番茄图片混淆',
    desc: '基于空间填充曲线的图片混淆工具，混淆后压缩仍保持色彩，支持混淆/解混淆/还原操作',
    tags: ['图像', '工具'],
    badge: 'XIXI',
    badgeColor: 'O',
    status: 'active',
    updateTime: '2026-01-02',
  },
  'drum-pad': {
    id: 'drum-pad',
    href: '/tools/drum-pad',
    icon: '🥁',
    title: 'Drum Pad 鼓机',
    desc: '纯 WebAudio 合成鼓垫：Kick/Snare/Hat/Clap，支持键盘演奏与 16 步编排循环',
    tags: ['音乐'],
    badge: 'IDK',
    badgeColor: 'G',
    status: 'active',
    updateTime: '2026-01-06',
  },
  'kalimba': {
    id: 'kalimba',
    href: '/tools/kalimba',
    icon: '🎶',
    title: 'Kalimba 拇指琴',
    desc: '纯 WebAudio 合成拇指琴：点击/键盘演奏，支持调式选择与录制循环，音色治愈',
    tags: ['音乐'],
    badge: 'IDK',
    badgeColor: 'P',
    status: 'active',
    updateTime: '2026-01-06',
  },
  'sort-viz': {
    id: 'sort-viz',
    href: '/tools/sort-viz',
    icon: '📊',
    title: '排序算法可视化',
    desc: '支持冒泡/选择/插入/归并/快速，观察比较与交换过程，支持调速与单步执行',
    tags: ['算法', '工具'],
    badge: 'GOOD-LOOKING',
    badgeColor: 'R',
    status: 'active',
    updateTime: '2026-01-06',
  },
  'img2ascii': {
    id: 'img2ascii',
    href: '/tools/img2ascii',
    icon: '🧩',
    title: '图片转 ASCII',
    desc: '上传图片生成字符画，支持亮度/对比度/反相，彩色 ASCII，可导出 TXT/PNG',
    tags: ['图像', '工具', '实验'],
    badge: 'INTERESTING',
    badgeColor: 'B',
    status: 'active',
    updateTime: '2026-01-06',
  },
  'pixelate': {
    id: 'pixelate',
    href: '/tools/pixelate',
    icon: '🟦',
    title: 'Pixelate · 图片像素化',
    desc: '上传图片 → 调像素块大小 → 导出PNG（可选限制色板 8/16/32 色）',
    tags: ['图像', '工具'],
    badge: 'IDK',
    badgeColor: 'Y',
    status: 'active',
    updateTime: '2026-01-06',
  },
  'floyd-steinberg': {
    id: 'floyd-steinberg',
    href: '/tools/floyd-steinberg',
    icon: '⬛️',
    title: 'Dithering · Floyd–Steinberg',
    desc: '黑白/限定色 Floyd–Steinberg 误差扩散抖动：复古报纸风、GameBoy 风',
    tags: ['图像', '工具'],
    badge: 'USELESS',
    badgeColor: 'B',
    status: 'active',
    updateTime: '2026-01-06',
  },
  'pathfinding-visualize': {
    id: 'pathfinding-visualize',
    href: '/tools/pathfinding-visualize',
    icon: '🧩',
    title: '路径寻找可视化',
    desc: '可视化不同路径寻找算法的过程，支持多种算法与参数设置',
    tags: ['算法', '工具'],
    badge: 'INTERESTING',
    badgeColor: 'O',
    status: 'active',
    updateTime: '2026-01-06',
  },
  'photo-patina': {
    id: 'photo-patina',
    href: '/tools/photo-patina',
    icon: '🖼️',
    title: '电子包浆 · JPEG 二次压缩',
    desc: '上传照片，选择包浆风格与强度，生成具有复古包浆效果的图片',
    tags: ['图像', '工具', '实验'],
    badge: 'INTERESTING',
    badgeColor: 'Y',
    status: 'active',
    updateTime: '2026-01-06',
  },
  'piano-keys': {
    id: 'piano-keys',
    href: '/tools/piano-keys',
    icon: '🎹',
    title: 'Piano Keys',
    desc: '基于 Web Audio API 的在线钢琴，支持键盘演奏、多种音色切换、预设曲目播放',
    tags: ['音乐'],
    badge: 'INTERESTING',
    badgeColor: 'P',
    status: 'active',
    updateTime: '2026-01-04',
  },
  'lesson-table': {
    id: 'lesson-table',
    href: '/tools/lesson-table',
    icon: '🗓️',
    title: '课程表',
    desc: '在线课程表，支持导入导出，个性化定制',
    tags: ['工具'],
    badge: 'NEW',
    badgeColor: 'G',
    status: 'active',
    createTime: '2026-03-22',
    updateTime: '2026-03-22',
  },
}

/**
 * 获取页面信息
 */
export function getPageInfo(routeName: string): NavItem | undefined {
  return pageRouteMap[routeName]
}

/**
 * 获取所有工具页面
 */
export function getAllToolPages(): NavItem[] {
  return Object.values(pageRouteMap)
}

/**
 * 按标签筛选页面
 */
export function getPagesByTag(tag: string): NavItem[] {
  return getAllToolPages().filter(page => page.tags.includes(tag))
}

/**
 * 获取所有标签
 */
export function getAllTags(): string[] {
  const tags = new Set<string>()
  getAllToolPages().forEach(page => {
    page.tags.forEach(tag => tags.add(tag))
  })
  return Array.from(tags).sort()
}

/**
 * 获取活跃的页面
 */
export function getActivePages(): NavItem[] {
  return getAllToolPages().filter(page => page.status === 'active')
}

/**
 * 获取不活跃的页面
 */
export function getInactivePages(): NavItem[] {
  return getAllToolPages().filter(page => page.status === 'inactive')
}
