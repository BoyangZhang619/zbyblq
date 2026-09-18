/**
 * 全库 emoji 检测
 *
 * 全站禁用 emoji，所有图标与特殊样式一律使用自制 SVG。
 * 本脚本接入 build 流程，含 emoji 的代码无法产出构建。
 *
 * 参见 docs/04-icon-system.md §6
 *
 * 用法：node tools/check-no-emoji.mjs
 *       npm run lint:emoji
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

/**
 * 检测范围
 *
 * 刻意不含 \u{2190}-\u{21FF}（箭头块）：U+2192、U+2193 等为无衬线排版
 * 箭头，用于代码注释与文档中的流程示意，渲染为单色字形，非 emoji。
 * 需要替换的是 U+2B06 / U+2B07 这类带 emoji 呈现的箭头，它们落在
 * \u{2B00}-\u{2BFF} 内，已被覆盖。
 */
const EMOJI_PATTERN =
  /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u

/** 扫描的扩展名 */
const EXTS = ['.ts', '.js', '.vue', '.html', '.css', '.json', '.md', '.svg']

/** 不进入的目录 */
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'android', '.vscode'])

/**
 * 允许清单
 *
 * 每一项都必须写明豁免理由与移除条件，避免变成永久豁免。
 */
const ALLOWLIST = [
  // 本脚本自身需要正则字面量
  'tools/check-no-emoji.mjs',

  // 归档区不参与构建，保留原始形态以便追溯
  'archive/',

  // 文档中使用 Unicode 码位标注来源字符（如 U+1F382），不含 emoji 本体
  'docs/',

  // === 以下为分阶段豁免，须随融合迁移逐步缩小 ===
  //
  // public/ 下的旧版静态站点尚未迁移，其界面仍有 300 余处 emoji。
  // 移除条件：每个工具完成 docs/02-fusion-architecture.md 的 Stage 4
  // （旧目录下线）后，从本清单中删除对应条目。全部迁移完成后，
  // 本条目应被整行删除。
  'public/',
]

function isAllowed(relPath) {
  const p = relPath.split('\\').join('/')
  return ALLOWLIST.some(a => p === a || p.startsWith(a))
}

function walk(dir, hits) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue

    const full = join(dir, entry)
    const rel = relative(process.cwd(), full)

    if (statSync(full).isDirectory()) {
      if (isAllowed(rel + '/')) continue
      walk(full, hits)
      continue
    }

    if (!EXTS.some(e => entry.endsWith(e))) continue
    if (isAllowed(rel)) continue

    const lines = readFileSync(full, 'utf8').split('\n')
    lines.forEach((line, i) => {
      const m = line.match(EMOJI_PATTERN)
      if (m) {
        hits.push({
          file: rel.split('\\').join('/'),
          line: i + 1,
          code: 'U+' + m[0].codePointAt(0).toString(16).toUpperCase().padStart(4, '0'),
        })
      }
    })
  }
  return hits
}

const hits = walk(process.cwd(), [])

if (hits.length) {
  console.error(`发现 ${hits.length} 处 emoji：\n`)
  for (const h of hits.slice(0, 60)) {
    console.error(`  ${h.file}:${h.line}  ${h.code}`)
  }
  if (hits.length > 60) {
    console.error(`  ... 另有 ${hits.length - 60} 处`)
  }
  console.error('\n替代方案：使用 AppIcon 渲染自制 SVG，见 docs/04-icon-system.md')
  process.exit(1)
}

console.log('[OK] 未发现 emoji')
