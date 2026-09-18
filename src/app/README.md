# app 层：应用装配

## 职责

回答「应用如何被组装起来」。这一层只处理启动、路由、全局插件与守卫，**不包含任何业务逻辑**。

## 目录结构

```
app/
├── router/
│   ├── index.ts          # 路由实例（createRouter）
│   ├── routes.ts         # 路由表，由各模块 manifest 聚合生成
│   └── guards/
│       ├── title.ts      # 页面标题
│       └── auth.ts       # 认证守卫
├── providers/            # 全局装配：Pinia、插件注册
└── bootstrap.ts          # 启动序列
```

## 依赖规则

| 允许 | 禁止 |
| --- | --- |
| 依赖 `shared/`、`design/` | 依赖具体业务模块的内部实现 |
| 引用各模块导出的 manifest 与 store | 直接 import 模块内部的组件或工具函数 |

路由表**不手写**，而是从 `modules/*/manifest.ts` 聚合。新增页面应通过模块自声明，而非修改 `routes.ts`。

## 迁移状态

当前实际代码仍在 `src/router/`，待等价重构后迁入本层。迁移属 `docs/01-refactor-structure.md` §9 步骤 5。
