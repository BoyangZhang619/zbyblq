# 04 图标体系与去 emoji 方案

- 文档定位：全站禁用 emoji 的落地规范，自制 SVG 图标体系的建设方案
- 前置阅读：`03-design-system.md`
- 硬约束：**全站任何位置不得使用 emoji，所有特殊样式一律以自制 SVG 实现**
- 约束：本轮只产出文档，不改动代码

---

## 1. 约束的来源与理由

### 1.1 约束内容

| 范围 | 要求 |
| --- | --- |
| 界面呈现 | 不使用任何 emoji 字符 |
| 图标实现 | 一律使用项目自制的 SVG |
| 文档 | 同样不使用 emoji，改用 `[OK]`、`[TODO]` 一类文本标记 |

### 1.2 为什么这条约束是对的

这条约束与参照对象 EMMO 的设计哲学高度一致——EMMO 的核心玩法正是「用**自制表情**+文字写日记」，而非调用系统 emoji。理由可以归纳为四条：

| 编号 | 理由 |
| --- | --- |
| R1 | **跨平台不一致**：同一个 emoji 在 iOS、Android、Windows、各浏览器上的字形完全不同。同一个界面在不同设备上观感割裂，而自制 SVG 是确定性的 |
| R2 | **不可控**：emoji 的字重、颜色、基线无法调整，无法与设计系统的色板和字阶对齐。彩色 emoji 尤其会破坏克制的莫兰迪配色 |
| R3 | **不可访问**：emoji 的朗读文本由系统决定，且常被读成冗长的描述。自制 SVG 可精确控制 `aria-label` |
| R4 | **风格不可统一**：emoji 自带强烈的「系统感」，与手帐质感的设计方向冲突；自制图标才能形成统一的视觉语言 |

---

## 2. 现状盘点

### 2.1 总体数据

| 指标 | 数值 |
| --- | --- |
| 唯一 emoji 种类 | 107 |
| emoji 总出现次数 | 518 |
| 涉及文件数 | 35 |

### 2.2 按文件分布

| 出现次数 | 文件 | 说明 |
| --- | --- | --- |
| 240 | `public/birthday/index.html` | 占全库 46%。该页未注册路由，属已下线状态 |
| 33 | `src/utils/notifications/README.md` | 文档排版用 |
| 28 | `public/mainpage/js/main.js` | 旧版导航逻辑 |
| 21 | `public/mainpage/data/navItems.json` | 工具图标字段 |
| 20 | `public/functions/data/tags.js` | 死文件，已列入删除清单 |
| 18 | `public/cS/paiCount.html` | 未接入的孤立页 |
| 16 | `src/composable/pages/PagesData.ts` | 新版工具图标字段 |
| 15 | `public/playPiano/index.html` | 钢琴页 |
| 14 | `public/mainpage/js/overlay.js` | 未被引用 |
| 13 | `public/lessonTable/README.md` | 随课表归档 |
| 其余 25 个文件 | 各 1-10 次 | 分散在各工具页 |

### 2.3 关键结论

**实际需要迁移的量远小于 518**。剔除以下三类后，真正需要设计图标的场景收敛到约 60 处：

| 类别 | 出现次数 | 处置 |
| --- | --- | --- |
| 未接入的孤立页面（birthday、cS、codeContent） | 约 300 | 页面本身不在产品内，随页面淘汰 |
| 死文件与待归档文件（tags.js、lessonTable、overlay.js） | 约 47 | 随对应清理动作消失 |
| README 与注释中的排版符号 | 约 40 | 重写文案即可，不涉及图标设计 |

**核心迁移面**：

| 位置 | 次数 | 性质 |
| --- | --- | --- |
| `PagesData.ts` 的 `icon` 字段 | 13 | 工具身份图标，每个都需要专属设计 |
| `mainpage/data/navItems.json` 的 `icon` 字段 | 18 | 同上，与上表重叠 |
| `mainpage/js/main.js` 渲染逻辑 | 28 | 徽章、状态、按钮的界面图标 |
| 各工具页内的按钮与状态符号 | 约 60 | 随融合迁移时逐个处理 |

### 2.4 特殊发现

**图标重复使用**：图片转 ASCII 与路径寻找可视化在 `PagesData.ts` 中使用了**同一个 emoji**。这正是 emoji 体系的缺陷暴露——可用图标太少，不得不复用。自制 SVG 可彻底解决。

**非 emoji 的符号类字符**：以下字符虽非 emoji，但同属「系统符号」，一并纳入替换范围：

| 字符 | 码位 | 出现场景 |
| --- | --- | --- |
| 勾 | U+2713 | 状态标记 |
| 叉 | U+2717 | 状态标记 |
| 雪花系列 | U+2744 至 U+2746、U+273B 至 U+273D、U+2748、U+2725 | 装饰 |
| 纸牌花色 | U+2660、U+2663、U+2665、U+2666 | 纸牌游戏 |
| 上箭头 | U+2B06、U+2B07 | 滚动提示 |
| 音符 | U+266B | 音乐类工具 |
| 齿轮 | U+2699 | 设置 |
| 太阳/月亮 | U+2600、U+1F319 | 主题切换（旧版） |

**明确不在替换范围的字符**（避免检测脚本误报）：

| 类别 | 码位 | 说明 |
| --- | --- | --- |
| 排版箭头 | U+2192、U+2193 等 | 用于代码注释与文档中的流程示意，渲染为单色字形，非 emoji |
| 目录树符号 | U+251C、U+2500、U+2514 等 | 用于目录结构说明 |
| 数学与逻辑符号 | U+2264、U+2265、U+00D7 等 | 用于公式与规格表述 |

**需要区分的是**：`U+2B06` / `U+2B07` 这类**带 emoji 呈现**的箭头属于界面图标，**必须**替换为自制 SVG（`arrow-up` / `arrow-down`）；而 `U+2192` 属于排版字符，仅出现在注释与文档中，不进入界面渲染，无需替换。二者的区别在于是否作为界面元素呈现。

---

## 3. 图标设计规范

### 3.1 画布与栅格

| 项 | 规格 |
| --- | --- |
| 画布 | `viewBox="0 0 24 24"` |
| 安全区 | 内容限制在 2 至 22 的范围内（即 20×20 有效区） |
| 对齐 | 关键节点落在 1px 整数栅格上，避免渲染模糊 |
| 视觉重心 | 重心居中，不依赖外框对齐 |

### 3.2 线条规格

```svg
stroke="currentColor"
stroke-width="1.75"
stroke-linecap="round"
stroke-linejoin="round"
fill="none"
```

**为什么是 1.75 而非 2**：现有 `bottomNav.vue` 使用 `stroke-width: 2`，视觉偏重。EMMO 风格强调轻盈治愈，1.75 在 24px 画布上更柔和；在小尺寸（16px）下也不至于糊成一团。

**为什么用 `currentColor`**：图标必须继承父元素颜色，才能响应主题切换与状态色。任何硬编码颜色的图标都是不合格的。

### 3.3 双层级体系

参照 EMMO「界面干净 + 贴纸可爱」的双重特征，图标分两个层级：

| 层级 | 名称 | 用途 | 风格 |
| --- | --- | --- | --- |
| Tier 1 | `line` | 界面功能：导航、按钮、状态 | 纯描边，单色，克制 |
| Tier 2 | `spot` | 工具身份：卡片主图标、空状态插图 | 双色（描边 + 柔色填充），带手绘感，更接近贴纸 |

Tier 2 是「可爱」调性的载体，也是与 EMMO 贴纸体系对应的部分。但**仅用于装饰性位置**，界面控件一律 Tier 1，保证操作清晰度。

### 3.4 示例：工具图标

Tier 1 形式的二叉树图标：

```svg
<!-- shared/icons/svg/tool-btree.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
  <circle cx="12" cy="5" r="2.5" stroke="currentColor" stroke-width="1.75"/>
  <circle cx="6" cy="13" r="2.5" stroke="currentColor" stroke-width="1.75"/>
  <circle cx="18" cy="13" r="2.5" stroke="currentColor" stroke-width="1.75"/>
  <circle cx="6" cy="20" r="2" stroke="currentColor" stroke-width="1.75"/>
  <path d="M10.7 6.6 7.3 11.4M13.3 6.6l3.4 4.8M6 15.5V18"
        stroke="currentColor" stroke-width="1.75"
        stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

Tier 2 形式（双色，用于卡片）：

```svg
<!-- 使用 CSS 变量注入柔色，随主题色板变化 -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
  <circle cx="12" cy="5" r="3" fill="var(--accent-bg)"/>
  <circle cx="6" cy="13" r="3" fill="var(--accent-bg)"/>
  <circle cx="18" cy="13" r="3" fill="var(--accent-bg)"/>
  <path d="M10.7 6.6 7.3 11.4M13.3 6.6l3.4 4.8M6 15.5V18"
        stroke="var(--accent-text)" stroke-width="1.75"
        stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="12" cy="5" r="2.5" stroke="var(--accent-text)" stroke-width="1.75"/>
  <circle cx="6" cy="13" r="2.5" stroke="var(--accent-text)" stroke-width="1.75"/>
  <circle cx="18" cy="13" r="2.5" stroke="var(--accent-text)" stroke-width="1.75"/>
</svg>
```

---

## 4. 技术方案

### 4.1 交付方式选型

| 方案 | 说明 | 评价 |
| --- | --- | --- |
| A. 组件内联 SVG | 直接写在 `.vue` 里 | 无缓存、无法复用、体积膨胀。仅适合一次性图形 |
| B. SVG Sprite | 合并为 `<symbol>` 雪碧图，用 `<use>` 引用 | 单次请求、可缓存。但无法 tree-shake，全量图标必进包 |
| C. 独立 SVG + 构建期转组件 | `vite-svg-loader` 或同类插件 | 可按需引入、可 tree-shake、有类型提示 |
| D. 图标字体 | 字体文件承载图标 | 否决：可访问性差、渲染有锯齿、无法多色 |

**选型：方案 C**。理由：Capacitor 打包后安装包体积直接受影响，tree-shaking 是刚需；同时该方案天然自带 TypeScript 类型，图标名写错会在编译期报错。

### 4.2 目录与文件

```
src/shared/icons/
├── AppIcon.vue              # 统一调用入口
├── registry.ts              # 名称 -> 组件 的映射
├── svg/                     # 自制 SVG 源文件
│   ├── tool-btree.svg
│   ├── tool-drum.svg
│   ├── nav-home.svg
│   ├── status-check.svg
│   └── ...
└── README.md                # 图标贡献规范
```

### 4.3 组件接口

```vue
<!-- AppIcon.vue -->
<template>
  <component
    :is="resolved"
    :width="size"
    :height="size"
    :aria-label="decorative ? undefined : label"
    :aria-hidden="decorative || undefined"
    role="img"
    class="app-icon"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { iconRegistry } from './registry'
import type { IconName } from './registry'

const props = withDefaults(defineProps<{
  name: IconName
  size?: number | string
  label?: string          // 无障碍标签
  decorative?: boolean    // 纯装饰时置 true，对读屏隐藏
}>(), {
  size: 24,
  decorative: false,
})

const resolved = computed(() => iconRegistry[props.name])
</script>
```

**调用示例**：

```vue
<!-- 装饰性：工具卡片主图标 -->
<AppIcon name="tool-btree" :size="28" decorative />

<!-- 功能性：必须有无障碍标签 -->
<AppIcon name="nav-home" :size="24" label="主页" />
```

### 4.4 注册表

```typescript
// registry.ts
import ToolBtree from './svg/tool-btree.svg'
import NavHome from './svg/nav-home.svg'
// ...

export const iconRegistry = {
  'tool-btree': ToolBtree,
  'nav-home': NavHome,
  // ...
} as const

export type IconName = keyof typeof iconRegistry
```

**收益**：`<AppIcon name="tool-btre" />` 这类拼写错误会在 `vue-tsc` 编译期直接报错，而不是运行时静默渲染空白。

---

## 5. 全量替换映射

> 表中以 Unicode 码位标注来源字符，不使用字符本身，以符合文档禁用 emoji 的要求。

### 5.1 工具身份图标（Tier 2）

每个工具需要一枚专属图标。**注意解决当前的图标重复问题**。

| 码位 | 名称 | 所属工具 | 目标图标名 | 设计方向 |
| --- | --- | --- | --- | --- |
| U+1F333 | 树 | 二叉树可视化 | `tool-btree` | 圆节点 + 分支连线 |
| U+1F524 | 字母 | 英文字体转换 | `tool-font` | 字母 A 叠加重影 |
| U+1F345 | 番茄 | 图片混淆 | `tool-scramble` | 网格错位打散 |
| U+1F941 | 鼓 | 鼓机 | `tool-drum` | 俯视鼓面 + 双鼓槌 |
| U+1F3B6 | 音符 | 拇指琴 | `tool-kalimba` | 琴键排列 + 单音符 |
| U+1F4CA | 柱状图 | 排序可视化 | `tool-sort` | 高低柱 + 交换箭头 |
| U+1F9E9 | 拼图 | 图片转 ASCII | `tool-ascii` | 图像块 → 字符块 |
| U+1F9E9 | 拼图 | 路径寻找 | `tool-path` | 网格 + 折线路径（**需与上者区分**） |
| U+1F7E6 | 蓝方块 | 图片像素化 | `tool-pixelate` | 大小不等的马赛克块 |
| U+2B1B | 黑方块 | 抖动 | `tool-dither` | 点阵密度渐变 |
| U+1F5BC | 相框 | 电子包浆 | `tool-patina` | 相框 + 老化斑驳 |
| U+1F3B9 | 钢琴 | 钢琴 | `tool-piano` | 黑白键片段 |
| U+1F5D3 | 日历 | 课程表 | `tool-calendar` | 已雪藏，图标先备 |
| U+1F3AE | 手柄 | 小游戏合集 | `tool-game` | 手柄轮廓 + 按键 |
| U+1F4DD | 备忘 | TodoList | `tool-todo` | 清单 + 勾选框 |
| U+1F4DA | 书本 | 学习日志 | `tool-journal` | 摊开的书 |
| U+1F338 | 花朵 | 新春祝福 | `tool-greeting` | 简笔花朵 |
| U+1F382 | 蛋糕 | 生日页 | `tool-birthday` | 已下线，按需产出 |

### 5.2 导航图标（Tier 1）

| 码位 | 名称 | 场景 | 目标图标名 |
| --- | --- | --- | --- |
| U+1F3E0 | 房子 | 底部导航-主页 | `nav-home` |
| — | — | 底部导航-分类（原为内联 SVG） | `nav-category` |
| — | — | 底部导航-我的（原为内联 SVG） | `nav-profile` |

> 现状：`src/components/base/main/svg/` 下存在 `home.svg`、`sort.svg`、`profile.svg` 三个文件，但 `bottomNav.vue` 实际使用的是内联 SVG，这三个文件为孤立资源。新建图标体系时按新规范重绘，不直接沿用。

### 5.3 界面功能图标（Tier 1）

| 码位 | 名称 | 场景 | 目标图标名 |
| --- | --- | --- | --- |
| U+2705 | 勾选 | 成功状态 | `status-success` |
| U+274C | 叉号 | 失败 / 关闭 | `status-error` |
| U+26A0 | 警告 | 警告状态 | `status-warning` |
| U+2139 | 信息 | 信息提示 | `status-info` |
| U+2753 | 问号 | 帮助 | `help-circle` |
| U+1F50D | 放大镜 | 搜索 | `search` |
| U+1F4BE | 软盘 | 保存 / 导出 | `save` |
| U+1F4E5 | 收件 | 导入 | `import` |
| U+1F4E4 | 发件 | 导出 | `export` |
| U+1F4C1 | 文件夹 | 目录 | `folder` |
| U+1F4CB | 剪贴板 | 复制 | `clipboard` |
| U+1F4C4 | 文档 | 文件 | `file` |
| U+1F5D1 | 垃圾桶 | 删除 | `trash` |
| U+1F9F9 | 扫帚 | 清空 | `clear` |
| U+1F6D1 | 停止 | 停止 | `stop` |
| U+1F527 | 扳手 | 工具 / 设置 | `tool` |
| U+2699 | 齿轮 | 设置 | `settings` |
| U+1F517 | 链接 | 外链 | `link-external` |
| U+1F512 | 锁 | 加密 / 隐私 | `lock` |
| U+1F513 | 开锁 | 解密 | `unlock` |
| U+1F441 | 眼睛 | 预览 / 显示 | `eye` |
| U+1F4A1 | 灯泡 | 提示 | `hint` |
| U+1F4CC | 图钉 | 置顶 | `pin` |
| U+1F4C5 | 日历 | 日期选择 | `calendar` |
| U+1F550 | 时钟 | 时间 | `clock` |
| U+1F522 | 数字 | 数值输入 | `number` |
| U+1F3AF | 靶心 | 定位 | `target` |
| U+1F3B2 | 骰子 | 随机 | `shuffle` |
| U+1FA84 | 魔杖 | 一键处理 | `magic` |
| U+1F4C8 | 涨势 | 统计 | `trend-up` |
| U+2B06 / U+2B07 | 上下箭头 | 滚动提示 | `arrow-up` / `arrow-down` |
| U+26F6 | 全屏 | 全屏切换 | `fullscreen` |
| U+1F50A | 喇叭 | 音量 | `volume` |
| U+1F3BC | 乐谱 | 曲谱 | `score` |
| U+1F3B5 | 音符 | 音乐 | `music-note` |
| U+1F3A8 | 调色板 | 主题 | `palette` |
| U+1F319 | 月亮 | 深色模式 | `theme-dark` |
| U+2600 | 太阳 | 浅色模式 | `theme-light` |
| U+1F4F1 | 手机 | 设备 | `device-phone` |
| U+1F6A9 | 旗帜 | 标记 | `flag` |
| U+1F4A3 | 炸弹 | 扫雷 | `mine` |
| U+1F622 | 哭脸 | 失败反馈 | `sad` |
| U+1F680 | 火箭 | 发布 / 启动 | `rocket` |
| U+1F4E6 | 包裹 | 打包 | `package` |
| U+1F465 | 人群 | 用户组 | `users` |
| U+1F41B | 甲虫 | 调试 | `bug` |
| U+2B50 | 星 | 收藏 | `star` |
| U+2764 | 心 | 喜欢 | `heart` |
| U+266B | 音符 | 音乐标记 | `music-note` |
| U+1F3BB | 提琴 | 乐器 | `instrument` |
| U+1F39B | 旋钮 | 参数 | `sliders` |
| U+1F393 | 学位帽 | 学习 | `study` |
| U+1F48C | 情书 | 消息 | `message` |
| U+2728 | 闪光 | 新功能标记 | `sparkle` |
| U+1F342 | 落叶 | 季节装饰 | `leaf` |

### 5.4 随页面淘汰（不设计图标）

以下字符集中在未接入或待删除的文件中，**不产出对应图标**：

| 类别 | 码位 | 所在 | 处置 |
| --- | --- | --- | --- |
| 食物系列 | U+1F382、U+1F967、U+1F36F、U+1F950、U+1F353、U+1F36A、U+1F36B、U+1F352、U+1F36C、U+1F369、U+1F361、U+1F968、U+1F351、U+1F370 | `public/birthday/` | 页面未接入，随页面淘汰 |
| 雪花与花饰 | U+2744 至 U+2746、U+273B 至 U+273D、U+2748、U+2725 | 装饰页 | 同上 |
| 纸牌花色 | U+2660、U+2663、U+2665、U+2666 | 纸牌游戏 | 同上 |
| 状态符号 | U+2713、U+2717 | 各工具页 | 替换为 `status-success` / `status-error` |
| 文档排版 | 全部 | README 类文件 | 改文案，不涉及图标 |

---

## 6. 约束机制

仅靠约定无法长期维持「零 emoji」。必须机械化拦截。

### 6.1 检测脚本

```javascript
// tools/check-no-emoji.mjs
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

// 允许清单：检测脚本自身需要正则，配置文件可能需保留历史数据
const ALLOWLIST = [
  'tools/check-no-emoji.mjs',
  'docs/',                       // 文档中已改用码位标注
]

// 注意：范围中刻意不含 \u{2190}-\u{21FF}（箭头块）。
// U+2192、U+2193 等是无衬线排版箭头，用于代码注释与文档中的流程示意，
// 非 emoji，渲染为单色字形，不应被拦截。
// 需要替换的是 U+2B06 / U+2B07 这类带 emoji 呈现的箭头，它们落在 \u{2B00}-\u{2BFF} 内。
const EMOJI_PATTERN =
  /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u

const EXTS = ['.ts', '.js', '.vue', '.html', '.css', '.json', '.md']

function walk(dir, hits = []) {
  for (const entry of readdirSync(dir)) {
    if (['node_modules', '.git', 'dist', 'android'].includes(entry)) continue
    const full = join(dir, entry)
    if (STATIC_DIRS.some(d => full.startsWith(d))) continue
    if (statSync(full).isDirectory()) { walk(full, hits); continue }
    if (!EXTS.some(e => entry.endsWith(e))) continue
    if (ALLOWLIST.some(a => full.includes(a))) continue

    const lines = readFileSync(full, 'utf8').split('\n')
    lines.forEach((line, i) => {
      const m = line.match(EMOJI_PATTERN)
      if (m) hits.push({ file: full, line: i + 1, char: m[0] })
    })
  }
  return hits
}

const hits = walk('.')
if (hits.length) {
  console.error(`发现 ${hits.length} 处 emoji：`)
  hits.slice(0, 50).forEach(h => {
    console.error(`  ${h.file}:${h.line}  U+${h.char.codePointAt(0).toString(16).toUpperCase()}`)
  })
  process.exit(1)
}
console.log('[OK] 未发现 emoji')
```

### 6.2 接入方式

```json
// package.json
{
  "scripts": {
    "lint:emoji": "node tools/check-no-emoji.mjs",
    "build": "npm run lint:emoji && vue-tsc -b && vite build"
  }
}
```

**将检查前置到 `build`** 是成本最低的强制手段：任何含 emoji 的代码都无法产出构建。

**建议同时接入**：Git pre-commit 钩子，在提交阶段就拦截，避免问题流入仓库。

### 6.3 存量文件的分阶段处理

检测脚本上线时会命中大量存量 emoji。**不应一次性清零**，而应配合迁移节奏，通过允许清单逐步收敛：

| 阶段 | 允许清单内容 | 说明 |
| --- | --- | --- |
| 阶段一 | `public/**`（旧版工具） | 只要求 `src/` 干净 |
| 阶段二 | 未迁移的工具目录 | 随融合进度逐个移除 |
| 阶段三 | 空 | 全库零 emoji |

允许清单必须**附带移除条件的注释**，避免变成永久豁免。

---

## 7. 迁移顺序

```
[1] 建立 shared/icons/ 目录与 AppIcon 组件、registry
        │
[2] 产出 Tier 1 界面图标（约 50 枚）—— 通用性强，复用面广
        │
[3] 接入 BottomNav，替换现有内联 SVG
        │
[4] 产出 Tier 2 工具身份图标（13 枚）
        │
[5] 改造 PagesData.ts 的 icon 字段：emoji -> 图标名
        │
[6] 改造 discovery 模块的 ToolCard，渲染 AppIcon
        │
[7] 上线检测脚本，允许清单先覆盖 public/
        │
[8] 随融合迁移，逐工具清理并缩小允许清单
        │
[9] 清理旧版导航 navItems.json（需与旧版主页下线同步）
```

**步骤 5 是数据契约变更**：`icon` 字段从「emoji 字符」变为「图标名」。需同步修改所有消费该字段的代码。建议在 `ToolManifest` 类型中把字段注释明确写为「图标名，对应 `shared/icons/registry.ts` 中的键」。

---

## 8. 图标贡献规范

新增图标时的检查项：

- [ ] 画布为 `viewBox="0 0 24 24"`，内容在 2 至 22 安全区内
- [ ] 使用 `currentColor`，无硬编码颜色
- [ ] `stroke-width="1.75"`，`linecap` 与 `linejoin` 均为 `round`
- [ ] 文件名符合 `tool-*.svg` / `nav-*.svg` / `status-*.svg` 等前缀约定
- [ ] 已在 `registry.ts` 中注册
- [ ] 在 16px、24px、32px 三档下均清晰
- [ ] 在浅色与深色主题下对比度均达标
- [ ] 功能性图标在使用处提供了 `label`，装饰性图标标注了 `decorative`
- [ ] 已通过 `npm run lint:emoji`

---

## 9. 验收清单

- [ ] `src/` 全目录零 emoji，`npm run lint:emoji` 通过
- [ ] 检测脚本已接入 `build` 流程
- [ ] `AppIcon` 的 `name` 拼写错误可在编译期被捕获
- [ ] 图片转 ASCII 与路径寻找使用**不同**图标
- [ ] 全部图标使用 `currentColor`，可响应主题色板切换
- [ ] 底部导航图标在深色模式下对比度达标
- [ ] 每枚功能性图标均有 `aria-label`，装饰性图标对读屏隐藏
- [ ] `docs/` 内文档同样无 emoji，改用 `[OK]` 类文本标记
- [ ] 允许清单中每一项都写明了移除条件

---

## 10. 执行记录

### 10.1 已完成（2026-09-18）

| 项 | 结果 |
| --- | --- |
| 图标目录 | `shared/icons/svg/`，41 个自制 SVG |
| 注册表 | `shared/icons/registry.ts`，由脚本从文件列表生成 |
| 组件 | `shared/icons/AppIcon.vue` |
| 公开出口 | `shared/icons/index.ts` |
| 数据契约 | `pages-data.ts` 的 `icon` 字段由 emoji 改为图标名，类型收紧为 `IconName` |
| 检测脚本 | `tools/check-no-emoji.mjs`，接入 `npm run build` |
| `src/` emoji | 由 46 处降为 0 |

### 10.2 与计划的三处偏差

1. **图标交付方式改为 `?raw` 导入而非构建期转组件**
   §4.1 选型为方案 C（`vite-svg-loader` 一类插件）。实际改用 Vite 内置的
   `?raw` 导入配合 `AppIcon` 的 `v-html` 渲染，**不引入任何新依赖**。
   代价是失去 tree-shaking（41 个图标全量入包，约 12 KB），收益是零依赖
   与更少的构建配置。对当前规模而言代价可接受。
   安全性说明：注入内容来自构建期静态导入的 `.svg`，不含用户输入，
   不存在 XSS 风险，已在组件内注明。

2. **未产出 §5 表格中的全部图标**
   实际产出 41 枚，覆盖当前所有使用场景（12 个工具 + 导航 + 常用功能）。
   §5.3 中列出的部分图标（如 `fullscreen`、`volume`、`score`、`music-note` 等）
   属于尚未迁移的旧工具内部所需，待各工具执行融合 Stage 3 时按需补充。

3. **允许清单包含 `public/`**
   §6.3 的分阶段策略要求先覆盖 `public/`。脚本中该项已注明移除条件：
   每个工具完成 Stage 4 后删除对应条目，全部迁移完成后整行删除。

### 10.3 待办

- 工具身份图标目前为 Tier 1 描边风格，Tier 2 的双色贴纸形态（§3.3）
  待卡片视觉稳定后再迭代
- 图标在 16px 与 32px 档位下的清晰度需目视确认
