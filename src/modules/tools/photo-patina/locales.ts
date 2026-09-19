/**
 * 电子包浆的界面文案
 *
 * 按 docs/09-tool-page-spec.md §5 放在工具目录内，不并入全局文案表——
 * 工具的文案与工具的生命周期绑定，集中存放会让并行开发互相冲突。
 *
 * `en` 声明为 `typeof zhCN`，漏一条会在 vue-tsc 阶段报错。
 * 中文标点用全角，英文用半角；英文短语首字母大写、句尾不加句号。
 */

const zhCN = {
  title: '电子包浆',
  subtitle: '真实 JPEG 编码回环 + 缩放劣化 + 轻度脏旧叠加',

  /* 上传 */
  dropIdle: '点击选择图片，或拖放到此处',
  dropLoaded: '已载入图片，点击可更换',
  dropAriaIdle: '选择图片',
  dropAriaLoaded: '重新选择图片',
  dropMetaIdle: '支持任意常见图片格式',
  sourceSize: '原图 {width} × {height}',

  /* 参数 */
  groupCore: '核心劣化（真 JPEG）',
  groupFlavor: '包浆味道（克制叠加）',
  quality1: '第一次 JPEG 质量',
  scale: '缩放倍率（先缩后放）',
  quality2: '第二次 JPEG 质量',
  loops: '额外回环次数（祖传加速）',
  warm: '泛黄/旧色',
  desat: '去饱和（发灰）',
  contrast: '对比异常（轻压高光）',
  grime: '脏污（低频斑点）',
  grain: '噪点（颗粒）',
  vignette: '暗角（屏摄感）',
  sharpen: '轻锐化（更像二次处理）',
  scanlines: '扫描线（可选）',
  tip: '想要「祖传三代」：把第二次质量拉低（20~35）+ 回环次数拉高（2~4）+ 缩放倍率降到 0.45~0.70。',

  /* 操作 */
  random: '随机',
  reset: '重置参数',
  exportPng: '导出 PNG',
  exportJpeg: '导出 JPEG',

  /* 预览 */
  preview: '预览',
  previewSource: '原图',
  previewOutput: '包浆后',
  canvasSourceAria: '原图预览',
  canvasOutputAria: '包浆结果预览',
  pipeline: '处理链：JPEG → scale → JPEG → 色调/脏污/颗粒/暗角/锐化',
  processing: '处理中…',
  done: '已生成',
  perf: '耗时 {ms} ms ｜ JPEG#1 {kb1} KB ｜ JPEG#2 {kb2} KB ｜ extra {kb3} KB',
  meta: 'q1={q1}  scale={scale}  q2={q2}  loops={loops}',
}

const en: typeof zhCN = {
  title: 'Digital Patina',
  subtitle: 'A real JPEG re-encode loop, scale degradation, and a restrained old-and-dirty overlay',

  /* Upload */
  dropIdle: 'Click to choose an image, or drop it here',
  dropLoaded: 'Image loaded, click to replace',
  dropAriaIdle: 'Choose an image',
  dropAriaLoaded: 'Replace the image',
  dropMetaIdle: 'Any common image format',
  sourceSize: 'Source {width} × {height}',

  /* Parameters */
  groupCore: 'Core degradation (real JPEG)',
  groupFlavor: 'Patina flavor (applied sparingly)',
  quality1: 'First JPEG quality',
  scale: 'Scale ratio (shrink then enlarge)',
  quality2: 'Second JPEG quality',
  loops: 'Extra loops (aged-up fast)',
  warm: 'Yellowing / old color',
  desat: 'Desaturation (washed out)',
  contrast: 'Odd contrast (soft highlights)',
  grime: 'Grime (low-frequency spots)',
  grain: 'Grain (noise)',
  vignette: 'Vignette (screen-photo feel)',
  sharpen: 'Light sharpen (reprocessed look)',
  scanlines: 'Scanlines (optional)',
  tip: 'For the full handed-down look: drop the second quality to 20-35, raise the loops to 2-4, and lower the scale ratio to 0.45-0.70.',

  /* Actions */
  random: 'Randomize',
  reset: 'Reset',
  exportPng: 'Export PNG',
  exportJpeg: 'Export JPEG',

  /* Preview */
  preview: 'Preview',
  previewSource: 'Original',
  previewOutput: 'Patina',
  canvasSourceAria: 'Original image preview',
  canvasOutputAria: 'Patina result preview',
  pipeline: 'Pipeline: JPEG → scale → JPEG → tone/grime/grain/vignette/sharpen',
  processing: 'Processing…',
  done: 'Done',
  perf: 'Took {ms} ms | JPEG#1 {kb1} KB | JPEG#2 {kb2} KB | extra {kb3} KB',
  meta: 'q1={q1}  scale={scale}  q2={q2}  loops={loops}',
}

export const messages = { 'zh-CN': zhCN, en }

/** 本工具全部文案键。参数表用它约束滑杆标签，避免写错键名 */
export type PhotoPatinaMessageKey = keyof typeof zhCN
