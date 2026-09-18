/**
 * 主题管理
 *
 * 管理两个正交的维度：
 *   1. 明暗模式：light / dark / auto（auto 跟随系统）
 *   2. 主题色板：六套马卡龙色，对应 themes/accent/ 下的类名
 *
 * 实现方式：在 <html> 上切换 data-theme 属性与 accent-* 类名，
 * 由 CSS 侧的语义令牌完成其余映射，JS 不直接操作任何颜色值。
 *
 * 参见 docs/03-design-system.md §3
 */

import { ref, computed, watch, readonly } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'auto'

export const ACCENT_NAMES = ['mint', 'rose', 'peach', 'butter', 'sky', 'lilac'] as const
export type AccentName = (typeof ACCENT_NAMES)[number]

export const ACCENT_LABELS: Record<AccentName, string> = {
  mint: '薄荷',
  rose: '玫瑰',
  peach: '蜜桃',
  butter: '奶油',
  sky: '天青',
  lilac: '丁香',
}

/** 默认使用薄荷：清透中性，与纸感底色最协调 */
const DEFAULT_ACCENT: AccentName = 'mint'
const STORAGE_KEY = 'zbyblq:theme'

interface StoredTheme {
  mode: ThemeMode
  accent: AccentName
}

/* ============================================
   状态：模块级单例，全应用共享
   ============================================ */
const mode = ref<ThemeMode>('auto')
const accent = ref<AccentName>(DEFAULT_ACCENT)

/** 系统是否偏好深色 */
const systemPrefersDark = ref(false)

/** 实际生效的明暗（auto 时取系统偏好） */
const resolvedMode = computed<'light' | 'dark'>(() =>
  mode.value === 'auto'
    ? (systemPrefersDark.value ? 'dark' : 'light')
    : mode.value,
)

/* ============================================
   读取与持久化
   ============================================ */
function loadStored(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as Partial<StoredTheme>
    if (parsed.mode === 'light' || parsed.mode === 'dark' || parsed.mode === 'auto') {
      mode.value = parsed.mode
    }
    if (parsed.accent && ACCENT_NAMES.includes(parsed.accent)) {
      accent.value = parsed.accent
    }
  } catch {
    // 存储损坏时静默回退到默认值，不阻断应用启动
  }
}

function persist(): void {
  try {
    const payload: StoredTheme = { mode: mode.value, accent: accent.value }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // 隐私模式或配额耗尽时忽略，主题仍在当前会话内生效
  }
}

/* ============================================
   应用到 DOM
   ============================================ */
function applyToDom(): void {
  const root = document.documentElement

  root.dataset.theme = resolvedMode.value

  // 移除旧色板类名，再挂新的
  ACCENT_NAMES.forEach(name => root.classList.remove(`accent-${name}`))
  root.classList.add(`accent-${accent.value}`)
}

/* ============================================
   初始化
   ============================================ */
let initialized = false

/**
 * 初始化主题。应在应用挂载前调用一次。
 */
export function initTheme(): void {
  if (initialized) return
  initialized = true

  // 监听系统偏好变化
  const query = window.matchMedia('(prefers-color-scheme: dark)')
  systemPrefersDark.value = query.matches
  query.addEventListener('change', (e) => {
    systemPrefersDark.value = e.matches
  })

  loadStored()
  applyToDom()

  // 任一维度变化时重绘并持久化
  watch([resolvedMode, accent], () => {
    applyToDom()
    persist()
  })
}

/* ============================================
   对外接口
   ============================================ */
export function useTheme() {
  return {
    /** 用户选择的模式（可能是 auto） */
    mode: readonly(mode),
    /** 实际生效的明暗 */
    resolvedMode,
    /** 当前主题色板 */
    accent: readonly(accent),

    setMode(next: ThemeMode): void {
      mode.value = next
    },

    setAccent(next: AccentName): void {
      accent.value = next
    },

    /** 在明暗之间快速切换（auto 时先落到当前生效值再切换） */
    toggleMode(): void {
      mode.value = resolvedMode.value === 'dark' ? 'light' : 'dark'
    },
  }
}
