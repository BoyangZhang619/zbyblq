/**
 * 国际化
 *
 * 自建实现而非引入 vue-i18n。理由：
 * 1. 本项目的本地化有**两层**——界面文案，以及存在工具 manifest 里的
 *    名称与描述。vue-i18n 只覆盖前者，数据层仍需另做一套。与其两套
 *    机制，不如用一套同时管两层。
 * 2. 界面文案只有约 40 条，且不需要复数规则以外的复杂特性。
 * 3. Capacitor 打包对体积敏感，省掉约 15 KB。
 *
 * 完整性由类型系统保证：MessageKey 从基准语种推导，其余语种声明为
 * Messages 类型，漏翻会在 vue-tsc 阶段报错。
 *
 * 参见 docs/10-i18n.md
 */

import { ref, computed, watch, readonly } from 'vue'
import {
  LOCALES, LOCALE_LABELS, TOOL_TAGS, TAG_ORDER,
  type Locale, type Localized, type ToolTag,
} from './types'
import { zhCN, type MessageKey } from './locales/zh-CN'
import { en } from './locales/en'
import { WHISPERS, whisperAt } from './whispers'

export { LOCALES, LOCALE_LABELS, TOOL_TAGS, TAG_ORDER, WHISPERS, whisperAt }
export type { Locale, Localized, MessageKey, ToolTag }

const MESSAGES: Record<Locale, Record<MessageKey, string>> = {
  'zh-CN': zhCN,
  en,
}

const STORAGE_KEY = 'zbyblq:locale'

/* ============================================
   语言状态：模块级单例
   ============================================ */

function detect(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && (LOCALES as readonly string[]).includes(saved)) return saved as Locale
  } catch {
    // 存储不可用时回退到浏览器语言
  }

  /*
    首次访问的默认语种是英语，而非跟随 navigator.language。

    本项目的主要读者在中文环境，但界面的默认语种选英语是刻意的：
    英文版更能暴露布局问题（英文文案普遍更长，中文文案容易把
    溢出与截断掩盖过去），也便于分享给非中文使用者。
    用户手动切换后会记入 localStorage，不再受此处影响。
  */
  return 'en'
}

const locale = ref<Locale>('en')

/** 同步 <html lang>，供读屏与浏览器断词使用 */
function applyToDom(): void {
  document.documentElement.lang = locale.value
}

let initialized = false

/** 初始化。应在应用挂载前调用一次。 */
export function initI18n(): void {
  if (initialized) return
  initialized = true

  locale.value = detect()
  applyToDom()

  watch(locale, () => {
    applyToDom()
    try {
      localStorage.setItem(STORAGE_KEY, locale.value)
    } catch {
      // 隐私模式或配额耗尽时忽略，语言仍在当前会话内生效
    }
  })
}

/* ============================================
   翻译
   ============================================ */

const PLACEHOLDER = /\{(\w+)\}/g

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template
  return template.replace(PLACEHOLDER, (_, key: string) =>
    key in params ? String(params[key]) : `{${key}}`,
  )
}

/** 取当前语种的界面文案 */
export function t(key: MessageKey, params?: Record<string, string | number>): string {
  return interpolate(MESSAGES[locale.value][key], params)
}

/**
 * 带数量的文案
 *
 * 中文没有复数变化，英文有。约定：若存在 `<key>.one` 且数量为 1，
 * 则使用该变体。
 */
export function tn(
  key: MessageKey,
  count: number,
  params?: Record<string, string | number>,
): string {
  const oneKey = `${key}.one` as MessageKey
  const useOne = count === 1 && oneKey in MESSAGES[locale.value]
  return t(useOne ? oneKey : key, { count, ...params })
}

/**
 * 分类 ID → 文案键
 *
 * 写成常量映射而非模板字符串拼接，这样键名有类型约束，
 * 新增分类时漏配会在编译期报错。
 */
const TAG_NAME_KEYS = {
  algorithm: 'tag.algorithm',
  utility: 'tag.utility',
  image: 'tag.image',
  music: 'tag.music',
  experimental: 'tag.experimental',
} as const satisfies Record<ToolTag, MessageKey>

const TAG_DESC_KEYS = {
  algorithm: 'tag.desc.algorithm',
  utility: 'tag.desc.utility',
  image: 'tag.desc.image',
  music: 'tag.desc.music',
  experimental: 'tag.desc.experimental',
} as const satisfies Record<ToolTag, MessageKey>

/** 分类的显示名 */
export function tagName(tag: ToolTag): string {
  return t(TAG_NAME_KEYS[tag])
}

/** 分类的说明文案 */
export function tagDescription(tag: ToolTag): string {
  return t(TAG_DESC_KEYS[tag])
}

/**
 * 取本地化数据
 *
 * 用于 manifest 里以 Localized 形式存储的名称与描述。
 */
export function lt<T>(value: Localized<T>): T {
  return value[locale.value]
}

/* ============================================
   工具级文案

   各工具的界面文案放在自己的目录内，而非集中到全局文案表。
   两个理由：
   1. 工具的文案与工具的生命周期绑定，删工具时应一并带走
   2. 集中存放会让多个工具改同一份文件，并行开发必然冲突

   用法：
     // modules/tools/pixelate/locales.ts
     export const messages = {
       'zh-CN': { blockSize: '像素块大小' },
       en:      { blockSize: 'Block size' },
     }

     // 组件内
     const { tt } = useToolI18n(messages)
     tt('blockSize')
   ============================================ */

export function useToolI18n<T extends Record<string, string>>(
  messages: Record<Locale, T>,
) {
  /** 取本工具的文案。在模板中调用即自动追踪语言变化 */
  function tt(key: keyof T & string, params?: Record<string, string | number>): string {
    return interpolate(messages[locale.value][key], params)
  }

  return { tt, locale }
}

/* ============================================
   小句子
   ============================================ */

/**
 * 本次会话选中的那一句
 *
 * 模块级常量，每次启动应用抽一次。导航时不重抽——同一句话在首页与
 * 个人页应保持一致，否则来回切换会一直闪。
 *
 * 用取模而非按语种长度取，因为中英语料条数可以不同。
 */
const whisperIndex = Math.floor(Math.random() * 100003)

/** 当前语言的随机小句子。语言切换后自动取同一条语料位置 */
export function useWhisper() {
  return computed(() => whisperAt(locale.value, whisperIndex))
}

/* ============================================
   组合式接口
   ============================================ */
export function useI18n() {
  return {
    locale: readonly(locale),
    locales: LOCALES,
    localeLabels: LOCALE_LABELS,
    /** 当前语种的响应式译文取值，用于需要在模板中随语言重算的场景 */
    current: computed(() => MESSAGES[locale.value]),

    t,
    tn,
    lt,

    setLocale(next: Locale): void {
      locale.value = next
    },
  }
}
