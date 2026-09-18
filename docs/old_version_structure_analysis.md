# 旧版本结构分析

- 分析对象：`D:\gitLocal\zbyblq`
- 分析时间：2026-09-18
- 分析范围：仓库根目录、`src/`、`public/`（排除 `node_modules/`、`dist/`、`android/build/`、`android/.gradle/`）

---

## 1. 项目定位

`zbyblq` 是一个个人 Web 工具合集项目，当前处于**两代版本并存**的迁移过渡期：

| 代号 | 形态 | 载体 | 状态 |
| --- | --- | --- | --- |
| 旧版本 (Gen 1) | 纯静态多页站点 | `public/` 目录 | 完整可用，被新版本以 iframe 方式复用 |
| 新版本 (Gen 2) | Vue 3 SPA | `src/` 目录 | 迁移中，仅外层壳完成 |

项目最终目标是打包为 Android 应用（Capacitor，appId 为 `xin.zbyblq`）。

---

## 2. 仓库根目录结构

```
zbyblq/
├── .vscode/                    # 编辑器配置（已被 .gitignore 忽略）
├── android/                    # Capacitor 生成的 Android 原生工程（已 gitignore）
├── dist/                       # Vite 构建输出（已 gitignore）
├── docs/                       # 本次新建的文档目录
│   └── old_version_structure_analysis.md
├── node_modules/               # 依赖（已 gitignore）
├── public/                     # [旧版本主体] 静态资源根，原样拷贝到构建产物
├── src/                        # [新版本主体] Vue 3 源码
├── index.html                  # Vite SPA 入口 HTML
├── package.json                # 依赖与脚本
├── vite.config.ts              # Vite 配置（含 @ 别名指向 src）
├── capacitor.config.ts         # Capacitor 配置
├── tsconfig.json               # TS 配置入口
├── tsconfig.app.json           # 应用侧 TS 配置
├── tsconfig.node.json          # Node 侧 TS 配置
├── README.md                   # 项目说明（38 字节）
└── *.md                        # 5 个 0 字节占位文档（详见 6.1）
```

### 2.1 技术栈

| 层 | 选型 | 版本 |
| --- | --- | --- |
| 框架 | Vue | ^3.5.32 |
| 路由 | vue-router | ^5.0.6 |
| 状态 | pinia | ^3.0.4 |
| 构建 | Vite | ^8.0.10 |
| 语言 | TypeScript | ~6.0.2 |
| 类型检查 | vue-tsc | ^3.2.7 |
| 原生封装 | @capacitor/android | ^8.3.1 |
| 本地通知 | @capacitor/local-notifications | ^8.0.2 |

### 2.2 npm 脚本

```json
{
  "dev": "vite",
  "build": "vue-tsc -b && vite build",
  "preview": "vite preview"
}
```

---

## 3. 新版本结构：`src/`

### 3.1 目录树

```
src/
├── main.ts                              # 应用入口：挂载 Pinia + Router
├── App.vue                              # 根组件：router-view + 条件渲染 BottomNav
├── style.css                            # Vite 默认模板样式（298 行，与新设计体系冲突）
├── assets/
│   └── svg/                             # [空目录]
├── components/
│   └── base/main/
│       ├── bottomNav.vue                # 底部导航组件（106 行）
│       └── svg/                         # home.svg / sort.svg / profile.svg（未被引用）
├── composable/
│   ├── components/base/main/
│   │   ├── BottomNavManager.ts          # 底部导航状态管理类
│   │   └── BottomNavManager.example.ts  # [0 字节]
│   ├── lessonTable/
│   │   └── index.ts                     # [0 字节，课表重写预留]
│   └── pages/
│       ├── PagesData.ts                 # 工具页元数据总表（13 条 NavItem）
│       ├── PagePathManager.ts           # iframe 路径映射表（当前无人引用）
│       ├── CategoryManager.ts           # 按标签聚合分类
│       └── ToolListManager.ts           # 工具列表筛选与排序
├── css/
│   ├── global.css                       # 全局 CSS 变量（黑白主题 + 暗色模式）
│   ├── lessonTable.css                  # [0 字节，课表重写预留]
│   ├── components/base/main/bottomNav.css
│   └── views/
│       ├── sort.css                     # 分类页样式
│       ├── toolList.css                 # 工具列表样式
│       └── pages/tools/pages.css        # iframe 容器样式
├── router/
│   └── index.ts                         # 路由表（3 主页面 + 13 工具页）
├── stores/
│   └── lessonTable.ts                   # [0 字节，课表重写预留]
├── utils/
│   └── notifications/                   # 通知系统（唯一完整的新功能模块）
│       ├── NotificationManager.ts       # 核心管理器（752 行）
│       ├── helpers.ts                   # 模板/快捷方法/构建器（468 行）
│       ├── Interceptors.ts              # 9 种拦截器（358 行）
│       ├── types.ts                     # 类型定义（243 行）
│       ├── EXAMPLES.ts                  # 使用示例（434 行）
│       ├── README.md                    # 模块文档
│       ├── index.ts                     # 导出入口
│       └── QUICK_REFERENCE.ts           # [0 字节]
└── views/
    ├── home.vue                         # 主页（当前是通知系统演示页，676 行）
    ├── sort.vue                         # 分类页（含分类浏览 / 工具列表双模式）
    ├── profile.vue                      # 个人中心（空壳）
    └── pages/
        ├── test/                        # [空目录]
        └── tools/
            ├── BTreeVisual.vue          # ┐
            ├── DrumPad.vue              # │
            ├── EftTool.vue              # │
            ├── EncryptionGraph.vue      # │
            ├── FloydSteinberg.vue       # │
            ├── Img2Ascii.vue            # │ 全部为 17 行的
            ├── Kalimba.vue              # ├ iframe 外壳组件
            ├── LessonTable.vue          # │
            ├── PathfindingVisualize.vue # │
            ├── PhotoPatina.vue          # │
            ├── PianoKeys.vue            # │
            ├── Pixelate.vue             # │
            ├── SortViz.vue              # ┘
            ├── LessonTable.vue.new      # [0 字节，课表重写预留]
            └── components/              # [8 个 0 字节 Vue 文件，课表重写预留]
                ├── InfoCard.vue
                ├── LessonCell.vue
                ├── LessonTableControls.vue
                ├── LessonTableDay.vue
                ├── LessonTableHeader.vue
                ├── LessonTableInfo.vue
                ├── LessonTableStats.vue
                ├── LessonTableWeek.vue
                └── StatCard.vue
```

### 3.2 路由表

| name | path | 组件 | meta.title |
| --- | --- | --- | --- |
| （重定向） | `/` | → `/home` | - |
| home | `/home` | home.vue | 主页 |
| sort | `/sort` | sort.vue | 分类 |
| profile | `/profile` | profile.vue | 个人中心 |
| btree-visual | `/tools/btree-visual` | BTreeVisual.vue | 二叉树可视化 |
| eft-tool | `/tools/eft-tool` | EftTool.vue | 英文字体转换 |
| encryption-graph | `/tools/encryption-graph` | EncryptionGraph.vue | 图片混淆 |
| drum-pad | `/tools/drum-pad` | DrumPad.vue | Drum Pad 鼓机 |
| kalimba | `/tools/kalimba` | Kalimba.vue | Kalimba 拇指琴 |
| sort-viz | `/tools/sort-viz` | SortViz.vue | 排序算法可视化 |
| img2ascii | `/tools/img2ascii` | Img2Ascii.vue | 图片转 ASCII |
| pixelate | `/tools/pixelate` | Pixelate.vue | 图片转像素化 |
| floyd-steinberg | `/tools/floyd-steinberg` | FloydSteinberg.vue | Dithering |
| pathfinding-visualize | `/tools/pathfinding-visualize` | PathfindingVisualize.vue | 路径寻找可视化 |
| photo-patina | `/tools/photo-patina` | PhotoPatina.vue | 电子包浆 |
| piano-keys | `/tools/piano-keys` | PianoKeys.vue | Piano Keys |
| lesson-table | `/tools/lesson-table` | LessonTable.vue | 课程表 |

路由使用 `createWebHistory`（非 hash 模式），配置了 `beforeEach` 守卫用于写入 `document.title`。

### 3.3 关键设计模式

**模式 A：Manager 类 + 组件持有实例**

CLI 风格的管理类（`BottomNavManager`、`CategoryManager`、`ToolListManager`）封装数据操作，Vue 组件中以 `ref(new XxxManager())` 方式持有。这是新版本的主要组织方式。

**模式 B：配置数据与视图分离**

`PagesData.ts` 是工具页的**单一数据源**，集中定义 13 个工具的 id / href / icon / title / desc / tags / badge / 状态 / 时间。`CategoryManager` 与 `ToolListManager` 均从它派生。

**模式 C：样式外置**

Vue 组件大多 `<style scoped>@import '@/css/...'</style>`，把 CSS 集中在 `src/css/` 而非组件内。

### 3.4 新旧衔接方式：iframe 桥接

13 个工具页的 Vue 组件结构完全一致，均为 17 行：

```vue
<template>
  <div class="page-container">
    <iframe :src="`/<旧目录>/index.html`" class="page-iframe" frameborder="0" allowfullscreen />
  </div>
</template>
<script setup lang="ts"></script>
<style scoped>@import '@/css/views/pages/tools/pages.css';</style>
```

对应的 commit 信息为「暂时使用 iframe 来导向所有子页」，说明这是过渡方案。

---

## 4. 旧版本主体：`public/` 目录详解

`public/` 是 Vite 的静态资源目录，构建时**原样拷贝**到 `dist/` 根。它保留了完整的旧版静态站点，共 **91 个文件**，体积分布如下：

```
296K  birthday/          cS/            76K
176K  codeContent/       colorVision/   68K
104K  lessonTable/       functions/     12K
 96K  mainpage/          eft/ etc.      20K-36K each
 80K  imageContent/
```

### 4.1 顶层入口

| 文件 | 说明 |
| --- | --- |
| `index.html` | 旧版导航主页。标题为数学斜体字形的 `I'M NOT A TITLE`。引用 `mainpage/css/main.css` 与 `mainpage/js/main.js`；`overlay.css` 与 `overlay.js` 的引用被注释掉 |
| `404.html` | 25 KB 的自定义 404 页（GitHub Pages 约定） |
| `README.md` | 旧版项目说明，含在线地址与目录速览 |
| `.gitignore` | public 目录级忽略规则 |
| `0758ec947146220c72cc9b0fb04313c3.txt` | 40 字节的站点校验文件（疑似搜索引擎/平台验证） |
| `defaultLessonTable.json` | **0 字节**，新课表功能预留的默认数据 |
| `mainpage/` | 导航主页子系统（见 4.2） |

### 4.2 `mainpage/`：导航主页子系统

这是旧版本的**中枢**，与新版 `src/composable/pages/` 职责对应。

```
mainpage/
├── css/
│   ├── main.css        11.8K  主样式（卡片列表、标签筛选、主题变量）
│   ├── cursor.css       4.2K  自定义光标样式
│   └── overlay.css      1.0K  遮罩层样式（当前未被引用）
├── data/
│   ├── navItems.json    7.7K  导航卡片数据源，18 条记录
│   └── theme.json       1.1K  主题令牌：theme / typography / layout 三组
└── js/
    ├── main.js         21.8K  导航系统核心
    ├── overlay.js      18.1K  遮罩层逻辑（当前未被引用）
    ├── cursor.js        8.5K  自定义光标
    └── fullScreen.js    3.2K  全屏辅助
```

**`main.js` 架构**：以全局对象 `NavSystem` 组织，属性分四组：

| 分组 | 职责 |
| --- | --- |
| `paths` | 声明 `navItems.json` 与 `theme.json` 的相对路径 |
| `data` | 运行期缓存 navItems / theme / settings |
| `state` | 标签筛选状态：`activeTag` / `tags` / `tagCounts` |
| `init()` | 并行 fetch 两个 JSON → 应用主题 → 从数据提取标签 → 读 URL 初始化标签 → 渲染标签筛选 → 渲染卡片 |

主题落 localStorage，未选择时跟随系统 `prefers-color-scheme`。卡片渲染支持标签筛选与徽章着色。

**`navItems.json` 结构**（每条记录）：

```jsonc
{
  "id": "lesson-table",
  "href": "./lessonTable",        // 站内相对路径 或 外部 https 子域
  "icon": "<emoji>",
  "title": "课程表",
  "desc": "在线课程表，支持导入导出，个性化定制",
  "tags": ["工具"],
  "badge": "NEW",
  "badgeColor": "G",              // 单字母代号 或 #RRGGBB
  "status": "active",             // active / inactive
  "createTime": "2026-03-22",
  "updateTime": "2026-03-22"
}
```

18 条记录分为两类：

- **外部子域链接（5 条）**：`game.zbyblq.xin`（小游戏合集）、`todo.zbyblq.xin`（TodoList）、`done.zbyblq.xin`（学习日志）、`greeting.zbyblq.xin`（新春祝福）、另有站内 `./birthday/index.html` 生日页
- **站内静态页（13 条）**：指向 `./eft/index.html`、`./btree/index.html` 等

> 注意：`navItems.json` 的 13 条站内记录与新版 `PagesData.ts` 的 13 条工具记录**一一对应**，两份数据存在冗余。

### 4.3 工具类子项目（三件套模式）

以下 **13 个目录**采用完全统一的「三件套」结构：

```
<tool>/
├── index.html      # 结构
├── css/main.css    # 样式
└── js/main.js      # 逻辑（原生 JS，无框架、无构建）
```

| 目录 | 单 JS 体积 | 功能 | 新版路由 |
| --- | --- | --- | --- |
| `btree/` | 28K 目录 | 二叉树可视化，另含 `generate_tree.py` 辅助脚本 | btree-visual |
| `drum/` | 36K 目录 | WebAudio 鼓机 | drum-pad |
| `eft/` | 20K 目录 | 英文字体转换 | eft-tool |
| `encryptionGraph/` | 20K 目录 | 空间填充曲线图片混淆 | encryption-graph |
| `Floyd–Steinberg/` | 28K 目录 | 误差扩散抖动 | floyd-steinberg |
| `img2ascii/` | 32K 目录 | 图片转字符画 | img2ascii |
| `kalimba/` | 32K 目录 | WebAudio 拇指琴 | kalimba |
| `PathfindingVisualize/` | 36K 目录 | 寻路算法可视化 | pathfinding-visualize |
| `photoPatina/` | 32K 目录 | JPEG 二次压缩包浆 | photo-patina |
| `pixelate/` | 28K 目录 | 图片像素化 | pixelate |
| `playPiano/` | 92K 目录 | WebAudio 钢琴，另含 `json/puzi.json` 曲谱 | piano-keys |
| `sortviz/` | 36K 目录 | 排序算法可视化 | sort-viz |
| `colorVision/` | 68K 目录 | 色觉相关工具 | **未注册路由** |

**`imageContent/`**（80K）是共享素材目录，存放 `icon.png` 站点图标，被 `index.html` 的 favicon 引用。

### 4.4 `lessonTable/`：结构特例

课表目录**不符合三件套模式**，采用扁平命名：

```
lessonTable/
├── index.html                                  11.1K  页面结构
├── index.css                                   16.8K  样式
├── index.js                                    23.6K  逻辑
├── README.md                                    5.3K  完整功能文档
└── 课表_2025-2026-1_230200400_20260322.json    32.9K  默认课表数据（中文文件名）
```

功能要点（据 README）：

- 支持上传 JSON 课表 / 加载同目录默认课表
- 按周一至周日 7 个按钮切换
- 纵轴为周次（1~最大周数），横轴为 12 节课时
- 6 套配色方案按课程顺序轮换
- 依赖 `html2canvas` 导出 PNG

数据格式：`datas.queryxskb.rows[]`，关键字段含 `KCM`（课程名）、`SKJS`（教师）、`JASMC`（教室）、`SKXQ`（星期）、`KSJC`（起始节次）、`JSJC`（持续节数）、`ZCMC`（周次文本）、`SKZC`（周次二进制位图）。

> 该模块是**当前唯一正在从旧版重写为新版 Vue 的模块**，见 §6.2。

### 4.5 内容类与游戏类目录

这些目录不具备独立工具形态，多为素材、合集或独立页面：

| 目录 | 体积 | 内容 |
| --- | --- | --- |
| `birthday/` | 296K | 生日页。`av.js` 单文件 270K（疑似内嵌资源），`index.html` 26K。**已从新版路由移除，但仍在 `navItems.json` 中标记为 active** |
| `codeContent/` | 176K | 代码内容合集，下含两个子项目 |
| `codeContent/little-game-webpage/` | - | 小游戏合集：2048 / 华容道 / 迷宫 / 扫雷，结构为 `css/ js/ html/` 三分 + 入口 `littleGameMainPage.html` |
| `codeContent/my-scriplets/english_font_transform/` | - | 英文字体转换的**副本**，`html/main.html` + `js/main.js`(27 行)，与 `public/eft/` 功能重复且实现不同 |
| `cS/` | 76K | 两个大体积单文件页：`index.html` 61K、`paiCount.html` 15K |
| `timecount/` | 1K | 极简倒计时页，`index.html` 仅 267 字节 |
| `other/` | 5K | `privacy.html` 隐私政策页 + `.txt` 占位 |
| `functions/data/tags.js` | 8.3K | `navItems.json` 的 **JS 变量版**（`const tags = {...}`），内容与 JSON 高度重复，当前**无任何文件引用** |
| `src/data_extraction/base.ts` | 0 | 空文件，疑似误入 public 的源码残留 |

---

## 5. 旧版本技术特征总结

### 5.1 架构特征

| 维度 | 旧版本做法 |
| --- | --- |
| 页面组织 | 多页应用（MPA），每个工具一个独立 `index.html` |
| 技术栈 | 原生 HTML + CSS + Vanilla JS，**零依赖、零构建** |
| 数据层 | `fetch` 读取同目录 JSON，或在 JS 中直接定义为全局常量 |
| 状态管理 | 模块内闭包 + 全局对象（如 `NavSystem`），无统一状态方案 |
| 样式体系 | 各工具自带 `css/main.css`，无跨项目共享的样式变量 |
| 路由 | 依赖浏览器真实跳转，无前端路由 |
| 主题 | `theme.json` 提供令牌 + CSS 变量 + `prefers-color-scheme`，落 localStorage |
| 部署 | 纯静态托管（`zbyblq.xin`），子域按功能拆分 |

### 5.2 与新版本的核心差异

| 对比项 | 旧版本 (`public/`) | 新版本 (`src/`) |
| --- | --- | --- |
| 页面数量 | 每个工具一个 HTML 入口 | 单 HTML 入口 + 前端路由 |
| 数据源 | `navItems.json` + `tags.js`（两份） | `PagesData.ts`（单一） |
| 分类逻辑 | 标签筛选（前端过滤） | `CategoryManager` 聚合 |
| 底部导航 | 无 | `bottomNav.vue`（home / sort / profile） |
| 通知能力 | 无 | `utils/notifications/` 完整体系 |
| 原生能力 | 无 | Capacitor 本地通知 |
| 样式变量 | `theme.json` 运行时注入 | `global.css` 编译期常量 |

### 5.3 新旧映射关系

| 新版路由 name | iframe 源路径（硬编码在 .vue 中） | 旧版目录 |
| --- | --- | --- |
| btree-visual | `/btree/index.html` | `public/btree/` |
| eft-tool | `/eft/index.html` | `public/eft/` |
| encryption-graph | `/encryptionGraph/index.html` | `public/encryptionGraph/` |
| drum-pad | `/drum/index.html` | `public/drum/` |
| kalimba | `/kalimba/index.html` | `public/kalimba/` |
| sort-viz | `/sortviz/index.html` | `public/sortviz/` |
| img2ascii | `/img2ascii/index.html` | `public/img2ascii/` |
| pixelate | `/pixelate/index.html` | `public/pixelate/` |
| floyd-steinberg | `/Floyd–Steinberg/index.html` | `public/Floyd–Steinberg/` |
| pathfinding-visualize | `/PathfindingVisualize/index.html` | `public/PathfindingVisualize/` |
| photo-patina | `/photoPatina/index.html` | `public/photoPatina/` |
| piano-keys | `/playPiano/index.html` | `public/playPiano/` |
| lesson-table | `/lessonTable/index.html` | `public/lessonTable/` |

---

## 6. 结构问题清单

### 6.1 空文件与占位资产（共 22 个 0 字节文件）

**根目录（5 个）**：`BOTTOM_NAV_README.md`、`LESSON_TABLE_REWRITE.md`、`PAGES_MIGRATION.md`、`PROJECT_STATUS.md`、`SORT_PAGE_COMPLETE.md`

> 文件名指向已完成的开发阶段，但内容为空，未起到记录作用。

**`src/` 内（14 个）**：

| 路径 | 预留用途 |
| --- | --- |
| `composable/components/base/main/BottomNavManager.example.ts` | 示例代码 |
| `composable/lessonTable/index.ts` | 课表重写 |
| `stores/lessonTable.ts` | 课表 Pinia store |
| `css/lessonTable.css` | 课表样式 |
| `views/pages/tools/LessonTable.vue.new` | 课表重写主体 |
| `views/pages/tools/components/*.vue`（8 个） | 课表子组件 |
| `utils/notifications/QUICK_REFERENCE.ts` | 通知速查 |

**`public/` 内（2 个）**：`defaultLessonTable.json`、`src/data_extraction/base.ts`

**空目录（2 个）**：`src/assets/svg/`、`src/views/pages/test/`

### 6.2 进行中的课表重写

`LessonTable` 是唯一在从 iframe 模式改造为原生 Vue 的模块。已确认的预留骨架：

```
src/stores/lessonTable.ts                    [空]
src/composable/lessonTable/index.ts          [空]
src/css/lessonTable.css                      [空]
src/views/pages/tools/LessonTable.vue.new    [空]
src/views/pages/tools/components/
├── LessonTableHeader.vue   [空]   表头
├── LessonTableWeek.vue     [空]   周视图
├── LessonTableDay.vue      [空]   日视图
├── LessonTableControls.vue [空]   控件
├── LessonTableInfo.vue     [空]   信息面板
├── LessonTableStats.vue    [空]   统计
├── LessonCell.vue          [空]   单元格
├── InfoCard.vue            [空]   通用信息卡
└── StatCard.vue            [空]   通用统计卡
public/defaultLessonTable.json               [空]
```

组件拆分意图清晰：**表头 / 周视图 / 日视图 / 控件 / 信息 / 统计** 六个功能区 + 两个通用卡片组件。

### 6.3 死代码与冗余

| 问题 | 位置 | 说明 |
| --- | --- | --- |
| 定义未使用 | `src/composable/pages/PagePathManager.ts` | 完整的 iframe 路径映射表，**无任何文件 import**；各 `.vue` 中的 iframe src 为硬编码字符串 |
| 逻辑重复 | `PagesData.ts` 与 `PagePathManager.ts` | 两者都维护 id → title 映射，数据双写 |
| 数据三写 | `navItems.json` / `functions/data/tags.js` / `PagesData.ts` | 同一批工具元数据存在三份副本 |
| 资源未引用 | `src/components/base/main/svg/*.svg` | `bottomNav.vue` 使用内联 SVG，三个 svg 文件为孤立资源 |
| 目录为空 | `src/assets/svg/`、`src/views/pages/test/` | 无内容 |
| 样式残留 | `src/style.css` | Vite 默认模板样式（298 行），定义了 `--accent: #aa3bff` 等变量，与 `global.css` 的黑白体系冲突 |
| 代码副本 | `public/codeContent/my-scriplets/english_font_transform/` | 与 `public/eft/` 功能重复 |
| 脚本未引用 | `public/mainpage/js/overlay.js`、`css/overlay.css` | 引用已在 `index.html` 中注释 |

### 6.4 新旧未对齐项

| 项 | 旧版 | 新版 | 状态 |
| --- | --- | --- | --- |
| 生日页 | `navItems.json` 标记 active | 无路由 | 功能缺失 |
| 色觉工具 | `public/colorVision/` 完整存在 | 无路由、无数据条目 | 未接入 |
| 小游戏合集 | 站内 `codeContent/little-game-webpage/` + 外部子域 | 无路由 | 未接入 |
| 外部子域（5 个） | `navItems.json` 中列出 | `PagesData.ts` 中无 | 未接入 |
| 隐私政策 | `public/other/privacy.html` | 无入口 | 未接入 |
| 首页内容 | 工具卡片导航 | 通知系统演示页 | 未替换 |

### 6.5 结构模式不统一

| 问题 | 说明 |
| --- | --- |
| 目录命名混用 | 同时存在 `kebab-case`（`encryptionGraph` 实为 camelCase）、`PascalCase`（`PathfindingVisualize`）、含特殊字符（`Floyd–Steinberg` 使用 en dash 而非连字符） |
| 中文文件名 | `public/lessonTable/课表_2025-2026-1_230200400_20260322.json` 在跨平台与 URL 编码场景下存在风险 |
| 入口命名不一 | 多数工具用 `css/main.css` + `js/main.js`，`lessonTable` 用 `index.css` + `index.js` |
| 目录深度不一 | 多数为两层（`<tool>/css/`），`codeContent` 为四层（`codeContent/little-game-webpage/css/`） |

### 6.6 工程配置注意点

- `.gitignore` 同时忽略了 `.vscode/` 与 `android/`，但 `.vscode/` 目录仍存在于工作区
- `capacitor.config.ts` 中的 `server` 开发配置已注释，注释提示「生产阶段需删除或注释」——当前状态正确
- 路由使用 `createWebHistory`，部署到静态托管需配置 history fallback（`public/404.html` 可承担此职责，但需确认内容）
- `router.beforeEach` 中留有 TODO：认证完成后需补登录态检查

---

## 7. 迁移状态评估

### 7.1 已完成

- [OK] 构建链路搭建：Vite + Vue 3 + TypeScript
- [OK] 前端路由体系：3 个主页面 + 13 个工具页
- [OK] 底部导航：组件 + 状态管理类 + 样式
- [OK] 工具元数据中枢：`PagesData.ts`（13 条记录）
- [OK] 分类与列表管理：`CategoryManager` + `ToolListManager`
- [OK] 通知系统：管理器 + 拦截器 + 模板 + 示例（约 2300 行）
- [OK] 旧版全量静态资源保留在 `public/`，功能不中断

### 7.2 进行中

- [~] 课表模块重写：骨架已建（13 个空文件），代码未写
- [~] 首页内容替换：当前仍是通知系统演示页
- [~] iframe 桥接方案：13 个工具页均为过渡态

### 7.3 待办

- [ ] 首页从「通知演示」改为「工具卡片导航」
- [ ] 个人中心页面实现（当前空壳）
- [ ] 将 `public/` 中的工具逐个从 iframe 迁移为原生 Vue 组件
- [ ] 接入未路由的旧版页面（生日页、色觉工具、小游戏、隐私政策）
- [ ] 决定外部子域（`todo` / `done` / `game` / `greeting`）的接入策略
- [ ] 清理死代码：`PagePathManager.ts`、`src/style.css`、孤立 svg、重复副本
- [ ] 统一数据源：消除 `navItems.json` / `tags.js` / `PagesData.ts` 三写
- [ ] 补全或删除 22 个 0 字节占位文件
- [ ] 补认证路由守卫（`router/index.ts` 中的 TODO）

### 7.4 架构演进判断

当前处于**「新壳套旧核」**阶段：

```
Vue SPA 外壳（路由 / 底部导航 / 通知 / 原生封装）
        ↓ iframe 桥接
旧版静态页面（13 个工具 + 素材 + 数据）
```

这一形态的收益是迁移期功能零中断、旧代码零改造；代价是 iframe 带来的样式隔离、路由同步、状态通信、性能（每个工具重复加载）等问题。从 `LessonTable.vue.new` 及 8 个子组件的空骨架可以判断，**课表是首个原生重写试点**，其模式将为后续 12 个工具提供迁移范式。
