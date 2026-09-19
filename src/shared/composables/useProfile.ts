/**
 * 个人化数据
 *
 * 昵称、形象植物、以及工具使用记录。全部存 localStorage——
 * 账户系统尚未启用（见 docs/05-account-system.md），当前为纯本地。
 *
 * 花园机制：用过的工具，其植物以原色显示；未用过的显示为暗淡的「种子」。
 * 这是一个不施压的收集机制——不显示进度条、不发催促提醒，
 * 与品牌的「不会催促你必须完美」一致。
 *
 * 存储用**单一有序数组**而非 Set：既需要「是否用过」的集合语义，
 * 也需要「最近用过哪些」的顺序语义，数组去重后两者都能派生。
 */

import { ref, computed, watch } from 'vue'
import { PLANT_NAMES, type PlantName } from '@/shared/mascot'

const STORAGE_KEY = 'zbyblq:profile'

/** 最近使用列表的长度上限 */
export const RECENT_LIMIT = 5

/** 可选作形象的植物。排除仅供主视觉使用的 hero */
export const AVATAR_PLANTS: PlantName[] = PLANT_NAMES.filter(p => p !== 'hero')

interface StoredProfile {
  nickname: string | null
  avatarPlant: PlantName
  /** 工具 id，最近使用的排在最前 */
  visits: string[]
}

/* ============================================
   状态：模块级单例
   ============================================ */

/** 为 null 时由界面回退到 i18n 的默认问候语 */
const nickname = ref<string | null>(null)
const avatarPlant = ref<PlantName>('sprout')
/** 按最近使用排序的工具 id。整个数组替换以触发响应式 */
const visits = ref<string[]>([])

/** 已使用过的工具 id 集合，由 visits 派生 */
const visitedSet = computed(() => new Set(visits.value))

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

  watch([nickname, avatarPlant, visits], persist)
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
   * 重复访问会把该工具移到最前，而不是重复添加。
   */
  function markVisited(toolId: string): void {
    if (visits.value[0] === toolId) return   // 已在最前，无需变动
    visits.value = [toolId, ...visits.value.filter(id => id !== toolId)]
  }

  function isVisited(toolId: string): boolean {
    return visitedSet.value.has(toolId)
  }

  /** 清空使用记录，花园回到初始状态 */
  function resetGarden(): void {
    visits.value = []
  }

  return {
    nickname,
    avatarPlant,
    visits,
    visitedCount,
    recentToolIds,
    setNickname,
    setAvatar,
    markVisited,
    isVisited,
    resetGarden,
  }
}
