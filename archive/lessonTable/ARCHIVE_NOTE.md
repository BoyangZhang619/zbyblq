# 归档说明：lessonTable

## 基本信息

| 项 | 值 |
| --- | --- |
| 归档日期 | 2026-09-18 |
| 原模块 ID | `lesson-table` |
| 原路由 | `/tools/lesson-table` |
| 归档原因 | 见下方「雪藏理由」 |
| 源码版本 | 归档前所在 commit：`0edcb71`（归档动作本身未提交） |

## 雪藏理由

1. 数据源依赖学校教务系统导出的特定 JSON 结构（`datas.queryxskb.rows[]`），格式受外部系统约束，通用性受限
2. 新版重写骨架已建立但长期未推进，占用结构位
3. 该模块与「通用工具合集」的产品定位耦合度最低，个人信息属性最强，涉及成绩课表等隐私数据

## 目录结构

```
lessonTable/
├── ARCHIVE_NOTE.md          本文件
├── legacy/                  原 public/lessonTable/ 静态实现
│   ├── index.html
│   ├── index.css
│   ├── index.js
│   ├── README.md            功能说明与 JSON 数据格式文档
│   └── 课表_2025-2026-1_230200400_20260322.json
├── integration/             新版 iframe 外壳组件
│   └── LessonTable.vue
└── rewrite-wip/             未完成的原生重写骨架（全部为 0 字节）
    ├── LESSON_TABLE_REWRITE.md
    ├── LessonTable.vue.new
    ├── defaultLessonTable.json
    ├── stores/lessonTable.ts
    ├── composable/lessonTable/index.ts
    ├── css/lessonTable.css
    └── components/          9 个空组件
```

## 隐私提示

`legacy/课表_2025-2026-1_230200400_20260322.json` 含真实学号（文件名中即含 `230200400`）与个人课表数据。

**该文件已随归档移出 `public/`，不再进入构建产物。** 若日后恢复此模块，务必确认该数据文件的部署范围，避免随应用公开发布。

## 恢复步骤

1. 按「路径对照表」将各文件原路归位
2. 恢复引用（见下）
3. 确认 `public/defaultLessonTable.json` 装入默认课表数据（归档时为 0 字节占位）
4. 运行 `npm run build` 验证

### 路径对照表

| 归档位置 | 原路径 | 跟踪状态 |
| --- | --- | --- |
| `legacy/index.html` | `public/lessonTable/index.html` | 已跟踪 |
| `legacy/index.css` | `public/lessonTable/index.css` | 已跟踪 |
| `legacy/index.js` | `public/lessonTable/index.js` | 已跟踪 |
| `legacy/README.md` | `public/lessonTable/README.md` | 已跟踪 |
| `legacy/课表_*.json` | `public/lessonTable/课表_*.json` | 已跟踪 |
| `integration/LessonTable.vue` | `src/views/pages/tools/LessonTable.vue` | 已跟踪 |
| `rewrite-wip/LESSON_TABLE_REWRITE.md` | `LESSON_TABLE_REWRITE.md`（仓库根） | 未跟踪 |
| `rewrite-wip/defaultLessonTable.json` | `public/defaultLessonTable.json` | 未跟踪 |
| `rewrite-wip/LessonTable.vue.new` | `src/views/pages/tools/LessonTable.vue.new` | 未跟踪 |
| `rewrite-wip/stores/lessonTable.ts` | `src/stores/lessonTable.ts` | 未跟踪 |
| `rewrite-wip/composable/lessonTable/index.ts` | `src/composable/lessonTable/index.ts` | 未跟踪 |
| `rewrite-wip/css/lessonTable.css` | `src/css/lessonTable.css` | 未跟踪 |
| `rewrite-wip/components/*.vue`（9 个） | `src/views/pages/tools/components/*.vue` | 未跟踪 |

> 标注「未跟踪」的文件在归档前尚未提交，删除即永久丢失，因此只做归档处理。

### 需恢复的引用

归档时移除了以下四处引用，恢复时需一并还原：

| 文件 | 移除内容 |
| --- | --- |
| `src/router/index.ts` | `LessonTable` 的 import 与 `lesson-table` 路由条目 |
| `src/composable/pages/PagesData.ts` | `pageRouteMap` 中的 `'lesson-table'` 条目 |
| `public/mainpage/data/navItems.json` | `items` 中的 `lesson-table` 条目 |
| `src/composable/pages/PagePathManager.ts` | `PAGE_PATHS` 中的 `'lesson-table'` 条目（该文件本身已整体删除，见 `docs/01-refactor-structure.md` §5.3） |

## 后续

该模块的重写组件拆分意图（表头 / 周视图 / 日视图 / 控件 / 信息 / 统计 + 两个通用卡片）记录在 `rewrite-wip/components/` 的文件名中，虽然内容为空，但拆分思路可作参考。

恢复开发前建议先确认：数据源是否仍为同一教务系统格式；是否应改为支持通用的课表 JSON 格式。
