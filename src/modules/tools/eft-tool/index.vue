<template>
  <div class="eft">
    <div class="page-content">
      <header class="eft__header">
        <h1 class="eft__title">{{ tt('title') }}</h1>
        <p class="eft__subtitle">{{ tt('subtitle') }}</p>
      </header>

      <!-- 输入 -->
      <section class="eft__section">
        <label class="eft__label" for="eft-input">{{ tt('inputLabel') }}</label>
        <textarea
          id="eft-input"
          v-model="input"
          class="eft__input"
          rows="3"
          :placeholder="tt('inputPlaceholder')"
          spellcheck="false"
          autocomplete="off"
        ></textarea>
      </section>

      <!-- 样式选择 -->
      <section class="eft__section">
        <h2 class="eft__label">{{ tt('styleLabel') }}</h2>
        <ul class="eft__styles">
          <li v-for="style in styles" :key="style.id">
            <button
              class="eft__style"
              :class="{ 'is-active': selectedId === style.id }"
              type="button"
              :aria-pressed="selectedId === style.id"
              :aria-label="styleLabel(style.id)"
              @click="select(style.id)"
            >
              <span class="eft__style-name" aria-hidden="true">{{ style.name }}</span>
              <span class="eft__style-sample" aria-hidden="true">{{ sampleOf(style) }}</span>
              <span class="eft__style-label">{{ styleLabel(style.id) }}</span>
            </button>
          </li>
        </ul>
      </section>

      <!-- 结果 -->
      <section class="eft__section">
        <div class="eft__result-head">
          <h2 class="eft__label">
            {{ tt('resultLabel') }}
            <span v-if="selected" class="eft__result-style">{{ styleLabel(selected.id) }}</span>
          </h2>
          <button
            class="eft__copy"
            :class="{ 'is-done': copied }"
            type="button"
            :disabled="!hasOutput"
            @click="handleCopy"
          >
            <AppIcon :name="copied ? 'check' : 'clipboard'" :size="16" decorative />
            {{ copied ? tt('copied') : tt('copy') }}
          </button>
        </div>

        <output class="eft__output" :class="{ 'is-empty': !hasOutput }">
          {{ hasOutput ? output : tt('resultPlaceholder') }}
        </output>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { AppIcon } from '@/shared/icons'
import { useToolI18n } from '@/shared/i18n'
import { useFontTransform, sampleOf } from './composables/useFontTransform'
import { messages, type EftKey } from './locales'

/**
 * 英文字体转换
 *
 * 融合迁移完成（docs/02-fusion-architecture.md Stage 3）：由 iframe 桥接
 * 改为原生 Vue 组件，接入设计令牌、图标体系与 i18n。
 *
 * 与原实现的差异：
 * 1. 去掉了人为的 150ms + 300ms 延迟动画。转写是同步的纯字符串运算，
 *    旧版的「转换中」是虚假的加载反馈，属纯粹的交互摩擦。
 * 2. 样式列表显示无障碍标签。旧版仅显示风格化字符，读屏无法朗读。
 */

const { tt } = useToolI18n(messages)

const { input, styles, selectedId, selected, output, hasOutput, select, copy } =
  useFontTransform()

/** 样式 id → 文案键。写成映射使漏配在编译期暴露 */
const STYLE_KEYS = {
  bold: 'style.bold',
  italic: 'style.italic',
  'bold-italic': 'style.bold-italic',
  gothic: 'style.gothic',
  'bold-gothic': 'style.bold-gothic',
  mono: 'style.mono',
  spaced: 'style.spaced',
  'small-caps': 'style.small-caps',
  script: 'style.script',
  boxed: 'style.boxed',
  combo: 'style.combo',
} as const satisfies Record<string, EftKey>

function styleLabel(id: string): string {
  const key = STYLE_KEYS[id as keyof typeof STYLE_KEYS]
  return key ? tt(key) : id
}

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
