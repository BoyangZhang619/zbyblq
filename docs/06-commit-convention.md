# 06 提交信息规范

- 文档定位：Git 提交信息的格式要求与操作约定
- 适用范围：本仓库全部分支
- 约束：无 emoji

---

## 1. 目的

本规范要解决三个已发生的问题：

| 问题 | 实例 | 后果 |
| --- | --- | --- |
| 信息缺失 | `0e0291a 初始化init`、`2cbb00c 添加底部栏` | 无法从历史判断改动范围 |
| 信息污染 | `dfe3080`、`eb538cb` | 提交信息是 `git status` 的输出，完全是噪音 |
| 无类型标识 | 全部历史提交 | 无法按改动性质筛选，重构与功能开发混在一条时间线上 |

同时保留现有历史中做得好的部分——中文、动词开头、说明效果，例如：

```
新增学习日志标签，记录用户学习过程，优化标签管理
优化 index.html 文件的缩进格式，提升代码可读性
```

---

## 2. 格式总览

```
<type>(<scope>): <subject>

<body>

<footer>
```

| 部分 | 必需 | 说明 |
| --- | --- | --- |
| `type` | 是 | 改动性质，见 §3 |
| `scope` | 否 | 影响范围，见 §4 |
| `subject` | 是 | 主题行，见 §5 |
| `body` | 否 | 正文，见 §6 |
| `footer` | 否 | 脚注，见 §7 |

**最小可用形式**：

```
fix(router): 修复 iframe 路径硬编码导致子页 404
```

**完整形式**：

```
chore(archive): 雪藏 lessonTable 模块

该模块数据源依赖特定教务系统的导出格式，通用性受限，且新版重写
长期未推进。整体移入 archive/lessonTable/。

归档而非删除：重写骨架的 7 个文件在归档前尚未提交到 git。

Refs: docs/01-refactor-structure.md §4
```

---

## 3. type 类型

采用业界通行的类型集合，便于工具解析。

| type | 含义 | 判断标准 |
| --- | --- | --- |
| `feat` | 新增功能 | 用户能感知到新能力 |
| `fix` | 修复缺陷 | 修正了错误行为 |
| `refactor` | 重构 | **不改变外部行为**，只调整结构 |
| `style` | 样式调整 | 视觉、配色、排版，不影响逻辑 |
| `docs` | 文档 | 只改 `.md` 或注释 |
| `chore` | 杂务 | 构建、依赖、配置、归档、清理 |
| `perf` | 性能优化 | 可测量的性能提升 |
| `revert` | 回滚 | 撤销此前的提交 |

**易混淆的三个**：

| 场景 | 正确 type | 理由 |
| --- | --- | --- |
| 移动文件、调整 import，功能不变 | `refactor` | 外部行为未变 |
| 改 CSS 变量、换配色 | `style` | 不影响逻辑 |
| 删死代码、删无用文件 | `chore` | 不产生新能力，也不是重构 |

**`chore` 是兜底类型，但要带 scope 说明性质**：`chore(archive)`、`chore(cleanup)`、`chore(deps)`。

---

## 4. scope 范围

可选。指明改动落在哪一块，用小写英文。

### 4.1 按分层与模块

| scope | 对应 |
| --- | --- |
| `shell` | 应用外壳：底部导航、页面框架 |
| `discovery` | 首页、分类、工具列表 |
| `account` | 账户与鉴权 |
| `profile` | 个人中心 |
| `design` | 设计令牌与主题 |
| `icons` | 图标体系 |
| `tools` | 工具模块整体 |
| `router` | 路由与守卫 |
| `notifications` | 通知系统 |

### 4.2 按具体工具

工具相关的改动直接用工具 id：

```
feat(btree): 树布局算法提取为独立 composable
fix(piano): 修复曲谱循环播放时最后一拍被截断
refactor(drum): 音频引擎与视图解耦
```

### 4.3 按杂务性质

```
chore(archive): 雪藏 lessonTable 模块
chore(cleanup): 删除死代码与 0 字节占位文件
chore(structure): 建立四层目录骨架
chore(deps): 升级 vite 至 8.0.10
chore(build): 将 emoji 检测接入构建流程
```

### 4.4 跨范围改动

当一次改动影响多个范围，**优先拆分提交**（见 §9）。确实无法拆分时省略 scope：

```
refactor: 迁移现有代码到 app/design/shared/modules 新骨架
```

---

## 5. subject 主题行

### 5.1 规则

| 项 | 要求 |
| --- | --- |
| 语言 | 中文 |
| 开头 | 动词，见 §5.2 动词表 |
| 长度 | 不超过 50 字 |
| 结尾 | 不加句号 |
| 内容 | 说明**做了什么**；效果细节放正文 |
| 大小写 | 中文无此问题；含英文标识符时保持原样 |

### 5.2 推荐动词

| 动词 | 适用 |
| --- | --- |
| 新增 | 添加功能或文件 |
| 优化 | 改善已有实现的体验或性能 |
| 修复 | 修正错误 |
| 调整 | 改动配置或参数 |
| 移除 | 删除功能或文件 |
| 归档 | 移入 `archive/` |
| 清理 | 删除无用内容 |
| 重命名 | 改名或移动 |
| 提取 | 把逻辑抽成独立单元 |
| 迁移 | 从旧结构搬到新结构 |

### 5.3 反例

| 反例 | 问题 |
| --- | --- |
| `update` | 无信息量 |
| `修改` | 无信息量 |
| `fix bug` | 未说明是什么 bug |
| `更新一下` | 无信息量 |
| `添加了通知的行为` | 未说明通知的什么行为；「了」是冗余口语 |
| `<粘贴 git status 输出>` | 见 §11.1 |

---

## 6. body 正文

可选。**当主题行无法说清「为什么」时必须写。**

### 6.1 规则

| 项 | 要求 |
| --- | --- |
| 内容 | 说明**为什么这么改**，而非「改了什么」 |
| 理由 | 改了什么，diff 已经写得很清楚；为什么改，只有提交信息能记录 |
| 换行 | 每行不超过 72 字符 |
| 形式 | 段落或 `-` 列表 |
| 与主题行 | 空一行分隔 |

### 6.2 值得写进正文的信息

- 决策理由（为什么选 A 不选 B）
- 副作用与影响范围
- 未做的事及原因
- 与设计文档的关联
- 已知限制

### 6.3 示例

**不佳**——只重复了主题行：

```
chore(archive): 雪藏 lessonTable 模块

移除了 lessonTable 相关的文件，并断开了引用。
```

**良好**——解释了决策与副作用：

```
chore(archive): 雪藏 lessonTable 模块

该模块数据源依赖特定教务系统的导出格式，通用性受限，且新版重写
长期未推进，占用结构位。

归档而非删除：重写骨架的 7 个文件在归档前尚未提交到 git，删除即
永久丢失。归档目录放在仓库根而非 public/ 下，否则仍会被 Vite
打进构建产物。

附带效果：dist/ 不再包含 32.9 KB 的含学号课表数据。
```

---

## 7. footer 脚注

### 7.1 文档关联

本仓库的结构改动均有设计文档支撑，提交时应关联：

```
Refs: docs/01-refactor-structure.md §9 步骤 1-4
```

格式：`Refs: <文件路径> §<章节>`

**价值**：日后翻历史时，能直接从提交跳到当初的设计依据，而不是猜测为什么这么改。

### 7.2 破坏性变更

接口、数据结构、路由路径的破坏性改动：

```
BREAKING CHANGE: ToolManifest.icon 字段由 emoji 字符改为图标名，
消费该字段的组件需同步修改。
```

---

## 8. 完整示例

### 8.1 文档

```
docs: 补充结构分析与四方向重构方案

新增 docs/ 文档集，覆盖现状认知、工程结构、新旧融合、视觉语言、
图标资源、用户体系六个方向。每份文档附决策台账与验收清单。

明确归档区规范：archive/ 必须位于仓库根目录而非 public/ 下，
否则被雪藏内容仍会随 Vite 构建进入产物。

Refs: docs/README.md
```

### 8.2 归档

```
chore(archive): 雪藏 lessonTable 模块

数据源依赖特定教务系统导出格式，通用性受限，且新版重写长期未推进。
整体移入 archive/lessonTable/，同时断开路由、工具元数据与旧版导航
三处引用。

归档而非删除：重写骨架的 7 个文件在归档前尚未提交到 git。

附带效果：dist/ 不再包含 32.9 KB 的含学号课表数据。

Refs: docs/01-refactor-structure.md §4
```

### 8.3 清理

```
chore(cleanup): 删除死代码与 0 字节占位文件

- PagePathManager.ts：定义了 iframe 路径映射但全项目零引用
- 3 个孤立 svg：bottomNav.vue 实际使用内联 SVG
- tags.js：与 navItems.json 重复的数据源
- english_font_transform：与 eft/ 功能重复且实现残缺
- 16 个 0 字节文件、4 个空目录

未删除 src/style.css：它被 main.ts 实际 import，且承载 color-scheme
与标题字重等基线样式，提前删除会造成视觉回归。其退役推迟到设计
令牌就位后。

Refs: docs/01-refactor-structure.md §5
```

### 8.4 结构

```
chore(structure): 建立 app/design/shared/modules 四层目录骨架

按功能域而非文件类型分层，为后续融合迁移与账户系统预留结构位。
每层附 README 说明职责与依赖规则。

依赖方向：modules -> shared -> design，禁止反向依赖与模块间互引。

Refs: docs/01-refactor-structure.md §3
```

### 8.5 功能

```
feat(eft): 字体转换模块迁移为原生实现

将 iframe 桥接改为原生 Vue 组件，接入设计令牌与图标体系。
字符映射表提取为纯函数模块，视图层只负责交互。

作为 13 个工具融合迁移的范式样板，后续工具按此模式推进。

Refs: docs/02-fusion-architecture.md §3
```

### 8.6 修复

```
fix(router): 修复深层链接刷新后 404

createWebHistory 模式下静态托管缺少 history fallback。补齐
404.html 的转发逻辑，并确认 Capacitor 打包后的 file:// 协议
不受影响。
```

---

## 9. 提交粒度

### 9.1 原则

**一个提交 = 一个可独立回滚的逻辑单元。**

判断方法：假设要撤销这次改动，是否有部分是你想保留的？如果有，就该拆成多个提交。

### 9.2 应当拆分

| 场景 | 拆分方式 |
| --- | --- |
| 改了功能，又顺手格式化了整个文件 | 拆成两个：`style` + `feat` |
| 新增模块，同时升级了依赖 | 拆成两个：`chore(deps)` + `feat` |
| 文档与代码一起改 | 优先拆，文档可独立回滚 |

### 9.3 不必拆分

- 同一次重构中移动多个文件
- 一次清理中删除多个无用文件
- 一个功能的多次小改动（尚未推送时）

### 9.4 避免的做法

| 做法 | 问题 |
| --- | --- |
| 攒一周再提交一次 | 无法二分定位问题 |
| 每改一行提交一次 | 历史噪音 |
| `wip`、`临时提交` | 推送前必须 squash |

---

## 10. 提交前检查

每次提交前确认：

- [ ] `npm run build` 通过
- [ ] `vue-tsc` 无类型错误（已包含在 build 中）
- [ ] 改动内容中无 emoji（见 `docs/04-icon-system.md` §6）
- [ ] 未提交 `node_modules/`、`dist/`、`.vscode/` 等忽略项
- [ ] **未把 `git status` 输出当作提交信息**（见 §11.1）
- [ ] 提交信息符合本规范

**建议的提交方式**：始终使用 `git commit -m`，不要使用裸 `git commit` 打开编辑器。

若需多行信息：

```bash
git commit -m "type(scope): 主题行" -m "正文段落" -m "Refs: docs/xxx.md"
```

或用 heredoc（Bash）：

```bash
git commit -F- <<'EOF'
type(scope): 主题行

正文。

Refs: docs/xxx.md
EOF
```

---

## 11. 禁止事项

### 11.1 禁止把 `git status` 输出作为提交信息

**本仓库已发生两次**：

```
dfe3080 	new file:   lessonTable/README.md 	new file:   lessonTable/index.css ...
eb538cb 	modified:   functions/data/tags.js
```

成因：执行裸 `git commit` 时编辑器被打开，保存了默认的注释内容。

**防御**：

1. 永远使用 `git commit -m "..."`
2. 若编辑器已被打开且内容为空或为默认注释，**清空后再写**，不要直接保存
3. 建议配置提交信息模板：

```bash
git config commit.template .gitmessage
```

配合 `.gitmessage` 文件：

```
# <type>(<scope>): <subject>
# type: feat | fix | refactor | style | docs | chore | perf | revert
# 详见 docs/06-commit-convention.md
#
# 以 # 开头的行会被忽略
```

### 11.2 禁止无信息量的信息

`update`、`修改`、`fix bug`、`更新一下`、`小改动`。

### 11.3 禁止 emoji

与全站约束一致（见 `docs/04-icon-system.md`）。提交信息中不使用 emoji 表达状态，改用 `[OK]` 一类文本标记。

### 11.4 禁止在提交信息中泄露敏感信息

本仓库曾包含真实学号（`课表_2025-2026-1_230200400_20260322.json`）。撰写提交信息时，不要复述文件中的个人信息、令牌、密码。

---

## 12. 现状：阶段一的提交建议

阶段一（归档 + 清理 + 建骨架）已执行完毕，改动如下：

| 类别 | 数量 |
| --- | --- |
| 删除 | 16 个文件 |
| 移动归档 | 6 个文件（git 已识别为重命名） |
| 修改 | 3 个文件（断开引用） |
| 新增未跟踪 | `docs/`、`archive/`、`src/{app,design,shared,modules}/` |

### 12.1 推荐方案：拆为 4 个提交

理由：四个部分可独立回滚。「不想要新骨架」不应导致「归档也被撤销」。

**步骤 0：清空暂存区（保留工作区改动）**

```bash
git reset
```

**步骤 1：文档**

```bash
git add docs/
git commit -F- <<'EOF'
docs: 补充结构分析与四方向重构方案

新增 docs/ 文档集，覆盖现状认知、工程结构、新旧融合、视觉语言、
图标资源、用户体系六个方向。每份文档附决策台账与验收清单。

明确归档区规范：archive/ 必须位于仓库根目录而非 public/ 下，
否则被雪藏内容仍会随 Vite 构建进入产物。

Refs: docs/README.md
EOF
```

**步骤 2：归档 lessonTable（含引用断开）**

```bash
git add -A archive/ public/lessonTable/ src/views/pages/tools/LessonTable.vue
git add src/router/index.ts src/composable/pages/PagesData.ts public/mainpage/data/navItems.json
git commit -F- <<'EOF'
chore(archive): 雪藏 lessonTable 模块

数据源依赖特定教务系统导出格式，通用性受限，且新版重写长期未推进。
整体移入 archive/lessonTable/，同时断开路由、工具元数据与旧版导航
三处引用。

归档而非删除：重写骨架的 7 个文件在归档前尚未提交到 git，删除即
永久丢失。

附带效果：dist/ 不再包含 32.9 KB 的含学号课表数据。

Refs: docs/01-refactor-structure.md §4
EOF
```

**步骤 3：新骨架**

```bash
git add src/app/ src/design/ src/shared/ src/modules/
git commit -F- <<'EOF'
chore(structure): 建立 app/design/shared/modules 四层目录骨架

按功能域而非文件类型分层，为后续融合迁移与账户系统预留结构位。
每层附 README 说明职责与依赖规则。

依赖方向：modules -> shared -> design，禁止反向依赖与模块间互引。

Refs: docs/01-refactor-structure.md §3
EOF
```

**步骤 4：清理**

此时工作区中剩余的改动恰好只有删除项，`git add -A` 是安全的。

```bash
git add -A
git commit -F- <<'EOF'
chore(cleanup): 删除死代码与 0 字节占位文件

- PagePathManager.ts：定义了 iframe 路径映射但全项目零引用
- 3 个孤立 svg：bottomNav.vue 实际使用内联 SVG
- tags.js：与 navItems.json 重复的数据源
- english_font_transform：与 eft/ 功能重复且实现残缺
- 16 个 0 字节文件、4 个空目录

未删除 src/style.css：它被 main.ts 实际 import，且承载 color-scheme
与标题字重等基线样式，提前删除会造成视觉回归。其退役推迟到设计
令牌就位后。

Refs: docs/01-refactor-structure.md §5
EOF
```

**顺序说明**：把「清理」放在最后，是为了让它能吃下 `git add -A`。若按逻辑顺序（清理在骨架前）提交，则 `git add -A` 会把新骨架一并纳入清理提交，需要用显式路径逐个添加删除项——可行但易错。

### 12.2 替代方案：单个提交

如果不想拆：

```bash
git add -A
git commit -F- <<'EOF'
chore: 执行结构重构阶段一：归档、清理与骨架建立

- 归档 lessonTable 至 archive/，断开全部引用
- 删除死代码与 0 字节占位文件
- 建立 app/design/shared/modules 四层目录骨架
- 新增 docs/ 文档集

详见 docs/01-refactor-structure.md §9.1 执行记录。

Refs: docs/01-refactor-structure.md §9
EOF
```

**代价**：无法单独回滚某一部分。

### 12.3 提交后验证

```bash
git log --oneline -5
git status          # 应为 clean
npm run build       # 应通过
```

---

## 13. 历史提交回顾

现有提交中值得保留的写法：

| 提交 | 评价 |
| --- | --- |
| `新增学习日志标签，记录用户学习过程，优化标签管理` | 动词开头，说明了对象与效果 |
| `优化 index.html 文件的缩进格式，提升代码可读性` | 说明了改动与收益 |
| `新增图表横向缩放功能，优化用户数据可视化体验` | 具体、可读 |

需要改进的写法：

| 提交 | 问题 |
| --- | --- |
| `初始化init` | 中英混用冗余 |
| `添加底部栏` | 略简，未说明是底部导航 |
| `换个位置` | 无信息量 |
| `dfe3080`、`eb538cb` | 提交信息为 `git status` 输出 |
| `添加了通知的行为` | 口语化，未说明具体行为 |

**不重写历史**。已推送的提交保持原样，新规范自下次提交起适用。
