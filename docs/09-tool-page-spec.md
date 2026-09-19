# 09 工具页规范

- 文档定位：工具模块从 iframe 迁移为原生实现的强制约束
- 适用范围：`src/modules/tools/` 下的全部工具
- 前置阅读：`03-design-system.md`、`04-icon-system.md`、`08-home-redesign-proposal.md`

**本文件是并行开发的唯一依据。** 违反其中任何一条都会造成工具之间不一致。

---

## 1. 迁移目标

每个工具从「iframe 桥接旧版静态页」改为「原生 Vue 组件」，四个阶段：

```
Stage 0  iframe 桥接（现状）
Stage 1  模块归位 —— entry 改为 'native' 之前的准备
Stage 2  逻辑提取 —— 算法从旧 JS 抽为纯 TS，与 DOM 解耦
Stage 3  视图重写 —— 套用设计令牌、图标、植物、i18n
Stage 4  旧目录下线 —— 删除 public/<tool>/
```

本次只做 **Stage 2 + Stage 3**。Stage 4 由主控在验收通过后统一执行。

---

## 2. 参考实现：先读这两个

**在写任何代码之前，必须先完整阅读这两个已完成的模块**，它们是范式的唯一权威：

| 工具 | 路径 | 可参考之处 |
| --- | --- | --- |
| 英文字体转换 | `src/modules/tools/eft-tool/` | 逻辑提取为纯函数、字体映射表、复制交互、空状态 |
| 图片像素化 | `src/modules/tools/pixelate/` | 图像处理、共享骨架样式、画布复用、导出 |

配套的共享能力（**必须复用，不要重新实现**）：

| 文件 | 提供 |
| --- | --- |
| `src/shared/composables/useImageFile.ts` | 文件选择、拖放、解码、错误处理 |
| `src/shared/utils/canvas.ts` | 离屏画布、尺寸调整、导出下载 |
| `src/shared/ui/image-tool.css` | 图像类工具的界面骨架样式 |
| `src/shared/icons/` | 43 枚几何图标（界面功能） |
| `src/shared/mascot/` | 植物（品牌表达，本层不用，见 §6） |
| `src/shared/i18n/` | 文案与本地化数据 |

---

## 3. 文件结构

每个工具目录的最终形态：

```
src/modules/tools/<tool-id>/
├── manifest.ts           # 已存在，仅需把 entry 改为 'native'
├── index.vue             # 必需：入口视图
├── <tool>.css            # 按需：仅当有共享骨架之外的样式时
├── locales.ts            # 必需：本工具的界面文案（见 §5）
├── composables/          # 逻辑：与 DOM 解耦的纯 TS
│   └── use<Thing>.ts
├── components/           # 可选：拆出的子组件
└── types.ts              # 可选
```

**命名**：目录 kebab-case；`.vue` PascalCase；其余 kebab-case。

---

## 4. 样式约束（最容易违反的一条）

### 4.1 只允许使用语义令牌

组件样式**只能**引用以下令牌，**禁止**任何裸值：

| 类别 | 允许的令牌 |
| --- | --- |
| 表面 | `--surface-page` `--surface-card` `--surface-sunken` `--surface-overlay` |
| 文字 | `--text-primary` `--text-secondary` `--text-tertiary` `--text-disabled` `--text-on-accent` |
| 描边 | `--border-subtle` `--border-default` |
| 主题色 | `--accent-fg` `--accent-bg` `--accent-text` |
| 状态 | `--state-success-fg/-bg` `--state-warning-fg/-bg` `--state-danger-fg/-bg` `--state-info-fg/-bg` |
| 间距 | `--space-1` 至 `--space-16` |
| 圆角 | `--radius-xs` `--radius-sm` `--radius-md` `--radius-lg` `--radius-xl` `--radius-2xl` `--radius-3xl` `--radius-full` |
| 字号 | `--text-xs` `--text-sm` `--text-base` `--text-md` `--text-lg` `--text-xl` `--text-2xl` |
| 字重 | `--weight-regular` `--weight-medium` `--weight-bold` |
| 行高 | `--leading-xs` 至 `--leading-2xl` |
| 阴影 | `--elev-card` `--elev-hover` `--elev-float` |
| 动效 | `--dur-fast` `--dur-base` `--dur-slow` `--ease-standard` `--ease-out` `--ease-soft` |
| 尺寸 | `--size-touch-min` `--size-nav-height` `--page-gutter` `--width-content-max` |

**禁止**：
- 裸十六进制色值（`#fff`、`#3B3B3F`）
- 裸 px 间距（`padding: 12px`，应写 `var(--space-3)`）
- 引用原始令牌（`--paper-1`、`--sun`、`--ink-1`）——它们只供主题层映射
- `rgb()` / `rgba()` 字面量

**唯一例外**：装饰性渐变、`color-mix()` 的混合比例、纯几何值（如 `translateY(-2px)`）。

### 4.2 复用共享骨架

图像类工具（img2ascii、floyd-steinberg、photo-patina、encryption-graph）
**必须**复用 `src/shared/ui/image-tool.css`，不要重写这些类：

`imgtool` `imgtool__header` `imgtool__title` `imgtool__subtitle` `imgtool__section`
`imgtool__label` `imgtool__value` `imgtool__hint` `imgtool__error`
`imgtool__drop` `imgtool__drop-title` `imgtool__drop-meta`
`imgtool__field` `imgtool__field-head` `imgtool__range` `imgtool__switch`
`imgtool__switch-track` `imgtool__switch-text` `imgtool__chips` `imgtool__chip`
`imgtool__actions` `imgtool__btn` `imgtool__btn--primary`
`imgtool__preview-head` `imgtool__canvas-wrap` `imgtool__canvas`

用法：`<style scoped>@import '@/shared/ui/image-tool.css';</style>`，
模板根元素用 `class="imgtool"`。

工具特有的样式写在自己的 `.css` 里，类名用 `工具名__元素名` 前缀。

### 4.3 页面骨架

所有工具页使用同一外层结构：

```vue
<template>
  <div class="<tool>">
    <div class="page-content">
      <header class="<tool>__header">
        <h1 class="<tool>__title">{{ tt('title') }}</h1>
        <p class="<tool>__subtitle">{{ tt('subtitle') }}</p>
      </header>
      <!-- 工具内容 -->
    </div>
  </div>
</template>
```

`.page-content` 由基础样式提供（最大宽度与页面内边距），**不要自己写**。

---

## 5. 国际化（强制）

### 5.1 界面文案：放本工具目录内

**不要**修改 `src/shared/i18n/locales/` 下的全局文案表——多个工具并行开发会冲突。

在 `src/modules/tools/<tool-id>/locales.ts` 建本工具的文案。

**注意形状：语种在外层，键在内层。** `useToolI18n` 的入参是 `Record<Locale, T>`：

```ts
import type { Messages } from '@/shared/i18n'   // 若需复用全局键

const zhCN = {
  title:     '图片像素化',
  subtitle:  '调整像素块大小',
  blockSize: '像素块大小',
}

/** 声明为 typeof zhCN，漏翻一个键就是编译错误 */
const en: typeof zhCN = {
  title:     'Pixelate',
  subtitle:  'Adjust the block size',
  blockSize: 'Block size',
}

export const messages = { 'zh-CN': zhCN, en }
```

> 本文档早期版本此处写成了 `Record<string, Localized>`（键在外），与实现相反，
> 会导致照抄者编译失败。已更正。

组件内：

```vue
<script setup lang="ts">
import { useToolI18n } from '@/shared/i18n'
import { messages } from './locales'

const { tt } = useToolI18n(messages)
</script>

<template>
  <h1>{{ tt('title') }}</h1>
</template>
```

`tt` 在模板中调用即自动追踪语言变化，不需要额外处理响应式。

### 5.2 要求的语种

**必须同时提供 `'zh-CN'` 与 `en`**，缺一不可——`Localized` 是 `Record<Locale, string>`，
漏一个语种会在 `vue-tsc` 阶段报错。

中文标点用全角（，。、），英文用半角。英文文案首字母大写、句尾不加句号（短语类）。

---

## 6. 图标与植物

| 层级 | 用途 | 本层的使用 |
| --- | --- | --- |
| `AppIcon` | 界面功能：按钮、状态、操作 | **用**。禁止 emoji，禁止内联 SVG |
| `PlantIcon` | 品牌表达：工具身份、主视觉 | **不用**。工具页内不出现植物 |

```vue
import { AppIcon } from '@/shared/icons'

<!-- 功能性图标必须有无障碍标签 -->
<AppIcon name="save" :size="16" label="导出" />

<!-- 纯装饰图标对读屏隐藏 -->
<AppIcon name="hint" :size="20" decorative />
```

**`IconName` 是联合类型，拼错会在编译期报错。** 若需要的图标不存在，
**停下来报告**，不要自己内联一个 SVG——那会破坏图标体系的统一性。

---

## 7. 无障碍

| 要求 | 说明 |
| --- | --- |
| 触控区 | 可点击元素不小于 `var(--size-touch-min)`（44px），或视觉小但触控区撑满 |
| 图标按钮 | 必须有 `aria-label`，内容为可读文字而非图标名 |
| 装饰图标 | 必须标 `decorative`，对读屏隐藏 |
| 表单控件 | 每个 `<input>` 必须有配对的 `<label for>` 或 `aria-label` |
| 状态变化 | 复制成功、处理失败等必须同时给出**文字**反馈，不能只改颜色或图标 |
| 键盘可达 | 需要点击的 `<div>` 必须补 `role="button" tabindex="0"` 与 `keydown.enter/space`；能用 `<button>` 就不用 div |
| 焦点可见 | 不要移除 `:focus-visible` 轮廓 |

---

## 8. 禁止事项

| 禁止 | 原因 |
| --- | --- |
| 使用 emoji | 全站硬约束，构建会失败（`npm run lint:emoji`） |
| 内联 SVG | 破坏图标体系；需要新图标请报告 |
| 硬编码中文文案 | 必须走 `tt()`，否则英文环境显示中文 |
| 修改 `src/shared/` 下的文件 | 共享层变更需主控统一处理，并行修改会冲突 |
| 修改其他工具的目录 | 越界 |
| 修改全局文案表 | 并行冲突 |
| 重新实现已有共享能力 | 先看 `shared/` 有没有 |
| 引入新依赖 | 需要新依赖请报告 |
| 改动 `public/` 下的旧文件 | Stage 4 由主控统一执行 |
| 删除旧实现 | 同上 |

**遇到拿不准的情况：停下来，在报告中说明，不要自行决定。**

---

## 9. 逻辑提取的要求（Stage 2）

从 `public/<tool>/js/main.js` 提取逻辑时的判断标准：

**可以提取**：输入输出都是数据，不读写 DOM、不监听事件。
例如「计算树布局坐标」「把像素转成字符」「算下一个排序步」。

**不要提取**：与渲染方式绑定的部分。例如「把坐标画到 canvas」——
它依赖具体的绘制方式，应留给 Stage 3 重写。

**必须保留原算法**：合成参数、卷积核、迭代次数等**逐值照搬**，
不得「顺手优化」。音色、色调差一点就变了。

若发现原实现有**明确的缺陷**（如重复的映射表、越界的坐标），
**保留行为但在报告中单独列出**，由主控决定是否修复。

---

## 10. 验收清单

提交前逐条自查：

- [ ] `npm run build` 通过（含 emoji 检测与 `vue-tsc`）
- [ ] 无 emoji
- [ ] 无内联 SVG，图标全部走 `AppIcon`
- [ ] 无硬编码文案，全部走 `tt()`
- [ ] 中英双语均完整
- [ ] 无裸色值 / 裸 px / 原始令牌引用
- [ ] 图像类工具复用了 `imgtool__*` 骨架（纯用共享骨架时不必有自有 CSS）
- [ ] 每个图标按钮有 `aria-label`
- [ ] 触控区不小于 44px
- [ ] 逻辑提取为独立文件，未与 DOM 耦合
- [ ] `manifest.ts` 的 `entry` 已改为 `'native'`
- [ ] 未修改 `src/shared/`、其他工具目录、全局文案表
- [ ] 未删除 `public/` 下的旧实现

---

## 11. 常见错误

| 错误 | 后果 |
| --- | --- |
| 用 `t('xxx')` 引用全局文案表 | 查不到该键，编译报错；且并行冲突 |
| 文案只写了中文 | `Localized` 缺 `en`，编译报错 |
| 间距写 `12px` 而非 `var(--space-3)` | 与其他工具节奏不一致 |
| 用 `--ink-1` 这类原始令牌 | 深色模式失效 |
| 复制交互只改按钮文字不播报 | 读屏用户无感知 |
| 把 canvas 绘制逻辑也抽进 composable | 逻辑与视图耦合，后续难改 |
| 顺手「优化」了合成参数 | 音色/色调改变，属行为回归 |
