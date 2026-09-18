# shared 层：跨模块共享

## 职责

存放**被两个以上模块使用**的代码。判断标准是使用方数量，不是「看起来通用」。

## 目录结构

```
shared/
├── ui/                   # 基础组件：AppButton、AppCard、AppSheet、AppTag ...
├── icons/                # 自制 SVG 图标体系，详见 docs/04-icon-system.md
│   ├── AppIcon.vue
│   ├── registry.ts
│   └── svg/
├── composables/          # 跨模块组合式函数：useTheme、useStorage ...
├── stores/               # 跨模块 Pinia store：ui（主题、语言）
└── utils/                # 纯函数工具
    └── notifications/    # 通知系统（自 src/utils/ 迁入）
```

## 准入规则

一段代码进入本层的**唯一理由**是被多个模块复用。

| 情形 | 应放位置 |
| --- | --- |
| 仅一个模块使用 | 该模块自己的 `composables/` 或 `components/` |
| 两个及以上模块使用 | 提升到本层 |
| 只有工具函数会用到 | 工具模块内部，不要提前抽到本层 |

**避免过早抽象**：不要因为「将来可能复用」就把代码放进本层。等到第二个使用方出现时再提升。

## 依赖规则

| 允许 | 禁止 |
| --- | --- |
| 依赖 `design/` | import `modules/` 下的任何内容 |
| 依赖其他 `shared/` 子目录 | 引入具体业务概念（如「课程表」「钢琴」） |

## 分层位置

```
modules/  ──依赖──>  shared/  ──依赖──>  design/
```

## 迁移状态

当前 `src/utils/notifications/`（约 2300 行）将迁入 `shared/utils/notifications/`。迁入前需按 `docs/04-icon-system.md` 处理其文档中的 emoji。
