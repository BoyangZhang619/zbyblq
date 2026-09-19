import { watch } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw, RouteLocationNormalized } from 'vue-router'
import { getTools, getToolById } from '@/modules/tools'
import { t, lt, useI18n, type MessageKey } from '@/shared/i18n'
import { useProfile } from '@/shared/composables/useProfile'

// 主页面
import HomeView from '@/modules/discovery/views/HomeView.vue'
import CategoryView from '@/modules/discovery/views/CategoryView.vue'
import ProfileView from '@/modules/profile/views/ProfileView.vue'
import SettingsView from '@/modules/profile/views/SettingsView.vue'

/**
 * 站点标题前缀。使用数学斜体字符而非 emoji，符合全站禁用 emoji 的约束
 */
const BRAND = '𝒵𝐵𝒴𝐵𝐿𝒬'

/* ============================================
   工具路由

   由工具注册表派生，不手写。新增工具只需创建模块目录与 manifest，
   路由自动生成。组件用 import.meta.glob 懒加载，每个工具打包为
   独立 chunk，首屏不必加载全部工具。
   ============================================ */
const toolViews = import.meta.glob('../../modules/tools/*/index.vue')

const toolRoutes: RouteRecordRaw[] = getTools().map((tool) => {
  const key = `../../modules/tools/${tool.id}/index.vue`
  const component = toolViews[key]

  if (!component) {
    // 构建期即可发现：manifest 登记了工具但缺少 index.vue
    console.error(`[router] 工具 ${tool.id} 缺少入口组件，期望路径 ${key}`)
  }

  return {
    path: tool.route.path,
    name: tool.route.name,
    // 兜底的静态引用：manifest 登记错误时回退到首页，而非白屏
    component: component ?? HomeView,
    // 标题不能在此处拼装：tool.title 是各语种的映射对象，模板字符串会
    // 得到 "[object Object]"。改存 id，由守卫在导航时按当前语言解析。
    meta: { toolId: tool.id, titleKey: null },
  }
})

/* ============================================
   路由表
   ============================================ */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/home',
  },
  {
    path: '/home',
    name: 'home',
    component: HomeView,
    meta: { titleKey: 'nav.home' },
  },
  {
    path: '/sort',
    name: 'sort',
    component: CategoryView,
    meta: { titleKey: 'nav.category' },
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfileView,
    meta: { titleKey: 'nav.profile' },
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsView,
    meta: { titleKey: 'settings.title' },
  },
  ...toolRoutes,
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

/* ============================================
   页面标题
   ============================================ */

function titleFor(route: RouteLocationNormalized): string {
  const toolId = route.meta.toolId as string | undefined
  if (toolId) {
    const tool = getToolById(toolId)
    if (tool) return `${BRAND}- ${lt(tool.title)}`
  }

  const key = route.meta.titleKey as MessageKey | null | undefined
  if (key) return `${BRAND}- ${t(key)}`

  return BRAND
}

/* ============================================
   路由守卫
   ============================================ */

// 返回 undefined 即放行。vue-router 5 已弃用 next() 回调写法
router.beforeEach((to) => {
  document.title = titleFor(to)

  // 记录工具访问，作为「我的花园」的生长依据
  const toolId = to.meta.toolId as string | undefined
  if (toolId) useProfile().markVisited(toolId)

  // TODO: 账户系统接入后在此处增加登录态检查，
  // 见 docs/05-account-system.md §7.4
})

/**
 * 语言切换后重算标题
 *
 * 守卫只在导航时触发，切换语言不会重新导航，标题会停留在旧语言。
 */
const { locale } = useI18n()
watch(locale, () => {
  document.title = titleFor(router.currentRoute.value)
})

export default router
