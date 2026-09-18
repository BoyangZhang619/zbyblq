# 01 结构重构方案

- 文档定位：全体结构分析与重构蓝图
- 前置阅读：`old_version_structure_analysis.md`
- 约束：本轮只产出文档，不改动代码

---

## 1. 重构目标

当前仓库是「新壳套旧核」的过渡形态：Vue 3 外壳（路由、底部导航、通知）包裹着 13 个以 iframe 嵌入的旧版静态工具。这种形态在迁移期是合理的，但已经暴露出结构性债务。

重构建成三个目标：

| 编号 | 目标 | 验收标准 |
| --- | --- | --- |
| G1 | 数据源唯一化 | 工具元数据只存在一处，增删工具只改一个文件 |
| G2 | 分层清晰化 | 每个文件有确定的归属层，新增代码无需询问「放哪」 |
| G3 | 债务清偿 | 死代码、0 字节占位、重复副本全部清除或归档 |

同时为后续三个方向让路：`02-fusion-architecture.md`（融合迁移）、`03-design-system.md`（视觉重塑）、`04-icon-system.md`（图标改造）、`05-account-system.md`（账户接入）。

---

## 2. 现状问题归因

### 2.1 数据三写（最高优先级）

同一批工具元数据存在三份副本，字段互相覆盖：

| 位置 | 形态 | 条目数 | 消费方 |
| --- | --- | --- | --- |
| `src/composable/pages/PagesData.ts` | TS 常量 | 13 | 新版分类页、工具列表 |
| `public/mainpage/data/navItems.json` | JSON | 18 | 旧版导航主页 |
| `public/functions/data/tags.js` | JS 全局常量 | 18 | 无（死文件） |

后果：新增一个工具需要在三处同步修改，且三者的字段集已经不一致（`PagesData.ts` 无外链条目，`navItems.json` 有 5 条外链）。

### 2.2 路径映射双写且未接线

`src/composable/pages/PagePathManager.ts` 定义了完整的 id → iframe 路径映射表，但**没有任何文件引用它**。13 个工具组件的 iframe `src` 全部是硬编码字符串字面量。

这属于「已写好但未接线」的半成品，比单纯的死代码更需要注意——它的存在说明原本的设计意图就是集中管理路径。

### 2.3 层级语义缺失

当前 `src/` 下的目录是按「文件类型」切分的：

```
src/
├── components/    # Vue 组件
├── composable/    # 组合式函数
├── css/           # 样式
├── router/        # 路由
├── stores/        # Pinia
├── utils/         # 工具
└── views/         # 页面
```

按类型切分在项目规模小时可行，但引入账户系统与工具融合后会产生问题：一个「课程表」模块的代码将被拆散到 7 个目录。**应按「功能域」切分**。

### 2.4 遗留债务清单

| 类别 | 数量 | 详见 |
| --- | --- | --- |
| 0 字节占位文件 | 23 | §5.1 |
| 空目录 | 4 | §5.2 |
| 死代码 | 4 个文件 | §5.3 |
| 重复实现 | 1 项 | §5.4 |
| 遗留样式（非死代码） | 1 项 | §5.5 |

> 计数已于 2026-09-18 实际执行阶段一时校正：0 字节文件原记为 22（漏计 `public/btree/generate_tree.py`），空目录原记为 2（漏计 `src/pages/`）。

---

## 3. 目标目录结构

### 3.1 总览

```
zbyblq/
├── archive/                        # [新增] 雪藏区，不参与构建
│   ├── README.md                   # 归档总说明与恢复方式
│   └── lessonTable/                # 见 §4
├── docs/                           # [新增] 设计文档
├── public/                         # 静态资源，随融合推进逐步清空
│   ├── imageContent/               # 保留：站点图标等共享素材
│   └── (各工具目录 → 迁移后删除)
├── src/
│   ├── main.ts                     # 入口
│   ├── App.vue                     # 根组件
│   ├── app/                        # [新增] 装配层
│   ├── design/                     # [新增] 设计系统
│   ├── shared/                     # [新增] 跨模块共享
│   └── modules/                    # [新增] 业务模块
├── index.html
├── vite.config.ts
├── capacitor.config.ts
└── package.json
```

### 3.2 `src/app/`：装配层

应用如何被组装起来，与业务无关。

```
src/app/
├── router/
│   ├── index.ts                    # 路由实例
│   ├── routes.ts                    # 路由表（由模块 manifest 聚合生成）
│   └── guards/
│       ├── title.ts                # 页面标题
│       └── auth.ts                 # 认证守卫（见 05 文档）
├── providers/                      # 全局装配：Pinia、插件注册
│   └── pinia.ts
└── bootstrap.ts                    # 启动序列
```

### 3.3 `src/design/`：设计系统

唯一真源，详见 `03-design-system.md`。

```
src/design/
├── tokens/
│   ├── color.css                   # 色彩令牌（含明暗与主题色板）
│   ├── typography.css              # 字阶与字重
│   ├── space.css                   # 间距刻度
│   ├── radius.css                  # 圆角刻度
│   ├── elevation.css               # 阴影层级
│   └── motion.css                  # 时长与缓动
├── base.css                        # reset + 基础元素样式
├── texture/                        # 手帐质感素材（SVG 纹理）
└── index.css                       # 汇总入口，按序 @import
```

**规则**：任何组件不得定义裸色值、裸字号、裸间距，一律引用令牌。

### 3.4 `src/shared/`：跨模块共享

被两个以上模块使用的代码。

```
src/shared/
├── ui/                             # 基础组件
│   ├── AppButton.vue
│   ├── AppCard.vue
│   ├── AppSheet.vue                # 底部抽屉
│   ├── AppTag.vue
│   ├── AppBadge.vue
│   └── AppEmptyState.vue
├── icons/                          # 自制 SVG 图标体系，见 04 文档
│   ├── AppIcon.vue
│   ├── registry.ts
│   └── svg/
├── composables/
│   ├── useTheme.ts
│   ├── useStorage.ts
│   └── useAsyncState.ts
├── stores/
│   └── ui.ts                       # 全局 UI 状态：主题、语言
└── utils/
    ├── notifications/              # 现有通知系统迁入
    ├── date.ts
    └── format.ts
```

### 3.5 `src/modules/`：业务模块

每个模块是一个自包含的功能域，内部可自由组织。

```
src/modules/
├── shell/                          # 应用外壳
│   ├── components/
│   │   ├── BottomNav.vue
│   │   └── PageFrame.vue
│   └── index.ts
├── discovery/                      # 发现：首页、分类、工具列表
│   ├── views/
│   │   ├── HomeView.vue
│   │   ├── CategoryView.vue
│   │   └── ToolListView.vue
│   ├── components/
│   │   └── ToolCard.vue
│   └── composables/
├── account/                        # 账户（待定，见 05 文档）
│   ├── views/
│   ├── stores/
│   ├── api/
│   └── index.ts
├── profile/                        # 个人中心
│   └── views/
├── tools/                          # 工具集
│   ├── registry.ts                 # 工具注册表（唯一数据源）
│   ├── types.ts                    # ToolManifest 类型
│   ├── btree/
│   │   ├── manifest.ts
│   │   ├── index.vue
│   │   ├── components/
│   │   ├── composables/
│   │   └── types.ts
│   ├── drum/
│   └── ...（其余工具同构）
└── external/                       # 外链聚合（todo/done/game/greeting）
```

### 3.6 分层依赖规则

```
modules/  ──依赖──>  shared/  ──依赖──>  design/
    │                   │
    └─────依赖─────> app/
```

**禁止的依赖方向**：

- `shared/` 不得 import `modules/`
- `design/` 不得 import 任何 TS 代码（纯 CSS）
- 模块之间不得直接互相 import；需要共享时下沉到 `shared/`

---

## 4. 雪藏 `lessonTable`

### 4.1 雪藏决策

课表模块的开发（无论旧版静态实现还是未完成的新版重写）全部暂停，整体移入归档区。

**雪藏理由**（据仓库现状推断，供确认）：

1. 旧版实现数据源依赖学校教务系统导出的特定 JSON 结构，通用性受限
2. 新版重写骨架已建立（13 个空文件）但迟迟未推进，长期占用结构位
3. 该模块与「通用工具合集」的产品定位耦合度最低，个人信息属性最强，涉及隐私数据处理

### 4.2 归档位置

```
zbyblq/
└── archive/
    ├── README.md                          # 归档区总说明
    └── lessonTable/
        ├── ARCHIVE_NOTE.md
        ├── legacy/                        # 原 public/lessonTable/ 静态实现
        │   ├── index.html
        │   ├── index.css
        │   ├── index.js
        │   ├── README.md
        │   └── 课表_2025-2026-1_230200400_20260322.json
        ├── integration/                   # 新版 iframe 外壳组件
        │   └── LessonTable.vue
        └── rewrite-wip/                   # 未完成的重写骨架
            ├── LESSON_TABLE_REWRITE.md
            ├── LessonTable.vue.new
            ├── defaultLessonTable.json
            ├── stores/lessonTable.ts
            ├── composable/lessonTable/index.ts
            ├── css/lessonTable.css
            └── components/                # 9 个空组件
```

实际归档 22 个文件。`integration/` 单列是因为 iframe 外壳属于**当前可用实现**，与「未完成的重写骨架」性质不同，恢复时的处理方式也不同。

**关键技术点**：归档目录必须放在**仓库根目录**的 `archive/`，而不是 `public/archive/`。

Vite 会把 `public/` 下的所有内容原样拷贝到 `dist/`。若归档在 `public/` 内，被雪藏的 104 KB 课表代码与 32.9 KB 个人课表数据仍会进入构建产物并部署上线——这既浪费体积，也存在个人数据泄露风险。放在根目录 `archive/` 则天然被排除在构建之外。

### 4.3 `ARCHIVE_NOTE.md` 应记录的内容

```markdown
# 归档说明：lessonTable

- 归档日期：2026-09-18
- 归档人：（待填）
- 雪藏原因：见 docs/01-refactor-structure.md §4.1
- 源码版本：public/lessonTable/ 移入前所在 commit（待填）

## 恢复步骤

1. 将 legacy/ 移回 public/lessonTable/
2. 将 rewrite-wip/ 各文件按原路径归位（见下表）
3. 在 tools/registry.ts 中恢复 lesson-table 条目
4. 在 public/defaultLessonTable.json 放入默认数据（当前为 0 字节）

## 原路径对照

| 归档位置 | 原路径 |
| --- | --- |
| rewrite-wip/stores/lessonTable.ts | src/stores/lessonTable.ts |
| rewrite-wip/composable/lessonTable/index.ts | src/composable/lessonTable/index.ts |
| ... | ... |
```

### 4.4 需同步摘除的引用

雪藏不是「移走文件」就结束，必须同时断开所有入口，否则会产生死链：

| 文件 | 操作 | 说明 |
| --- | --- | --- |
| `src/router/index.ts` | 删除 `lesson-table` 路由 | 含 import 与 routes 数组条目 |
| `src/composable/pages/PagesData.ts` | 删除 `lesson-table` 条目 | 工具元数据 |
| `src/composable/pages/PagePathManager.ts` | 删除 `lesson-table` 条目 | 随该文件整体处理，见 §5.3 |
| `public/mainpage/data/navItems.json` | 删除 `lesson-table` 条目 | 旧版导航，避免死链 |
| `src/views/pages/tools/LessonTable.vue` | 移入归档 | iframe 外壳 |
| `public/defaultLessonTable.json` | 移入归档 | 0 字节占位 |

### 4.5 移除后的影响检查

- 底部导航不含课表入口，无需改动
- 分类页由工具标签动态生成，条目减少后自动收敛
- 无其他模块依赖课表数据

---

## 5. 清理清单

### 5.1 0 字节占位文件（23 个）

**处置原则**：根目录的开发阶段记录类 md 与课表重写骨架随课表一并归档；其余无预留价值者直接删除。

| 文件 | 字节 | 处置 |
| --- | --- | --- |
| `BOTTOM_NAV_README.md` | 0 | 删除（底部导航已实现且稳定） |
| `PAGES_MIGRATION.md` | 0 | 删除（迁移状态并入 docs/） |
| `PROJECT_STATUS.md` | 0 | 删除（同上） |
| `SORT_PAGE_COMPLETE.md` | 0 | 删除（分类页已实现） |
| `LESSON_TABLE_REWRITE.md` | 0 | 归档至 `archive/lessonTable/` |
| `public/defaultLessonTable.json` | 0 | 归档 |
| `src/stores/lessonTable.ts` | 0 | 归档 |
| `src/composable/lessonTable/index.ts` | 0 | 归档 |
| `src/css/lessonTable.css` | 0 | 归档 |
| `src/views/pages/tools/LessonTable.vue.new` | 0 | 归档 |
| `src/views/pages/tools/components/*.vue`（9 个） | 0 | 归档 |
| `src/composable/components/base/main/BottomNavManager.example.ts` | 0 | 删除或补写 |
| `src/utils/notifications/QUICK_REFERENCE.ts` | 0 | 删除或补写 |
| `public/src/data_extraction/base.ts` | 0 | 删除（源码误入 public） |
| `public/btree/generate_tree.py` | 0 | 删除（空脚本，无引用） |

> 说明：`BottomNavManager.example.ts` 与 `QUICK_REFERENCE.ts` 属于「有明确用途但未写」的占位。要么补写内容，要么删除——保留 0 字节文件在任何情况下都无意义。

### 5.2 空目录（3 个）

| 目录 | 处置 |
| --- | --- |
| `src/assets/svg/` | 删除；图标资源统一到 `src/shared/icons/svg/`（见 04 文档） |
| `src/assets/` | 删除（其下仅 `svg/`） |
| `src/views/pages/test/` | 删除 |
| `src/pages/` | 删除（初始脚手架残留，从未使用） |

### 5.3 死代码

判定标准：文件存在且可被引用，但**全项目零引用**。

| 目标 | 处置 | 理由 |
| --- | --- | --- |
| `src/composable/pages/PagePathManager.ts` | 删除 | 定义了 iframe 路径映射但**全项目零引用**；融合迁移引入 manifest 机制后，该职责由工具注册表承接（见 02 文档） |
| `src/components/base/main/svg/*.svg`（3 个） | 删除 | `bottomNav.vue` 使用内联 SVG，三个独立文件为孤立资源；新图标体系建立后按 04 文档重建，不直接沿用 |

### 5.4 重复实现

| 目标 | 处置 |
| --- | --- |
| `public/codeContent/my-scriplets/english_font_transform/` | 保留 `public/eft/`（140 行实现，功能完整），删除该副本（27 行，功能残缺） |
| `public/functions/data/tags.js` | 删除，随数据源统一（§6） |

### 5.5 样式体系冲突（含一项非死代码的遗留样式）

当前存在两套并行的 CSS 变量体系：

| 来源 | 内容 | 冲突点 |
| --- | --- | --- |
| `src/style.css` | Vite 模板变量 | `--accent: #aa3bff` 紫色、`--bg` `--text` 命名 |
| `src/css/global.css` | 项目自建 | `--color-primary: #000000` 黑白体系 |

**重要更正**：`src/style.css` 在本文档早期版本中被归入 §5.3 死代码，该分类**不正确**。

实测结果：

- 它被 `src/main.ts` 第 4 行 `import './style.css'` **实际引用**，不是死代码
- 其定义的 14 个自定义属性（`--text`、`--accent`、`--sans` 等）经全库检索，**零处引用**
- 但它同时承载了以下**基线样式**，删除会立即造成视觉回归：
  - `:root { font: 18px/145% var(--sans); letter-spacing: 0.18px; color-scheme: light dark; }`
  - `h1, h2 { font-weight: 500; color: var(--text-h) }` 与 `h1 { font-size: 56px }`

**处置调整**：该文件的退役**推迟到阶段二**，与 `src/design/tokens/` 及 `base.css` 的就位同步进行。在替代品就绪前删除，属于「为了清理而制造回归」。

正确的分类是**遗留样式**而非死代码——它以错误的方式承担了正确职责。

---

## 6. 数据源统一

### 6.1 目标形态

以「每个工具自己声明自己」取代「中心文件罗列所有工具」。

**新增** `src/modules/tools/types.ts`：

```typescript
export interface ToolManifest {
  id: string
  title: string
  description: string
  icon: string                 // 图标名，非 emoji（见 04 文档）
  route: {
    path: string
    name: string
  }
  category: ToolCategory
  tags: string[]
  badge?: string
  status: 'active' | 'inactive' | 'archived'
  lifecycle: {
    created?: string
    updated?: string
  }
  entry: 'native' | 'iframe' | 'external'   // 迁移阶段标记
  externalUrl?: string
}
```

**每个工具** `src/modules/tools/<tool>/manifest.ts`：

```typescript
import type { ToolManifest } from '../types'

export const manifest: ToolManifest = {
  id: 'btree',
  title: '二叉树可视化',
  description: '输入层序遍历数组，自动生成可视化二叉树，支持保存为图片',
  icon: 'tree',
  route: { path: '/tools/btree', name: 'tool-btree' },
  category: 'algorithm',
  tags: ['算法', '工具'],
  status: 'active',
  lifecycle: { created: '2026-01-03', updated: '2026-01-03' },
  entry: 'iframe',
}
```

**注册表** `src/modules/tools/registry.ts` 聚合所有 manifest，路由表与分类页从此派生。

### 6.2 收益

| 项 | 现状 | 目标 |
| --- | --- | --- |
| 新增工具 | 改 3 个文件 | 新增 1 个目录 + 注册 |
| 路径定义 | 硬编码在 .vue 内 | manifest 单一来源 |
| 上下线工具 | 改 3 处 | 改 `status` 字段 |
| 迁移进度可见 | 无 | `entry` 字段直接统计 |
| 外链工具 | 不在数据内 | 统一用 `entry: 'external'` |

### 6.3 旧数据处置

| 文件 | 处置 |
| --- | --- |
| `public/mainpage/data/navItems.json` | 保留至旧版导航主页下线；融合完成后删除 |
| `public/functions/data/tags.js` | 立即删除（无引用） |

---

## 7. 命名与目录规范

### 7.1 命名规则

| 对象 | 规则 | 示例 |
| --- | --- | --- |
| 目录 | kebab-case | `img-to-ascii/` |
| Vue 组件文件 | PascalCase | `ToolCard.vue` |
| 其他 TS 文件 | kebab-case | `tool-registry.ts` |
| 样式文件 | kebab-case | `design-tokens.css` |
| 路由 path | kebab-case | `/tools/img-to-ascii` |
| 路由 name | `tool-<id>` | `tool-img-to-ascii` |
| 工具 id | kebab-case，无前缀 | `img-to-ascii` |

### 7.2 现存不合规项

| 现状 | 问题 | 目标 |
| --- | --- | --- |
| `Floyd–Steinberg/` | 使用 en dash（U+2013），非连字符；URL 编码后为 `%E2%80%93`，跨平台风险高 | `floyd-steinberg/` |
| `PathfindingVisualize/` | PascalCase | `pathfinding/` |
| `encryptionGraph/` | camelCase | `image-scramble/` |
| `sortviz/` | 缩写 | `sort-viz/` |
| `playPiano/` | 动词+名词 | `piano/` |
| `img2ascii/` | 数字替代单词 | `img-to-ascii/` |
| `colorVision/` | camelCase | `color-vision/` |
| `课表_2025-2026-1_230200400_20260322.json` | 中文文件名，且含学号 | 随课表归档 |

> 改名会改变 URL。融合迁移期间需保留旧路径重定向，或接受旧链接失效（考虑到是个人项目，建议后者）。

### 7.3 单工具目录内部规范

```
src/modules/tools/<tool>/
├── manifest.ts          # 必需：模块自声明
├── index.vue            # 必需：模块入口视图
├── components/          # 可选：私有组件
├── composables/         # 可选：私有逻辑
├── types.ts             # 可选：类型定义
└── assets/              # 可选：私有素材
```

---

## 8. 工程配置修正

| 项 | 现状 | 建议 |
| --- | --- | --- |
| `.gitignore` | 忽略 `.vscode/` 与 `android/` | `android/` 是 Capacitor 生成物，忽略合理；但需确认 CI 场景下是否需保留 `android/app/src/` 中的手改文件 |
| `archive/` | 不存在 | 新增后**不得**被 `.gitignore` 忽略，归档需要进版本库 |
| 路由模式 | `createWebHistory` | 静态托管需 history fallback；确认 `public/404.html` 已承担该职责，否则改用 `createWebHashHistory` |
| 认证守卫 | `router/index.ts` 中有 TODO | 见 05 文档 |
| 代码检查 | 无 lint 配置 | 建议引入 ESLint + Prettier；至少配置一条禁止 emoji 的自定义规则（见 04 文档 §6） |
| TypeScript | 三份 tsconfig | 配置合理，保留 |

---

## 9. 执行顺序

按依赖关系排序，每步可独立验证：

```
[1] 建立 archive/ 与归档说明                  [已完成 2026-09-18]
        │
[2] 雪藏 lessonTable（移文件 + 断引用）        [已完成 2026-09-18]
        │
[3] 删除死代码与 0 字节占位                    [已完成 2026-09-18]
        │
[4] 建立新目录骨架（app/design/shared/modules） [已完成 2026-09-18]
        │
[5] 迁移现有代码到新骨架（等价重构，不改行为）  [已完成 2026-09-18]
        │
[6] 引入 ToolManifest，替换三写数据源          [待执行]
        │
[7] 接入 design tokens（见 03 文档）           [已完成 2026-09-18]
        │
[8] 接入图标体系（见 04 文档）                 [已完成 2026-09-18]
        │
[9] 融合迁移旧工具（见 02 文档）               [待执行 - 阶段三]
        │
[10] 接入账户系统（见 05 文档）                [待执行 - 阶段四]
```

**关键约束**：步骤 4-5 必须是**等价重构**——只移动文件、调整 import，不改变任何运行时行为。这样一旦出错可以快速二分定位。

### 9.1 步骤 1-4 执行记录（2026-09-18）

| 项 | 结果 |
| --- | --- |
| 归档文件数 | 22 个 |
| 归档位置 | `archive/lessonTable/{legacy,integration,rewrite-wip}/` |
| 删除文件数 | 17 个 |
| 清理空目录 | 4 个 |
| 新建分层 | `src/{app,design,shared,modules}/` |
| 构建验证 | `npm run build` 通过 |
| 产物验证 | `dist/` 中已无课表相关文件 |

**执行中的两处发现**：

1. **文档计数有误，已校正**：0 字节文件实为 23 个（漏计 `public/btree/generate_tree.py`）；空目录实为 3 个（漏计 `src/pages/`）；重写骨架组件实为 9 个（原记 8 个）。
2. **`src/style.css` 的分类错误，已更正**：它被 `src/main.ts` 实际 import，不是死代码。虽其 14 个自定义属性零引用，但承载 `color-scheme`、`h1/h2` 字重与字号等基线样式，提前删除会造成视觉回归。已从 §5.3 移至 §5.5，退役时间推迟到阶段二。

**未删除但原计划删除的文件**：`src/style.css`（原因如上）。其余删除项均已执行。

**未跟踪文件的特殊处理**：`LESSON_TABLE_REWRITE.md`、`src/stores/lessonTable.ts` 等 7 项在归档前**尚未提交到 git**，删除即永久丢失，因此一律采用移动归档而非删除。

### 9.2 步骤 5 执行记录（2026-09-18）

| 项 | 结果 |
| --- | --- |
| 重命名文件 | 30 个，全部被 git 识别（R076 至 R100） |
| 新增文件 | 1 个（`modules/tools/index.ts`） |
| 修改文件 | 2 个（`App.vue`、`main.ts`，仅 import 行） |
| 退役旧目录 | 6 个（`views/` `composable/` `components/` `css/` `router/` `utils/`） |
| 构建验证 | 通过，CSS 产物体积与重构前一致 |

**等价性证明**（非仅依赖构建通过）：

- 5 个 CSS 文件与历史版本 SHA-256 逐字节相同
- 通知系统 7 个文件中 6 个逐字节相同，唯一改动的 `EXAMPLES.ts` 为 import 路径

**执行中的三处判断**：

1. **工具目录名沿用现有 tool id，未采用 §7.2 的简化名**。§7.2 提议改为 `btree`、`piano`、`pathfinding` 等，但改 id 会同时改动路由路径与 `PagesData` 数据契约，属步骤 6 范围。现保持**目录名 = 工具 id = 路由名**三者一致，该不变量带入步骤 6 更清晰。
2. **新增 `modules/tools/index.ts` 作为模块公开出口**。§3.6 规定「模块之间不得直接互相 import」，但 `discovery` 的 Manager 确需工具数据。若无可访问的公开出口，该规则无法执行。barrel 使 discovery 通过公开 API 访问，而不伸手进 `tools/data/` 内部。
3. **`router/index.ts` 原样搬移，未拆出 `guards/title.ts`**。拆 guard 属「新增结构」而非「移动文件」，违背步骤 5 的等价重构纪律。该工作与步骤 6 拆分 `routes.ts` 合并进行更自然。

**验证方法上的一次自纠**：首次等价性比对报告全部文件有差异，但 git 同时报告 `R100`（内容 100% 相同），二者矛盾。排查为 `core.autocrlf=true` 导致工作区为 CRLF、git 存储为 LF，是比对脚本漏做行尾规范化，非重构问题。规范化后重比方得上表结果。

---

## 10. 验收清单

- [ ] `archive/lessonTable/` 存在，且 `dist/` 构建产物中不含课表相关文件
- [ ] 全项目搜索 `lesson-table` 无残留引用
- [ ] 0 字节文件数量为 0
- [ ] `public/functions/data/tags.js` 已删除
- [ ] `src/composable/pages/PagePathManager.ts` 已删除
- [ ] `src/style.css` 已删除，无 `#aa3bff` 残留
- [ ] `archive/` 未被 `.gitignore` 忽略
- [ ] 新增工具只需创建一个目录 + 一行注册
- [ ] `npm run build` 通过，`vue-tsc` 无类型错误
