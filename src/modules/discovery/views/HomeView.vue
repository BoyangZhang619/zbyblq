<template>
  <div class="home grid-bg">
    <div class="page-content">
      <header class="home__head">
        <span class="home__brand">{{ t('app.brand') }}</span>

        <button
          class="home__action"
          type="button"
          :aria-label="t('home.switchLanguage')"
          @click="switchLanguage"
        >
          <AppIcon name="language" :size="19" decorative />
        </button>
      </header>

      <!-- 主视觉：植物 + 问候词 -->
      <div class="home__hero">
        <PlantIcon name="hero" :size="104" aspect="1 / 1" decorative />
        <p class="home__greeting">{{ whisper }}</p>
      </div>

      <!-- 货架 -->
      <ShelfRow
        v-for="shelf in shelves"
        :key="shelf.tag"
        :tag="shelf.tag"
        :tools="shelf.tools"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AppIcon } from '@/shared/icons'
import { PlantIcon } from '@/shared/mascot'
import { t, useI18n, useWhisper } from '@/shared/i18n'
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

const { locale, locales, setLocale } = useI18n()
const whisper = useWhisper()

const shelves = computed(() => getShelves())

/**
 * 在可用语种间轮换
 *
 * 放在首页右上角而非只藏在设置里——语言是「一眼即用」的偏好，
 * 不该让英文用户先进中文的设置页才能改。
 */
function switchLanguage(): void {
  const i = locales.indexOf(locale.value as (typeof locales)[number])
  setLocale(locales[(i + 1) % locales.length])
}
</script>

<style scoped>
@import './home.css';
</style>
