<template>
  <div class="bg-view">
    <router-view />
    <BottomNav v-if="showBottomNav" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BottomNav from '@/modules/shell/components/BottomNav.vue'

/** 显示底部导航的路由名 */
const NAV_ROUTES = ['home', 'sort', 'profile']

const route = useRoute()
const showBottomNav = computed(() => NAV_ROUTES.includes(route.name as string))
</script>

<!-- 全局样式由 src/main.ts 引入的 @/design/index.css 提供，此处不再声明 -->
