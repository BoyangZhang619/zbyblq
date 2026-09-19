/**
 * 简体中文文案
 *
 * 本文件是**基准语种**：MessageKey 由它的键推导，其余语种必须提供
 * 完全相同的键集合，漏翻会在编译期报错。
 *
 * 占位符用 {name} 形式，由 t() 替换。
 */

export const zhCN = {
  // 品牌
  'app.brand': '𝒵𝐵𝒴𝐵𝐿𝒬',
  'app.greeting': '小筑',

  // 底部导航
  'nav.home': '主页',
  'nav.category': '分类',
  'nav.profile': '我的',

  // 通用
  'common.back': '返回',
  'common.count.tools': '{count} 个工具',
  'common.count.tools.one': '{count} 个工具',

  // 首页
  'home.theme.toLight': '切换到浅色模式',
  'home.theme.toDark': '切换到深色模式',
  'home.shelf.more': '查看「{name}」的全部 {count} 个工具',

  // 分类
  'category.title': '分类',
  'category.all': '全部分类',
  'category.index.more': '进入「{name}」',

  // 分类名（标签在数据中是稳定 ID，显示名由此提供）
  'tag.algorithm': '算法',
  'tag.utility': '工具',
  'tag.image': '图像',
  'tag.music': '音乐',
  'tag.experimental': '实验',

  'tag.desc.algorithm': '算法可视化与演示',
  'tag.desc.utility': '实用工具集合',
  'tag.desc.image': '图像处理与转换',
  'tag.desc.music': '音乐创作与演奏',
  'tag.desc.experimental': '试验性质的功能',

  // 个人中心
  'profile.title': '我的',
  'profile.subtitle': '外观与偏好设置',
  'profile.language': '语言',
  'profile.appearance': '外观模式',
  'profile.mode.light': '浅色',
  'profile.mode.dark': '深色',
  'profile.mode.auto': '跟随系统',
  'profile.accent': '主题配色',
  'profile.account': '账户',
  'profile.account.pending':
    '账户系统尚未启用。启用后可跨设备同步偏好与工具数据。',

  // 主题色板
  'accent.sun': '暖阳',
  'accent.mint': '薄荷',
  'accent.rose': '玫瑰',
  'accent.peach': '蜜桃',
  'accent.sky': '天青',
  'accent.lilac': '丁香',
}

/** 其余语种必须实现完全相同的键集合 */
export type Messages = typeof zhCN
export type MessageKey = keyof Messages
