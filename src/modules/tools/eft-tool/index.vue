<template>
  <div class="eft">
    <div class="page-content">
      <header class="eft__header">
        <h1 class="eft__title">英文字体转换</h1>
        <p class="eft__subtitle">输入英文，选择样式即可转为对应的 Unicode 字形</p>
      </header>

      <!-- 输入 -->
      <section class="eft__section">
        <label class="eft__label" for="eft-input">输入文本</label>
        <textarea
          id="eft-input"
          v-model="input"
          class="eft__input"
          rows="3"
          placeholder="Type something..."
          spellcheck="false"
          autocomplete="off"
        ></textarea>
      </section>

      <!-- 样式选择 -->
      <section class="eft__section">
        <h2 class="eft__label">选择样式</h2>
        <ul class="eft__styles">
          <li v-for="style in styles" :key="style.id">
            <button
              class="eft__style"
              :class="{ 'is-active': selectedId === style.id }"
              type="button"
              :aria-pressed="selectedId === style.id"
              :aria-label="style.label"
              @click="select(style.id)"
            >
              <span class="eft__style-name" aria-hidden="true">{{ style.name }}</span>
              <span class="eft__style-sample" aria-hidden="true">{{ sampleOf(style) }}</span>
              <span class="eft__style-label">{{ style.label }}</span>
            </button>
          </li>
        </ul>
      </section>

      <!-- 结果 -->
      <section class="eft__section">
        <div class="eft__result-head">
          <h2 class="eft__label">
            转换结果
            <span v-if="selected" class="eft__result-style">{{ selected.label }}</span>
          </h2>
          <button
            class="eft__copy"
            :class="{ 'is-done': copied }"
            type="button"
            :disabled="!hasOutput"
            @click="handleCopy"
          >
            <AppIcon :name="copied ? 'check' : 'clipboard'" :size="16" decorative />
            {{ copied ? '已复制' : '复制' }}
          </button>
        </div>

        <output class="eft__output" :class="{ 'is-empty': !hasOutput }">
          {{ hasOutput ? output : '转换结果将显示在这里' }}
        </output>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { AppIcon } from '@/shared/icons'
import { useFontTransform, sampleOf } from './composables/useFontTransform'

/**
 * 英文字体转换
 *
 * 融合迁移完成（docs/02-fusion-architecture.md Stage 3）：由 iframe 桥接
 * 改为原生 Vue 组件，接入设计令牌与图标体系。
 *
 * 与原实现的差异：
 * 1. 去掉了人为的 150ms + 300ms 延迟动画。转写是同步的纯字符串运算，
 *    旧版的「转换中」状态是虚假的加载反馈，属纯粹的交互摩擦。
 * 2. 样式列表显示无障碍标签。旧版仅显示风格化字符，读屏无法朗读。
 */

const { input, styles, selectedId, selected, output, hasOutput, select, copy } =
  useFontTransform()

const copied = ref(false)

async function handleCopy(): Promise<void> {
  const ok = await copy()
  copied.value = ok
  if (ok) {
    setTimeout(() => { copied.value = false }, 1400)
  }
}
</script>

<style scoped>
@import './eft.css';
</style>
