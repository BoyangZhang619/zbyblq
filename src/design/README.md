# design 层：设计系统

## 职责

全站视觉的唯一真源。**本层只包含 CSS，不含任何 TypeScript 代码。**

规范详见 `docs/03-design-system.md`。

## 目录结构

```
design/
├── tokens/               # 第一层：原始令牌
│   ├── palette.css       # 原始色值（十六进制只允许出现在这里）
│   ├── scale.css         # 间距、圆角、字阶
│   └── motion.css        # 时长与缓动
├── themes/               # 第二层：语义令牌
│   ├── light.css         # 浅色主题
│   ├── dark.css          # 深色主题
│   └── accent/           # 马卡龙主题色板
├── texture/              # 手帐质感素材（SVG 纹理）
├── base.css              # 第三层：reset 与基础元素样式
└── index.css             # 汇总入口，按序 import
```

## 令牌三层模型

```
原始令牌 (--paper-1, --macaron-mint)
    ↓ 映射
语义令牌 (--surface-card, --accent-bg)
    ↓ 引用
组件样式
```

**核心规则**：组件只允许引用**语义令牌**，不允许直接使用原始令牌，更不允许出现裸十六进制色值。这是主题切换能够生效的前提。

## 依赖规则

| 允许 | 禁止 |
| --- | --- |
| 被 `shared/`、`modules/` 引用 | import 任何 TS / Vue 代码 |
| 令牌之间互相引用 | 定义组件级的类名或选择器 |

## 迁移状态

当前样式分散在 `src/css/`、`src/style.css` 与各工具自带 CSS 三处。本层建立后统一收拢，属 `docs/01-refactor-structure.md` §9 步骤 7。

> 注意：`src/style.css` 被 `src/main.ts` 实际引用，且承载 `color-scheme`、标题字重等基线样式，**不是死代码**。其退役必须与本层的 `tokens/` 和 `base.css` 就位同步进行，不可提前删除。
