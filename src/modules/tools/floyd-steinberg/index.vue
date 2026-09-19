<template>
  <div class="imgtool floyd-steinberg">
    <div class="page-content">
      <header class="imgtool__header">
        <h1 class="imgtool__title">{{ tt('title') }}</h1>
        <p class="imgtool__subtitle">{{ tt('subtitle') }}</p>
      </header>

      <!-- 上传 -->
      <div
        class="imgtool__drop"
        :class="{ 'is-dragging': isDragging, 'has-image': hasImage }"
        role="button"
        tabindex="0"
        :aria-label="hasImage ? tt('ariaReplace') : tt('ariaPick')"
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
        <AppIcon name="tool-dither" :size="30" decorative />
        <p class="imgtool__drop-title">
          {{ hasImage ? tt('dropReplace') : tt('dropPick') }}
        </p>
        <p v-if="dimensions" class="imgtool__drop-meta">
          {{ tt('originalSize', { width: dimensions.width, height: dimensions.height }) }}
        </p>
        <p v-else class="imgtool__drop-meta">{{ tt('dropFormats') }}</p>
      </div>

      <p v-if="status === 'error'" class="imgtool__error">{{ tt('errorLoad') }}</p>

      <!-- 参数 -->
      <section v-if="hasImage" class="imgtool__section">
        <div class="imgtool__field">
          <p class="imgtool__label">{{ tt('modeLabel') }}</p>
          <div
            class="imgtool__chips floyd-steinberg__chips"
            role="radiogroup"
            :aria-label="tt('modeLabel')"
          >
            <button
              v-for="option in MODE_OPTIONS"
              :key="option.value"
              class="imgtool__chip"
              :class="{ 'is-active': mode === option.value }"
              type="button"
              role="radio"
              :aria-checked="mode === option.value"
              @click="mode = option.value"
            >
              {{ tt(option.labelKey) }}
            </button>
          </div>
          <p class="imgtool__hint">{{ tt('modeHint') }}</p>
        </div>

        <div v-if="mode === 'palette'" class="imgtool__field">
          <p class="imgtool__label">{{ tt('colorsLabel') }}</p>
          <div
            class="imgtool__chips floyd-steinberg__chips"
            role="radiogroup"
            :aria-label="tt('colorsLabel')"
          >
            <button
              v-for="count in PALETTE_COLOR_OPTIONS"
              :key="count"
              class="imgtool__chip"
              :class="{ 'is-active': colors === count }"
              type="button"
              role="radio"
              :aria-checked="colors === count"
              @click="colors = count"
            >
              {{ tt('colorsCount', { count }) }}
            </button>
          </div>
          <p class="imgtool__hint">{{ tt('colorsHint') }}</p>
        </div>

        <div class="imgtool__field">
          <div class="imgtool__field-head">
            <label class="imgtool__label" for="dither-strength">
              {{ tt('strengthLabel') }}
            </label>
            <span class="imgtool__value">
              {{ tt('strengthValue', { value: strengthPercent }) }}
            </span>
          </div>
          <input
            id="dither-strength"
            v-model.number="strengthSlider"
            class="imgtool__range"
            type="range"
            :min="STRENGTH_MIN"
            :max="STRENGTH_MAX"
            step="1"
          />
          <p class="imgtool__hint">{{ tt('strengthHint') }}</p>
        </div>

        <div class="imgtool__actions">
          <button class="imgtool__btn" type="button" @click="resetParams">
            {{ tt('reset') }}
          </button>
          <button class="imgtool__btn" type="button" @click="fitToImage">
            {{ tt('fit') }}
          </button>
          <button class="imgtool__btn imgtool__btn--primary" type="button" @click="exportPNG">
            <AppIcon name="save" :size="16" decorative />
            {{ tt('exportPng') }}
          </button>
        </div>

        <p class="imgtool__hint" role="status" aria-live="polite">{{ statusText }}</p>
      </section>

      <!-- 预览 -->
      <section v-if="hasImage" class="imgtool__section">
        <div class="imgtool__preview-head">
          <h2 class="imgtool__label">{{ tt('preview') }}</h2>
          <span class="imgtool__value">{{ outputSize }}</span>
        </div>
        <div class="imgtool__canvas-wrap">
          <canvas ref="canvasRef" class="imgtool__canvas"></canvas>
        </div>
        <p class="imgtool__hint">{{ tt('note') }}</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { AppIcon } from '@/shared/icons'
import { useToolI18n } from '@/shared/i18n'
import { useImageFile } from '@/shared/composables/useImageFile'
import { createCanvas, drawImageToCanvas, downloadCanvasPNG } from '@/shared/utils/canvas'
import { messages, type ToolMessageKey } from './locales'
import {
  PALETTE_COLOR_OPTIONS,
  MAX_OUT_HEIGHT,
  MAX_OUT_WIDTH,
  STRENGTH_MAX,
  STRENGTH_MIN,
  ditherImageData,
  fitToNiceCanvas,
  useDither,
  type DitherMode,
} from './composables/useDither'

/**
 * Dithering · Floyd–Steinberg
 *
 * 融合迁移完成（docs/02-fusion-architecture.md Stage 3）：由 iframe 桥接
 * 改为原生 Vue 组件，接入设计令牌、图标体系与工具级 i18n。
 * 界面骨架复用 @/shared/ui/image-tool.css 的 imgtool__* 类。
 *
 * 与原实现的差异（均为视图层，算法未动）：
 * 1. 色板大小由「置灰的下拉框」改为限定色模式下才出现的选项组
 * 2. 原实现把「适配画布」「导出 PNG」放在页头、「重置参数」放在参数区，
 *    此处统一到参数区的操作行，与 pixelate 一致
 * 3. 原实现用固定高度容器拉伸画布（宽高比失真），此处按共享骨架等比展示
 * 4. 状态提示改为 role="status"，随语言切换更新
 */

const { tt } = useToolI18n(messages)

/** 模式选项，顺序与旧实现的下拉框一致 */
const MODE_OPTIONS: { value: DitherMode; labelKey: ToolMessageKey }[] = [
  { value: 'bw', labelKey: 'modeBw' },
  { value: 'palette', labelKey: 'modePalette' },
]

const canvasRef = ref<HTMLCanvasElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const { mode, colors, strengthSlider, strengthPercent, strength, reset } = useDither()

/**
 * 原图画布，与输出画布分离，避免反复缩放造成累积失真。
 * 与 staging 都是画布资源，不参与渲染响应式，故用普通变量持有。
 */
let source: { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null = null
/** 中间画布：承载缩放后的原图与抖动结果，尺寸与输出画布一致 */
let staging: { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null = null

/* ============================================
   状态文案
   ============================================ */

type StatusKey = 'statusIdle' | 'statusLoaded' | 'statusReset' | 'statusFit'

const statusKey = ref<StatusKey>('statusIdle')
/** 适配画布时的缩放百分比，与 statusFit 配套 */
const statusScale = ref(100)

/** 存键而非存文案，语言切换后提示语跟着变 */
const statusText = computed(() => tt(statusKey.value, { scale: statusScale.value }))

/* ============================================
   载入
   ============================================ */

const { isDragging, hasImage, status, dimensions, pickFile, handleInputChange, onDragEnter, onDragOver, onDragLeave, onDrop } =
  useImageFile({
    inputRef: fileInput,
    onLoad: (img) => {
      if (!source) source = createCanvas()
      source.canvas.width = img.naturalWidth
      source.canvas.height = img.naturalHeight
      drawImageToCanvas(source.ctx, img)

      fit()
      statusKey.value = 'statusLoaded'
    },
  })

const outputSize = computed(() => {
  const canvas = canvasRef.value
  return canvas && canvas.width ? `${canvas.width} × ${canvas.height}` : ''
})

/* ============================================
   渲染
   ============================================ */

function render(): void {
  const output = canvasRef.value
  if (!source || !output) return

  const outW = output.width
  const outH = output.height
  if (outW === 0 || outH === 0) return

  // 中间画布随尺寸复用：尺寸未变时只清空，避免每次重建
  if (!staging) staging = createCanvas(outW, outH)
  if (staging.canvas.width !== outW || staging.canvas.height !== outH) {
    staging.canvas.width = outW
    staging.canvas.height = outH
  } else {
    staging.ctx.clearRect(0, 0, outW, outH)
  }

  // 第一步：带平滑地把原图缩放到输出尺寸
  staging.ctx.imageSmoothingEnabled = true
  staging.ctx.clearRect(0, 0, outW, outH)
  staging.ctx.drawImage(
    source.canvas, 0, 0, source.canvas.width, source.canvas.height, 0, 0, outW, outH,
  )

  // 第二步：在缩放后的像素上做误差扩散
  const imageData = staging.ctx.getImageData(0, 0, outW, outH)
  staging.ctx.putImageData(
    ditherImageData(imageData, {
      mode: mode.value,
      colors: colors.value,
      strength: strength.value,
    }),
    0,
    0,
  )

  // 第三步：原样拷到输出画布。两者尺寸一致，关闭平滑即可逐像素对应
  const ctx = output.getContext('2d', { willReadFrequently: true })
  if (!ctx) return
  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, outW, outH)
  ctx.drawImage(staging.canvas, 0, 0)
}

/** 把输出画布尺寸设为原图尺寸（受上限约束）并重绘 */
function fit(): void {
  const dims = dimensions.value
  const canvas = canvasRef.value
  if (!dims || !canvas) return

  const fitted = fitToNiceCanvas(dims.width, dims.height, MAX_OUT_WIDTH, MAX_OUT_HEIGHT)
  canvas.width = fitted.width
  canvas.height = fitted.height
  statusScale.value = Math.round(fitted.scale * 100)
  render()
}

function fitToImage(): void {
  fit()
  statusKey.value = 'statusFit'
}

function resetParams(): void {
  reset()
  render()
  statusKey.value = 'statusReset'
}

function exportPNG(): void {
  if (canvasRef.value) downloadCanvasPNG(canvasRef.value, 'dither')
}

/* ============================================
   响应式重绘
   ============================================ */

watch([mode, colors, strengthSlider], render)

// 画布元素在 v-if 之后才存在：首次载入图片时，onLoad 里 canvasRef 仍为 null，
// 等元素出现后再定尺寸并绘制一次
watch(canvasRef, (el) => {
  if (el) fit()
}, { flush: 'post' })

onBeforeUnmount(() => {
  source = null
  staging = null
})
</script>

<style scoped>
@import '@/shared/ui/image-tool.css';
@import './floyd-steinberg.css';
</style>
