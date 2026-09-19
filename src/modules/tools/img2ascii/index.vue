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
        :aria-label="hasImage ? tt('repickImage') : tt('pickImage')"
        @click="pickFile"
        @keydown.enter.prevent="pickFile"
        @keydown.space.prevent="pickFile"
        @dragenter="onDragEnter"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @drop="onDrop"
      >
        <!--
          隐藏的 file input 落在可点击的上传区内部，因此：
          click.stop 拦住 input.click() 冒泡回上传区——否则会再触发一次
          pickFile，形成自我递归；tabindex=-1 是为了不让这个看不见的控件
          混进 Tab 序列。
        -->
        <input
          ref="fileInput"
          class="visually-hidden"
          type="file"
          accept="image/*"
          tabindex="-1"
          @click.stop
          @change="handleInputChange"
        />
        <AppIcon name="tool-ascii" :size="30" decorative />
        <p class="imgtool__drop-title">
          {{ hasImage ? tt('dropReplace') : tt('dropPick') }}
        </p>
        <p v-if="dimensions" class="imgtool__drop-meta">
          {{ tt('sourceSize', { width: dimensions.width, height: dimensions.height }) }}
        </p>
        <p v-else class="imgtool__drop-meta">{{ tt('dropFormats') }}</p>
      </div>

      <p v-if="status === 'error'" class="imgtool__error">{{ tt('errorLoad') }}</p>

      <!-- 示例图：没有图片时也应可用，因此不放在参数区里 -->
      <div class="imgtool__section">
        <button class="imgtool__btn" type="button" @click="useExample">
          <AppIcon name="sparkle" :size="16" decorative />
          {{ tt('example') }}
        </button>
      </div>

      <!-- 参数 -->
      <section v-if="hasGrid" class="imgtool__section">
        <div class="imgtool__field">
          <div class="imgtool__field-head">
            <label class="imgtool__label" for="img2ascii-width">{{ tt('width') }}</label>
            <span class="imgtool__value">{{ widthCols }}</span>
          </div>
          <input
            id="img2ascii-width"
            v-model.number="widthCols"
            class="imgtool__range"
            type="range"
            :min="WIDTH_MIN"
            :max="WIDTH_MAX"
            step="1"
          />
          <p class="imgtool__hint">{{ tt('widthHint') }}</p>
        </div>

        <div class="imgtool__field">
          <div class="imgtool__field-head">
            <label class="imgtool__label" for="img2ascii-font">{{ tt('fontSize') }}</label>
            <span class="imgtool__value">{{ fontSize }}</span>
          </div>
          <input
            id="img2ascii-font"
            v-model.number="fontSize"
            class="imgtool__range"
            type="range"
            :min="FONT_SIZE_MIN"
            :max="FONT_SIZE_MAX"
            step="1"
          />
          <p class="imgtool__hint">{{ tt('fontSizeHint') }}</p>
        </div>

        <div class="imgtool__field">
          <p class="imgtool__label">{{ tt('charset') }}</p>
          <div class="imgtool__chips" role="radiogroup" :aria-label="tt('charset')">
            <button
              v-for="key in CHARSET_KEYS"
              :key="key"
              class="imgtool__chip"
              :class="{ 'is-active': charset === key }"
              type="button"
              role="radio"
              :aria-checked="charset === key"
              @click="charset = key"
            >
              {{ tt(CHARSET_LABEL_KEYS[key]) }}
            </button>
          </div>
          <p class="imgtool__hint">{{ tt('charsetHint') }}</p>
        </div>

        <div class="imgtool__field">
          <div class="imgtool__field-head">
            <label class="imgtool__label" for="img2ascii-brightness">
              {{ tt('brightness') }}
            </label>
            <span class="imgtool__value">{{ brightness }}</span>
          </div>
          <input
            id="img2ascii-brightness"
            v-model.number="brightness"
            class="imgtool__range"
            type="range"
            :min="ADJUST_MIN"
            :max="ADJUST_MAX"
            step="1"
          />
        </div>

        <div class="imgtool__field">
          <div class="imgtool__field-head">
            <label class="imgtool__label" for="img2ascii-contrast">{{ tt('contrast') }}</label>
            <span class="imgtool__value">{{ contrast }}</span>
          </div>
          <input
            id="img2ascii-contrast"
            v-model.number="contrast"
            class="imgtool__range"
            type="range"
            :min="ADJUST_MIN"
            :max="ADJUST_MAX"
            step="1"
          />
        </div>

        <div class="imgtool__field img2ascii__switches">
          <label class="imgtool__switch">
            <input v-model="invert" type="checkbox" />
            <span class="imgtool__switch-track" aria-hidden="true"></span>
            <span class="imgtool__switch-text">{{ tt('invert') }}</span>
          </label>

          <label class="imgtool__switch">
            <input v-model="color" type="checkbox" />
            <span class="imgtool__switch-track" aria-hidden="true"></span>
            <span class="imgtool__switch-text">{{ tt('colorAscii') }}</span>
          </label>
        </div>

        <div class="imgtool__actions">
          <button class="imgtool__btn" type="button" @click="copyText">
            <AppIcon :name="copied ? 'check' : 'clipboard'" :size="16" decorative />
            {{ copied ? tt('copied') : tt('copy') }}
          </button>
          <button class="imgtool__btn" type="button" @click="downloadTxtFile">
            {{ tt('downloadTxt') }}
          </button>
          <button class="imgtool__btn imgtool__btn--primary" type="button" @click="exportPng">
            <AppIcon name="save" :size="16" decorative />
            {{ tt('exportPng') }}
          </button>
        </div>
      </section>

      <!-- 预览 -->
      <section v-if="hasGrid" class="imgtool__section">
        <div class="imgtool__preview-head">
          <h2 class="imgtool__label">
            {{ tt('preview') }}
            <span class="img2ascii__mode">{{ tt(color ? 'modeColor' : 'modePlain') }}</span>
          </h2>
          <span class="imgtool__value">{{ outputSize }}</span>
        </div>
        <p class="imgtool__hint">{{ tt('previewHint') }}</p>

        <pre
          v-if="color"
          class="img2ascii__output img2ascii__output--color"
          tabindex="0"
          :style="outputStyle"
          :aria-label="tt('outputLabel')"
        ><span v-for="(row, y) in rows" :key="y" class="img2ascii__line"><span
          v-for="(cell, x) in row"
          :key="x"
          class="img2ascii__char"
          :style="cell.color ?? ''"
        >{{ cell.char }}</span></span></pre>

        <pre
          v-else
          class="img2ascii__output"
          tabindex="0"
          :style="outputStyle"
          :aria-label="tt('outputLabel')"
        >{{ text }}</pre>

        <p class="img2ascii__status" role="status" aria-live="polite">
          {{ statusKey ? tt(statusKey) : '' }}
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { AppIcon } from '@/shared/icons'
import { useImageFile } from '@/shared/composables/useImageFile'
import { useTheme } from '@/shared/composables/useTheme'
import { useToolI18n } from '@/shared/i18n'
import { downloadCanvasPNG, downloadText } from '@/shared/utils/canvas'
import {
  ADJUST_MAX,
  ADJUST_MIN,
  CHARSET_KEYS,
  FONT_SIZE_MAX,
  FONT_SIZE_MIN,
  WIDTH_MAX,
  WIDTH_MIN,
  useAsciiArt,
  type CharsetKey,
} from './composables/useAsciiArt'
import { drawAsciiToCanvas, monoFontStack } from './utils/ascii-png'
import { renderExampleImage } from './utils/example-image'
import { messages, type ToolMessageKey } from './locales'

/**
 * 图片转 ASCII
 *
 * 融合迁移完成（docs/09-tool-page-spec.md 的 Stage 2 + 3）：由 iframe
 * 桥接改为原生 Vue 组件。采样与亮度映射提取到 composables/useAsciiArt.ts，
 * 导出与示例图分别提取到 utils/，界面接入设计令牌、图标体系与中英文案。
 *
 * 与原实现的差异（算法未改，只动了交互外壳）：
 * 1. 去掉「生成」按钮。旧版在任一参数变化时已自动重绘，它只是多余的一步
 *    确认；现在保持同一行为——有图即实时更新。
 * 2. 字符密度由下拉框改为胶囊选项组，与图像类工具的共用骨架一致。
 * 3. 复制不再回退到已废弃的 execCommand，失败时给出文字提示。
 * 4. 导出文件名带时间戳（沿用 shared/utils/canvas 的约定），旧版固定为
 *    ascii.txt / ascii.png。
 */

const { tt } = useToolI18n(messages)

/** 状态提示的键。取自本工具的文案键联合类型，写错键名会在编译期报错 */
type StatusKey = ToolMessageKey

/** 提示的停留时长。与英文字体转换保持一致 */
const FEEDBACK_MS = 1400

const art = useAsciiArt()
const { widthCols, fontSize, charset, brightness, contrast, invert, color, grid } = art
const { resolvedMode } = useTheme()

const fileInput = ref<HTMLInputElement | null>(null)

const {
  isDragging,
  hasImage,
  status,
  dimensions,
  loadFile,
  pickFile,
  handleInputChange,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
} = useImageFile({
  inputRef: fileInput,
  onLoad: (image) => {
    art.load(image)
  },
})

/* ============================================
   输出
   ============================================ */

/** 仅在算完第一张网格后为真。比 hasImage 多一层保证：有网格才有可导出的内容 */
const hasGrid = computed(() => grid.value !== null)

const rows = computed(() => grid.value?.lines ?? [])
const text = computed(() => grid.value?.text ?? '')

const outputSize = computed(() => {
  const g = grid.value
  return g ? tt('outputSize', { cols: g.cols, rows: g.rows }) : ''
})

/** 字号是纯显示参数，不进网格计算 */
const outputStyle = computed(() => ({ fontSize: `${fontSize.value}px` }))

const CHARSET_LABEL_KEYS = {
  detailed: 'charsetDetailed',
  simple: 'charsetSimple',
  blocks: 'charsetBlocks',
  binary: 'charsetBinary',
} as const satisfies Record<CharsetKey, string>

/* ============================================
   操作
   ============================================ */

const copied = ref(false)
const statusKey = ref<StatusKey | null>(null)

let copiedTimer: number | undefined
let statusTimer: number | undefined

function flash(key: StatusKey): void {
  statusKey.value = key
  window.clearTimeout(statusTimer)
  statusTimer = window.setTimeout(() => {
    statusKey.value = null
  }, FEEDBACK_MS * 2)
}

/** 复制的是纯文本，彩色模式下也如此——与旧实现一致，纯文本更通用 */
async function copyText(): Promise<void> {
  const g = grid.value
  if (!g) return

  try {
    await navigator.clipboard.writeText(g.text)
    copied.value = true
    window.clearTimeout(copiedTimer)
    copiedTimer = window.setTimeout(() => {
      copied.value = false
    }, FEEDBACK_MS)
  } catch {
    flash('copyFailed')
  }
}

function downloadTxtFile(): void {
  const g = grid.value
  if (!g) return
  downloadText(g.text, 'ascii')
}

function exportPng(): void {
  const g = grid.value
  if (!g) return

  const canvas = drawAsciiToCanvas(g, {
    fontSize: fontSize.value,
    color: color.value,
    dark: resolvedMode.value === 'dark',
    fontFamily: monoFontStack(),
  })
  downloadCanvasPNG(canvas, 'ascii')
  flash('pngExported')
}

/** 本地生成的示例图，与用户选的文件走同一条加载路径 */
async function useExample(): Promise<void> {
  const blob = await renderExampleImage()
  if (!blob) return
  loadFile(new File([blob], 'example.png', { type: 'image/png' }))
}

onBeforeUnmount(() => {
  window.clearTimeout(copiedTimer)
  window.clearTimeout(statusTimer)
})
</script>

<style scoped>
@import '@/shared/ui/image-tool.css';
@import './img2ascii.css';
</style>
