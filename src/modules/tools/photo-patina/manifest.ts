/**
 * 电子包浆 · JPEG 二次压缩 的模块自声明
 *
 * 本文件是该工具的唯一数据来源。路由表与分类页均从此派生，
 * 不再维护中心化的工具清单。参见 docs/01-refactor-structure.md §6
 */

import type { ToolManifest } from '../types'

export const manifest: ToolManifest = {
  id: 'photo-patina',
  title: { 'zh-CN': '电子包浆 · JPEG 二次压缩', en: 'Digital Patina' },
  description: { 'zh-CN': '上传照片，选择包浆风格与强度，生成具有复古包浆效果的图片', en: 'Re-compress a photo repeatedly for a weathered, low-fidelity look.' },
  icon: 'tool-patina',
  plant: 'leaf',
  route: {
    path: '/tools/photo-patina',
    name: 'tool-photo-patina',
  },
  tags: ['image', 'utility', 'experimental'],
  badge: 'INTERESTING',
  status: 'active',
  entry: 'iframe',
  lifecycle: {
    updated: '2026-01-06',
  },
}
