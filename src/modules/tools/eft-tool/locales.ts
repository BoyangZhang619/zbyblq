/**
 * 英文字体转换的界面文案
 *
 * 形状为 Record<Locale, T>（语种在外层），与 useToolI18n 的入参一致。
 * en 声明为 typeof zhCN，漏翻一个键即编译错误。
 */

const zhCN = {
  title: '英文字体转换',
  subtitle: '输入英文，选择样式即可转为对应的 Unicode 字形',
  inputLabel: '输入文本',
  inputPlaceholder: '在此输入英文…',
  styleLabel: '选择样式',
  resultLabel: '转换结果',
  resultPlaceholder: '转换结果将显示在这里',
  copy: '复制',
  copied: '已复制',

  // 样式名。字体本身展示的是风格化字符（如 𝐁𝐨𝐥𝐝），
  // 这几条是给读屏与中文界面用的可读标签
  'style.bold': '粗体',
  'style.italic': '斜体',
  'style.bold-italic': '粗斜体',
  'style.gothic': '哥特体',
  'style.bold-gothic': '粗哥特',
  'style.mono': '等宽体',
  'style.spaced': '全角间隔',
  'style.small-caps': '小型大写',
  'style.script': '手写体',
  'style.boxed': '方框体',
  'style.combo': '下划线',
}

const en: typeof zhCN = {
  title: 'Font Style Converter',
  subtitle: 'Type English text and pick a style to convert it into Unicode letterforms',
  inputLabel: 'Input',
  inputPlaceholder: 'Type something in English…',
  styleLabel: 'Choose a style',
  resultLabel: 'Result',
  resultPlaceholder: 'The converted text will appear here',
  copy: 'Copy',
  copied: 'Copied',

  'style.bold': 'Bold',
  'style.italic': 'Italic',
  'style.bold-italic': 'Bold italic',
  'style.gothic': 'Gothic',
  'style.bold-gothic': 'Bold gothic',
  'style.mono': 'Monospace',
  'style.spaced': 'Full-width',
  'style.small-caps': 'Small caps',
  'style.script': 'Script',
  'style.boxed': 'Boxed',
  'style.combo': 'Underlined',
}

export const messages = { 'zh-CN': zhCN, en }

export type EftKey = keyof typeof zhCN
