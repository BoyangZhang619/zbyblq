/**
 * 图片像素化的界面文案
 *
 * 形状为 Record<Locale, T>（语种在外层），与 useToolI18n 的入参一致。
 */

const zhCN = {
  title: '图片像素化',
  subtitle: '调整像素块大小，可选择性限制色板',

  dropPick: '点击选择图片，或拖放到此处',
  dropReplace: '已载入图片，点击可更换',
  dropHint: '支持任意常见图片格式',

  blockSize: '像素块大小',
  blockHint: '数值越大，马赛克越粗',

  quantize: '限制色板',
  quantizeHint: '通道分箱近似量化，色带感是像素风的预期效果',
  palette: '{count} 色',

  reset: '重置参数',
  fit: '适配画布',
  export: '导出 PNG',

  preview: '预览',
}

const en: typeof zhCN = {
  title: 'Pixelate',
  subtitle: 'Adjust the block size, then optionally limit the palette',

  dropPick: 'Click to choose an image, or drop one here',
  dropReplace: 'Image loaded — click to replace',
  dropHint: 'Any common image format',

  blockSize: 'Block size',
  blockHint: 'Larger values give chunkier pixels',

  quantize: 'Limit palette',
  quantizeHint: 'Per-channel quantisation — the banding is the point',
  palette: '{count} colours',

  reset: 'Reset',
  fit: 'Fit canvas',
  export: 'Export PNG',

  preview: 'Preview',
}

export const messages = { 'zh-CN': zhCN, en }
