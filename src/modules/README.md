# modules 层：业务模块

## 职责

按**功能域**切分的业务代码。每个模块自包含，内部可自由组织。

## 目录结构

```
modules/
├── shell/                # 应用外壳：底部导航、页面框架
├── discovery/            # 发现：首页、分类、工具列表
├── account/              # 账户：登录、注册、鉴权（待定）
├── profile/              # 个人中心
├── tools/                # 工具集
│   ├── registry.ts       # 工具注册表（唯一数据源）
│   ├── types.ts          # ToolManifest 类型
│   └── <tool>/           # 每个工具一个目录
└── external/             # 外链聚合
```

## 模块内部规范

模块可以自由组织内部结构，但工具模块建议遵循统一形态：

```
modules/tools/<tool>/
├── manifest.ts           # 必需：模块自声明
├── index.vue             # 必需：模块入口视图
├── components/           # 可选：私有组件
├── composables/          # 可选：私有逻辑
├── types.ts              # 可选：类型定义
└── assets/               # 可选：私有素材
```

## 依赖规则

| 允许 | 禁止 |
| --- | --- |
| 依赖 `shared/`、`design/`、`app/` | **模块之间直接互相 import** |
| 模块内部自由依赖 | 从 `shared/` 反向 import `modules/` |

**模块间需要共享时**，把代码下沉到 `shared/`，而不是让模块互相引用。这条规则保证了模块可以被独立迁移、独立测试、独立删除。

## 工具模块的特殊约定

工具通过 `manifest.ts` 自声明，路由表与分类页从注册表派生，**不再维护中心化的工具清单**。

```typescript
export const manifest: ToolManifest = {
  id: 'btree',
  title: '二叉树可视化',
  icon: 'tree',                    // 图标名，非 emoji
  route: { path: '/tools/btree', name: 'tool-btree' },
  entry: 'iframe',                 // 迁移进度：iframe -> native
  // ...
}
```

字段定义见 `modules/tools/types.ts`，设计依据见 `docs/01-refactor-structure.md` §6。

## 迁移状态

当前所有代码仍在旧的按类型切分的目录下（`src/views/`、`src/composable/`、`src/components/`）。迁入本层属 `docs/01-refactor-structure.md` §9 步骤 5。

工具从 iframe 迁移为原生实现的完整范式见 `docs/02-fusion-architecture.md`。
