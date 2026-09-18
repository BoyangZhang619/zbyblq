# 归档说明：notifications

## 基本信息

| 项 | 值 |
| --- | --- |
| 归档日期 | 2026-09-18 |
| 原路径 | `src/shared/utils/notifications/` |
| 迁移前路径 | `src/utils/notifications/` |
| 规模 | 7 个文件，约 2300 行 |
| 归档原因 | 无生产消费者 |

## 雪藏理由

本模块是一套完整可用的通知系统，支持模板、拦截器、队列、群组、定时、
历史与统计。但它**从未有过除演示之外的使用场景**：

1. 它以 `src/views/home.vue` 的通知演示面板作为唯一的消费方
2. 视觉重塑阶段将该演示面板替换为真实的工具导航（见
   `docs/03-design-system.md` §12）
3. 替换后全库不再有任何生产代码引用本模块

保留在 `shared/` 会产生误导——该层级的含义是「被多个模块复用」，
而它实际上无人使用。故移入归档区。

## 与 lessonTable 的区别

| | lessonTable | notifications |
| --- | --- | --- |
| 归档前状态 | 功能可用，但开发方向暂停 | 功能可用，且无任何消费方 |
| 恢复条件 | 决定重启该功能 | 出现真实使用场景 |
| 代码质量 | 数据源受外部系统约束 | 完整，有类型与文档 |

## 目录结构

```
notifications/
├── ARCHIVE_NOTE.md          本文件
├── index.ts                 导出入口
├── types.ts                 类型定义（优先级、样式、定时、通道、拦截器…）
├── NotificationManager.ts   核心管理器
├── Interceptors.ts          9 种拦截器实现
├── helpers.ts               模板、快捷方法、构建器、工具函数
├── EXAMPLES.ts              使用示例（归档前已无生产引用）
└── README.md                模块文档
```

## 恢复步骤

1. 移回 `src/shared/utils/notifications/`
2. 若恢复 `EXAMPLES.ts`，需同步修正其内部 import 路径
3. 在需要通知能力的模块中按 README 的用法接入

**无需恢复路由或数据条目**——本模块从未注册过路由，也不参与工具元数据。

## 恢复前需确认

**依赖 Capacitor 插件**：`NotificationManager.ts` 引入了
`@capacitor/local-notifications`。恢复时需确认该依赖仍在
`package.json` 中（当前仍在，未随归档移除）。

## 计划的接入点

`docs/05-account-system.md` §7.6 列出了预期场景：

- 登录成功 / 失败 / 会话过期的反馈
- 云端同步冲突提示
- 应用在后台时的定时提醒（依赖 Capacitor 本地通知能力）

若账户系统最终不采用该方案，本模块可长期留在归档区或直接删除。
