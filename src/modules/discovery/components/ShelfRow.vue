<template>
  <section class="shelf">
    <h2 class="shelf__name">{{ tagName(tag) }}</h2>

    <div class="shelf__stage">
      <!--
        三层结构：植物 → 木板 → 标签。
        标签必须独立成层放在木板之下——若与植物放在同一个容器里，
        视觉顺序会变成「植物 / 标签 / 木板」，标签被木板压住。
        两层用同一套 grid 列宽（三列）保证纵向对齐。
      -->
      <ul class="shelf__row">
        <li v-for="(tool, i) in visible" :key="tool.id" class="shelf__slot">
          <router-link
            class="shelf__item"
            :to="tool.route.path"
            :aria-label="lt(tool.title)"
          >
            <PlantIcon :name="tool.plant" :size="SIZES[i % SIZES.length]" decorative />
          </router-link>
        </li>
      </ul>

      <!-- 超出三个时，右缘给一枚极淡的箭头 -->
      <router-link
        v-if="hasMore"
        class="shelf__more"
        :to="{ name: 'sort', query: { category: tag } }"
        :aria-label="t('home.shelf.more', { name: tagName(tag), count: tools.length })"
      >
        <AppIcon name="arrow-right" :size="18" decorative />
      </router-link>

      <div class="shelf__board" aria-hidden="true"></div>

      <ul class="shelf__names">
        <li v-for="tool in visible" :key="tool.id" class="shelf__slot">
          <router-link class="shelf__label" :to="tool.route.path">
            {{ lt(tool.title) }}
          </router-link>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AppIcon } from '@/shared/icons'
import { PlantIcon } from '@/shared/mascot'
import { t, lt, tagName, type ToolTag } from '@/shared/i18n'
import type { ToolManifest } from '@/modules/tools'

/**
 * 一个货架
 *
 * 一层货架 = 一个分类。植物连盆坐在木板上，标签贴在板沿下方。
 * 参见 docs/08-home-redesign-proposal.md §7.2
 */

const props = withDefaults(defineProps<{
  /** 分类标识。显示名由 i18n 提供 */
  tag: ToolTag
  /** 该分类下的全部工具 */
  tools: ToolManifest[]
  /** 最多展示几个，超出则由箭头跳转 */
  max?: number
}>(), {
  max: 3,
})

const visible = computed(() => props.tools.slice(0, props.max))
const hasMore = computed(() => props.tools.length > props.max)

/**
 * 尺寸错落：同一货架内每株宽度不同，形成非标准化的排列。
 * 按位置轮换三档。用索引而非形态名，避免同种形态总是同尺寸。
 */
const SIZES = [72, 58, 66]
</script>

<style scoped>
@import './shelf.css';
</style>
