<template>
  <div class="home grid-bg">
    <div class="page-content">
      <header class="home__head">
        <span class="home__brand">𝒵𝐵𝒴𝐵𝐿𝒬</span>

        <button
          class="home__action"
          type="button"
          :aria-label="isDark ? '切换到浅色模式' : '切换到深色模式'"
          @click="toggleMode"
        >
          <AppIcon :name="isDark ? 'theme-light' : 'theme-dark'" :size="19" decorative />
        </button>
      </header>

      <!-- 主视觉：植物 + 问候词 -->
      <div class="home__hero">
        <PlantIcon name="hero" :size="104" aspect="1 / 1" decorative />
        <p class="home__greeting">小筑</p>
      </div>

      <!-- 货架 -->
      <ShelfRow
        v-for="shelf in shelves"
        :key="shelf.name"
        :name="shelf.name"
        :tools="shelf.tools"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AppIcon } from '@/shared/icons'
import { PlantIcon } from '@/shared/mascot'
import { useTheme } from '@/shared/composables/useTheme'
import { getShelves } from '@/modules/tools'
import ShelfRow from '../components/ShelfRow.vue'

/**
 * 首页：植物货架
 *
 * 布局原则见 docs/08-home-redesign-proposal.md §7.2：
 * 不用卡片，工具以「植物 + 花盆」的形式坐在木板上，
 * 一层货架 = 一个分类。
 *
 * 木板的坑：标签必须放在木板之下。放在植物下方会被木板遮挡，
 * 二者需用同一套 grid 列宽才能对齐。
 */

const { resolvedMode, toggleMode } = useTheme()
const isDark = computed(() => resolvedMode.value === 'dark')

const shelves = computed(() => getShelves())
</script>

<style scoped>
@import './home.css';
</style>
