<template>
  <div class="cat">
    <div class="page-content">
      <!-- ============ 分类详情：全部工具 ============ -->
      <template v-if="current">
        <button class="cat__back" type="button" @click="clear">
          <AppIcon name="arrow-left" :size="16" decorative />
          全部分类
        </button>

        <header class="cat__head">
          <h1 class="cat__title">{{ current.name }}</h1>
          <span class="cat__count">{{ current.tools.length }} 个工具</span>
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
                <span class="cat__name">{{ tool.title }}</span>
                <span class="cat__desc">{{ tool.description }}</span>
              </span>
            </router-link>
          </li>
        </ul>
      </template>

      <!-- ============ 分类索引 ============ -->
      <template v-else>
        <header class="cat__head">
          <h1 class="cat__title">分类</h1>
        </header>

        <ul class="cat__index">
          <li v-for="item in categories" :key="item.name">
            <button class="cat__entry" type="button" @click="select(item.name)">
              <PlantIcon :name="item.plant" :size="44" decorative />
              <span class="cat__text">
                <span class="cat__name">{{ item.name }}</span>
                <span class="cat__desc">{{ item.description }}</span>
              </span>
              <span class="cat__count">{{ item.tools.length }}</span>
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
import { getShelves, type ToolManifest } from '@/modules/tools'

/**
 * 分类页
 *
 * 两个层级共用本组件：
 *   无 query        → 分类索引
 *   ?category=xxx   → 该分类下的全部工具
 *
 * 与首页的分工：首页是浏览（植物大、节奏慢、情绪优先），
 * 本页是查找（信息密度优先，植物降为锚点）。
 */

const route = useRoute()
const router = useRouter()

const shelves = getShelves()

interface CategoryEntry {
  name: string
  /** 代表植物：取该分类首个工具的形态 */
  plant: ToolManifest['plant']
  tools: ToolManifest[]
  description: string
}

/** 分类说明。未登记的标签回退为通用描述 */
const DESCRIPTIONS: Record<string, string> = {
  工具: '实用工具集合',
  算法: '算法可视化与演示',
  图像: '图像处理与转换',
  音乐: '音乐创作与演奏',
  实验: '试验性质的功能',
}

const categories = computed<CategoryEntry[]>(() =>
  shelves.map(s => ({
    name: s.name,
    plant: s.tools[0].plant,
    tools: s.tools,
    description: DESCRIPTIONS[s.name] ?? `${s.name}相关工具`,
  })),
)

const current = computed(() => {
  const name = route.query.category as string | undefined
  if (!name) return undefined
  return categories.value.find(c => c.name === name)
})

function select(name: string): void {
  router.push({ name: 'sort', query: { category: name } })
}

function clear(): void {
  router.push({ name: 'sort' })
}
</script>

<style scoped>
@import './category.css';
</style>
