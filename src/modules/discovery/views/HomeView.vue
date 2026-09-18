<template>
  <div class="home">
    <div class="page-content">
      <header class="home__header texture-paper">
        <div class="home__heading">
          <h1 class="home__title">『𝑍𝐵𝑌𝐵𝐿𝑄』</h1>
          <p class="home__subtitle">个人工具合集</p>
        </div>

        <button
          class="home__theme"
          type="button"
          :aria-label="isDark ? '切换到浅色模式' : '切换到深色模式'"
          @click="toggleMode"
        >
          <AppIcon :name="isDark ? 'theme-light' : 'theme-dark'" :size="20" decorative />
        </button>
      </header>

      <!-- 标签筛选 -->
      <div class="home__filters" role="tablist" aria-label="按分类筛选">
        <button
          class="home__chip"
          :class="{ 'is-active': activeTag === ALL_TAG }"
          type="button"
          role="tab"
          :aria-selected="activeTag === ALL_TAG"
          @click="activeTag = ALL_TAG"
        >
          全部
          <span class="home__chip-count">{{ tools.length }}</span>
        </button>
        <button
          v-for="tag in tags"
          :key="tag"
          class="home__chip"
          :class="{ 'is-active': activeTag === tag }"
          type="button"
          role="tab"
          :aria-selected="activeTag === tag"
          @click="activeTag = tag"
        >
          {{ tag }}
          <span class="home__chip-count">{{ countByTag(tag) }}</span>
        </button>
      </div>

      <!-- 工具列表 -->
      <ul v-if="visibleTools.length" class="home__list">
        <li v-for="tool in visibleTools" :key="tool.id">
          <ToolCard :item="tool" />
        </li>
      </ul>

      <div v-else class="home__empty">
        <AppIcon name="search" :size="36" decorative />
        <p class="home__empty-title">该分类下暂无工具</p>
        <button class="home__empty-action" type="button" @click="activeTag = ALL_TAG">
          查看全部工具
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { AppIcon } from '@/shared/icons'
import { CategoryManager } from '../composables/category-manager'
import { ToolListManager } from '../composables/tool-list-manager'
import { useTheme } from '@/shared/composables/useTheme'
import ToolCard from '../components/ToolCard.vue'

/**
 * 首页：工具导航
 *
 * 布局原则见 docs/03-design-system.md §9：单页单主任务、
 * 触控优先、渐进披露。
 */

const ALL_TAG = '全部'

const categoryManager = new CategoryManager()
const toolListManager = new ToolListManager()

const { resolvedMode, toggleMode } = useTheme()
const isDark = computed(() => resolvedMode.value === 'dark')

const tools = computed(() => toolListManager.getToolList())
const tags = computed(() => categoryManager.getCategories().map(c => c.name))

const activeTag = ref<string>(ALL_TAG)

const visibleTools = computed(() =>
  activeTag.value === ALL_TAG
    ? tools.value
    : toolListManager.getToolList({ category: activeTag.value }),
)

function countByTag(tag: string): number {
  return categoryManager.getCategoryById(tag)?.count ?? 0
}
</script>

<style scoped>
@import './home.css';
</style>
