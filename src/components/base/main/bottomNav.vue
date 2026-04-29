<template>
  <nav class="bottom-nav">
    <div class="nav-items">
      <router-link
        v-for="item in navManager.getItems()"
        :key="item.id"
        :to="item.path"
        :class="['nav-item', navManager.isActive(item.id) ? 'active' : 'inactive']"
        @click="handleNavClick(item)"
      >
        <svg
          :key="`icon-${item.id}`"
          class="nav-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <!-- Home Icon -->
          <g v-if="item.id === 'home'">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </g>
          <!-- Sort Icon -->
          <g v-else-if="item.id === 'sort'">
            <circle cx="12" cy="12" r="1" />
            <path d="M4 12a8 8 0 0 1 16 0" />
            <path d="M4 12a8 8 0 0 0 16 0" />
          </g>
          <!-- Profile Icon -->
          <g v-else-if="item.id === 'profile'">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </g>
        </svg>
        <!-- <span class="nav-label">{{ item.name }}</span> -->
      </router-link>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { BottomNavManager, type NavItem } from '@/composable/components/base/main/BottomNavManager'

const route = useRoute()

// 初始化导航管理器
const navItems: NavItem[] = [
  {
    id: 'home',
    name: '主页',
    path: '/home',
    routeName: 'home',
  },
  {
    id: 'sort',
    name: '分类',
    path: '/sort',
    routeName: 'sort',
  },
  {
    id: 'profile',
    name: '个人主页',
    path: '/profile',
    routeName: 'profile',
  },
]

const navManager = ref(new BottomNavManager(navItems))

/**
 * 处理导航点击事件
 */
const handleNavClick = (item: NavItem): void => {
  navManager.value.setActiveItem(item.id)
}

/**
 * 监听路由变化，更新活跃项目
 */
const updateActiveItemByRoute = (): void => {
  const currentRouteName = route.name as string

  const item = navItems.find(nav => nav.routeName === currentRouteName)
  if (item) {
    navManager.value.setActiveItem(item.id)
  }
}

onMounted(() => {
  updateActiveItemByRoute()
})

watch(() => route.name, () => {
  updateActiveItemByRoute()
})
</script>

<style scoped>
@import '@/css/components/base/main/bottomNav.css';
</style>
