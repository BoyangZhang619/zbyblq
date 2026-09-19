/**
 * 个人化数据
 *
 * 昵称、形象植物、使用记录。全部存 localStorage——
 * 账户系统尚未启用（见 docs/05-account-system.md），当前为纯本地。
 *
 * 花园机制：用过的工具，其植物以原色显示；未用过的显示为暗淡的「种子」。
 * 不显示进度条、不发催促提醒，与品牌的「不会催促你必须完美」一致。
 *
 * 同时记录**按天的使用次数**，供个人页的足迹热力图使用。
 */

import { ref, computed, watch } from 'vue'
import { PLANT_NAMES, type PlantName } from '@/shared/mascot'

const STORAGE_KEY = 'zbyblq:profile'

/** 最近使用列表的长度上限 */
export const RECENT_LIMIT = 5

/** 可选作形象的植物。排除仅供主视觉使用的 hero */
export const AVATAR_PLANTS: PlantName[] = PLANT_NAMES.filter(p => p !== 'hero')

/** 按天的使用次数：YYYY-MM-DD -> 次数 */
export type DailyCounts = Record<string, number>

interface StoredProfile {
  nickname: string | null
  avatarPlant: PlantName
  /** 工具 id，最近使用的排在最前 */
  visits: string[]
  daily: DailyCounts
}

/* ============================================
   状态：模块级单例
   ============================================ */

/** 为 null 时由界面回退到默认昵称 */
const nickname = ref<string | null>(null)
const avatarPlant = ref<PlantName>('sprout')
/** 按最近使用排序的工具 id */
const visits = ref<string[]>([])
const daily = ref<DailyCounts>({})

/** 已使用过的工具 id 集合，由 visits 派生 */
const visitedSet = computed(() => new Set(visits.value))

/** 本地日期键。刻意不用 toISOString——那是 UTC，跨时区会错一天 */
function todayKey(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function load(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as Partial<StoredProfile>

    if (typeof parsed.nickname === 'string' && parsed.nickname.trim()) {
      nickname.value = parsed.nickname.trim()
    }
    if (parsed.avatarPlant && AVATAR_PLANTS.includes(parsed.avatarPlant)) {
      avatarPlant.value = parsed.avatarPlant
    }
    if (Array.isArray(parsed.visits)) {
      visits.value = parsed.visits.filter(x => typeof x === 'string')
    }
    if (parsed.daily && typeof parsed.daily === 'object') {
      const clean: DailyCounts = {}
      for (const [k, v] of Object.entries(parsed.daily)) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(k) && typeof v === 'number' && v > 0) clean[k] = v
      }
      daily.value = clean
    }
  } catch {
    // 存储损坏时静默回退到默认值，不阻断应用启动
  }
}

function persist(): void {
  try {
    const payload: StoredProfile = {
      nickname: nickname.value,
      avatarPlant: avatarPlant.value,
      visits: visits.value,
      daily: daily.value,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // 隐私模式或配额耗尽时忽略
  }
}

let initialized = false

/** 初始化。应在应用挂载前调用一次。 */
export function initProfile(): void {
  if (initialized) return
  initialized = true

  load()

  watch([nickname, avatarPlant, visits, daily], persist, { deep: true })
}

/* ============================================
   对外接口
   ============================================ */

export function useProfile() {
  const visitedCount = computed(() => visits.value.length)

  /** 最近使用，按时间倒序 */
  const recentToolIds = computed(() => visits.value.slice(0, RECENT_LIMIT))

  function setNickname(value: string): void {
    const trimmed = value.trim()
    nickname.value = trimmed || null
  }

  function setAvatar(plant: PlantName): void {
    if (AVATAR_PLANTS.includes(plant)) avatarPlant.value = plant
  }

  /**
   * 记录一次工具访问。由路由守卫调用。
   *
   * 重复访问会把该工具移到最前，而不是重复添加；
   * 按天的计数则每次都累加。
   */
  function markVisited(toolId: string): void {
    const key = todayKey()
    daily.value = { ...daily.value, [key]: (daily.value[key] ?? 0) + 1 }

    if (visits.value[0] === toolId) return
    visits.value = [toolId, ...visits.value.filter(id => id !== toolId)]
  }

  function isVisited(toolId: string): boolean {
    return visitedSet.value.has(toolId)
  }

  /** 清空使用记录，花园回到初始状态 */
  function resetGarden(): void {
    visits.value = []
    daily.value = {}
  }

  /** 供「行囊」导出使用 */
  function snapshot(): StoredProfile {
    return {
      nickname: nickname.value,
      avatarPlant: avatarPlant.value,
      visits: [...visits.value],
      daily: { ...daily.value },
    }
  }

  /** 供「行囊」导入使用 */
  function restore(data: StoredProfile): void {
    nickname.value = typeof data.nickname === 'string' && data.nickname.trim()
      ? data.nickname.trim()
      : null
    if (data.avatarPlant && AVATAR_PLANTS.includes(data.avatarPlant)) {
      avatarPlant.value = data.avatarPlant
    }
    visits.value = Array.isArray(data.visits) ? data.visits.filter(x => typeof x === 'string') : []
    daily.value = data.daily && typeof data.daily === 'object' ? data.daily : {}
  }

  return {
    nickname,
    avatarPlant,
    visits,
    daily,
    visitedCount,
    recentToolIds,
    setNickname,
    setAvatar,
    markVisited,
    isVisited,
    resetGarden,
    snapshot,
    restore,
  }
}
