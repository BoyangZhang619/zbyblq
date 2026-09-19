<template>
  <div class="imgtool">
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
        :aria-label="hasImage ? tt('dropAriaLoaded') : tt('dropAriaIdle')"
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
        <AppIcon name="tool-patina" :size="30" decorative />
        <p class="imgtool__drop-title">
          {{ hasImage ? tt('dropLoaded') : tt('dropIdle') }}
        </p>
        <p v-if="dimensions" class="imgtool__drop-meta">
          {{ tt('sourceSize', { width: dimensions.width, height: dimensions.height }) }}
        </p>
        <p v-else class="imgtool__drop-meta">{{ tt('dropMetaIdle') }}</p>
      </div>

      <p v-if="status === 'error'" class="imgtool__error">{{ errorMessage }}</p>

      <template v-if="hasImage">
        <!-- 核心劣化 -->
        <section class="imgtool__section">
          <h2 class="photo-patina__group-title">{{ tt('groupCore') }}</h2>
          <div class="photo-patina__fields">
            <div v-for="field in CORE_FIELDS" :key="field.key" class="imgtool__field">
              <div class="imgtool__field-head">
                <label class="imgtool__label" :for="inputId(field)">{{ tt(field.label) }}</label>
                <span class="imgtool__value">{{ display(field) }}</span>
              </div>
              <input
                :id="inputId(field)"
                v-model.number="params[field.key]"
                class="imgtool__range"
                type="range"
                :min="PATINA_LIMITS[field.key].min"
                :max="PATINA_LIMITS[field.key].max"
                :step="PATINA_LIMITS[field.key].step"
              />
            </div>
          </div>
        </section>

        <!-- 包浆味道 -->
        <section class="imgtool__section">
          <h2 class="photo-patina__group-title">{{ tt('groupFlavor') }}</h2>
          <div class="photo-patina__fields">
            <div v-for="field in FLAVOR_FIELDS" :key="field.key" class="imgtool__field">
              <div class="imgtool__field-head">
                <label class="imgtool__label" :for="inputId(field)">{{ tt(field.label) }}</label>
                <span class="imgtool__value">{{ display(field) }}</span>
              </div>
              <input
                :id="inputId(field)"
                v-model.number="params[field.key]"
                class="imgtool__range"
                type="range"
                :min="PATINA_LIMITS[field.key].min"
                :max="PATINA_LIMITS[field.key].max"
                :step="PATINA_LIMITS[field.key].step"
              />
            </div>
          </div>
        </section>

        <!-- 操作 -->
        <section class="imgtool__section">
          <div class="imgtool__actions">
            <button class="imgtool__btn" type="button" @click="randomize">
              <AppIcon name="shuffle" :size="16" decorative />
              {{ tt('random') }}
            </button>
            <button class="imgtool__btn" type="button" @click="reset">
              {{ tt('reset') }}
            </button>
            <button class="imgtool__btn imgtool__btn--primary" type="button" @click="exportPNG">
              <AppIcon name="save" :size="16" decorative />
              {{ tt('exportPng') }}
            </button>
            <button class="imgtool__btn" type="button" @click="exportJPEG">
              <AppIcon name="save" :size="16" decorative />
              {{ tt('exportJpeg') }}
            </button>
          </div>
          <p class="imgtool__hint">{{ tt('tip') }}</p>
        </section>

        <!-- 预览 -->
        <section class="imgtool__section">
          <div class="imgtool__preview-head">
            <h2 class="imgtool__label">{{ tt('preview') }}</h2>
            <span class="imgtool__value" role="status">
              {{ isProcessing ? tt('processing') : tt('done') }}
            </span>
          </div>

          <div class="photo-patina__grid">
            <figure class="photo-patina__card">
              <figcaption class="photo-patina__card-head">
                <h3 class="photo-patina__card-title">{{ tt('previewSource') }}</h3>
                <span class="imgtool__value">{{ sizeText }}</span>
              </figcaption>
              <div class="imgtool__canvas-wrap texture-paper">
                <canvas
                  ref="srcCanvas"
                  class="imgtool__canvas photo-patina__canvas"
                  role="img"
                  :aria-label="tt('canvasSourceAria')"
                ></canvas>
              </div>
            </figure>

            <figure class="photo-patina__card">
              <figcaption class="photo-patina__card-head">
                <h3 class="photo-patina__card-title">{{ tt('previewOutput') }}</h3>
                <span class="imgtool__value">{{ sizeText }}</span>
              </figcaption>
              <div class="imgtool__canvas-wrap texture-paper">
                <canvas
                  ref="outCanvas"
                  class="imgtool__canvas photo-patina__canvas"
                  role="img"
                  :aria-label="tt('canvasOutputAria')"
                ></canvas>
              </div>
            </figure>
          </div>

          <p class="imgtool__hint">{{ tt('pipeline') }}</p>
          <p class="imgtool__hint photo-patina__readout">{{ perfText }}</p>
          <p class="imgtool__hint photo-patina__readout">{{ metaText }}</p>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { AppIcon } from '@/shared/icons'
import { useToolI18n } from '@/shared/i18n'
import { useImageFile } from '@/shared/composables/useImageFile'
import { downloadCanvasPNG, timestampedName } from '@/shared/utils/canvas'
import { messages, type PhotoPatinaMessageKey } from './locales'
import {
  PATINA_LIMITS,
  usePhotoPatina,
  type PatinaParams,
} from './composables/usePhotoPatina'

/**
 * 电子包浆
 *
 * 融合迁移完成（docs/09-tool-page-spec.md 的 Stage 2 + Stage 3）：由 iframe
 * 桥接改为原生 Vue 组件，接入设计令牌、图标体系与中英双语。
 *
 * 处理链与全部参数逐值照搬旧实现 public/photoPatina/js/main.js，唯一替换是
 * JPEG 编解码器（旧版从 CDN 取 jpeg-js，本项目未声明该依赖，改用平台自带
 * 的 canvas.toBlob 与 createImageBitmap）。理由与影响见 patina-effects.ts
 * 顶部的说明。
 *
 * 与原实现的差异（均为界面层）：
 * 1. 旧版在画布上画白色占位图与说明文字，这里改为「上传区即空状态、预览区
 *    载入后才出现」，与 pixelate 等工具一致。
 * 2. 随机/重置按钮在载入图片前不出现，旧版是出现但点了没反应。
 * 3. 处理是异步的，运行期间的参数改动会合并为一次重跑，见 usePhotoPatina。
 */

const { tt } = useToolI18n(messages)

/** 滑杆的键与文案键。次序与旧版面板一致 */
interface ParamField {
  key: keyof PatinaParams
  label: PhotoPatinaMessageKey
}

const CORE_FIELDS: ParamField[] = [
  { key: 'q1', label: 'quality1' },
  { key: 'scale', label: 'scale' },
  { key: 'q2', label: 'quality2' },
  { key: 'loops', label: 'loops' },
]

const FLAVOR_FIELDS: ParamField[] = [
  { key: 'warm', label: 'warm' },
  { key: 'desat', label: 'desat' },
  { key: 'contrast', label: 'contrast' },
  { key: 'grime', label: 'grime' },
  { key: 'grain', label: 'grain' },
  { key: 'vignette', label: 'vignette' },
  { key: 'sharpen', label: 'sharpen' },
  { key: 'scanlines', label: 'scanlines' },
]

const srcCanvas = ref<HTMLCanvasElement | null>(null)
const outCanvas = ref<HTMLCanvasElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const {
  isDragging, hasImage, status, errorMessage, dimensions,
  pickFile, handleInputChange, onDragEnter, onDragOver, onDragLeave, onDrop,
} = useImageFile({
  inputRef: fileInput,
  onLoad: async (img) => {
    // 两个画布在 v-if 之后才挂载，要等一次 DOM 更新才能拿到宽高
    await nextTick()
    setSource(img)
    await render()
  },
})

const { params, isProcessing, stats, outputSize, setSource, render, randomize, reset } =
  usePhotoPatina({ sourceCanvas: srcCanvas, outputCanvas: outCanvas, hasImage })

/** 滑杆的 id 与 label 的 for 必须配对（docs/09-tool-page-spec.md §7） */
function inputId(field: ParamField): string {
  return `photo-patina-${field.key}`
}

/** 整数参数直接显示，小数参数保留两位——与旧版的 value 回写一致 */
function display(field: ParamField): string {
  const value = params[field.key]
  return PATINA_LIMITS[field.key].step >= 1 ? String(value) : value.toFixed(2)
}

const sizeText = computed(() => {
  const size = outputSize.value
  return size ? `${size.width} × ${size.height}` : '—'
})

const perfText = computed(() => {
  const s = stats.value
  if (!s) return '—'
  return tt('perf', {
    ms: s.elapsedMs.toFixed(1),
    kb1: s.jpeg1KB.toFixed(1),
    kb2: s.jpeg2KB.toFixed(1),
    kb3: s.extraKB.toFixed(1),
  })
})

const metaText = computed(() =>
  tt('meta', {
    q1: params.q1,
    scale: params.scale.toFixed(2),
    q2: params.q2,
    loops: params.loops,
  }),
)

function exportPNG(): void {
  const canvas = outCanvas.value
  if (!canvas || !hasImage.value) return
  downloadCanvasPNG(canvas, 'photo-patina')
}

/**
 * 下载 JPEG
 *
 * 与旧版一致：用第二次质量作为导出质量。shared/utils/canvas 只提供 PNG 的
 * 下载，这里按同样的方式补一个 JPEG 版本。
 */
function exportJPEG(): void {
  const canvas = outCanvas.value
  if (!canvas || !hasImage.value) return

  const quality = Math.max(0.05, Math.min(0.95, params.q2 / 100))
  const link = document.createElement('a')
  link.download = timestampedName('photo-patina', 'jpg')
  link.href = canvas.toDataURL('image/jpeg', quality)
  link.click()
}
</script>

<style scoped>
@import '@/shared/ui/image-tool.css';
@import './photo-patina.css';
</style>
