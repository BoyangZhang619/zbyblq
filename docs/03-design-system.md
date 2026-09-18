# 03 设计系统规范

- 文档定位：视觉语言定义与设计令牌规范
- 前置阅读：`01-refactor-structure.md`
- 约束：本轮只产出文档，不改动代码

---

## 0. 调研说明与局限

### 0.1 调研过程

本文档的风格参照对象为 emmo.club 旗下软件（EMMO 日记、EMMO 小账本、EMMO 手帐）。

**必须说明的限制**：直接访问 `emmo.club` 与 App Store 页面的网络请求被环境策略拦截，未能获取官网原图与精确色值。以下风格结论来自公开渠道对 EMMO 系列产品的文字描述归纳。

### 0.2 风格特征归纳

| 特征 | 依据表述 | 本规范的处理 |
| --- | --- | --- |
| 极简去繁 | "去繁取简"、"简约却功能强大" | §4 布局原则：单页单主任务 |
| 清新明亮 | "小清新风格"、"清新明亮" | §3.1 暖白纸感底色，弃用纯灰 |
| 治愈柔和 | "清新治愈的使用体验" | §3.2 低饱和莫兰迪语义色 |
| 可爱不幼稚 | "Q 版卡通"、"极简又可爱" | §3.5 大圆角 + 轻微回弹动效 |
| 手帐质感 | "油画棒质感"、"手帐风格" | §6 纸纹与颗粒质感层 |
| 自制表情 | "用自制表情+文字的方式" | 与项目的去 emoji 约束天然一致，见 `04-icon-system.md` |
| 主题可换 | "马卡龙主题色卡"、"全彩主题" | §3.3 主题色板机制 |
| 气泡容器 | "支出和收入两个气泡框" | §5.2 卡片与气泡形态 |

### 0.3 需要你确认的偏差

由于未能直接查看 EMEMO 线上界面，以下三点属于**推断**，请核对：

1. 具体的马卡龙色值（本文档给出了一套自拟方案，非提取值）
2. 圆角尺寸量级（EMMO 为移动 App，本方案按移动端手感设定）
3. 是否使用圆体字（EMMO 强调"个性化字体"，但 Web 端引入字体的体积代价需权衡）

---

## 1. 设计目标

现有配色为纯黑白体系（`--color-primary: #000000`、`--color-background: #f5f5f5`），调性偏冷硬，与参照对象的清新治愈方向不符。本次重塑的目标：

| 目标 | 说明 |
| --- | --- |
| 从硬到柔 | 弃用纯黑纯白，改用暖色纸感基底与暖黑文字 |
| 从散到统 | 现存样式散落在 `global.css`、`style.css`、各工具自带 CSS 三处，统一到 `design/tokens/` |
| 从静到活 | 引入主题色板切换能力，呼应 EMMO 的"随心情而变" |
| 从网页到应用 | 按移动端优先设计，兼顾 Capacitor 打包后的原生观感 |

---

## 2. 令牌分层架构

```
design/
├── tokens/            # 第一层：原始令牌（primitive）
│   ├── palette.css    # 原始色值，无语义，只在此处出现十六进制
│   ├── scale.css      # 尺寸刻度：间距、圆角、字阶
│   └── motion.css     # 时长与缓动
├── themes/            # 第二层：语义令牌（semantic）
│   ├── light.css      # 浅色主题：把原始令牌映射为语义名
│   ├── dark.css       # 深色主题
│   └── accent/        # 主题色板：rose / mint / sky / lilac ...
└── base.css           # 第三层：基础元素样式（reset + 标签默认值）
```

**核心规则**：组件只允许引用**语义令牌**（`--surface-card`、`--text-primary`），不允许引用**原始令牌**（`--paper-1`、`--macaron-mint`），更不允许出现裸十六进制色值。

这条规则是主题切换能生效的前提——换主题时只需重新映射语义层。

---

## 3. 色彩系统

### 3.1 中性色：暖纸感

弃用纯灰，改用带暖调的纸感色阶。这是「清新治愈」调性的基础。

```css
/* tokens/palette.css —— 原始色阶 */
:root {
  /* 纸：从最亮到最深 */
  --paper-0: #FFFCF7;
  --paper-1: #FAF5EC;
  --paper-2: #F2EBDF;
  --paper-3: #E6DCCC;
  --paper-4: #D5C8B4;

  /* 墨：暖黑，从最深到最浅 */
  --ink-1: #3B342C;
  --ink-2: #6B6157;
  --ink-3: #9C9186;
  --ink-4: #C6BBAE;
  --ink-5: #E3DCD1;
}
```

**与现状的差异**：

| 现状 | 问题 | 目标 |
| --- | --- | --- |
| `--color-primary: #000000` | 纯黑在移动端屏显过硬，长文本阅读疲劳 | `--ink-1: #3B342C` 暖黑 |
| `--color-background: #f5f5f5` | 冷灰，缺乏温度 | `--paper-1: #FAF5EC` 暖白 |
| `--color-border: #cccccc` | 对比过强，割裂感 | 改用 `--ink-5` 一类极浅描边 |

### 3.2 语义色：莫兰迪柔和版

状态色同样降低饱和度，但必须保证文本可读性。每个状态提供前景/背景两个变体：

```css
:root {
  /* 原始色 */
  --moss:   #7A9E7E;   /* 苔绿 */
  --amber:  #C99B58;   /* 琥珀 */
  --clay:   #C4837D;   /* 陶土 */
  --slate:  #7A94AC;   /* 石板蓝 */

  /* 语义映射（浅色主题） */
  --state-success-fg: #4A6B4F;
  --state-success-bg: #E8F0E8;
  --state-warning-fg: #8A6528;
  --state-warning-bg: #F8EFDC;
  --state-danger-fg:  #8E4E48;
  --state-danger-bg:  #F7E4E2;
  --state-info-fg:    #4C6479;
  --state-info-bg:    #E6EDF3;
}
```

**约束**：`-fg` 与其配对的 `-bg` 组合对比度不低于 4.5:1（WCAG AA 正文标准）。

### 3.3 主题色板：马卡龙

呼应 EMMO「马卡龙主题色卡」，提供可切换的主色板。每个色板定义三个层次：主色、柔和底色、强调色。

```css
/* themes/accent/ */
.accent-rose  { --accent: #E8909F; --accent-soft: #FBE9EC; --accent-deep: #C96E7E; }
.accent-peach { --accent: #E9A87C; --accent-soft: #FCEEE4; --accent-deep: #C98A5E; }
.accent-butter{ --accent: #DDC168; --accent-soft: #FAF3DA; --accent-deep: #B8A046; }
.accent-mint  { --accent: #8DC3A7; --accent-soft: #E6F3EC; --accent-deep: #6BA287; }
.accent-sky   { --accent: #8FB4D9; --accent-soft: #E7F0F8; --accent-deep: #6D93BB; }
.accent-lilac { --accent: #AD9BD4; --accent-soft: #EEE9F8; --accent-deep: #8B78B5; }
```

**默认色板**：`accent-mint`（清透中性，与纸感底色最协调）。

**切换机制**：

```typescript
// shared/composables/useTheme.ts
// 在 <html> 上切换 accent-* class
// 用户选择持久化到 localStorage
// 未选择时跟随系统 prefers-color-scheme 决定明暗，色板固定为默认
```

### 3.4 语义令牌映射

组件实际引用的名字。浅色主题：

```css
/* themes/light.css */
:root {
  --surface-page:     var(--paper-1);
  --surface-card:     var(--paper-0);
  --surface-sunken:   var(--paper-2);
  --surface-overlay:  var(--paper-0);

  --text-primary:     var(--ink-1);
  --text-secondary:   var(--ink-2);
  --text-tertiary:    var(--ink-3);
  --text-disabled:    var(--ink-4);
  --text-on-accent:   var(--paper-0);

  --border-subtle:    var(--ink-5);
  --border-default:   var(--ink-4);

  --accent-fg:        var(--accent);
  --accent-bg:        var(--accent-soft);
  --accent-text:      var(--accent-deep);
}
```

深色主题：

```css
/* themes/dark.css */
:root {
  --surface-page:     #1B1917;
  --surface-card:     #242118;
  --surface-sunken:   #151312;
  --surface-overlay:  #2C2823;
  /* 深色下墨与纸互换角色 */
  --text-primary:     #F2ECE2;
  --text-secondary:   #BEB4A6;
  --text-tertiary:    #8E8478;
  --text-disabled:    #5C554C;
  --border-subtle:    #332F29;
  --border-default:   #45403A;
  /* 主色在深色下需提亮以维持对比 */
  --accent-fg:        color-mix(in srgb, var(--accent) 85%, white);
  --accent-bg:        color-mix(in srgb, var(--accent) 18%, #242118);
  --accent-text:      color-mix(in srgb, var(--accent) 70%, white);
}
```

**深色模式关键点**：主色不可直接沿用浅色值——低饱和的莫兰迪色在深底上对比不足，需按比例提亮。

### 3.5 现有变量迁移对照

| 现有令牌 | 新令牌 | 说明 |
| --- | --- | --- |
| `--color-primary: #000000` | `--text-primary` | 语义完全改变（原为品牌色，现为文字色） |
| `--color-secondary: #999999` | `--text-tertiary` | |
| `--color-inactive: #f5f5f5` | `--surface-sunken` | |
| `--color-background: #f5f5f5` | `--surface-page` | |
| `--color-text: #000000` | `--text-primary` | |
| `--color-border: #cccccc` | `--border-subtle` | |
| `--color-dark-*`（6 个） | 删除 | 由 `themes/dark.css` 整体接管 |
| `--color-light-*`（6 个） | 删除 | 由 `themes/light.css` 整体接管 |
| `--accent: #aa3bff`（`style.css`） | 删除 | Vite 模板残留，与体系冲突 |

**注意**：现有 `--color-primary` 承担了「品牌色」职责（用于标题、主按钮），新体系中被拆分为 `--text-primary`（文字）与 `--accent-*`（品牌色）。这是语义上的重构，迁移时需逐个判断原用途。

---

## 4. 排版系统

### 4.1 字体栈

```css
--font-sans:
  -apple-system, BlinkMacSystemFont,
  "PingFang SC", "Hiragino Sans GB",
  "Microsoft YaHei", "Source Han Sans SC",
  system-ui, sans-serif;
```

**关于圆体**：EMMO 强调个性化字体，但引入 Web 字体的代价需评估——中文字体子集化后仍有数百 KB，会显著增加 Capacitor 安装包体积。

建议策略：

| 场景 | 方案 |
| --- | --- |
| 正文 | 系统字体栈（零体积） |
| 标题/Logo | 可考虑引入一款开源圆体的**拉丁子集**（体积可控） |
| 数字 | 可选等宽或圆体数字子集 |

若引入中文字体，必须做子集化，并在构建流程中固化。

### 4.2 字阶

按 1.2 左右比例，基于 15px 正文（移动端可读性与密度平衡）：

```css
--text-xs:   12px;  --leading-xs:   1.5;
--text-sm:   13px;  --leading-sm:   1.55;
--text-base: 15px;  --leading-base: 1.65;   /* 正文 */
--text-md:   17px;  --leading-md:   1.5;
--text-lg:   20px;  --leading-lg:   1.4;
--text-xl:   24px;  --leading-xl:   1.3;
--text-2xl:  30px;  --leading-2xl:  1.2;
--text-3xl:  38px;  --leading-3xl:  1.15;
```

字重：

```css
--weight-regular: 400;   /* 正文，不用 300（中文细体在低分屏发虚） */
--weight-medium:  500;   /* 强调、按钮 */
--weight-bold:    600;   /* 标题；不用 700+（与柔和调性冲突） */
```

### 4.3 排版规则

- 中文正文行高不低于 1.6（汉字字面率高，行距过密影响阅读）
- 中西文混排时，数字与英文自动使用字体栈中的拉丁字体
- 标题不使用纯黑，用 `--text-primary`
- 正文不用 300 字重

---

## 5. 空间与形态

### 5.1 间距刻度（4pt 基准）

```css
--space-1:  4px;
--space-2:  8px;
--space-3:  12px;
--space-4:  16px;
--space-5:  20px;
--space-6:  24px;
--space-7:  28px;
--space-8:  32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
```

**页面边距**：移动端 `--space-4`（16px），平板及以上 `--space-6`。

### 5.2 圆角

EMMO 的「可爱」感有相当部分来自大圆角。本规范采用偏大的圆角量级：

```css
--radius-xs:   6px;     /* 标签、徽章 */
--radius-sm:  10px;     /* 输入框、小按钮 */
--radius-md:  14px;     /* 常规卡片 */
--radius-lg:  20px;     /* 大卡片、面板 */
--radius-xl:  28px;     /* 底部抽屉、模态 */
--radius-full: 999px;   /* 胶囊按钮、头像 */
```

**嵌套规则**：内层元素圆角 = 外层圆角 − 内外间距。避免同心圆角看起来「没对齐」。

### 5.3 阴影

阴影颜色基于暖墨而非纯黑，且透明度极低——柔和不脏：

```css
--elev-0: none;
--elev-1: 0 1px 2px rgba(59, 52, 44, 0.04),
          0 2px 8px rgba(59, 52, 44, 0.05);
--elev-2: 0 2px 4px rgba(59, 52, 44, 0.05),
          0 6px 16px rgba(59, 52, 44, 0.07);
--elev-3: 0 4px 8px rgba(59, 52, 44, 0.06),
          0 12px 28px rgba(59, 52, 44, 0.09);
```

**使用约定**：

- `elev-1`：静态卡片
- `elev-2`：可交互卡片、悬浮态
- `elev-3`：底部抽屉、模态、浮层

**深色模式下阴影几乎不可见**，需改用描边或表面提亮来表达层级。这是深色主题的常见陷阱。

---

## 6. 质感层

EMMO 的「手帐」「油画棒」质感是本项目当前完全缺失的维度，也是拉开与普通工具站差距的关键。

### 6.1 纸纹

用 SVG `feTurbulence` 生成精细噪点，作为页面或卡片的叠加层：

```css
.texture-paper::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.035;
  background-image: url('/design/texture/grain.svg');
  mix-blend-mode: multiply;
}
```

**约束**：

- 不透明度不超过 0.05，否则会显脏
- 必须是 `pointer-events: none`，不能拦截交互
- 纹理在深色主题下改用 `screen` 混合模式或直接关闭

### 6.2 手绘描边

对装饰性元素（如标签、贴纸式卡片）使用不规则边缘，模拟手绘：

- 用 SVG 路径而非 `border-radius` 绘制边缘
- 线条端点用 `stroke-linecap: round`
- 允许 ±1px 的不规则抖动

### 6.3 使用边界

质感层只用于**装饰**，不得影响功能区域的清晰度：

| 允许 | 禁止 |
| --- | --- |
| 页面背景 | 正文文本容器背景 |
| 卡片外框 | 表单控件内部 |
| 空状态插图 | 数据表格与图表区 |

---

## 7. 动效

```css
--dur-instant: 80ms;
--dur-fast:    140ms;
--dur-base:    220ms;
--dur-slow:    340ms;

--ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out:      cubic-bezier(0.16, 1, 0.3, 1);
--ease-in-out:   cubic-bezier(0.65, 0, 0.35, 1);
--ease-soft:     cubic-bezier(0.34, 1.45, 0.64, 1);  /* 轻微过冲，营造可爱感 */
```

**`--ease-soft` 是「可爱」的关键**：在位移、缩放类动画结尾加入轻微过冲（overshoot），产生 Q 弹的物理感。仅用于小尺寸元素的进入动画，大面板使用 `--ease-out`。

**必须遵守**：

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. 基础组件规范

### 8.1 工具卡片（ToolCard）

首页与分类页的核心元素，是设计系统的门面。

```
┌──────────────────────────────────┐  radius: --radius-lg (20px)
│  ┌────┐                          │  padding: --space-4
│  │icon│  二叉树可视化            │  gap: --space-3
│  └────┘                          │
│         输入层序遍历数组，自动    │  标题: --text-md / --weight-bold
│         生成可视化二叉树          │  描述: --text-sm / --text-secondary
│                                  │  描述最多 2 行，超出省略
│  [算法] [工具]          01-03    │  标签: --radius-xs
└──────────────────────────────────┘  时间: --text-xs / --text-tertiary
```

要点：

- 图标容器为圆角方块，背景用 `--accent-bg`，图标用 `--accent-text`
- 卡片背景 `--surface-card`，阴影 `--elev-1`，按压缩放至 0.98
- 标签不使用彩色，统一用 `--surface-sunken` 底 + `--text-secondary` 字

### 8.2 底部导航（BottomNav）

现状：`--size-nav-height: 60px`，图标为内联 SVG。

规范调整：

| 项 | 现状 | 目标 |
| --- | --- | --- |
| 高度 | 60px | 保留 60px，另加 `env(safe-area-inset-bottom)` |
| 图标 | 描边风格，`stroke-width: 2` | 见 `04-icon-system.md` |
| 激活态 | class 切换 | 图标填充色变化 + 轻微上移 2px + `--ease-soft` |
| 背景 | 纯色 | 半透明 + 背景模糊（呼应 Liquid Glass 趋势） |
| 标签 | 已注释掉 | 维持不显示（纯图标） |

**安全区适配**（Capacitor 打包必需）：

```css
.bottom-nav {
  height: calc(60px + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);
}
```

### 8.3 底部抽屉（AppSheet）

EMMO 风格的容器组件，用于工具参数面板、课程详情等场景。

- 圆角：顶部两角 `--radius-xl`
- 拖拽把手：宽 36px、高 4px、`--radius-full`、`--ink-4`
- 进入动画：`--ease-out`，`--dur-base`
- 遮罩：`rgba(59,52,44,0.32)`，非纯黑

### 8.4 空状态（AppEmptyState）

- 插图使用自制 SVG（见 `04-icon-system.md`），不使用 emoji
- 文案：主文案 `--text-md`，辅助文案 `--text-sm / --text-tertiary`
- 居中，上下留白 `--space-10`

---

## 9. 页面布局原则

呼应 EMMO 的「去繁取简」，确立三条布局规则：

| 规则 | 说明 |
| --- | --- |
| 单页单主任务 | 一屏内只有一个视觉焦点，次要信息降级或收纳进抽屉 |
| 触控优先 | 可点击区域不小于 44×44px；元素间距不小于 `--space-2` |
| 渐进披露 | 高级参数默认隐藏，通过「更多」展开，保持首屏清爽 |

---

## 10. 落地顺序

```
[1] 建立 design/tokens/ 与 design/themes/，产出令牌文件
        │
[2] 编写 design/base.css，替换现有 global.css 与 style.css
        │
[3] 实现 useTheme.ts，接通明暗与主题色板切换
        │
[4] 改造 shell 模块：BottomNav、PageFrame
        │
[5] 改造 discovery 模块：ToolCard、HomeView、CategoryView
        │
[6] 接入质感层（纸纹）
        │
[7] 随融合迁移，逐工具套用（见 02 文档 Stage 3）
```

**注意**：步骤 2 会一次性改变全站外观。由于旧版工具仍在 iframe 内（样式隔离），它们**不会**受影响——这正是「融合是视觉统一前提」的具体体现。在外壳先行落地的同时，工具内部的视觉统一需等各自 Stage 3 完成。

---

## 11. 验收清单

- [ ] 全站搜索无裸十六进制色值（`tokens/palette.css` 与 `themes/` 除外）
- [ ] 全站搜索无裸 px 间距值（`tokens/scale.css` 除外）
- [ ] 明暗双模下，正文对比度均不低于 4.5:1
- [ ] 六套马卡龙色板切换后，主色与文字组合均可读
- [ ] 深色模式下层级可辨（不依赖阴影）
- [ ] `prefers-reduced-motion` 生效
- [ ] 底部导航在带刘海/横条的设备上不被遮挡
- [ ] 纸纹质感层不拦截任何点击事件
- [ ] `src/style.css` 与 `src/css/global.css` 已退役
