/**
 * 二叉树可视化 的界面文案
 *
 * 放在工具目录内而非全局文案表：工具的文案与工具的生命周期绑定，
 * 删工具时一并带走，也不会与并行开发的其它工具改同一份文件。
 * 见 docs/09-tool-page-spec.md §5
 *
 * 两个语种都必须齐全——缺一个会在 vue-tsc 阶段报错。
 */

import type { Locale } from '@/shared/i18n'

/**
 * 用类型别名而非 interface
 *
 * useToolI18n 的约束是 `T extends Record<string, string>`，而 interface
 * 不会获得隐式索引签名，用 interface 声明会在这里编译失败。
 */
export type BtreeMessages = {
  title: string
  subtitle: string
  inputLabel: string
  inputPlaceholder: string
  inputHint: string
  generate: string
  save: string
  clear: string
  examples: string
  exampleComplete: string
  exampleLeetcode: string
  exampleLeftSkewed: string
  exampleRightSkewed: string
  exampleBst: string
  placeholder: string
  statsNodes: string
  statsHeight: string
  statsLeaves: string
  canvasAlt: string
  errorEmpty: string
  errorFormat: string
  errorNoTree: string
}

export const messages: Record<Locale, BtreeMessages> = {
  'zh-CN': {
    title: '二叉树可视化',
    subtitle: '输入层序遍历数组，自动生成可视化二叉树',
    inputLabel: '层序遍历数组',
    inputPlaceholder: '如：[1, 2, 3, null, 4, 5]',
    inputHint: '用 null 表示空节点，支持数字与字符串节点，按 Enter 快速生成',
    generate: '生成',
    save: '保存图片',
    clear: '清空',
    examples: '快速示例',
    exampleComplete: '完全二叉树',
    exampleLeetcode: 'LeetCode 104',
    exampleLeftSkewed: '左倾斜',
    exampleRightSkewed: '右倾斜',
    exampleBst: '二叉搜索树',
    placeholder: '输入数组后点击生成，树会画在这里',
    statsNodes: '节点数',
    statsHeight: '树高度',
    statsLeaves: '叶子节点',
    canvasAlt: '二叉树结构图，共 {count} 个节点',
    errorEmpty: '请输入层序遍历数组',
    errorFormat: '输入格式错误，请输入有效的数组，如：[1, 2, 3, null, 4]',
    errorNoTree: '无法构建二叉树，请检查输入',
  },
  en: {
    title: 'Binary Tree Visualizer',
    subtitle: 'Enter a level-order array to draw the tree diagram',
    inputLabel: 'Level-order array',
    inputPlaceholder: 'e.g. [1, 2, 3, null, 4, 5]',
    inputHint: 'Use null for empty nodes. Numbers and strings both work; press Enter to render',
    generate: 'Generate',
    save: 'Save image',
    clear: 'Clear',
    examples: 'Examples',
    exampleComplete: 'Complete tree',
    exampleLeetcode: 'LeetCode 104',
    exampleLeftSkewed: 'Left-skewed',
    exampleRightSkewed: 'Right-skewed',
    exampleBst: 'Binary search tree',
    placeholder: 'Render an array to see the tree here',
    statsNodes: 'Nodes',
    statsHeight: 'Height',
    statsLeaves: 'Leaves',
    canvasAlt: 'Tree diagram with {count} nodes',
    errorEmpty: 'Enter a level-order array',
    errorFormat: 'Invalid format. Use a valid array, e.g. [1, 2, 3, null, 4]',
    errorNoTree: 'Cannot build a tree from this input',
  },
}
