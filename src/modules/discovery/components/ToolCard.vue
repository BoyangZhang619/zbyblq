<template>
  <router-link :to="item.href" class="tool-card texture-paper">
    <div class="tool-card__icon">
      <AppIcon :name="item.icon" :size="26" decorative />
    </div>

    <div class="tool-card__body">
      <div class="tool-card__head">
        <h3 class="tool-card__title">{{ item.title }}</h3>
        <span v-if="item.badge" class="tool-card__badge">{{ item.badge }}</span>
      </div>

      <p class="tool-card__desc">{{ item.desc }}</p>

      <div class="tool-card__foot">
        <ul class="tool-card__tags">
          <li v-for="tag in visibleTags" :key="tag" class="tool-card__tag">
            {{ tag }}
          </li>
        </ul>
        <time v-if="item.updateTime" class="tool-card__time">
          {{ shortDate(item.updateTime) }}
        </time>
      </div>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AppIcon } from '@/shared/icons'
import type { NavItem } from '@/modules/tools'

/**
 * 工具卡片
 *
 * 视觉规范见 docs/03-design-system.md §8.1：
 * - 图标容器为圆角方块，背景用主题色柔和底
 * - 标签不使用彩色，统一下沉底 + 次文字
 * - 描述最多两行，超出省略
 */

const props = withDefaults(defineProps<{
  item: NavItem
  /** 最多显示几个标签 */
  maxTags?: number
}>(), {
  maxTags: 2,
})

const visibleTags = computed(() => props.item.tags.slice(0, props.maxTags))

/** 只显示月日，卡片上的时间是次要信息 */
function shortDate(value: string): string {
  const m = value.match(/^\d{4}-(\d{2})-(\d{2})$/)
  return m ? `${m[1]}-${m[2]}` : value
}
</script>

<style scoped>
@import './tool-card.css';
</style>
