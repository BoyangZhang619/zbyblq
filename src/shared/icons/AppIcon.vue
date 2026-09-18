<template>
  <span
    class="app-icon"
    :class="{ 'app-icon--spin': spin }"
    :style="sizeStyle"
    :role="decorative ? undefined : 'img'"
    :aria-label="decorative ? undefined : label"
    :aria-hidden="decorative ? 'true' : undefined"
    v-html="raw"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { iconRegistry, type IconName } from './registry'

/**
 * 统一图标组件
 *
 * 全站唯一允许呈现图标的入口。任何界面位置都不得使用 emoji 字符，
 * 一律通过本组件渲染自制 SVG。参见 docs/04-icon-system.md
 *
 * 关于 v-html 的安全性：注入内容来自构建期静态导入的 .svg 文件，
 * 不含任何用户输入或运行时数据，因此不存在 XSS 风险。
 * 若将来出现动态图标源，必须改为受控渲染。
 */

const props = withDefaults(defineProps<{
  /** 图标名，对应 registry 中的键。拼错会在编译期报错 */
  name: IconName
  /** 尺寸，数字按 px 处理 */
  size?: number | string
  /** 无障碍标签。功能性图标必须提供 */
  label?: string
  /** 纯装饰时置 true，对读屏隐藏 */
  decorative?: boolean
  /** 加载态旋转 */
  spin?: boolean
}>(), {
  size: 24,
  decorative: false,
  spin: false,
})

const raw = computed(() => iconRegistry[props.name])

const sizeStyle = computed(() => {
  const value = typeof props.size === 'number' ? `${props.size}px` : props.size
  return { width: value, height: value }
})
</script>

<style scoped>
.app-icon {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  color: inherit;
  vertical-align: middle;
}

/* v-html 注入的内容不带 scope 属性，需用 :deep 穿透 */
.app-icon :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
}

.app-icon--spin :deep(svg) {
  animation: app-icon-spin 1s linear infinite;
}

@keyframes app-icon-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .app-icon--spin :deep(svg) {
    animation: none;
  }
}
</style>
