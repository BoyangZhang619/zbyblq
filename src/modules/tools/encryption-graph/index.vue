<template>
  <div class="imgtool encryption-graph">
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
        :aria-label="hasImage ? tt('dropReplace') : tt('dropIdle')"
        @click="pickFile"
        @keydown.enter.prevent="pickFile"
        @keydown.space.prevent="pickFile"
        @dragenter="onDragEnter"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @drop="handleDrop"
      >
        <input
          ref="fileInput"
          class="visually-hidden"
          type="file"
          accept="image/*"
          @change="handleFileChange"
        />
        <AppIcon name="tool-scramble" :size="30" decorative />
        <p class="imgtool__drop-title">
          {{ hasImage ? tt('dropReplace') : tt('dropIdle') }}
        </p>
        <p v-if="dimensions" class="imgtool__drop-meta">
          {{ tt('originalSize', { w: dimensions.width, h: dimensions.height }) }}
        </p>
        <p v-else class="imgtool__drop-meta">{{ tt('dropFormats') }}</p>
      </div>

      <p v-if="status === 'error'" class="imgtool__error">{{ errorMessage }}</p>

      <!-- 状态播报。常驻节点，读屏才能播报内容变化 -->
      <p
        class="encryption-graph__status"
        :class="{ 'is-idle': !statusText }"
        role="status"
      >
        {{ statusText }}
      </p>

      <!-- 操作 -->
      <section v-if="hasImage" class="imgtool__section">
        <div class="imgtool__actions encryption-graph__actions">
          <button
            class="imgtool__btn imgtool__btn--primary"
            type="button"
            :disabled="busy"
            @click="run('encrypt')"
          >
            <AppIcon name="shuffle" :size="16" decorative />
            {{ tt('encrypt') }}
          </button>
          <button
            class="imgtool__btn"
            type="button"
            :disabled="busy"
            @click="run('decrypt')"
          >
            {{ tt('decrypt') }}
          </button>
          <button class="imgtool__btn" type="button" :disabled="busy" @click="restore">
            {{ tt('restore') }}
          </button>
          <button class="imgtool__btn" type="button" :disabled="busy" @click="exportJpeg">
            <AppIcon name="save" :size="16" decorative />
            {{ tt('download') }}
          </button>
        </div>
        <p class="imgtool__hint">{{ tt('actionHint') }}</p>
        <p class="imgtool__hint">{{ tt('outputHint') }}</p>
      </section>

      <!-- 预览 -->
      <section v-if="hasImage" class="imgtool__section">
        <div class="imgtool__preview-head">
          <h2 class="imgtool__label">{{ tt('preview') }}</h2>
          <span class="imgtool__value">{{ canvasSize }}</span>
        </div>
        <div class="imgtool__canvas-wrap texture-paper">
          <canvas
            ref="canvasRef"
            class="imgtool__canvas encryption-graph__canvas"
            role="img"
            :aria-label="tt('canvasLabel')"
          ></canvas>
        </div>
        <p class="imgtool__hint">{{ tt('saveTip') }}</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { AppIcon } from '@/shared/icons'
import { useImageFile } from '@/shared/composables/useImageFile'
import { useToolI18n } from '@/shared/i18n'
import { drawImageToCanvas } from '@/shared/utils/canvas'
import {
  JPEG_QUALITY,
  scrambleImageData,
  type ScrambleDirection,
} from './composables/useEncryptionGraph'
import { messages, type EncryptionGraphMessages } from './locales'

/**
 * 小番茄图片混淆
 *
 * 融合迁移完成（docs/02-fusion-architecture.md Stage 3）：由 iframe 桥接
 * 改为原生 Vue 组件，接入设计令牌、图标体系与 i18n。
 *
 * 与原实现的差异：
 * 1. 画布尺寸取解码后的原始尺寸，刻意不设上限。解混淆必须与混淆时
 *    的尺寸完全一致，缩放会让曲线错位。代价是大图的内存占用，已列入
 *    迁移报告。
 * 2. 加载、混淆、解混淆、还原的耗时都是真实的，因此保留旧版的忙碌文案，
 *    但把「等一帧让文案上屏」换成真正的 rAF，而不是旧版凭空等的
 *    50ms / 100ms。处理失败时给出文字反馈，旧版只会卡在遮罩上。
 * 3. 每次操作后仍按 JPEG 0.95 重编码，与旧版一致——工作图像因此会累积
 *    压缩损失，这是旧版的既定行为，未擅自改为无损。
 * 4. 下载用画布直接导出 JPEG，文件名沿用旧版的「原文件名 + UTC 时间戳」。
 *    共享的 downloadCanvasPNG 固定输出 PNG 且命名格式不同，故未采用。
 * 5. 处理中禁用操作按钮，旧版只靠遮罩挡点击。
 */

const { tt } = useToolI18n(messages)

/** 状态文案的键。从文案表推导，写错会在编译期报错 */
type StatusKey = Extract<keyof EncryptionGraphMessages, `status${string}`>

const canvasRef = ref<HTMLCanvasElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

/** 处理中。期间按钮不可点，且状态文案已给出反馈 */
const busy = ref(false)
const statusKey = ref<StatusKey | null>(null)

/** 存键而非译好的字符串，切换语言时文案才会跟着变 */
const statusText = computed(() => (statusKey.value ? tt(statusKey.value) : ''))

/** 原文件名，仅用于导出命名 */
const fileName = ref('')

const {
  status,
  errorMessage,
  isDragging,
  hasImage,
  dimensions,
  image,
  pickFile,
  handleInputChange,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
} = useImageFile({
  inputRef: fileInput,
  onLoad: (el) => {
    statusKey.value = 'statusLoaded'
    void drawOriginal(el)
  },
})

const canvasSize = computed(() => {
  const dims = dimensions.value
  return dims ? `${dims.width} × ${dims.height}` : ''
})

/* ============================================
   画布
   ============================================ */

/**
 * 把图像按原始像素尺寸绘制到画布
 *
 * 画布位于 v-if 之内，图片载入后 DOM 才生成，需等一次刷新。
 */
async function drawOriginal(el: HTMLImageElement): Promise<void> {
  await nextTick()

  const canvas = canvasRef.value
  if (!canvas) return

  canvas.width = el.naturalWidth
  canvas.height = el.naturalHeight

  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (ctx) drawImageToCanvas(ctx, el)
}

/**
 * 把控制权交还浏览器一帧
 *
 * 千万像素的图片要处理数百毫秒到数秒，期间主线程被占满。先让浏览器把
 * 「混淆中…」画出来，用户才看得到反馈。
 */
function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve())
  })
}

/** 标记忙碌并等一帧，确保状态文案已经上屏 */
async function beginBusy(key: StatusKey): Promise<void> {
  busy.value = true
  statusKey.value = key
  await nextTick()
  await nextFrame()
}

function endBusy(key: StatusKey): void {
  busy.value = false
  statusKey.value = key
}

/* ============================================
   操作
   ============================================ */

async function run(direction: ScrambleDirection): Promise<void> {
  const canvas = canvasRef.value
  if (busy.value || !canvas || !hasImage.value) return

  await beginBusy(direction === 'encrypt' ? 'statusEncrypting' : 'statusDecrypting')

  try {
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) throw new Error('无法获取 2D 绘图上下文')

    const source = ctx.getImageData(0, 0, canvas.width, canvas.height)
    ctx.putImageData(scrambleImageData(source, direction), 0, 0)
    await reencodeJpeg(canvas)

    endBusy(direction === 'encrypt' ? 'statusEncrypted' : 'statusDecrypted')
  } catch {
    endBusy('statusFailed')
  }
}

/** 回到最初选中的那张图。直接重绘原始图像，不经过任何编码 */
async function restore(): Promise<void> {
  const el = image.value
  if (busy.value || !el) return

  await beginBusy('statusRestoring')

  try {
    await drawOriginal(el)
    endBusy('statusRestored')
  } catch {
    endBusy('statusFailed')
  }
}

async function exportJpeg(): Promise<void> {
  const canvas = canvasRef.value
  if (busy.value || !canvas) return

  busy.value = true
  try {
    const url = URL.createObjectURL(await canvasToJpegBlob(canvas))
    const link = document.createElement('a')
    link.href = url
    link.download = `${outputPrefix()}_${timestamp()}.jpg`

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    statusKey.value = 'statusExported'
  } catch {
    statusKey.value = 'statusFailed'
  } finally {
    busy.value = false
  }
}

/* ============================================
   JPEG 编解码
   ============================================ */

function canvasToJpegBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('画布导出失败'))
      },
      'image/jpeg',
      JPEG_QUALITY,
    )
  })
}

function decodeImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const el = new Image()
    el.onload = () => resolve(el)
    el.onerror = () => reject(new Error('图像解码失败'))
    el.src = url
  })
}

/**
 * 按 JPEG 重新编码并写回画布
 *
 * 旧版每次混淆/解混淆后都把结果交给 <img> 显示，工作图像实际是压缩过
 * 一代的结果，这里照做。用 <img> 而非 createImageBitmap 解码：手机照片
 * 带 EXIF 方向标记，<img> 会按标记摆正，与旧版路径一致。
 */
async function reencodeJpeg(canvas: HTMLCanvasElement): Promise<void> {
  const url = URL.createObjectURL(await canvasToJpegBlob(canvas))
  try {
    const el = await decodeImage(url)
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (ctx) drawImageToCanvas(ctx, el)
  } finally {
    URL.revokeObjectURL(url)
  }
}

/* ============================================
   导出命名
   ============================================ */

/**
 * 时间戳，取自 toISOString，因此是 UTC 而非本地时间
 *
 * 旧版如此，保留不动。共享的 timestampedName 用本地时间且格式不同，
 * 为保持文件名风格一致，这里不用它。
 */
function timestamp(): string {
  return new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')
}

/** 去掉扩展名的原文件名，取不到时回退 image */
function outputPrefix(): string {
  return fileName.value.replace(/\.[^.]+$/, '') || 'image'
}

/* ============================================
   文件选择
   ============================================ */

/**
 * 先记下文件名，再交给共享的加载逻辑
 *
 * useImageFile 只暴露解码后的图像，不保留 File，而导出命名需要文件名。
 */
function handleFileChange(event: Event): void {
  const input = event.target as HTMLInputElement
  fileName.value = input.files?.[0]?.name ?? ''
  handleInputChange(event)
}

function handleDrop(event: DragEvent): void {
  fileName.value = event.dataTransfer?.files?.[0]?.name ?? ''
  onDrop(event)
}
</script>

<style scoped>
@import '@/shared/ui/image-tool.css';
@import './encryption-graph.css';
</style>
