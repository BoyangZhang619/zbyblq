/**
 * 国际化类型
 *
 * 参见 docs/10-i18n.md
 */

export const LOCALES = ['zh-CN', 'en'] as const

export type Locale = (typeof LOCALES)[number]

/** 语言的中文名，用于设置页展示（自身不参与翻译） */
export const LOCALE_LABELS: Record<Locale, string> = {
  'zh-CN': '简体中文',
  en: 'English',
}

/**
 * 本地化数据
 *
 * 用 Record 而非可选字段，强制所有语种都提供翻译——
 * 漏翻会在编译期报错，而不是运行时回退成空白。
 */
export type Localized<T = string> = Record<Locale, T>

/**
 * 工具分类
 *
 * 定义在本层而非 modules/tools：分层规则要求 modules 依赖 shared，
 * shared 不得反向依赖 modules。而分类的显示名属于本地化职责，
 * 与 i18n 同层更自然。
 */
export const TOOL_TAGS = ['algorithm', 'utility', 'image', 'music', 'experimental'] as const

export type ToolTag = (typeof TOOL_TAGS)[number]

/** 分类的固定展示次序，用于数量相同时的稳定排序 */
export const TAG_ORDER: readonly ToolTag[] = TOOL_TAGS
