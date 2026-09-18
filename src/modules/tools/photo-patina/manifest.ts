/**
 * 电子包浆 · JPEG 二次压缩 的模块自声明
 *
 * 本文件是该工具的唯一数据来源。路由表与分类页均从此派生，
 * 不再维护中心化的工具清单。参见 docs/01-refactor-structure.md §6
 */

import type { ToolManifest } from '../types'

export const manifest: ToolManifest = {
  id: 'photo-patina',
  title: '电子包浆 · JPEG 二次压缩',
  description: '上传照片，选择包浆风格与强度，生成具有复古包浆效果的图片',
  icon: 'tool-patina',
  route: {
    path: '/tools/photo-patina',
    name: 'tool-photo-patina',
  },
  tags: ['图像', '工具', '实验'],
  badge: 'INTERESTING',
  status: 'active',
  entry: 'iframe',
  lifecycle: {
    updated: '2026-01-06',
  },
}
