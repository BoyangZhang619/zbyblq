# 02 融合架构方案

- 文档定位：旧版静态工具并入新版架构的迁移范式与目标结构
- 前置阅读：`old_version_structure_analysis.md`、`01-refactor-structure.md`
- 约束：本轮只产出文档，不改动代码

---

## 1. 「融合」的定义

本项目同时存在两套代码：`public/` 下的旧版静态站点与 `src/` 下的新版 Vue 应用。当前二者通过 iframe 单向嵌套。

**融合**指：把旧版工具的代码与能力真正并入新版架构，使二者成为同一个应用，而非「应用里嵌页面」。

融合包含三个层面，必须按序完成：

| 层面 | 名称 | 内容 | 完成后 |
| --- | --- | --- | --- |
| L1 | 结构融合 | 工具代码归位到 `modules/tools/`，接入 manifest | 工具有了模块身份 |
| L2 | 逻辑融合 | 算法与业务逻辑提取为框架无关的 TS module | 逻辑可被任意视图复用 |
| L3 | 视觉融合 | 视图重写为 Vue 组件，套用设计系统 | 外观统一，可响应主题 |

只做 L1 是「搬家」，做完 L3 才是真融合。

---

## 2. 为什么要弃用 iframe

iframe 桥接是迁移期的正确选择（旧代码零改造、功能零中断），但不能作为终态。原因如下：

| 编号 | 问题 | 影响 |
| --- | --- | --- |
| P1 | **视觉无法统一** | iframe 内的样式与父文档完全隔离，设计系统的令牌无法继承。这是视觉重塑的硬阻断——不融合就永远做不到风格统一 |
| P2 | **重复加载** | 13 个工具 = 13 份独立 HTML 文档，各自重复加载字体、基础样式与公共脚本 |
| P3 | **路由不同步** | iframe 内部的页面跳转不会改变浏览器地址栏，前进/后退按钮行为异常，深链接失效 |
| P4 | **通信受限** | 跨文档通信需 `postMessage`，账户态、通知、主题切换难以同步到工具内部 |
| P5 | **移动端体验** | 滚动穿透、手势冲突、安全区（刘海/底部横条）适配在 iframe 中难以正确处理 |
| P6 | **原生打包风险** | Capacitor 打包后页面从 `file://` 或 `https://localhost` 加载，iframe 的 `src` 绝对路径与同源策略可能失效 |
| P7 | **无法按需加载** | iframe 无法参与 Vite 的代码分割，所有工具资源始终存在 |

其中 **P1 是决定性的**：`03-design-system.md` 描述的视觉重塑，在不融合的前提下无法落地。

---

## 3. 融合阶段模型

每个工具独立迁移，互不阻塞。四个阶段：

```
Stage 0         Stage 1         Stage 2         Stage 3         Stage 4
iframe 桥接  →  模块归位     →  逻辑提取     →  视图重写     →  旧目录下线
(现状)          (L1)            (L2)            (L3)            (清理)
```

### Stage 0：iframe 桥接（当前状态）

```vue
<!-- src/views/pages/tools/BTreeVisual.vue -->
<template>
  <div class="page-container">
    <iframe :src="`/btree/index.html`" class="page-iframe" frameborder="0" allowfullscreen />
  </div>
</template>
```

特征：`entry: 'iframe'`，路径硬编码，13 个组件完全相同。

### Stage 1：模块归位

建立模块目录，接入 manifest，**实现代码不变**。

```
src/modules/tools/btree/
├── manifest.ts          # 新增
├── index.vue            # 由 BTreeVisual.vue 移入，内容不变
└── legacy/              # 指向 public/btree/ 的过渡说明
```

此阶段收益：路径不再硬编码，manifest 的 `entry` 字段可以准确统计迁移进度。`PagePathManager.ts` 的职责由 manifest 承接，该文件可删除。

### Stage 2：逻辑提取

把旧版 `js/main.js` 中**与 DOM 无关的算法逻辑**提取为纯 TS module。

```
src/modules/tools/btree/
├── composables/
│   └── useTreeLayout.ts     # 从 public/btree/js/main.js 提取
├── types.ts                 # 提取过程中发现的类型契约
└── legacy/
```

**判定标准**：一个函数如果输入输出都是数据（不读写 DOM、不监听事件），就可以提取。

以 `public/btree/js/main.js` 为例，其中「层序数组 → 树结构 → 节点坐标」的计算部分与 DOM 无关，可直接迁移；而「把坐标画到 canvas」的部分与渲染方式绑定，留到 Stage 3 重写时处理。

此阶段收益：算法的可测试性、可复用性；视图重写时逻辑已经就绪。

### Stage 3：视图重写

用 Vue 组件重写界面，套用设计系统令牌与图标体系。

```
src/modules/tools/btree/
├── manifest.ts
├── index.vue                # 重写
├── components/
│   ├── TreeCanvas.vue
│   └── TreeControls.vue
├── composables/
│   └── useTreeLayout.ts
└── types.ts
```

**完成标志**：

- 组件内无裸色值 / 裸字号 / 裸间距，全部引用 `design/tokens/`
- 无 emoji，图标一律走 `AppIcon`（见 04 文档）
- 撤销/重置等通用交互走 `shared/ui/`
- 该工具在父文档内的路由、主题、通知均正常工作

### Stage 4：旧目录下线

删除 `public/<tool>/`，从 `.gitignore` 或构建流程中确认其不再被打包。

**安全前提**：Stage 3 已上线并验证通过，且旧目录已进入 git 历史。

---

## 4. 融合后的目标结构

### 4.1 工具模块解剖

```typescript
// src/modules/tools/btree/manifest.ts
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
  lifecycle: { created: '2026-01-03', updated: '2026-09-18' },
  entry: 'iframe',              // 迁移进度标记：iframe → native
}
```

### 4.2 融合完成后的全景

```
src/modules/tools/
├── registry.ts                     # 聚合全部 manifest，派生路由与分类
├── types.ts                        # ToolManifest 类型
│
├── btree/                          # 全部为 entry: 'native'
│   ├── manifest.ts
│   ├── index.vue
│   ├── components/
│   ├── composables/
│   └── types.ts
├── drum/
├── eft/
├── encryption-graph/
├── floyd-steinberg/
├── img-to-ascii/
├── kalimba/
├── pathfinding/
├── photo-patina/
├── piano/
├── pixelate/
├── sort-viz/
└── color-vision/                   # 原先未接入的工具补齐
```

`public/` 此时仅保留：

```
public/
├── imageContent/                   # 站点图标等
├── other/privacy.html              # 隐私政策（或用 Vue 重写）
└── 404.html
```

---

## 5. 逐工具迁移评估

依据旧版实现特征评估迁移工作量。难度为相对值。

| 工具 | 旧目录 | 旧实现特征 | 难度 | 关键工作 |
| --- | --- | --- | --- | --- |
| 字体转换 | `eft/` | 字符映射表，纯函数 | 低 | 映射表直接搬；UI 重写 |
| 像素化 | `pixelate/` | canvas 分块采样 | 低 | 采样算法提取为纯函数 |
| 二叉树 | `btree/` | 树布局计算 + canvas 绘制 | 中 | 布局算法与绘制分离 |
| 排序可视化 | `sortviz/` | 算法步进生成器 + 动画 | 中 | 生成器提取；动画循环改用 Vue 生命周期 |
| 路径寻找 | `PathfindingVisualize/` | 同上 | 中 | 同上 |
| 图片转字符 | `img2ascii/` | canvas 像素读取 + 字符映射 | 中 | 亮度映射纯函数化 |
| 抖动 | `Floyd–Steinberg/` | canvas 误差扩散 | 中 | 卷积核提取 |
| 包浆 | `photoPatina/` | canvas + JPEG 重编码 | 中 | 处理链路提取；注意导出流程 |
| 鼓机 | `drum/` | WebAudio 合成 + 步进编排 | 中 | 音频引擎提取为类 |
| 拇指琴 | `kalimba/` | WebAudio 合成 + 录制 | 中 | 同上 |
| 钢琴 | `playPiano/` | WebAudio + 曲谱 JSON | 中高 | 引擎 + 数据加载 |
| 图片混淆 | `encryptionGraph/` | 空间填充曲线 | 中高 | 曲线生成算法较复杂 |
| 色觉 | `colorVision/` | 未接入 | 待评估 | 需先确认功能定位 |

**共性结论**：难度的主要来源不是算法本身，而是**旧代码中算法与 DOM 的耦合程度**。旧版 `js/main.js` 普遍采用「查询 DOM 元素 → 绑定事件 → 直接操作样式」的写法，Stage 2 的提取工作本质是解耦。

**建议首迁目标**：`eft`（字体转换）。它是一个模块的完整样板，风险最低，可作为后续 12 个工具的范式验证。

---

## 6. 融合中的兼容策略

### 6.1 路径重定向

融合会改变 URL（如 `/tools/floyd-steinberg` 在目录改名后可能变化）。作为个人项目，建议**不做重定向**，接受旧链接失效——重定向机制的维护成本高于收益。

### 6.2 渐进共存

迁移期间同一条路由下可能同时存在新旧实现。建议通过 manifest 的 `entry` 字段控制：

```typescript
// 策略 A：不同路由共存（推荐）
// 旧：/tools/btree      → iframe
// 新：/tools/btree-next → native
// 验证通过后将新实现挪正，删除旧路由

// 策略 B：特性开关
// 通过 UI store 中的 debug 开关在新旧实现间切换
```

推荐策略 A：用户可见的路径保持稳定，开发期新实现挂在临时路径上。

### 6.3 数据迁移

部分工具在旧版中把数据存在 `localStorage`。融合时需注意：

| 工具 | 存储内容 | 迁移处理 |
| --- | --- | --- |
| 课表 | 已雪藏 | 不迁移 |
| 其他工具 | 需逐个排查 `localStorage` 使用 | 若 key 命名变化，需读取旧 key 后写入新 key |

建议在融合前对每个工具执行一次 `localStorage` 使用扫描，形成清单。

---

## 7. 与账户系统的衔接

融合到 Stage 3 后，工具成为应用的一部分，可以自然地接入账户能力（见 `05-account-system.md`）：

| 能力 | iframe 阶段 | 融合后 |
| --- | --- | --- |
| 识别当前用户 | 需 postMessage 传递 | 直接读 authStore |
| 云端同步配置 | 需自建通信 | 调用统一 API 层 |
| 工具使用记录 | 无法采集 | 直接埋点 |

**因此，账户系统的完整体验依赖融合进度**。在融合完成前，账户系统只能覆盖外壳部分（个人中心、设置）。

---

## 8. 执行顺序

```
[1] 完成 01 文档的结构重构（骨架就位）
        │
[2] 建立 tools/types.ts 与 registry.ts
        │
[3] 全部 13 个工具执行 Stage 1（模块归位，实现不变）
        │    └─ 验证：功能与现状完全一致
        │
[4] 选定 eft 执行 Stage 2 + Stage 3，形成范式样板
        │    └─ 验证：视觉统一、功能对等
        │
[5] 按难度从低到高逐个推进其余工具
        │
[6] 每个工具 Stage 3 验收通过后立即执行 Stage 4
```

**关键纪律**：Stage 1 必须是纯搬运。若在归位过程中顺手改代码，一旦出问题将无法区分是「搬家搬坏了」还是「改动引入的」。

---

## 9. 验收清单

- [ ] `registry.ts` 能聚合全部 manifest，路由表由其派生
- [ ] 每个工具的 `entry` 字段反映真实施工状态
- [ ] Stage 3 完成的工具，其组件内无裸样式值
- [ ] Stage 3 完成的工具，主题切换可正常响应
- [ ] Stage 4 完成后，`public/<tool>/` 目录已删除且不再进入构建产物
- [ ] 全站无 iframe 嵌套自有内容（仅允许嵌入第三方外链）
- [ ] `dist/` 体积相较现状有可测量的下降
