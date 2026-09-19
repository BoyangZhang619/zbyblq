<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="dlg"
      role="alertdialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      :aria-describedby="bodyId"
      @keydown.esc="emit('close')"
    >
      <div class="dlg__scrim" @click="emit('close')"></div>

      <div class="dlg__panel">
        <h2 :id="titleId" class="dlg__title">{{ title }}</h2>
        <p :id="bodyId" class="dlg__body">{{ body }}</p>

        <div class="dlg__actions">
          <button ref="confirmBtn" class="dlg__btn" type="button" @click="emit('close')">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'

/**
 * 模态对话框
 *
 * 用于「拒绝执行」这类必须打断的场合——与就地提示不同，模态会夺走焦点，
 * 所以只用在真正需要用户确认已读的地方（如参数超出硬件上限）。
 * 一般性的错误提示请用就地文案。
 */

const props = withDefaults(defineProps<{
  open: boolean
  title: string
  body: string
  confirmText: string
}>(), {})

const emit = defineEmits<{ close: [] }>()

const confirmBtn = ref<HTMLElement | null>(null)

const titleId = `dlg-title-${Math.floor(performance.now() * 1000) % 1e9}`
const bodyId = `${titleId}-body`

/** 打开时把焦点移进对话框，关闭时归还原处 */
let lastFocused: HTMLElement | null = null

watch(() => props.open, async (isOpen) => {
  if (isOpen) {
    lastFocused = document.activeElement as HTMLElement | null
    await nextTick()
    confirmBtn.value?.focus()
  } else {
    lastFocused?.focus()
    lastFocused = null
  }
})

/** 模态期间禁止背景滚动 */
watch(() => props.open, (isOpen) => {
  document.body.style.overflow = isOpen ? 'hidden' : ''
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})
</script>

<style scoped>
@import './app-dialog.css';
</style>
