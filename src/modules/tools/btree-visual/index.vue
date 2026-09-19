<template>
  <div class="btree">
    <div class="page-content">
      <header class="btree__header">
        <h1 class="btree__title">{{ tt('title') }}</h1>
        <p class="btree__subtitle">{{ tt('subtitle') }}</p>
      </header>

      <!-- 输入 -->
      <section class="btree__section">
        <label class="btree__label" for="btree-input">{{ tt('inputLabel') }}</label>

        <div class="btree__input-row">
          <input
            id="btree-input"
            v-model="input"
            class="btree__input"
            type="text"
            :placeholder="tt('inputPlaceholder')"
            spellcheck="false"
            autocomplete="off"
            @keydown.enter="generate"
          />

          <button class="btree__btn btree__btn--primary" type="button" @click="generate">
            <AppIcon name="sparkle" :size="16" decorative />
            {{ tt('generate') }}
          </button>

          <button
            class="btree__btn"
            type="button"
            :disabled="!hasTree"
            @click="saveImage"
          >
            <AppIcon name="save" :size="16" decorative />
            {{ tt('save') }}
          </button>

          <button class="btree__btn" type="button" @click="clear">
            <AppIcon name="trash" :size="16" decorative />
            {{ tt('clear') }}
          </button>
        </div>

        <p class="btree__hint">
          <AppIcon name="hint" :size="14" decorative />
          {{ tt('inputHint') }}
        </p>

        <p v-if="errorMessage" class="btree__error" role="alert">
          <AppIcon name="status-warning" :size="16" decorative />
          {{ errorMessage }}
        </p>
      </section>

      <!-- 示例 -->
      <section class="btree__section">
        <h2 class="btree__label">{{ tt('examples') }}</h2>
        <div class="btree__chips">
          <button
            v-for="example in EXAMPLES"
            :key="example.value"
            class="btree__chip"
            type="button"
            @click="loadExample(example.value)"
          >
            {{ tt(example.key) }}
          </button>
        </div>
      </section>

      <!-- 树 -->
      <section class="btree__section">
        <div class="btree__stage" :class="{ 'is-empty': !hasTree }">
          <p v-if="!hasTree" class="btree__placeholder">
            <AppIcon name="tool-btree" :size="32" decorative />
            {{ tt('placeholder') }}
          </p>

          <TreeCanvas
            ref="treeCanvas"
            :root="tree"
            :width="layout.width"
            :height="layout.height"
            :label="canvasAlt"
          />
        </div>
      </section>

      <!-- 统计 -->
      <section class="btree__section">
        <dl class="btree__stats">
          <div class="btree__stat">
            <dt class="btree__stat-label">{{ tt('statsNodes') }}</dt>
            <dd class="btree__stat-value">{{ stats.nodeCount }}</dd>
          </div>
          <div class="btree__stat">
            <dt class="btree__stat-label">{{ tt('statsHeight') }}</dt>
            <dd class="btree__stat-value">{{ stats.height }}</dd>
          </div>
          <div class="btree__stat">
            <dt class="btree__stat-label">{{ tt('statsLeaves') }}</dt>
            <dd class="btree__stat-value">{{ stats.leafCount }}</dd>
          </div>
        </dl>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { AppIcon } from '@/shared/icons'
import { useToolI18n } from '@/shared/i18n'
import { messages, type BtreeMessages } from './locales'
import TreeCanvas from './components/TreeCanvas.vue'
import { useTreeLayout, type TreeErrorCode } from './composables/useTreeLayout'

/**
 * 二叉树可视化
 *
 * 融合迁移完成（docs/09-tool-page-spec.md Stage 2 + Stage 3）：由 iframe
 * 桥接改为原生 Vue 组件。逻辑在 composables/useTreeLayout.ts，绘制在
 * components/TreeCanvas.vue，本文件只负责组装与交互。
 *
 * 与原实现的差异：
 * 1. 错误由 alert 改为就地提示——弹窗会打断操作，且不随语言切换
 * 2. 界面文案接入 i18n，图标接入 AppIcon，配色接入语义令牌
 * 3. 去掉窗口缩放时的重新生成（布局与视口无关，见 composables 注释）
 */

const { tt } = useToolI18n(messages)

const { input, tree, layout, stats, error, hasTree, generate, clear, loadExample } =
  useTreeLayout()

/** 快速示例，与旧版示例按钮一一对应 */
const EXAMPLES = [
  { key: 'exampleComplete', value: '[1, 2, 3, 4, 5, 6, 7]' },
  { key: 'exampleLeetcode', value: '[3, 9, 20, null, null, 15, 7]' },
  { key: 'exampleLeftSkewed', value: '[1, 2, null, 3, null, 4, null, 5]' },
  { key: 'exampleRightSkewed', value: '[1, null, 2, null, 3, null, 4]' },
  { key: 'exampleBst', value: '[5, 3, 7, 2, 4, 6, 8, 1]' },
] as const satisfies readonly { key: keyof BtreeMessages; value: string }[]

/** 错误码到文案键的映射。写成常量表，漏配会在编译期报错 */
const ERROR_KEYS: Record<TreeErrorCode, keyof BtreeMessages> = {
  'empty-input': 'errorEmpty',
  'invalid-format': 'errorFormat',
  'no-tree': 'errorNoTree',
}

const errorMessage = computed(() => (error.value ? tt(ERROR_KEYS[error.value]) : ''))

const canvasAlt = computed(() => tt('canvasAlt', { count: stats.value.nodeCount }))

const treeCanvas = ref<InstanceType<typeof TreeCanvas> | null>(null)

function saveImage(): void {
  treeCanvas.value?.exportPNG()
}

onMounted(() => {
  // 旧版在 DOMContentLoaded 时生成默认示例，此处保持一致
  generate()
})
</script>

<style scoped>
@import './btree-visual.css';
</style>
