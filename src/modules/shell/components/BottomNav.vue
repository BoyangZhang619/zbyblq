<template>
  <nav class="bottom-nav" :aria-label="t('nav.home')">
    <div class="nav-items">
      <router-link
        v-for="item in navItems"
        :key="item.id"
        :to="item.path"
        class="nav-item"
        :class="item.routeName === currentRouteName ? 'active' : 'inactive'"
        :aria-label="t(item.labelKey)"
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
import { t } from '@/shared/i18n'

/**
 * 底部导航
 *
 * 视觉规范见 docs/03-design-system.md §8.2：
 * 半透明背景 + 背景模糊，激活态用主题色并轻微上移。
 * 图标一律走 AppIcon，不使用 emoji 或内联 SVG。
 */

interface NavEntry {
  id: string
  /** 文案键，标签随语言变化 */
  labelKey: 'nav.home' | 'nav.category' | 'nav.profile'
  path: string
  routeName: string
  icon: IconName
}

const navItems: NavEntry[] = [
  { id: 'home',    labelKey: 'nav.home',    path: '/home',    routeName: 'home',    icon: 'nav-home' },
  { id: 'sort',    labelKey: 'nav.category', path: '/sort',    routeName: 'sort',    icon: 'nav-category' },
  { id: 'profile', labelKey: 'nav.profile', path: '/profile', routeName: 'profile', icon: 'nav-profile' },
]

const route = useRoute()
const currentRouteName = computed(() => route.name as string)
</script>

<style scoped>
@import './bottom-nav.css';
</style>
