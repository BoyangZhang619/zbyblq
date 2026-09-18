<template>
  <div class="category">
    <div class="page-content">
      <!-- 二级：某分类下的工具 -->
      <template v-if="selected">
        <button class="category__back" type="button" @click="clear">
          <AppIcon name="arrow-right" :size="18" class="category__back-icon" decorative />
          返回分类
        </button>

        <header class="category__header">
          <h1 class="category__title">{{ selected.name }}</h1>
          <p class="category__meta">{{ selected.count }} 个工具</p>
          <p class="category__desc">{{ selected.description }}</p>
        </header>

        <ul v-if="tools.length" class="category__list">
          <li v-for="tool in tools" :key="tool.id">
            <ToolCard :item="tool" />
          </li>
        </ul>

        <div v-else class="category__empty">
          <AppIcon name="search" :size="36" decorative />
          <p>该分类下暂无工具</p>
        </div>
      </template>

      <!-- 一级：分类概览 -->
      <template v-else>
        <header class="category__header">
          <h1 class="category__title">分类浏览</h1>
          <p class="category__meta">按标签查看全部工具</p>
        </header>

        <ul class="category__grid">
          <li v-for="item in categories" :key="item.id">
            <button class="category__item" type="button" @click="select(item.id)">
              <span class="category__item-name">{{ item.name }}</span>
              <span class="category__item-count">{{ item.count }}</span>
              <span class="category__item-desc">{{ item.description }}</span>
            </button>
          </li>

          <li>
            <router-link to="/home" class="category__item category__item--all">
              <span class="category__item-name">全部工具</span>
              <span class="category__item-count">{{ totalTools }}</span>
              <span class="category__item-desc">浏览完整列表</span>
            </router-link>
          </li>
        </ul>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { AppIcon } from '@/shared/icons'
import { CategoryManager } from '../composables/category-manager'
import { ToolListManager } from '../composables/tool-list-manager'
import ToolCard from '../components/ToolCard.vue'

/**
 * 分类页
 *
 * 与首页的标签筛选为两级关系：首页是快速筛选，本页提供
 * 分类概览与下钻浏览，包含分类说明。
 */

const route = useRoute()
const categoryManager = new CategoryManager()
const toolListManager = new ToolListManager()

const selectedId = ref<string | null>(null)

// 支持通过 ?category=xxx 深链接进入某个分类
const initial = route.query.category as string | undefined
if (initial && categoryManager.isCategoryExists(initial)) {
  selectedId.value = initial
}

const categories = computed(() => categoryManager.getCategories())
const totalTools = computed(() => categoryManager.getAllTools().length)

const selected = computed(() =>
  selectedId.value ? categoryManager.getCategoryById(selectedId.value) : undefined,
)

const tools = computed(() =>
  selectedId.value ? toolListManager.getToolList({ category: selectedId.value }) : [],
)

function select(id: string): void {
  selectedId.value = id
}

function clear(): void {
  selectedId.value = null
}
</script>

<style scoped>
@import './category.css';
</style>
