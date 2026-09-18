<template>
  <nav class="bottom-nav" aria-label="主导航">
    <div class="nav-items">
      <router-link
        v-for="item in navItems"
        :key="item.id"
        :to="item.path"
        class="nav-item"
        :class="item.routeName === currentRouteName ? 'active' : 'inactive'"
        :aria-label="item.name"
        :aria-current="item.routeName === currentRouteName ? 'page' : undefined"
      >
        <AppIcon
          class="nav-icon"
          :name="item.icon"
          :size="26"
          decorative
        />
      </router-link>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { AppIcon, type IconName } from '@/shared/icons'

/**
 * 底部导航
 *
 * 视觉规范见 docs/03-design-system.md §8.2：
 * 半透明背景 + 背景模糊，激活态用主题色并轻微上移。
 * 图标一律走 AppIcon，不使用 emoji 或内联 SVG。
 */

interface NavEntry {
  id: string
  name: string
  path: string
  routeName: string
  icon: IconName
}

const navItems: NavEntry[] = [
  { id: 'home',    name: '主页',     path: '/home',    routeName: 'home',    icon: 'nav-home' },
  { id: 'sort',    name: '分类',     path: '/sort',    routeName: 'sort',    icon: 'nav-category' },
  { id: 'profile', name: '个人中心', path: '/profile', routeName: 'profile', icon: 'nav-profile' },
]

const route = useRoute()
const currentRouteName = computed(() => route.name as string)
</script>

<style scoped>
@import './bottom-nav.css';
</style>
