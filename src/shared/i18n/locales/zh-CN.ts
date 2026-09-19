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
  'app.brand': '𝒁𝑩𝒀𝑩𝑳𝑸',
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
  'home.switchLanguage': '切换语言',
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
  // 共享：图像加载错误。供 useImageFile 使用，各工具不必各写一套
  'image.error.notImage': '请选择图片文件',
  'image.error.loadFailed': '图片加载失败，文件可能已损坏',

  // 个人页
  'profile.garden': '我的花园',
  'profile.garden.hint': '已种下 {count} / {total}',
  'profile.garden.reset': '重置花园',
  'profile.recent': '最近使用',
  'profile.recent.empty': '还没有使用记录，随便逛逛吧',
  'profile.avatar': '我的形象',
  'profile.avatar.hint': '选一株作为你的形象',
  'profile.name.edit': '修改名字',
  'profile.name.placeholder': '给自己起个名字',
  'profile.settings': '设置',

  // 设置页
  'settings.title': '设置',
  'settings.about': '关于',
  'settings.about.text': '一个自用的小工具合集。',
  'settings.version': '版本',
  'settings.garden.reset.hint': '清空使用记录，花园回到初始状态',

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
