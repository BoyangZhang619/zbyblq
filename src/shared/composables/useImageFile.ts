/**
 * 图像文件加载
 *
 * 从旧版各图像工具的 js/main.js 中提取的公共部分：文件选择、拖放、
 * 解码、错误处理。5 个图像类工具（pixelate、img2ascii、floyd-steinberg、
 * photo-patina、encryption-graph）共用。
 *
 * 这是 docs/02-fusion-architecture.md §3 所述 Stage 2 的产物：
 * 与 DOM 解耦的能力，可被任意视图复用。
 */

import { ref, shallowRef, computed } from 'vue'
import type { Ref } from 'vue'

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface UseImageFileOptions {
  /**
   * 隐藏的原生 file input 的模板引用
   *
   * 由组件声明后传入，而非在 composable 内创建——`ref="name"` 这种字符串
   * 模板引用不会被 vue-tsc 计入「已使用」，若在此处声明会导致组件侧出现
   * 「变量未使用」的误报。
   */
  inputRef: Ref<HTMLInputElement | null>
  /** 加载成功后的回调，可用于初始化画布尺寸等 */
  onLoad?: (image: HTMLImageElement) => void
}

export function useImageFile(options: UseImageFileOptions) {
  const { inputRef } = options

  const image = shallowRef<HTMLImageElement | null>(null)
  const status = ref<LoadStatus>('idle')
  const errorMessage = ref('')
  const isDragging = ref(false)

  const hasImage = computed(() => status.value === 'ready' && image.value !== null)

  const dimensions = computed(() => {
    const img = image.value
    return img ? { width: img.naturalWidth, height: img.naturalHeight } : null
  })

  function fail(message: string): void {
    status.value = 'error'
    errorMessage.value = message
  }

  /**
   * 加载图像文件
   *
   * 用 objectURL 而非 FileReader——后者会把整张图读成 base64 常驻内存，
   * 对手机拍摄的大图是明显负担。
   */
  function loadFile(file: File | null | undefined): void {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      fail('请选择图片文件')
      return
    }

    status.value = 'loading'
    errorMessage.value = ''

    const url = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(url)
      image.value = img
      status.value = 'ready'
      options.onLoad?.(img)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      fail('图片加载失败，文件可能已损坏')
    }

    img.src = url
  }

  /** 触发系统文件选择框 */
  function pickFile(): void {
    inputRef.value?.click()
  }

  function handleInputChange(event: Event): void {
    const input = event.target as HTMLInputElement
    loadFile(input.files?.[0])
    // 清空以便重复选择同一文件时仍能触发 change
    input.value = ''
  }

  /* ============================================
     拖放
     ============================================ */

  function onDragEnter(event: DragEvent): void {
    event.preventDefault()
    isDragging.value = true
  }

  function onDragOver(event: DragEvent): void {
    event.preventDefault()
  }

  function onDragLeave(event: DragEvent): void {
    event.preventDefault()
    isDragging.value = false
  }

  function onDrop(event: DragEvent): void {
    event.preventDefault()
    isDragging.value = false
    loadFile(event.dataTransfer?.files?.[0])
  }

  return {
    image,
    status,
    errorMessage,
    isDragging,
    hasImage,
    dimensions,
    loadFile,
    pickFile,
    handleInputChange,
    onDragEnter,
    onDragOver,
    onDragLeave,
    onDrop,
  }
}
