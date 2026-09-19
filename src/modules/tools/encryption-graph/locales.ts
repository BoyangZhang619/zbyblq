/**
 * 小番茄图片混淆的界面文案
 *
 * 工具的文案与工具的生命周期绑定，放在工具目录内而非全局文案表，
 * 避免并行开发时多个工具改同一份文件。参见 docs/09-tool-page-spec.md §5。
 *
 * 完整性由类型系统保证：中文为基准，英文声明为同一类型，漏翻会在
 * vue-tsc 阶段报错。
 */

import type { Locale } from '@/shared/i18n'

const zhCN = {
  title: '小番茄图片混淆',
  subtitle: '沿 Gilbert 空间填充曲线重排像素，全过程在本机完成',

  dropIdle: '点击选择图片，或拖放到此处',
  dropReplace: '已载入图片，点击可更换',
  dropFormats: '支持任意常见图片格式',
  originalSize: '原图 {w} × {h}',

  encrypt: '混淆',
  decrypt: '解混淆',
  restore: '还原',
  download: '下载',
  actionHint: '解混淆是混淆的逆运算；还原则回到最初选中的那张图',
  outputHint: '输出为 JPEG（质量 0.95），与旧版一致',

  preview: '预览',
  canvasLabel: '图片预览',
  saveTip: '也可右键图片直接另存为',

  statusLoaded: '图片已载入',
  statusEncrypting: '混淆中…',
  statusDecrypting: '解混淆中…',
  statusRestoring: '还原中…',
  statusEncrypted: '已混淆',
  statusDecrypted: '已解混淆',
  statusRestored: '已还原为最初选中的图片',
  statusExported: '已导出 JPEG',
  statusFailed: '处理失败，请换一张图片重试',
}

/** 本工具文案的键集合 */
export type EncryptionGraphMessages = typeof zhCN

const en: EncryptionGraphMessages = {
  title: 'Image Scrambler',
  subtitle: 'Scrambles pixels along a Gilbert space-filling curve, entirely on your device',

  dropIdle: 'Click to choose an image, or drop one here',
  dropReplace: 'Image loaded — click to replace',
  dropFormats: 'Any common image format',
  originalSize: 'Original {w} × {h}',

  encrypt: 'Scramble',
  decrypt: 'Unscramble',
  restore: 'Restore',
  download: 'Download',
  actionHint: 'Unscramble reverses Scramble; Restore goes back to the file you picked',
  outputHint: 'Output is JPEG at quality 0.95, same as the original tool',

  preview: 'Preview',
  canvasLabel: 'Image preview',
  saveTip: 'Right-click the image to save it directly',

  statusLoaded: 'Image loaded',
  statusEncrypting: 'Scrambling…',
  statusDecrypting: 'Unscrambling…',
  statusRestoring: 'Restoring…',
  statusEncrypted: 'Scrambled',
  statusDecrypted: 'Unscrambled',
  statusRestored: 'Restored to the file you picked',
  statusExported: 'JPEG exported',
  statusFailed: 'Processing failed, please try another image',
}

export const messages: Record<Locale, EncryptionGraphMessages> = {
  'zh-CN': zhCN,
  en,
}
