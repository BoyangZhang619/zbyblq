/**
 * 图片转 ASCII 的界面文案
 *
 * 工具级文案留在工具目录内，不并入全局文案表——多个工具并行开发时
 * 集中存放必然冲突，且工具下线时应能一并带走自己的文案。
 * 参见 docs/10-i18n.md 与 docs/09-tool-page-spec.md §5
 *
 * en 声明为 typeof zhCN：漏翻或键名不一致会在 vue-tsc 阶段报错。
 */

const zhCN = {
  title: '图片转 ASCII',
  subtitle: '上传一张图片，把它变成字符画。支持纯文本与彩色 ASCII',

  // 上传
  dropPick: '点击选择图片，或拖放到此处',
  dropReplace: '已载入图片，点击可更换',
  dropFormats: '支持 PNG / JPG / WEBP 等常见格式',
  pickImage: '选择图片',
  repickImage: '重新选择图片',
  sourceSize: '原图 {width} × {height}',
  errorLoad: '图片加载失败，请重新选择图片文件',
  example: '用示例图',

  // 参数
  width: '输出宽度（列）',
  widthHint: '数值越大，字符画越细腻',
  fontSize: '字体大小',
  fontSizeHint: '只影响预览与导出的字号，不改变字符网格',
  charset: '字符密度',
  charsetHint: '决定亮度到字符的映射表',
  charsetDetailed: '细密（推荐）',
  charsetSimple: '简洁',
  charsetBlocks: '方块',
  charsetBinary: '二值',
  brightness: '亮度',
  contrast: '对比度',
  invert: '反相',
  colorAscii: '彩色 ASCII',

  // 操作
  copy: '复制',
  copied: '已复制到剪贴板',
  copyFailed: '复制失败，请手动选择文本',
  downloadTxt: '下载 TXT',
  exportPng: '导出 PNG',
  pngExported: '已导出 PNG',

  // 预览
  preview: '预览',
  previewHint: '彩色模式逐字符上色；纯文本模式更适合粘贴到终端或 README',
  modeColor: '彩色 ASCII',
  modePlain: '纯文本 ASCII',
  outputSize: '{cols} × {rows} 字符',
  outputLabel: 'ASCII 输出',
}

const en: typeof zhCN = {
  title: 'Image to ASCII',
  subtitle: 'Turn an image into character art, in plain text or colour',

  // Upload
  dropPick: 'Click to pick an image, or drop one here',
  dropReplace: 'Image loaded, click to replace',
  dropFormats: 'PNG, JPG, WEBP and other common formats',
  pickImage: 'Pick an image',
  repickImage: 'Pick another image',
  sourceSize: 'Source {width} × {height}',
  errorLoad: 'Could not load the image, please pick another file',
  example: 'Use a sample image',

  // Controls
  width: 'Output width (columns)',
  widthHint: 'Higher values give a finer character grid',
  fontSize: 'Font size',
  fontSizeHint: 'Affects the preview and export only, not the character grid',
  charset: 'Character set',
  charsetHint: 'Maps luminance to characters',
  charsetDetailed: 'Detailed (recommended)',
  charsetSimple: 'Simple',
  charsetBlocks: 'Blocks',
  charsetBinary: 'Binary',
  brightness: 'Brightness',
  contrast: 'Contrast',
  invert: 'Invert',
  colorAscii: 'Colour ASCII',

  // Actions
  copy: 'Copy',
  copied: 'Copied to clipboard',
  copyFailed: 'Copy failed, select the text manually',
  downloadTxt: 'Download TXT',
  exportPng: 'Export PNG',
  pngExported: 'PNG exported',

  // Preview
  preview: 'Preview',
  previewHint: 'Colour mode tints every character; plain text pastes better into terminals and READMEs',
  modeColor: 'Colour ASCII',
  modePlain: 'Plain text',
  outputSize: '{cols} × {rows} chars',
  outputLabel: 'ASCII output',
}

export const messages = { 'zh-CN': zhCN, en }

/** 本工具的文案键，供界面侧以联合类型约束取值 */
export type ToolMessageKey = keyof typeof zhCN
