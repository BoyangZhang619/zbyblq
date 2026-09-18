import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { getTools } from '@/modules/tools'

// 主页面
import HomeView from '@/modules/discovery/views/HomeView.vue'
import CategoryView from '@/modules/discovery/views/CategoryView.vue'
import ProfileView from '@/modules/profile/views/ProfileView.vue'

/**
 * 站点标题前缀。使用数学斜体字符而非 emoji，符合全站禁用 emoji 的约束
 */
const BRAND = '『𝑍𝐵𝑌𝐵𝐿𝑄』'

/* ============================================
   工具路由

   由工具注册表派生，不手写。新增工具只需创建模块目录与 manifest，
   路由自动生成。组件用 import.meta.glob 懒加载，每个工具打包为
   独立 chunk，首屏不必加载全部 12 个工具。
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
    meta: { title: `${BRAND}- ${tool.title}` },
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
    meta: { title: `${BRAND}- 主页` },
  },
  {
    path: '/sort',
    name: 'sort',
    component: CategoryView,
    meta: { title: `${BRAND}- 分类` },
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfileView,
    meta: { title: `${BRAND}- 个人中心` },
  },
  ...toolRoutes,
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

/* ============================================
   路由守卫
   ============================================ */
// 返回 undefined 即放行。vue-router 5 已弃用 next() 回调写法
router.beforeEach((to) => {
  document.title = (to.meta.title as string) ?? BRAND

  // TODO: 账户系统接入后在此处增加登录态检查，
  // 见 docs/05-account-system.md §7.4
})

export default router
