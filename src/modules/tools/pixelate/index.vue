<template>
  <div class="imgtool">
    <div class="page-content">
      <header class="imgtool__header">
        <h1 class="imgtool__title">图片像素化</h1>
        <p class="imgtool__subtitle">调整像素块大小，可选择性限制色板</p>
      </header>

      <!-- 上传 -->
      <div
        class="imgtool__drop"
        :class="{ 'is-dragging': isDragging, 'has-image': hasImage }"
        role="button"
        tabindex="0"
        :aria-label="hasImage ? '重新选择图片' : '选择图片'"
        @click="pickFile"
        @keydown.enter.prevent="pickFile"
        @keydown.space.prevent="pickFile"
        @dragenter="onDragEnter"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @drop="onDrop"
      >
        <input
          ref="fileInput"
          class="visually-hidden"
          type="file"
          accept="image/*"
          @change="handleInputChange"
        />
        <AppIcon name="tool-pixelate" :size="30" decorative />
        <p class="imgtool__drop-title">
          {{ hasImage ? '已载入图片，点击可更换' : '点击选择图片，或拖放到此处' }}
        </p>
        <p v-if="dimensions" class="imgtool__drop-meta">
          原图 {{ dimensions.width }} × {{ dimensions.height }}
        </p>
        <p v-else class="imgtool__drop-meta">支持任意常见图片格式</p>
      </div>

      <p v-if="status === 'error'" class="imgtool__error">{{ errorMessage }}</p>

      <!-- 参数 -->
      <section v-if="hasImage" class="imgtool__section">
        <div class="imgtool__field">
          <div class="imgtool__field-head">
            <label class="imgtool__label" for="block-range">像素块大小</label>
            <span class="imgtool__value">{{ blockSize }}</span>
          </div>
          <input
            id="block-range"
            v-model.number="blockSize"
            class="imgtool__range"
            type="range"
            :min="BLOCK_SIZE_MIN"
            :max="BLOCK_SIZE_MAX"
            step="1"
          />
          <p class="imgtool__hint">数值越大，马赛克越粗</p>
        </div>

        <div class="imgtool__field">
          <label class="imgtool__switch">
            <input v-model="quantize" type="checkbox" />
            <span class="imgtool__switch-track" aria-hidden="true"></span>
            <span class="imgtool__switch-text">限制色板</span>
          </label>

          <div v-if="quantize" class="imgtool__chips" role="radiogroup" aria-label="色板大小">
            <button
              v-for="size in PALETTE_SIZES"
              :key="size"
              class="imgtool__chip"
              :class="{ 'is-active': paletteSize === size }"
              type="button"
              role="radio"
              :aria-checked="paletteSize === size"
              @click="paletteSize = size"
            >
              {{ size }} 色
            </button>
          </div>
          <p class="imgtool__hint">
            通道分箱近似量化，色带感是像素风的预期效果
          </p>
        </div>

        <div class="imgtool__actions">
          <button class="imgtool__btn" type="button" @click="reset">重置参数</button>
          <button class="imgtool__btn" type="button" @click="fit">适配画布</button>
          <button class="imgtool__btn imgtool__btn--primary" type="button" @click="exportPNG">
            <AppIcon name="save" :size="16" decorative />
            导出 PNG
          </button>
        </div>
      </section>

      <!-- 预览 -->
      <section v-if="hasImage" class="imgtool__section">
        <div class="imgtool__preview-head">
          <h2 class="imgtool__label">预览</h2>
          <span class="imgtool__value">{{ outputSize }}</span>
        </div>
        <div class="imgtool__canvas-wrap texture-paper">
          <canvas ref="canvasRef" class="imgtool__canvas"></canvas>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { AppIcon } from '@/shared/icons'
import { useImageFile } from '@/shared/composables/useImageFile'
import { createCanvas, drawImageToCanvas, downloadCanvasPNG } from '@/shared/utils/canvas'
import {
  pixelate,
  fitWithin,
  PALETTE_SIZES,
  BLOCK_SIZE_MIN,
  BLOCK_SIZE_MAX,
  BLOCK_SIZE_DEFAULT,
  type PaletteSize,
} from './composables/usePixelate'

/**
 * 图片像素化
 *
 * 融合迁移完成（docs/02-fusion-architecture.md Stage 3）：由 iframe 桥接
 * 改为原生 Vue 组件，接入设计令牌与图标体系。
 */

const canvasRef = ref<HTMLCanvasElement | null>(null)
const blockSize = ref(BLOCK_SIZE_DEFAULT)
const quantize = ref(false)
const paletteSize = ref<PaletteSize>(16)

/** 原图画布，与显示画布分离，避免反复缩放造成累积失真 */
let source: { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null = null

const fileInput = ref<HTMLInputElement | null>(null)

const { isDragging, hasImage, status, errorMessage, dimensions, pickFile, handleInputChange, onDragEnter, onDragOver, onDragLeave, onDrop } =
  useImageFile({
    inputRef: fileInput,
    onLoad: (img) => {
      if (!source) source = createCanvas()
      source.canvas.width = img.naturalWidth
      source.canvas.height = img.naturalHeight
      drawImageToCanvas(source.ctx, img)
      fit()
    },
  })

const outputSize = computed(() => {
  const c = canvasRef.value
  return c ? `${c.width} × ${c.height}` : ''
})

/* ============================================
   渲染
   ============================================ */

function render(): void {
  if (!source || !canvasRef.value) return
  pixelate(source.canvas, canvasRef.value, {
    blockSize: blockSize.value,
    quantize: quantize.value,
    paletteSize: paletteSize.value,
  })
}

/** 把输出画布尺寸设为原图尺寸（受上限约束） */
function fit(): void {
  const dims = dimensions.value
  const canvas = canvasRef.value
  if (!dims || !canvas) return

  const fitted = fitWithin(dims.width, dims.height)
  canvas.width = fitted.width
  canvas.height = fitted.height
  render()
}

function reset(): void {
  blockSize.value = BLOCK_SIZE_DEFAULT
  quantize.value = false
  paletteSize.value = 16
  render()
}

function exportPNG(): void {
  if (canvasRef.value) downloadCanvasPNG(canvasRef.value, 'pixelate')
}

/* ============================================
   响应式重绘
   ============================================ */

watch([blockSize, quantize, paletteSize], render)

// 画布元素在 v-if 之后才存在，需在挂载后补一次
onMounted(() => {
  if (hasImage.value) render()
})

onBeforeUnmount(() => {
  source = null
})
</script>

<style scoped>
@import '@/shared/ui/image-tool.css';
</style>
