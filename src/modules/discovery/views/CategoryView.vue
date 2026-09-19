<template>
  <div class="cat">
    <div class="page-content">
      <!-- ============ 分类详情：全部工具 ============ -->
      <template v-if="current">
        <button class="cat__back" type="button" @click="clear">
          <AppIcon name="arrow-left" :size="16" decorative />
          {{ t('category.all') }}
        </button>

        <header class="cat__head">
          <h1 class="cat__title">{{ tagName(current.tag) }}</h1>
          <span class="cat__count">{{ tn('common.count.tools', current.tools.length) }}</span>
        </header>

        <!--
          刻意不用货架。
          货架的美感来自「陈列精选的少数」，一层最多三个；分类页要给的是
          全量，用货架会退化成带横线的网格。此处改为紧凑列表——
          植物降为 40px 的视觉锚点，描述回归（主页删它是因为浏览时是噪音，
          查找时它是信息）。
          见 docs/08-home-redesign-proposal.md §9
        -->
        <ul class="cat__list">
          <li v-for="tool in current.tools" :key="tool.id">
            <router-link class="cat__row" :to="tool.route.path">
              <PlantIcon :name="tool.plant" :size="40" decorative />
              <span class="cat__text">
                <span class="cat__name">{{ lt(tool.title) }}</span>
                <span class="cat__desc">{{ lt(tool.description) }}</span>
              </span>
            </router-link>
          </li>
        </ul>
      </template>

      <!-- ============ 分类索引 ============ -->
      <template v-else>
        <header class="cat__head">
          <h1 class="cat__title">{{ t('category.title') }}</h1>
        </header>

        <ul class="cat__index">
          <li v-for="shelf in shelves" :key="shelf.tag">
            <button
              class="cat__entry"
              type="button"
              :aria-label="t('category.index.more', { name: tagName(shelf.tag) })"
              @click="select(shelf.tag)"
            >
              <PlantIcon :name="shelf.tools[0].plant" :size="44" decorative />
              <span class="cat__text">
                <span class="cat__name">{{ tagName(shelf.tag) }}</span>
                <span class="cat__desc">{{ tagDescription(shelf.tag) }}</span>
              </span>
              <span class="cat__count">{{ shelf.tools.length }}</span>
              <AppIcon name="arrow-right" :size="16" class="cat__chevron" decorative />
            </button>
          </li>
        </ul>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AppIcon } from '@/shared/icons'
import { PlantIcon } from '@/shared/mascot'
import { t, tn, lt, tagName, tagDescription, type ToolTag } from '@/shared/i18n'
import { getShelves } from '@/modules/tools'

/**
 * 分类页
 *
 * 两个层级共用本组件：
 *   无 query        → 分类索引
 *   ?category=<tag> → 该分类下的全部工具（tag 为分类 ID，非显示名）
 *
 * 与首页的分工：首页是浏览（植物大、节奏慢、情绪优先），
 * 本页是查找（信息密度优先，植物降为锚点）。
 */

const route = useRoute()
const router = useRouter()

const shelves = getShelves()

/**
 * 按分类 ID 定位当前分类
 *
 * 用 ID 而非显示名——显示名随语言变化，不能用作标识。
 */
const current = computed(() => {
  const tag = route.query.category as ToolTag | undefined
  if (!tag) return undefined
  return shelves.find(s => s.tag === tag)
})

function select(tag: ToolTag): void {
  router.push({ name: 'sort', query: { category: tag } })
}

function clear(): void {
  router.push({ name: 'sort' })
}
</script>

<style scoped>
@import './category.css';
</style>
