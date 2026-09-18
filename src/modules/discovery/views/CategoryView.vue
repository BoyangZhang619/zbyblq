<template>
  <div class="sort-view">
    <div class="sort-container">
      <!-- 返回按钮 -->
      <router-link v-if="selectedCategory" to="/sort" class="back-button">
        返回分类
      </router-link>

      <!-- 分类浏览模式 -->
      <template v-if="!selectedCategory">
        <header class="sort-header">
          <h1 class="sort-title">分类浏览</h1>
          <p class="sort-subtitle">按类别浏览所有工具</p>
        </header>

        <div class="categories-flex">
          <button
            v-for="category in categories"
            :key="category.id"
            class="category-button"
            @click="selectCategory(category.id)"
          >
            <div class="category-name">{{ category.name }}</div>
            <div class="category-count">{{ category.count }} 个工具</div>
            <div class="category-description">{{ category.description }}</div>
          </button>

          <router-link
            to="/home"
            class="all-tools-button"
          >
            <div class="all-tools-name">全部工具</div>
            <div class="all-tools-count">{{ totalTools }} 个工具</div>
          </router-link>
        </div>
      </template>

      <!-- 工具列表模式 -->
      <template v-else>
        <div class="tool-list">
          <div class="tool-list-header">
            <h2 class="tool-list-title">{{ selectedCategoryName }}</h2>
            <span class="tool-count">{{ categoryTools.length }} 个工具</span>
          </div>

          <div v-if="categoryTools.length > 0" class="tool-grid">
            <router-link
              v-for="tool in categoryTools"
              :key="tool.id"
              :to="tool.href"
              class="tool-item"
            >
              <div class="tool-item-title">{{ tool.title }}</div>
              <div class="tool-item-desc">{{ tool.desc }}</div>
              <div class="tool-item-meta">
                <div class="tool-item-tags">
                  <span v-for="tag in tool.tags.slice(0, 2)" :key="tag" class="tool-tag">
                    {{ tag }}
                  </span>
                </div>
                <span v-if="tool.updateTime" class="tool-update-time">
                  {{ formatDate(tool.updateTime) }}
                </span>
              </div>
            </router-link>
          </div>

          <div v-else class="tool-empty">
            <div class="tool-empty-text">该分类暂无工具</div>
            <button class="back-button" @click="clearCategory">返回分类</button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { CategoryManager } from '../composables/category-manager'
import { ToolListManager } from '../composables/tool-list-manager'

const route = useRoute()
const categoryManager = new CategoryManager()
const toolListManager = new ToolListManager()

const selectedCategory = ref<string | null>(null)

const categories = computed(() => categoryManager.getCategories())
const totalTools = computed(() => categoryManager.getAllTools().length)

const selectedCategoryName = computed(() => {
  if (!selectedCategory.value) return ''
  const category = categoryManager.getCategoryById(selectedCategory.value)
  return category?.name || ''
})

const categoryTools = computed(() => {
  if (!selectedCategory.value) return []
  return toolListManager.getToolList({
    category: selectedCategory.value,
    sortBy: 'default',
  })
})

/**
 * 选择分类
 */
function selectCategory(categoryId: string): void {
  selectedCategory.value = categoryId
}

/**
 * 清除分类选择
 */
function clearCategory(): void {
  selectedCategory.value = null
}

/**
 * 格式化日期
 */
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  } catch {
    return dateStr
  }
}

// 检查路由参数
const categoryParam = route.query.category as string | undefined
if (categoryParam && categoryManager.isCategoryExists(categoryParam)) {
  selectedCategory.value = categoryParam
}
</script>

<style scoped>
@import './category.css';
@import './tool-list.css';
</style>