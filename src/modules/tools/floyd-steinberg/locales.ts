/**
 * Dithering · Floyd–Steinberg 的界面文案
 *
 * 工具级文案放在本目录内，不进全局文案表——工具的文案与工具的生命周期
 * 绑定，且集中存放会让并行的多个工具改同一份文件。参见
 * docs/09-tool-page-spec.md §5 与 docs/10-i18n.md
 *
 * 文案以简体中文为基准语种，英文声明为同一类型：漏翻会在 vue-tsc 阶段报错。
 */

const zhCN = {
  title: 'Dithering · Floyd–Steinberg',
  subtitle: '黑白 / 限定色误差扩散抖动，复古报纸与掌机质感',

  dropPick: '点击选择图片，或拖放到此处',
  dropReplace: '已载入图片，点击可更换',
  dropFormats: '支持 PNG / JPG / WebP 等常见格式',
  ariaPick: '选择图片',
  ariaReplace: '重新选择图片',
  originalSize: '原图 {width} × {height}',
  errorLoad: '图片加载失败，请重新选择图片文件',

  modeLabel: '模式',
  modeBw: '黑白',
  modePalette: '限定色',
  modeHint: '黑白更硬朗，限定色更接近掌机灰阶',

  colorsLabel: '色板大小',
  colorsCount: '{count} 色',
  colorsHint: '2 / 4 色更像掌机，16 色更细腻',

  strengthLabel: '抖动强度',
  strengthValue: '{value}%',
  strengthHint: '强度越大抖动越明显；0% 近似「无抖动量化」',

  reset: '重置参数',
  fit: '适配画布',
  exportPng: '导出 PNG',

  preview: '预览',
  note: 'Floyd–Steinberg：把量化误差按 7/16、3/16、5/16、1/16 扩散到邻域像素，形成复古颗粒感',

  statusIdle: '等待上传图片',
  statusLoaded: '已加载图片',
  statusReset: '已重置参数',
  statusFit: '画布已适配（缩放 {scale}%）',
}

const en: typeof zhCN = {
  title: 'Dithering · Floyd–Steinberg',
  subtitle: 'Black & white or limited-palette error diffusion for a retro look',

  dropPick: 'Click to choose an image, or drop one here',
  dropReplace: 'Image loaded — click to replace',
  dropFormats: 'PNG, JPG, WebP and other common formats',
  ariaPick: 'Choose an image',
  ariaReplace: 'Replace the image',
  originalSize: 'Source {width} × {height}',
  errorLoad: 'Could not load the image — please choose another file',

  modeLabel: 'Mode',
  modeBw: 'Black & white',
  modePalette: 'Limited palette',
  modeHint: 'Black & white is harsher; a limited palette reads more like a handheld screen',

  colorsLabel: 'Palette size',
  colorsCount: '{count} colors',
  colorsHint: '2 or 4 colors feel more like a handheld; 16 is finer',

  strengthLabel: 'Dither strength',
  strengthValue: '{value}%',
  strengthHint: 'Higher values dither more strongly; 0% is close to plain quantization',

  reset: 'Reset',
  fit: 'Fit canvas',
  exportPng: 'Export PNG',

  preview: 'Preview',
  note: 'Floyd–Steinberg spreads the quantization error to neighbouring pixels at 7/16, 3/16, 5/16 and 1/16',

  statusIdle: 'Waiting for an image',
  statusLoaded: 'Image loaded',
  statusReset: 'Settings reset',
  statusFit: 'Canvas fitted ({scale}% scale)',
}

export const messages = {
  'zh-CN': zhCN,
  en,
}

/** 本工具的文案键，供界面侧以联合类型约束取值 */
export type ToolMessageKey = keyof typeof zhCN
