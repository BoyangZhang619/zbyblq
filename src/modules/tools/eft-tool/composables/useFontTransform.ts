/**
 * 字体转写逻辑
 *
 * 从 public/eft/js/main.js 提取，与 DOM 完全解耦：输入输出都是字符串，
 * 可独立测试。这是 docs/02-fusion-architecture.md §3 所述 Stage 2 的产物。
 *
 * 原实现的转写逻辑本身是正确的，此处仅做提取与类型化，算法未改动。
 */

import { ref, computed } from 'vue'
import { LATIN, FONT_STYLES, type FontStyle } from '../data/fonts'

/** 组合标记（combining marks）的 Unicode 属性 */
const COMBINING_MARK = /\p{M}/u

/**
 * 把字符串切分为字形组
 *
 * 一个基础字符连同其后的全部组合标记算作一个字形。
 * 必需性：Combo 样式的映射表含组合下划线，按码位计长会得到 104 而非 52，
 * 直接索引会错位。
 */
export function splitGlyphs(str: string): string[] {
  const glyphs: string[] = []
  let buffer = ''

  for (const ch of str) {
    if (buffer && COMBINING_MARK.test(ch)) {
      buffer += ch
    } else {
      if (buffer) glyphs.push(buffer)
      buffer = ch
    }
  }
  if (buffer) glyphs.push(buffer)

  return glyphs
}

/**
 * 把文本按指定样式转写
 *
 * 非拉丁字母（中文、数字、标点等）原样保留。
 */
export function transformText(input: string, font: FontStyle): string {
  const glyphs = splitGlyphs(font.map)

  // 映射表长度不足时不做转换，避免越界取到 undefined
  if (glyphs.length < LATIN.length) return input

  let output = ''
  for (const ch of input) {
    const idx = LATIN.indexOf(ch)
    output += idx === -1 ? ch : glyphs[idx]
  }
  return output
}

/**
 * 取样式的前若干个字形作为样例，用于列表展示
 */
export function sampleOf(font: FontStyle, count = 10): string {
  return splitGlyphs(font.map).slice(0, count).join('')
}

/* ============================================
   组合式状态
   ============================================ */

export function useFontTransform() {
  const input = ref('')
  const selectedId = ref<string | null>(null)

  const styles = FONT_STYLES

  const selected = computed(
    () => styles.find(s => s.id === selectedId.value) ?? null,
  )

  /** 未选样式时结果跟随输入，与旧版行为一致 */
  const output = computed(() => {
    if (!selected.value) return input.value
    return transformText(input.value, selected.value)
  })

  const hasOutput = computed(() => output.value.length > 0)

  function select(id: string): void {
    // 再次点击同一样式则取消选择，回到跟随输入的状态
    selectedId.value = selectedId.value === id ? null : id
  }

  async function copy(): Promise<boolean> {
    if (!hasOutput.value) return false
    try {
      await navigator.clipboard.writeText(output.value)
      return true
    } catch {
      return false
    }
  }

  return { input, styles, selectedId, selected, output, hasOutput, select, copy }
}
