/**
 * 行囊：本地数据的导出与导入
 *
 * 没有账号意味着没有云端——**这台设备就是唯一的存储**。
 * 清缓存、换设备、卸载都会让记录消失。所以数据的进出口不是高级功能，
 * 而是「不上云」这个选择的必要补偿。
 *
 * 导出为单个 JSON，包含全部带有 zbyblq: 前缀的键。
 * 导入时整体覆盖，不做合并——合并需要解决冲突，而这里没有可靠的
 * 时间序可言，强行合并比覆盖更危险。
 */

import { useProfile } from './useProfile'

/** 本应用在 localStorage 中的键前缀 */
const PREFIX = 'zbyblq:'

/** 导出文件的格式版本。将来结构变更时用于识别与迁移 */
const FORMAT_VERSION = 1

interface Bundle {
  app: 'zbyblq'
  version: number
  /** 导出时间，ISO 字符串 */
  exportedAt: string
  /** localStorage 中 zbyblq: 前缀的原始键值 */
  data: Record<string, string>
}

export interface ImportResult {
  ok: boolean
  /** 失败原因，未翻译的错误码 */
  reason?: 'not-json' | 'not-bundle' | 'version-too-new' | 'empty'
}

/** 收集全部应用数据 */
function collect(): Record<string, string> {
  const out: Record<string, string> = {}
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key || !key.startsWith(PREFIX)) continue
      const value = localStorage.getItem(key)
      if (value !== null) out[key] = value
    }
  } catch {
    // 存储不可用时返回已收集的部分
  }
  return out
}

export function usePortableData() {
  const { snapshot } = useProfile()

  /**
   * 导出为 JSON 文本
   *
   * 先让 profile 落盘再收集，否则最近一次改动可能还在内存里。
   */
  function exportJSON(): string {
    // 触发一次快照，确保 profile 的数据已写入 localStorage
    void snapshot()

    const bundle: Bundle = {
      app: 'zbyblq',
      version: FORMAT_VERSION,
      exportedAt: new Date().toISOString(),
      data: collect(),
    }
    return JSON.stringify(bundle, null, 2)
  }

  /** 触发浏览器下载 */
  function download(): void {
    const text = exportJSON()
    const blob = new Blob([text], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

    const link = document.createElement('a')
    link.download = `zbyblq-${stamp}.json`
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
  }

  /**
   * 从 JSON 文本导入
   *
   * 写入 localStorage 后需要刷新页面才能让各模块重新读取——
   * 主题、语言、个人数据都只在启动时读一次。
   */
  function importJSON(text: string): ImportResult {
    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      return { ok: false, reason: 'not-json' }
    }

    const bundle = parsed as Partial<Bundle>
    if (bundle?.app !== 'zbyblq' || typeof bundle.data !== 'object' || bundle.data === null) {
      return { ok: false, reason: 'not-bundle' }
    }
    if (typeof bundle.version === 'number' && bundle.version > FORMAT_VERSION) {
      return { ok: false, reason: 'version-too-new' }
    }

    const entries = Object.entries(bundle.data).filter(([k]) => k.startsWith(PREFIX))
    if (!entries.length) return { ok: false, reason: 'empty' }

    try {
      // 先清掉本应用现有的键，再整体写入——避免旧键残留形成混合状态
      for (const key of Object.keys(collect())) localStorage.removeItem(key)
      for (const [key, value] of entries) localStorage.setItem(key, value)
    } catch {
      return { ok: false, reason: 'empty' }
    }

    return { ok: true }
  }

  /** 清空本应用的全部本地数据 */
  function clearAll(): void {
    try {
      for (const key of Object.keys(collect())) localStorage.removeItem(key)
    } catch {
      // 忽略
    }
  }

  return { exportJSON, download, importJSON, clearAll }
}
