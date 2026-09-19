/**
 * 路径寻找可视化的界面文案
 *
 * 放本工具目录内而非全局文案表：文案与工具同生命周期，且多个工具并行
 * 迁移时不会互相冲突。用法见 docs/09-tool-page-spec.md §5。
 *
 * 语种完整性由类型保证：en 声明为 typeof zhCN，漏键会在 vue-tsc 阶段报错。
 * 注意 useToolI18n 的入参形状是 Record<Locale, T>（语种在前），
 * 与规范 §5.1 的示例片段相反——以实现为准，见交付说明的 concerns。
 */

import type { Locale } from '@/shared/i18n'

const zhCN = {
  title: '路径寻找可视化',
  subtitle: 'BFS / DFS / Dijkstra / A* · 画墙 · 拖拽起点终点 · 动画演示',

  // 主操作
  actionRun: '运行',
  actionRandom: '随机地图',
  actionClearPath: '清除路径',
  actionClearAll: '清空全部',

  // 分组标题
  algorithmLabel: '算法',
  drawModeLabel: '绘制模式',
  speedLabel: '速度',
  statsLabel: '统计',
  shortcutsLabel: '快捷操作',

  // 算法
  algorithmAstar: 'A*（推荐）',
  algorithmDijkstra: 'Dijkstra（最短路）',
  algorithmBfs: 'BFS（无权最短）',
  algorithmDfs: 'DFS（不保证最短）',

  // 绘制模式
  toolWall: '墙',
  toolErase: '橡皮',
  toolWeight: '权重',
  toolMove: '拖拽点',
  drawHint: '鼠标或触摸拖动即可绘制。拖拽点：移动起点与终点。',

  // 开关
  allowDiagonal: '允许对角移动',
  allowWeightLabel: '启用权重（权重 = 5）',

  // 速度与统计
  speedUnit: '{value} 毫秒/步',
  statVisited: '已访问',
  statPathLength: '路径长度',
  statCost: '总代价',

  // 图例
  legendStart: '起点',
  legendEnd: '终点',
  legendWall: '墙',
  legendWeight: '权重',
  legendVisited: '已访问',
  legendPath: '路径',

  // 快捷键
  shortcutRun: '运行 / 重新运行',
  shortcutClearPath: '清除路径',
  shortcutClearAll: '清空全部',
  shortcutRandom: '随机生成地图',
  shortcutTools: '墙 / 橡皮 / 权重 / 拖拽点',

  // 说明
  footHint: '提示：A* 在启发式合理时更快；Dijkstra 保证最短，但更「铺地毯」。',
  boardLabel: '网格画布 {cols} × {rows}，可绘制墙体与权重',

  // 提示条
  toastHint: '开始：画墙，或拖拽起点与终点',
  toastClearedAll: '已清空全部',
  toastRandomMap: '已随机生成地图',
  toastPathCleared: '已清除路径',
  toastToolChanged: '工具：{name}',
  toastDone: '完成',
  toastNoPath: '未找到路径（可能被墙围住了）',
}

const en: typeof zhCN = {
  title: 'Pathfinding Visualizer',
  subtitle: 'BFS / DFS / Dijkstra / A* · Draw walls · Drag the endpoints · Watch it run',

  actionRun: 'Run',
  actionRandom: 'Random map',
  actionClearPath: 'Clear path',
  actionClearAll: 'Clear all',

  algorithmLabel: 'Algorithm',
  drawModeLabel: 'Draw mode',
  speedLabel: 'Speed',
  statsLabel: 'Stats',
  shortcutsLabel: 'Shortcuts',

  algorithmAstar: 'A* (recommended)',
  algorithmDijkstra: 'Dijkstra (shortest path)',
  algorithmBfs: 'BFS (unweighted shortest)',
  algorithmDfs: 'DFS (no shortest guarantee)',

  toolWall: 'Wall',
  toolErase: 'Eraser',
  toolWeight: 'Weight',
  toolMove: 'Drag',
  drawHint: 'Drag with a mouse or finger to draw. Drag: move the start and end points.',

  allowDiagonal: 'Allow diagonal moves',
  allowWeightLabel: 'Enable weights (weight = 5)',

  speedUnit: '{value} ms/step',
  statVisited: 'Visited',
  statPathLength: 'Path length',
  statCost: 'Total cost',

  legendStart: 'Start',
  legendEnd: 'End',
  legendWall: 'Wall',
  legendWeight: 'Weight',
  legendVisited: 'Visited',
  legendPath: 'Path',

  shortcutRun: 'Run / rerun',
  shortcutClearPath: 'Clear path',
  shortcutClearAll: 'Clear all',
  shortcutRandom: 'Generate a random map',
  shortcutTools: 'Wall / Eraser / Weight / Drag',

  footHint: 'Tip: A* is faster when the heuristic holds; Dijkstra guarantees the shortest path but spreads out like a carpet',
  boardLabel: 'Grid canvas {cols} × {rows}, draw walls and weights on it',

  toastHint: 'Start: draw walls, or drag the start and end points',
  toastClearedAll: 'Cleared everything',
  toastRandomMap: 'Random map generated',
  toastPathCleared: 'Path cleared',
  toastToolChanged: 'Tool: {name}',
  toastDone: 'Done',
  toastNoPath: 'No path found (the target may be walled in)',
}

export const messages: Record<Locale, typeof zhCN> = { 'zh-CN': zhCN, en }
