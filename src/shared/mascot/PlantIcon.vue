<template>
  <span
    class="plant"
    :style="sizeStyle"
    :role="decorative ? undefined : 'img'"
    :aria-label="decorative ? undefined : label"
    :aria-hidden="decorative ? 'true' : undefined"
    v-html="raw"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { plantRegistry, type PlantName } from './registry'

/**
 * 植物
 *
 * 品牌表达层，与几何图标体系（AppIcon）分工不同：
 * 图标管界面功能，植物管工具身份与主视觉。
 * 参见 docs/08-home-redesign-proposal.md §7.1
 *
 * 关于 v-html 的安全性：注入内容来自构建期静态导入的 .svg 文件，
 * 不含任何用户输入或运行时数据，因此不存在 XSS 风险。
 */

const props = withDefaults(defineProps<{
  /** 形态名，对应 registry 中的键。拼错会在编译期报错 */
  name: PlantName
  /** 宽度，高度按 aspect 自动计算 */
  size?: number | string
  /**
   * 宽高比。默认 2/3（对应 80×120 的 viewBox）。
   * 主视觉的 hero 形态为 1:1，需显式传入。
   */
  aspect?: string
  /** 无障碍标签。功能性使用时必须提供 */
  label?: string
  /** 纯装饰时置 true，对读屏隐藏 */
  decorative?: boolean
}>(), {
  size: 56,
  aspect: '2 / 3',
  decorative: true,
})

const raw = computed(() => plantRegistry[props.name])

const sizeStyle = computed(() => {
  const w = typeof props.size === 'number' ? `${props.size}px` : props.size
  return { width: w, aspectRatio: props.aspect }
})
</script>

<style scoped>
.plant {
  display: block;
  flex: none;
}

.plant :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
}

/* 深色模式下植物偏暗，适度提亮以维持可辨度 */
:global(:root[data-theme='dark']) .plant {
  filter: brightness(1.15) saturate(0.92);
}
</style>
