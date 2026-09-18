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

## 当前内容

| 目录 | 状态 |
| --- | --- |
| `icons/` | 已投入实际使用：41 枚自制 SVG + AppIcon + 注册表 |
| `composables/` | `useTheme.ts`（明暗与主题色板） |
| `ui/` | 待填充，基础组件目前散在各模块内 |
| `stores/` | 待填充，暂无跨模块共享的状态 |
| `utils/` | 待填充，尚无跨模块复用的纯函数 |

## 已归档

原 `shared/utils/notifications/`（约 2300 行通知系统）已于 2026-09-18 移入
`archive/notifications/`。原因：其唯一消费方是首页的通知演示面板，该面板
已在视觉重塑中被真实工具导航取代，导致模块无人使用。

它保留在本层会产生误导——「shared」的含义是被多个模块复用，而它没有被
任何模块使用。恢复条件与计划的接入场景见其
[归档说明](../../archive/notifications/ARCHIVE_NOTE.md)。
